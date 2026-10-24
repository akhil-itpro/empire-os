// Runs the real migrations on PGlite (PostgreSQL in WebAssembly) with Supabase's
// roles and auth.uid() recreated, then proves the row-level security rules.
// The same checks run against the real Supabase project in `npm run test:rls`.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MISSIONS } from "@/lib/plan-engine/missions";
import { missionSeedSql } from "@/lib/plan-engine/seed-sql";

const MIGRATIONS = "supabase/migrations";
const A = "00000000-0000-4000-8000-00000000000a";
const B = "00000000-0000-4000-8000-00000000000b";

// The parts of Supabase the migrations rely on.
const SUPABASE_STUB = `
  create schema auth;
  create table auth.users (id uuid primary key, email text);
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  grant usage on schema public, auth to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated, service_role;
  -- Supabase grants everything on new public tables; RLS and our revokes do the locking.
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
`;

let db: PGlite;

async function as<T>(role: "anon" | "authenticated" | "service_role", sub: string | null, fn: () => Promise<T>) {
  await db.exec(`set role ${role}; select set_config('request.jwt.claim.sub', '${sub ?? ""}', false);`);
  try {
    return await fn();
  } finally {
    await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`);
  }
}

const rows = async (sql: string, params: unknown[] = []) =>
  (await db.query<Record<string, unknown>>(sql, params)).rows;

function profileSql(id: string, code: string) {
  return `insert into public.profiles (id, first_name, age_bracket, adult_confirmed_at, city, situation, goal,
      pillar_order, daily_minutes, budget, gym, laptop, enemy, intensity, archetype, season_start, trial_ends_at, referral_code)
    values ('${id}', 'Test', '21-24', now(), 'pune', 'student', 'first_job', array['career','mind','body','money'],
      30, 'free', false, false, 'phone', 'steady', 'grinder', current_date, now() + interval '7 days', '${code}')`;
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(SUPABASE_STUB);
  for (const file of readdirSync(MIGRATIONS).filter((f) => f.endsWith(".sql")).sort()) {
    await db.exec(readFileSync(join(MIGRATIONS, file), "utf8"));
  }
  await db.exec(`
    insert into auth.users (id, email) values ('${A}', 'a@example.com'), ('${B}', 'b@example.com');
    ${profileSql(A, "AAAAAA")};
    ${profileSql(B, "BBBBBB")};
    insert into public.user_missions (user_id, local_date, slot, mission_id, pillar, minutes, xp)
      values ('${A}', current_date, 1, 'car-01', 'career', 5, 30),
             ('${B}', current_date, 1, 'car-02', 'career', 5, 30);
    insert into public.user_stats (user_id, xp) values ('${A}', 100), ('${B}', 200);
    insert into public.journal_entries (user_id, local_date, body) values ('${B}', current_date, 'private');
  `);
}, 60_000);

afterAll(async () => {
  await db?.close();
});

describe("migrations", () => {
  it("seed all 120 missions, matching lib/plan-engine/missions.ts", async () => {
    expect((await rows("select count(*)::int as n from public.mission_library where active"))[0]).toEqual({ n: 120 });
    const seeds = readdirSync(MIGRATIONS).filter((f) => f.includes("mission_library")).sort();
    expect(readFileSync(join(MIGRATIONS, seeds.at(-1)!), "utf8")).toBe(missionSeedSql(MISSIONS));
  });

  it("turn on row-level security for every table", async () => {
    const off = await rows(
      `select relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity`,
    );
    expect(off).toEqual([]);
  });
});

describe("a signed-in student", () => {
  it("reads only their own profile, missions, stats and journal", async () => {
    await as("authenticated", A, async () => {
      expect(await rows("select id from public.profiles")).toEqual([{ id: A }]);
      expect((await rows("select user_id from public.user_missions")).map((r) => r.user_id)).toEqual([A]);
      expect(await rows("select xp from public.user_stats")).toEqual([{ xp: 100 }]);
      expect(await rows("select body from public.journal_entries")).toEqual([]);
    });
  });

  it("can read the mission library", async () => {
    await as("authenticated", A, async () => {
      expect((await rows("select count(*)::int as n from public.mission_library"))[0]).toEqual({ n: 120 });
    });
  });

  it("can't mark missions done, change XP or streaks, or grant passes", async () => {
    await as("authenticated", A, async () => {
      await expect(db.query(`update public.user_missions set status = 'done', completed_at = now() where user_id = '${A}'`)).rejects.toThrow(/permission denied/);
      await expect(db.query(`update public.user_stats set xp = 999999`)).rejects.toThrow(/permission denied/);
      await expect(db.query(`insert into public.xp_events (user_id, kind, ref, xp) values ('${A}', 'boss', 'x', 150)`)).rejects.toThrow(/permission denied/);
      await expect(db.query(`insert into public.entitlements (user_id, kind, starts_at, ends_at, source) values ('${A}', 'season_pass', now(), now() + interval '90 days', 'free')`)).rejects.toThrow(/permission denied/);
      await expect(db.query(`insert into public.roles (user_id, role) values ('${A}', 'founder')`)).rejects.toThrow(/permission denied/);
      await expect(db.query(`update public.profiles set trial_ends_at = now() + interval '10 years'`)).rejects.toThrow(/permission denied/);
      await expect(db.query(`delete from public.user_missions`)).rejects.toThrow(/permission denied/);
    });
  });

  it("logs events only for themselves, from the allowed list, with a small payload", async () => {
    await as("authenticated", A, async () => {
      await db.query(`insert into public.events (name, user_id) values ('quiz_start', '${A}')`);
      await expect(db.query(`insert into public.events (name, user_id) values ('quiz_start', '${B}')`)).rejects.toThrow(/row-level security/);
      await expect(db.query(`insert into public.events (name) values ('made_up_event')`)).rejects.toThrow(/check constraint/);
      await expect(
        db.query(`insert into public.events (name, props) values ('quiz_step', $1)`, [JSON.stringify({ x: "y".repeat(5000) })]),
      ).rejects.toThrow(/check constraint/);
      await expect(db.query(`select * from public.events`)).rejects.toThrow(/permission denied/);
    });
  });
});

describe("a visitor who isn't signed in", () => {
  it("can't read anything", async () => {
    await as("anon", null, async () => {
      for (const table of ["profiles", "user_missions", "user_stats", "mission_library", "journal_entries", "roles", "events"]) {
        await expect(db.query(`select * from public.${table}`), table).rejects.toThrow(/permission denied/);
      }
    });
  });

  it("can log anonymous funnel events, but not as a user", async () => {
    await as("anon", null, async () => {
      await db.query(`insert into public.events (name, anon_id) values ('landing_view', gen_random_uuid())`);
      await expect(db.query(`insert into public.events (name, user_id) values ('landing_view', '${A}')`)).rejects.toThrow(/row-level security/);
    });
  });
});

describe("data rules", () => {
  it("allows one live mission per slot per day, and keeps swapped ones as history", async () => {
    await expect(
      db.query(`insert into public.user_missions (user_id, local_date, slot, mission_id, pillar, minutes, xp) values ('${A}', current_date, 1, 'car-03', 'career', 5, 30)`),
    ).rejects.toThrow(/duplicate key/);
    await db.exec(`update public.user_missions set status = 'swapped' where user_id = '${A}' and slot = 1`);
    await db.query(`insert into public.user_missions (user_id, local_date, slot, mission_id, pillar, minutes, xp) values ('${A}', current_date, 1, 'car-03', 'career', 5, 30)`);
  });

  it("never grants the same XP twice", async () => {
    await db.query(`insert into public.xp_events (user_id, kind, ref, xp) values ('${A}', 'day_bonus', '2026-10-24', 30)`);
    await expect(
      db.query(`insert into public.xp_events (user_id, kind, ref, xp) values ('${A}', 'day_bonus', '2026-10-24', 30)`),
    ).rejects.toThrow(/duplicate key/);
  });

  it("rejects a pillar order without all four pillars", async () => {
    const C = "00000000-0000-4000-8000-00000000000c";
    await db.query(`insert into auth.users (id) values ('${C}')`);
    const bad = profileSql(C, "CCCCCC").replace(
      "array['career','mind','body','money']",
      "array['career','career','body','money']",
    );
    await expect(db.query(bad)).rejects.toThrow(/profiles_pillar_order_check/);
    await db.query(profileSql(C, "CCCCCC"));
  });

  it("deletes a student's rows with their account, and unlinks their events", async () => {
    await db.query(`insert into public.events (name, user_id) values ('signup_done', '${B}')`);
    await db.query(`delete from auth.users where id = '${B}'`);
    expect(await rows(`select id from public.profiles where id = '${B}'`)).toEqual([]);
    expect(await rows(`select id from public.user_missions where user_id = '${B}'`)).toEqual([]);
    expect(await rows(`select id from public.journal_entries where user_id = '${B}'`)).toEqual([]);
    expect((await rows(`select count(*)::int as n from public.events where name = 'signup_done' and user_id is null`))[0]).toEqual({ n: 1 });
  });
});

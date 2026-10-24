// npm run test:rls: proves row-level security on the real Supabase project.
// Creates two throwaway students, checks that neither can read or write the
// other's rows (or protected rows of their own), then deletes them.
// Needs .env.local with the three Supabase values.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secret = process.env.SUPABASE_SECRET_KEY;

if (!url || !publishable || !secret) {
  console.error("Supabase isn't set up yet: fill in .env.local (see .env.example), then run this again.");
  process.exit(1);
}

const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
const results: { name: string; pass: boolean; detail?: string }[] = [];

function check(name: string, pass: boolean, detail?: string) {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${pass || !detail ? "" : `  (${detail})`}`);
}

function randomText(n: number) {
  return Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => (b % 36).toString(36)).join("");
}

async function makeStudent(label: string) {
  const email = `rls-${label}-${randomText(8)}@example.com`;
  const password = `${randomText(20)}A1!`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) throw new Error(`createUser ${label}: ${error?.message}`);
  const id = data.user.id;
  const code = `T${randomText(7).toUpperCase()}`;
  const seeded = await admin.from("profiles").insert({
    id,
    first_name: `Test ${label}`,
    age_bracket: "21-24",
    adult_confirmed_at: new Date().toISOString(),
    city: "pune",
    situation: "student",
    goal: "first_job",
    pillar_order: ["career", "mind", "body", "money"],
    daily_minutes: 30,
    budget: "free",
    gym: false,
    laptop: false,
    enemy: "phone",
    intensity: "steady",
    archetype: "grinder",
    season_start: new Date().toISOString().slice(0, 10),
    trial_ends_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    referral_code: code,
  });
  if (seeded.error) throw new Error(`profile ${label}: ${seeded.error.message}`);
  await admin.from("user_missions").insert({
    user_id: id,
    local_date: new Date().toISOString().slice(0, 10),
    slot: 1,
    mission_id: "car-01",
    pillar: "career",
    minutes: 5,
    xp: 30,
  });
  await admin.from("user_stats").insert({ user_id: id, xp: 100 });
  await admin.from("journal_entries").insert({ user_id: id, local_date: new Date().toISOString().slice(0, 10), body: `secret ${label}` });

  const client = createClient(url!, publishable!, { auth: { persistSession: false, autoRefreshToken: false } });
  const signIn = await client.auth.signInWithPassword({ email, password });
  if (signIn.error) throw new Error(`signIn ${label}: ${signIn.error.message}`);
  return { id, client };
}

async function expectDenied(name: string, run: () => PromiseLike<{ error: unknown; data?: unknown }>) {
  const { error, data } = await run();
  const changedRows = Array.isArray(data) ? data.length : 0;
  check(name, Boolean(error) || changedRows === 0, error ? undefined : `changed ${changedRows} rows`);
}

async function studentChecks(me: { id: string; client: SupabaseClient }, other: { id: string }, label: string) {
  const c = me.client;
  const profiles = await c.from("profiles").select("id");
  check(`${label} reads only their own profile`, profiles.data?.length === 1 && profiles.data[0].id === me.id, profiles.error?.message);
  const missions = await c.from("user_missions").select("user_id");
  check(`${label} reads only their own missions`, (missions.data ?? []).every((m) => m.user_id === me.id) && (missions.data?.length ?? 0) > 0, missions.error?.message);
  const journals = await c.from("journal_entries").select("user_id");
  check(`${label} reads only their own journal`, (journals.data ?? []).every((j) => j.user_id === me.id), journals.error?.message);
  const stats = await c.from("user_stats").select("user_id");
  check(`${label} reads only their own stats`, (stats.data ?? []).every((s) => s.user_id === me.id), stats.error?.message);

  await expectDenied(`${label} can't mark their own mission done`, () =>
    c.from("user_missions").update({ status: "done", completed_at: new Date().toISOString() }).eq("user_id", me.id).select(),
  );
  await expectDenied(`${label} can't change their own XP`, () => c.from("user_stats").update({ xp: 999999 }).eq("user_id", me.id).select());
  await expectDenied(`${label} can't grant themselves XP`, () => c.from("xp_events").insert({ user_id: me.id, kind: "boss", ref: "hack", xp: 150 }).select());
  await expectDenied(`${label} can't give themselves a Season Pass`, () =>
    c.from("entitlements").insert({ user_id: me.id, kind: "season_pass", starts_at: new Date().toISOString(), ends_at: new Date(Date.now() + 9e9).toISOString(), source: "hack" }).select(),
  );
  await expectDenied(`${label} can't make themselves founder`, () => c.from("roles").insert({ user_id: me.id, role: "founder" }).select());
  await expectDenied(`${label} can't extend their trial`, () =>
    c.from("profiles").update({ trial_ends_at: new Date(Date.now() + 9e10).toISOString() }).eq("id", me.id).select(),
  );
  await expectDenied(`${label} can't change the other student's profile`, () => c.from("profiles").update({ first_name: "Hacked" }).eq("id", other.id).select());
  await expectDenied(`${label} can't delete the other student's missions`, () => c.from("user_missions").delete().eq("user_id", other.id).select());
  await expectDenied(`${label} can't log events as the other student`, () => c.from("events").insert({ name: "quiz_start", user_id: other.id }));
  const own = await c.from("events").insert({ name: "quiz_start", user_id: me.id });
  check(`${label} can log their own events`, !own.error, own.error?.message);
}

let a: Awaited<ReturnType<typeof makeStudent>> | undefined;
let b: Awaited<ReturnType<typeof makeStudent>> | undefined;
try {
  a = await makeStudent("a");
  b = await makeStudent("b");
  await studentChecks(a, b, "Student A");
  await studentChecks(b, a, "Student B");

  const anon = createClient(url, publishable, { auth: { persistSession: false } });
  for (const table of ["profiles", "user_missions", "journal_entries", "user_stats", "mission_library", "roles"] as const) {
    const r = await anon.from(table).select("*").limit(1);
    check(`A visitor who isn't signed in can't read ${table}`, Boolean(r.error) || (r.data?.length ?? 0) === 0, r.error ? undefined : "got rows");
  }
  const library = await a.client.from("mission_library").select("id", { count: "exact", head: true });
  check("A signed-in student can read the mission library", (library.count ?? 0) >= 120, library.error?.message);
} catch (error) {
  check("Setup", false, error instanceof Error ? error.message : String(error));
} finally {
  for (const s of [a, b]) if (s) await admin.auth.admin.deleteUser(s.id);
}

const failed = results.filter((r) => !r.pass).length;
console.log(`\n${results.length - failed} passed, ${failed} failed.`);
process.exit(failed ? 1 : 0);

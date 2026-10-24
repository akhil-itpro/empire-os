import { beforeEach, describe, expect, it } from "vitest";
import type { Answers } from "@/lib/plan-engine/answers";
import {
  chooseFreePillar,
  completeMission,
  ensureToday,
  skipMission,
  startSeason,
  swapMission,
  undoMission,
  type Deps,
} from "@/lib/server/season-service";
import { MemoryStore } from "@/lib/server/store-memory";

const ALICE = "11111111-1111-4111-8111-111111111111";
const BOB = "22222222-2222-4222-8222-222222222222";

const answers: Answers = {
  firstName: "Asha",
  ageBracket: "21-24",
  city: "hyderabad",
  situation: "student",
  goal: "first_job",
  pillarOrder: ["career", "mind", "body", "money"],
  dailyMinutes: 45,
  budget: "free",
  gym: false,
  laptop: true,
  enemy: "no_plan",
  intensity: "ambitious",
};

// 10:00 in India on 1 Nov 2026.
const START = new Date("2026-11-01T04:30:00Z");
const at = (days: number, hourUtc = 4.5) => new Date(START.getTime() + days * 86_400_000 + (hourUtc - 4.5) * 3_600_000);

let store: MemoryStore;
const deps = (now = START): Deps => ({ store, now });

async function start(userId = ALICE, now = START) {
  const r = await startSeason(deps(now), userId, answers, { timeZone: "Asia/Kolkata" });
  expect(r.ok).toBe(true);
}

async function today(userId = ALICE, now = START) {
  const r = await ensureToday(deps(now), userId);
  if (!r.ok) throw new Error(r.message);
  return r.data;
}

beforeEach(() => {
  store = new MemoryStore();
});

describe("startSeason", () => {
  it("rejects bad answers without writing anything", async () => {
    const r = await startSeason(deps(), ALICE, { ...answers, city: "paris" });
    expect(r).toMatchObject({ ok: false, error: "invalid_input" });
    expect(store.profiles.size).toBe(0);
  });

  it("creates the profile, a 7-day trial, Day 1's three missions and the sign-up event", async () => {
    await start();
    const p = store.profiles.get(ALICE)!;
    expect(p.archetype).toBe("grinder");
    expect(p.seasonStart).toBe("2026-11-01");
    expect(p.trialEndsAt.toISOString()).toBe("2026-11-08T04:30:00.000Z");
    expect(p.referralCode).toMatch(/^[A-Z2-9]{8}$/);
    const t = await today();
    expect(t.missions).toHaveLength(3);
    expect(t.missions[0].minutes).toBe(5);
    expect(store.events.map((e) => e.name)).toContain("signup_done");
  });

  it("is safe to call twice", async () => {
    await start();
    const again = await startSeason(deps(), ALICE, answers);
    expect(again).toEqual({ ok: true, data: { created: false } });
    expect(store.missions).toHaveLength(3);
  });

  it("falls back to India time for an unknown time zone", async () => {
    await startSeason(deps(), ALICE, answers, { timeZone: "Mars/Olympus" });
    expect(store.profiles.get(ALICE)!.timeZone).toBe("Asia/Kolkata");
  });

  it("links a valid referral code, but never a self-referral", async () => {
    await start(ALICE);
    const code = store.profiles.get(ALICE)!.referralCode;
    await startSeason(deps(), BOB, answers, { referralCode: code.toLowerCase() });
    expect(store.referrals).toEqual([{ referrerId: ALICE, referredId: BOB }]);
  });
});

describe("ensureToday", () => {
  it("generates missions once per local date and never duplicates them", async () => {
    await start();
    await today();
    await today();
    expect(store.missions).toHaveLength(3);
    await today(ALICE, at(1));
    expect(store.missions).toHaveLength(6);
  });

  it("counts days in the student's time zone", async () => {
    await start();
    // 20:00 UTC on 1 Nov is already 2 Nov in India.
    const t = await today(ALICE, new Date("2026-11-01T20:00:00Z"));
    expect(t.today).toBe("2026-11-02");
    expect(t.day).toBe(2);
  });

  it("asks a student without a season to start one", async () => {
    expect(await ensureToday(deps(), BOB)).toMatchObject({ ok: false, error: "not_started" });
  });
});

describe("completeMission", () => {
  it("marks it done and grants its XP once", async () => {
    await start();
    const [m] = (await today()).missions;
    const r = await completeMission(deps(), ALICE, m.id);
    expect(r).toMatchObject({ ok: true, data: { xpGained: m.xp, dayComplete: false, streak: 1 } });
    const again = await completeMission(deps(), ALICE, m.id);
    expect(again).toMatchObject({ ok: false, error: "not_today" });
    expect(await store.xpTotal(ALICE)).toBe(m.xp);
  });

  it("adds the 30 XP day bonus when all three are done, once", async () => {
    await start();
    const ms = (await today()).missions;
    let last;
    for (const m of ms) last = await completeMission(deps(), ALICE, m.id);
    const sum = ms.reduce((s, m) => s + m.xp, 0);
    expect(last).toMatchObject({ ok: true, data: { dayComplete: true, totalXp: sum + 30 } });
    expect(store.events.filter((e) => e.name === "day_complete")).toHaveLength(1);
    expect(store.events.filter((e) => e.name === "first_mission_done")).toHaveLength(1);
  });

  it("refuses another student's mission", async () => {
    await start(ALICE);
    await start(BOB);
    const [aliceMission] = (await today(ALICE)).missions;
    expect(await completeMission(deps(), BOB, aliceMission.id)).toMatchObject({ ok: false, error: "not_today" });
    expect(store.missions.find((m) => m.id === aliceMission.id)!.status).toBe("assigned");
  });

  it("refuses yesterday's mission", async () => {
    await start();
    const [m] = (await today()).missions;
    expect(await completeMission(deps(at(1)), ALICE, m.id)).toMatchObject({ ok: false, error: "not_today" });
  });

  it("rejects ids that aren't ids", async () => {
    await start();
    expect(await completeMission(deps(), ALICE, "'; drop table users; --")).toMatchObject({ ok: false, error: "invalid_input" });
  });

  it("reports a rank-up when XP crosses a threshold", async () => {
    await start();
    store.xp.push({ userId: ALICE, kind: "boss", ref: "seed", xp: 390 });
    const [m] = (await today()).missions;
    const r = await completeMission(deps(), ALICE, m.id);
    expect(r).toMatchObject({ ok: true, data: { rank: "Operator", rankUp: "Operator" } });
  });

  it("builds a streak over days and resets it gently after a missed day", async () => {
    await start();
    for (const d of [0, 1, 2]) {
      const [m] = (await today(ALICE, at(d))).missions;
      await completeMission(deps(at(d)), ALICE, m.id);
    }
    expect(store.stats.get(ALICE)).toMatchObject({ currentStreak: 3, bestStreak: 3 });
    const [m] = (await today(ALICE, at(4))).missions;
    const r = await completeMission(deps(at(4)), ALICE, m.id);
    expect(r).toMatchObject({ ok: true, data: { streak: 1 } });
    expect(store.stats.get(ALICE)).toMatchObject({ currentStreak: 1, bestStreak: 3 });
  });

  it("reports the 3-day streak milestone on the first mission of day 3 only", async () => {
    await start();
    for (const d of [0, 1]) {
      const [m] = (await today(ALICE, at(d))).missions;
      await completeMission(deps(at(d)), ALICE, m.id);
    }
    const [first, second] = (await today(ALICE, at(2))).missions;
    expect(await completeMission(deps(at(2)), ALICE, first.id)).toMatchObject({ data: { streakMilestone: 3 } });
    expect(await completeMission(deps(at(2)), ALICE, second.id)).toMatchObject({ data: { streakMilestone: null } });
  });
});

describe("undoMission", () => {
  it("takes back the mission and the day bonus", async () => {
    await start();
    const ms = (await today()).missions;
    for (const m of ms) await completeMission(deps(), ALICE, m.id);
    const r = await undoMission(deps(), ALICE, ms[2].id);
    expect(r).toEqual({ ok: true, data: { totalXp: ms[0].xp + ms[1].xp } });
  });
});

describe("skipMission", () => {
  it("needs a valid reason and records it", async () => {
    await start();
    const [m] = (await today()).missions;
    expect(await skipMission(deps(), ALICE, m.id, "lazy")).toMatchObject({ ok: false, error: "invalid_input" });
    expect(await skipMission(deps(), ALICE, m.id, "too_hard")).toEqual({ ok: true, data: { skipped: true } });
    expect(store.missions.find((x) => x.id === m.id)).toMatchObject({ status: "skipped", skipReason: "too_hard" });
    expect(await completeMission(deps(), ALICE, m.id)).toMatchObject({ ok: false });
  });
});

describe("swapMission", () => {
  it("swaps for a new mission in the same pillar and slot, once a day", async () => {
    await start();
    const [m, second] = (await today()).missions;
    const r = await swapMission(deps(), ALICE, m.id);
    if (!r.ok) throw new Error(r.message);
    expect(r.data.mission).toMatchObject({ slot: m.slot, pillar: m.pillar, status: "assigned" });
    expect(r.data.mission.missionId).not.toBe(m.missionId);
    expect((await today()).missions).toHaveLength(3);
    expect((await today()).swapsLeft).toBe(0);
    expect(await swapMission(deps(), ALICE, second.id)).toMatchObject({ ok: false, error: "swap_limit" });
  });

  it("keeps the day within the student's minutes", async () => {
    await start();
    const before = (await today(ALICE, at(3))).missions;
    await swapMission(deps(at(3)), ALICE, before[0].id);
    const after = (await today(ALICE, at(3))).missions;
    expect(after.reduce((s, m) => s + m.minutes, 0)).toBeLessThanOrEqual(45);
  });

  it("refuses done or skipped missions", async () => {
    await start();
    const [m] = (await today()).missions;
    await completeMission(deps(), ALICE, m.id);
    expect(await swapMission(deps(), ALICE, m.id)).toMatchObject({ ok: false, error: "not_today" });
  });
});

describe("after the free trial", () => {
  it("gives no automatic missions; the student picks one pillar for one mission", async () => {
    await start();
    const t = await today(ALICE, at(8));
    expect(t.fullAccess).toBe(false);
    expect(t.missions).toHaveLength(0);
    const r = await chooseFreePillar(deps(at(8)), ALICE, "money");
    if (!r.ok) throw new Error(r.message);
    expect(r.data.missions).toHaveLength(1);
    expect(r.data.missions[0].pillar).toBe("money");
    // A second pick the same day doesn't add another mission.
    const again = await chooseFreePillar(deps(at(8)), ALICE, "body");
    expect(again.ok && again.data.missions).toHaveLength(1);
  });

  it("keeps three missions a day with a Season Pass", async () => {
    await start();
    store.grants.push({ userId: ALICE, kind: "season_pass", startsAt: START, endsAt: at(90) });
    expect((await today(ALICE, at(8))).missions).toHaveLength(3);
  });

  it("rejects a pillar that isn't one of the four", async () => {
    await start();
    expect(await chooseFreePillar(deps(at(8)), ALICE, "gaming")).toMatchObject({ ok: false, error: "invalid_input" });
  });
});

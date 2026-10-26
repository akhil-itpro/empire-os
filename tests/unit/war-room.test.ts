import { beforeEach, describe, expect, it } from "vitest";
import type { Answers } from "@/lib/plan-engine/answers";
import { LIBRARY } from "@/lib/plan-engine/library";
import { selectDailyMissions, slotPillars, type PlanSettings } from "@/lib/plan-engine/select";
import { adaptNextWeek, reviewSchema, weakestPillar, type WeekStats } from "@/lib/plan-engine/war-room";
import { completeMission, ensureToday, startSeason, type Deps } from "@/lib/server/season-service";
import { MemoryStore } from "@/lib/server/store-memory";
import {
  completeBoss,
  decideProposal,
  loadBoss,
  loadWarRoom,
  reviewWeek,
  submitReview,
} from "@/lib/server/war-room-service";

const settings: PlanSettings = {
  pillarOrder: ["career", "mind", "body", "money"],
  dailyMinutes: 45,
  budget: "under_500",
  gym: false,
  laptop: true,
  enemy: "phone",
  intensity: "ambitious",
};

function stats(done: number, assigned: number, byPillar: Partial<WeekStats["byPillar"]> = {}): WeekStats {
  return {
    done,
    assigned,
    byPillar: {
      career: { assigned: 7, done: 7 },
      mind: { assigned: 7, done: 5 },
      body: { assigned: 4, done: 1 },
      money: { assigned: 3, done: 2 },
      ...byPillar,
    },
  };
}

type ReviewBits = Parameters<typeof adaptNextWeek>[0]["review"];
const review: ReviewBits = { felt: "just_right", blocker: "nothing", focusPillar: "body" };
const adapt = (s: WeekStats, r: Partial<ReviewBits> = {}) =>
  adaptNextWeek({ stats: s, review: { ...review, ...r }, settings, previousBudget: "under_500", nextWeek: 5 });

describe("War Room rules", () => {
  it("under 50% done: one time tier and one difficulty level down, a 5-minute quick win, Reset copy", () => {
    const a = adapt(stats(9, 21));
    expect(a.adjustments).toMatchObject({ timeTierShift: -1, difficultyShift: -1, quickWinMax: 5 });
    expect(a.adjustments.boss).toBeUndefined();
    expect(a.lowWeek).toBe(true);
    expect(a.reasons[0]).toBe(
      "You finished 9 of 21 missions (43%), under half. Next week each day is shorter, about 30 minutes instead of 45, and one step easier. A 5-minute quick win stays every day.",
    );
  });

  it("'too hard' is a low week too, even with most missions done", () => {
    const a = adapt(stats(19, 21), { felt: "too_hard" });
    expect(a.adjustments).toMatchObject({ timeTierShift: -1, difficultyShift: -1 });
    expect(a.adjustments.boss).toBeUndefined();
    expect(a.reasons[0]).toMatch(/^You said this week felt too hard\./);
  });

  it("over 85% and not too hard: one level harder and a 150 XP boss mission", () => {
    const a = adapt(stats(19, 21));
    expect(a.adjustments).toMatchObject({ difficultyShift: 1, boss: true });
    expect(a.lowWeek).toBe(false);
    expect(a.reasons[0]).toBe("You finished 19 of 21 missions (90%). Next week is one step harder, plus a boss mission worth 150 XP.");
  });

  it("between the two keeps the same pace", () => {
    const a = adapt(stats(14, 21));
    expect(a.adjustments.difficultyShift).toBeUndefined();
    expect(a.adjustments.timeTierShift).toBeUndefined();
    expect(a.reasons[0]).toBe("You finished 14 of 21 missions (67%) and it felt about right. Next week keeps the same pace.");
  });

  it("a money blocker or a lower budget means free missions only", () => {
    expect(adapt(stats(14, 21), { blocker: "money" }).adjustments.freeOnly).toBe(true);
    const lower = adaptNextWeek({ stats: stats(14, 21), review, settings: { ...settings, budget: "free" }, previousBudget: "under_500", nextWeek: 5 });
    expect(lower.adjustments.freeOnly).toBe(true);
    expect(lower.reasons).toContain("Your budget went down, so every mission next week is free.");
    expect(adapt(stats(14, 21)).adjustments.freeOnly).toBeUndefined();
  });

  it("an energy blocker adds sleep and energy missions", () => {
    const a = adapt(stats(14, 21), { blocker: "energy" });
    expect(a.adjustments.focusTag).toBe("energy");
    expect(a.reasons).toContain("Energy was the blocker, so next week adds sleep and energy missions.");
  });

  it("a focus pillar outside the top two gets a mission every day; the weakest is named with its number", () => {
    const a = adapt(stats(14, 21));
    expect(a.adjustments.focusPillar).toBe("body");
    expect(a.reasons.at(-1)).toBe("Your focus next week is Body, your weakest pillar this week at 25%, so it gets a mission every day.");
    expect(adapt(stats(14, 21), { focusPillar: "mind" }).adjustments.focusPillar).toBeUndefined();
  });

  it("always gives 2 to 4 reasons", () => {
    for (const r of [{}, { blocker: "money" }, { blocker: "energy", felt: "too_hard" }] as Partial<ReviewBits>[]) {
      const n = adapt(stats(3, 21), r).reasons.length;
      expect(n).toBeGreaterThanOrEqual(2);
      expect(n).toBeLessThanOrEqual(4);
    }
  });

  it("pre-selects the weakest pillar", () => {
    expect(weakestPillar(stats(14, 21), settings.pillarOrder)).toBe("body");
  });

  it("needs the follow-up answer for each change ticked", () => {
    const base = { ...review, changes: ["schedule"] };
    expect(reviewSchema.safeParse(base).success).toBe(false);
    expect(reviewSchema.safeParse({ ...base, dailyMinutes: 30 }).success).toBe(true);
    expect(reviewSchema.safeParse({ ...review, changes: ["goal"], goal: "made_up" }).success).toBe(false);
  });
});

describe("the plan engine with War Room changes", () => {
  const ctx = (seasonDay: number, adjustments = {}) => ({
    seed: "s",
    date: `2026-11-${String(seasonDay).padStart(2, "0")}`,
    seasonDay,
    week: 2,
    act: 1 as const,
    archetype: "grinder" as const,
    settings,
    history: [],
    adjustments,
  });

  it("puts the focus pillar in the third slot every day", () => {
    expect(slotPillars(settings.pillarOrder, 8, "money")).toEqual(["career", "mind", "money"]);
    expect(slotPillars(settings.pillarOrder, 9, "money")).toEqual(["career", "mind", "money"]);
    // A focus already in the top two leaves the rotation alone.
    expect(slotPillars(settings.pillarOrder, 9, "career")).toEqual(["career", "mind", "body"]);
    expect(slotPillars(settings.pillarOrder, 10, "career")).toEqual(["career", "mind", "money"]);
    for (const day of [8, 9, 10]) {
      expect(selectDailyMissions(LIBRARY, ctx(day, { focusPillar: "body" })).map((m) => m.pillar)).toEqual(["career", "mind", "body"]);
    }
  });

  it("keeps a 5-minute quick win and the shorter day in a low week, and free missions only when asked", () => {
    for (const day of [9, 10, 11]) {
      const picked = selectDailyMissions(LIBRARY, ctx(day, { timeTierShift: -1, quickWinMax: 5, freeOnly: true }));
      expect(Math.min(...picked.map((p) => p.mission.minutes))).toBe(5);
      expect(picked.reduce((s, p) => s + p.mission.minutes, 0)).toBeLessThanOrEqual(30);
      expect(picked.every((p) => p.mission.cost === "free")).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// The service
// ---------------------------------------------------------------------------

const START = new Date("2026-11-01T04:30:00Z"); // 10:00 in India
const at = (day: number) => new Date(START.getTime() + (day - 1) * 86_400_000);
const answers: Answers = {
  firstName: "Asha",
  ageBracket: "21-24",
  city: "hyderabad",
  situation: "student",
  goal: "first_job",
  pillarOrder: ["career", "mind", "body", "money"],
  dailyMinutes: 60,
  budget: "under_500",
  gym: false,
  laptop: true,
  enemy: "phone",
  intensity: "ambitious",
};
const STRONG = "11111111-1111-4111-8111-111111111111";
const LOW = "22222222-2222-4222-8222-222222222222";

let store: MemoryStore;
const deps = (day: number): Deps => ({ store, now: at(day) });

async function playWeek(userId: string, doneEachDay: number) {
  for (let day = 1; day <= 7; day++) {
    const t = await ensureToday(deps(day), userId);
    if (!t.ok) throw new Error(t.message);
    for (const m of t.data.missions.slice(0, doneEachDay)) await completeMission(deps(day), userId, m.id);
  }
}

const reviewInput = { felt: "just_right", blocker: "nothing", changes: [], focusPillar: "body" };

beforeEach(async () => {
  store = new MemoryStore();
  for (const id of [STRONG, LOW]) await startSeason(deps(1), id, answers, { timeZone: "Asia/Kolkata" });
});

describe("the War Room service", () => {
  it("opens on day 7 for week 1, and reviews the latest finished week", () => {
    expect(reviewWeek("2026-11-01", "2026-11-06")).toBeNull();
    expect(reviewWeek("2026-11-01", "2026-11-07")).toBe(1);
    expect(reviewWeek("2026-11-01", "2026-11-13")).toBe(1);
    expect(reviewWeek("2026-11-01", "2026-11-14")).toBe(2);
    expect(reviewWeek("2026-11-01", "2027-01-29")).toBe(12); // day 90
    expect(reviewWeek("2026-11-01", "2027-01-30")).toBeNull(); // after the season
  });

  it("gives two students with different weeks visibly different next weeks", async () => {
    // Both have Season Pass, so week 2 (after the free week) still has three missions a day.
    for (const id of [STRONG, LOW]) {
      await store.grantEntitlement(id, { kind: "season_pass", startsAt: at(1), endsAt: at(91), source: "test" });
    }
    await playWeek(STRONG, 3);
    await playWeek(LOW, 0);
    for (const id of [STRONG, LOW]) expect((await submitReview(deps(7), id, reviewInput)).ok).toBe(true);

    const strong = await loadWarRoom(deps(7), STRONG);
    const low = await loadWarRoom(deps(7), LOW);
    if (!strong.ok || !low.ok) throw new Error();
    expect(strong.data.review!.outcome).toMatchObject({ difficultyShift: 1, boss: true, applied: true, done: 21, assigned: 21 });
    expect(low.data.review!.outcome).toMatchObject({ timeTierShift: -1, difficultyShift: -1, lowWeek: true, done: 0 });

    const day8 = async (id: string) => {
      const t = await ensureToday(deps(8), id);
      if (!t.ok) throw new Error();
      return t.data.missions;
    };
    const [s, l] = [await day8(STRONG), await day8(LOW)];
    const minutes = (ms: { minutes: number }[]) => ms.reduce((sum, m) => sum + m.minutes, 0);
    expect(minutes(l)).toBeLessThanOrEqual(45);
    expect(minutes(s)).toBeGreaterThan(minutes(l));
    expect(s.map((m) => m.missionId)).not.toEqual(l.map((m) => m.missionId));
    // Body is the focus and isn't in the top two: it's the third mission every day.
    expect(s.map((m) => m.pillar)).toEqual(["career", "mind", "body"]);

    // Only the strong week earned a boss mission; it pays 150 XP once.
    expect(await loadBoss(deps(8), LOW)).toBeNull();
    const boss = await loadBoss(deps(8), STRONG);
    expect(boss).toMatchObject({ xp: 150, done: false, pillar: "body" });
    const xpBefore = await store.xpTotal(STRONG);
    const first = await completeBoss(deps(8), STRONG);
    expect(first.ok && first.data.xpGained).toBe(150);
    expect(first.ok && first.data.firstBoss).toBe(true);
    const again = await completeBoss(deps(9), STRONG);
    expect(again.ok && again.data.xpGained).toBe(0);
    expect(again.ok && again.data.firstBoss).toBe(false);
    expect(await store.xpTotal(STRONG)).toBe(xpBefore + 150);
  });

  it("saves once per week, and refuses before day 7", async () => {
    expect((await submitReview(deps(5), STRONG, reviewInput)).ok).toBe(false);
    await submitReview(deps(7), STRONG, reviewInput);
    await submitReview(deps(7), STRONG, { ...reviewInput, felt: "too_hard" });
    expect(store.reviews.filter((r) => r.userId === STRONG)).toHaveLength(1);
    expect(store.reviews[0].felt).toBe("just_right");
    expect(store.events.filter((e) => e.name === "weekly_review_done")).toHaveLength(1);
  });

  it("applies schedule and budget changes from tomorrow, and asks before a goal change", async () => {
    await playWeek(STRONG, 2);
    const r = await submitReview(deps(7), STRONG, {
      ...reviewInput,
      changes: ["schedule", "budget", "goal"],
      dailyMinutes: 30,
      budget: "free",
      goal: "fitness",
    });
    expect(r.ok).toBe(true);
    let p = store.profiles.get(STRONG)!;
    expect(p.pendingFrom).toBe("2026-11-08");
    expect(p.pendingSettings).toMatchObject({ dailyMinutes: 30, budget: "free", goal: "first_job" });

    const room = await loadWarRoom(deps(7), STRONG);
    if (!room.ok) throw new Error();
    expect(room.data.review!.outcome.freeOnly).toBe(true);
    expect(room.data.proposal).toMatchObject({
      before: { archetype: "The Grinder" },
      after: { archetype: "The Warrior" },
      goalChanged: true,
      cityChanged: false,
      status: "open",
    });

    const xp = await store.xpTotal(STRONG);
    expect((await decideProposal(deps(7), STRONG, true)).ok).toBe(true);
    p = store.profiles.get(STRONG)!;
    expect(p.pendingSettings).toMatchObject({ goal: "fitness", archetype: "warrior", dailyMinutes: 30 });
    expect(p.archetype).toBe("grinder"); // today and the past stay as they were
    expect(await store.xpTotal(STRONG)).toBe(xp);
    expect((await decideProposal(deps(7), STRONG, true)).ok).toBe(false);
  });

  it("shows Free students what would change, without applying it", async () => {
    // Week 2 ends on day 14, after the free week: no pass, so Free.
    const r = await submitReview(deps(14), LOW, reviewInput);
    expect(r.ok).toBe(true);
    const room = await loadWarRoom(deps(14), LOW);
    if (!room.ok) throw new Error();
    expect(room.data.fullAccess).toBe(false);
    expect(room.data.review!.outcome).toMatchObject({ applied: false });
    expect(room.data.review!.outcome.reasons.length).toBeGreaterThanOrEqual(2);
  });
});

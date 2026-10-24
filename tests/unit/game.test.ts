import { describe, expect, it } from "vitest";
import { hasFullAccess, hasSeasonPass, showTrialEndingBanner, trialEndsAt } from "@/lib/game/access";
import { addDays, daysBetween, isLocalDate, localDate, seasonPosition } from "@/lib/game/dates";
import { empireScore, pillarScores } from "@/lib/game/score";
import { computeStreak, streakMilestone } from "@/lib/game/streak";
import { STREAK_MILESTONES } from "@/lib/game/rules";
import { rankFor, rankUp, xpForDay, xpForDifficulty } from "@/lib/game/xp";

describe("XP", () => {
  it("gives 30, 45 or 60 XP by difficulty", () => {
    expect([xpForDifficulty(1), xpForDifficulty(2), xpForDifficulty(3)]).toEqual([30, 45, 60]);
  });

  it("adds the 30 XP day bonus only when every mission is done", () => {
    const day = [
      { difficulty: 2 as const, done: true },
      { difficulty: 2 as const, done: true },
      { difficulty: 1 as const, done: false },
    ];
    expect(xpForDay(day)).toBe(90);
    expect(xpForDay(day.map((m) => ({ ...m, done: true })))).toBe(45 + 45 + 30 + 30);
    expect(xpForDay([])).toBe(0);
  });
});

describe("ranks", () => {
  it("uses the thresholds Rookie 0, Operator 400, Strategist 1500, Architect 3500, Commander 6500, Legend 10000", () => {
    expect(rankFor(0).rank).toBe("Rookie");
    expect(rankFor(399).rank).toBe("Rookie");
    expect(rankFor(400).rank).toBe("Operator");
    expect(rankFor(1499).rank).toBe("Operator");
    expect(rankFor(1500).rank).toBe("Strategist");
    expect(rankFor(3500).rank).toBe("Architect");
    expect(rankFor(6500).rank).toBe("Commander");
    expect(rankFor(10000).rank).toBe("Legend");
    expect(rankFor(25000).rank).toBe("Legend");
  });

  it("reports the XP still needed and progress through the band", () => {
    // The HQ design: 1,195 XP is Operator, 305 XP to Strategist.
    expect(rankFor(1195)).toEqual({ rank: "Operator", next: "Strategist", toNext: 305, percent: 72 });
    expect(rankFor(10000)).toEqual({ rank: "Legend", next: null, toNext: 0, percent: 100 });
  });

  it("treats negative or fractional XP safely", () => {
    expect(rankFor(-50).rank).toBe("Rookie");
    expect(rankFor(399.9).rank).toBe("Rookie");
  });

  it("detects a rank-up only when the rank changes", () => {
    expect(rankUp(380, 425)).toBe("Operator");
    expect(rankUp(400, 445)).toBeNull();
  });
});

describe("dates", () => {
  it("gives the date in the student's own time zone", () => {
    // 20:00 UTC on 24 Oct is 01:30 on 25 Oct in India.
    const now = new Date("2026-10-24T20:00:00Z");
    expect(localDate(now, "Asia/Kolkata")).toBe("2026-10-25");
    expect(localDate(now, "UTC")).toBe("2026-10-24");
  });

  it("validates local dates", () => {
    expect(isLocalDate("2026-10-24")).toBe(true);
    expect(isLocalDate("2026-02-30")).toBe(false);
    expect(isLocalDate("24-10-2026")).toBe(false);
  });

  it("adds and counts days across months", () => {
    expect(addDays("2026-10-30", 3)).toBe("2026-11-02");
    expect(daysBetween("2026-10-30", "2026-11-02")).toBe(3);
  });

  it("maps a season day to its week and act", () => {
    const start = "2026-10-01";
    expect(seasonPosition(start, "2026-10-01")).toEqual({ day: 1, week: 1, act: 1, finished: false });
    expect(seasonPosition(start, addDays(start, 27))).toMatchObject({ day: 28, week: 4, act: 1 });
    expect(seasonPosition(start, addDays(start, 28))).toMatchObject({ day: 29, week: 5, act: 2 });
    expect(seasonPosition(start, addDays(start, 56))).toMatchObject({ day: 57, week: 9, act: 3 });
    expect(seasonPosition(start, addDays(start, 89))).toMatchObject({ day: 90, week: 13, act: 3, finished: false });
    expect(seasonPosition(start, addDays(start, 95))).toMatchObject({ day: 90, week: 13, finished: true });
  });
});

describe("streaks", () => {
  const start = "2026-10-01";
  const days = (...offsets: number[]) => offsets.map((o) => addDays(start, o));

  it("counts consecutive days with at least one mission done", () => {
    const r = computeStreak({ activeDays: days(0, 1, 2), today: addDays(start, 2), seasonStart: start });
    expect(r).toMatchObject({ current: 3, best: 3, state: "done_today" });
  });

  it("keeps the streak alive while today is still open", () => {
    const r = computeStreak({ activeDays: days(0, 1, 2), today: addDays(start, 3), seasonStart: start });
    expect(r).toMatchObject({ current: 3, state: "alive" });
  });

  it("resets after a missed day and says paused, keeping the best", () => {
    const r = computeStreak({ activeDays: days(0, 1, 2, 3), today: addDays(start, 5), seasonStart: start });
    expect(r).toMatchObject({ current: 0, best: 4, state: "paused" });
  });

  it("starts again from 1 after a reset", () => {
    const r = computeStreak({ activeDays: days(0, 1, 3), today: addDays(start, 3), seasonStart: start });
    expect(r).toMatchObject({ current: 1, best: 2, state: "done_today" });
  });

  it("uses one shield a week for pass holders on a missed day", () => {
    const r = computeStreak({
      activeDays: days(0, 1, 3, 4),
      today: addDays(start, 4),
      seasonStart: start,
      hasShieldOn: () => true,
    });
    expect(r).toMatchObject({ current: 4, state: "done_today", shieldedDays: [addDays(start, 2)] });
  });

  it("allows only one shield in the same season week", () => {
    const r = computeStreak({
      activeDays: days(0, 2, 4),
      today: addDays(start, 4),
      seasonStart: start,
      hasShieldOn: () => true,
    });
    // Day index 1 is shielded; day index 3 is in the same week, so the streak resets.
    expect(r.current).toBe(1);
    expect(r.shieldedDays).toEqual([addDays(start, 1)]);
  });

  it("gives a new shield in the next season week", () => {
    const r = computeStreak({
      activeDays: days(5, 7, 9),
      today: addDays(start, 9),
      seasonStart: start,
      hasShieldOn: () => true,
    });
    // Day 6 (week 0) and day 8 (week 1) are each covered.
    expect(r.current).toBe(3);
    expect(r.shieldedDays).toEqual(days(6, 8));
  });

  it("gives no shield without a pass", () => {
    const r = computeStreak({ activeDays: days(0, 1, 3), today: addDays(start, 3), seasonStart: start });
    expect(r.shieldedDays).toEqual([]);
    expect(r.current).toBe(1);
  });

  it("returns none with no activity, and ignores future dates", () => {
    expect(computeStreak({ activeDays: [], today: start, seasonStart: start }).state).toBe("none");
    expect(computeStreak({ activeDays: days(5), today: start, seasonStart: start }).current).toBe(0);
  });

  it("reports milestones at 3, 7, 14, 30, 60 and 90 days", () => {
    expect(streakMilestone(7, STREAK_MILESTONES)).toBe(7);
    expect(streakMilestone(8, STREAK_MILESTONES)).toBeNull();
  });
});

describe("Empire score", () => {
  const today = "2026-10-10";
  const m = (offset: number, pillar: "career" | "body" | "mind" | "money", done: boolean) => ({
    localDate: addDays(today, -offset),
    pillar,
    done,
  });

  it("is missions done ÷ assigned over the last 7 days, 0 to 100", () => {
    const missions = [m(1, "career", true), m(1, "body", false), m(2, "mind", true), m(3, "money", true)];
    expect(empireScore(missions, today)).toBe(75);
  });

  it("ignores missions older than 7 days", () => {
    expect(empireScore([m(7, "career", false), m(6, "career", true)], today)).toBe(100);
  });

  it("doesn't count today's unfinished missions against the student", () => {
    expect(empireScore([m(0, "career", false), m(1, "body", true)], today)).toBe(100);
    expect(empireScore([m(0, "career", true), m(1, "body", false)], today)).toBe(50);
  });

  it("is null when nothing was assigned", () => {
    expect(empireScore([], today)).toBeNull();
  });

  it("uses the same formula per pillar", () => {
    const scores = pillarScores([m(1, "career", true), m(2, "career", false), m(1, "body", true)], today);
    expect(scores).toEqual({ career: 50, body: 100, mind: null, money: null });
  });
});

describe("access", () => {
  const signup = new Date("2026-10-01T10:00:00Z");
  const end = trialEndsAt(signup);

  it("gives full access for exactly 7 days after sign-up", () => {
    expect(end.toISOString()).toBe("2026-10-08T10:00:00.000Z");
    expect(hasFullAccess(new Date("2026-10-08T09:59:59Z"), end, [])).toBe(true);
    expect(hasFullAccess(new Date("2026-10-08T10:00:00Z"), end, [])).toBe(false);
  });

  it("keeps full access while a pass covers now", () => {
    const pass = { kind: "season_pass" as const, startsAt: signup, endsAt: new Date("2027-01-01T00:00:00Z") };
    expect(hasFullAccess(new Date("2026-11-01T00:00:00Z"), end, [pass])).toBe(true);
    expect(hasSeasonPass(new Date("2026-11-01T00:00:00Z"), [pass])).toBe(true);
    expect(hasSeasonPass(new Date("2027-01-02T00:00:00Z"), [pass])).toBe(false);
  });

  it("shows the trial-ending banner only in the last 24 hours, and not to pass holders", () => {
    expect(showTrialEndingBanner(new Date("2026-10-07T12:00:00Z"), end, [])).toBe(true);
    expect(showTrialEndingBanner(new Date("2026-10-06T12:00:00Z"), end, [])).toBe(false);
    expect(showTrialEndingBanner(new Date("2026-10-08T12:00:00Z"), end, [])).toBe(false);
    const pass = { kind: "season_pass" as const, startsAt: signup, endsAt: new Date("2027-01-01T00:00:00Z") };
    expect(showTrialEndingBanner(new Date("2026-10-07T12:00:00Z"), end, [pass])).toBe(false);
  });
});

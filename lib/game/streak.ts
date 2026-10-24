import { addDays, daysBetween, type LocalDate } from "./dates";

export type StreakInput = {
  /** Local dates with at least one mission done, in any order. */
  activeDays: LocalDate[];
  today: LocalDate;
  /** First day of the season; shields are counted per season week from here. */
  seasonStart: LocalDate;
  /** True if the student held a Season Pass on that date (one shield a week). */
  hasShieldOn?: (date: LocalDate) => boolean;
};

export type StreakState =
  /** Today already counts. */
  | "done_today"
  /** The streak is alive; do one mission today to keep it. */
  | "alive"
  /** A missed day reset it: "Streak paused. Your XP and rank are safe. Go again today." */
  | "paused"
  /** Nothing yet. */
  | "none";

export type StreakResult = {
  current: number;
  best: number;
  state: StreakState;
  /** Missed days covered by a shield (one per season week, pass holders only). */
  shieldedDays: LocalDate[];
};

function seasonWeek(seasonStart: LocalDate, date: LocalDate): number {
  return Math.floor(daysBetween(seasonStart, date) / 7);
}

/**
 * Walks the days from the first active day to today. A day counts when at least
 * one mission is done. A missed day uses that week's shield if the student had a
 * pass then and hasn't used it; otherwise the streak resets. Today never breaks
 * the streak, because the day isn't over.
 */
export function computeStreak({
  activeDays,
  today,
  seasonStart,
  hasShieldOn = () => false,
}: StreakInput): StreakResult {
  const active = new Set(activeDays.filter((d) => daysBetween(d, today) >= 0));
  if (active.size === 0) {
    return { current: 0, best: 0, state: "none", shieldedDays: [] };
  }

  const first = [...active].sort()[0];
  const usedShieldWeeks = new Set<number>();
  const shieldedDays: LocalDate[] = [];
  let run = 0;
  let best = 0;
  let brokeAfterRun = false;

  for (let d = first; daysBetween(d, today) >= 0; d = addDays(d, 1)) {
    if (active.has(d)) {
      run += 1;
      brokeAfterRun = false;
    } else if (d === today) {
      // Today is still open.
    } else {
      const week = seasonWeek(seasonStart, d);
      if (run > 0 && hasShieldOn(d) && !usedShieldWeeks.has(week)) {
        usedShieldWeeks.add(week);
        shieldedDays.push(d);
      } else {
        if (run > 0) brokeAfterRun = true;
        run = 0;
      }
    }
    best = Math.max(best, run);
  }

  const state: StreakState = active.has(today)
    ? "done_today"
    : run > 0
      ? "alive"
      : brokeAfterRun
        ? "paused"
        : "none";

  return { current: run, best, state, shieldedDays };
}

/** The milestone reached exactly at this streak length, if any (3, 7, 14, 30, 60, 90). */
export function streakMilestone(current: number, milestones: readonly number[]): number | null {
  return milestones.includes(current) ? current : null;
}

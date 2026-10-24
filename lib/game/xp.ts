import { DAY_COMPLETE_BONUS, RANKS, XP_BY_DIFFICULTY, type Difficulty, type RankName } from "./rules";

export function xpForDifficulty(difficulty: Difficulty): number {
  return XP_BY_DIFFICULTY[difficulty];
}

/** XP for one day: the done missions, plus the bonus when every assigned mission is done. */
export function xpForDay(missions: { difficulty: Difficulty; done: boolean }[]): number {
  const earned = missions.reduce((sum, m) => sum + (m.done ? xpForDifficulty(m.difficulty) : 0), 0);
  const allDone = missions.length > 0 && missions.every((m) => m.done);
  return earned + (allDone ? DAY_COMPLETE_BONUS : 0);
}

export type RankProgress = {
  rank: RankName;
  /** The next rank, or null at Legend. */
  next: RankName | null;
  /** XP still needed for the next rank (0 at Legend). */
  toNext: number;
  /** 0 to 100 through the current rank's band (100 at Legend). */
  percent: number;
};

export function rankFor(xp: number): RankProgress {
  const total = Math.max(0, Math.floor(xp));
  let index = 0;
  for (let i = 0; i < RANKS.length; i++) {
    if (total >= RANKS[i].minXp) index = i;
  }
  const current = RANKS[index];
  const next = RANKS[index + 1];
  if (!next) return { rank: current.name, next: null, toNext: 0, percent: 100 };
  const band = next.minXp - current.minXp;
  return {
    rank: current.name,
    next: next.name,
    toNext: next.minXp - total,
    percent: Math.floor(((total - current.minXp) / band) * 100),
  };
}

/** The rank reached when XP goes from `before` to `after`, or null if the rank didn't change. */
export function rankUp(before: number, after: number): RankName | null {
  const a = rankFor(before).rank;
  const b = rankFor(after).rank;
  return a === b ? null : b;
}

import "server-only";
import { passCoversDate } from "@/lib/game/access";
import { addDays, localDate } from "@/lib/game/dates";
import { pillarScores } from "@/lib/game/score";
import { computeStreak } from "@/lib/game/streak";
import { PILLARS, type Pillar } from "@/lib/pillars";
import type { Deps, Result } from "./season-service";
import { summariseDays } from "./season-history";

export type StatsData = {
  missionsDone: number;
  minutesInvested: number;
  currentStreak: number;
  bestStreak: number;
  totalXp: number;
  week: Record<Pillar, number | null>;
  season: Record<Pillar, number | null>;
  /** XP per day for the last 14 days of the season so far. */
  xpByDay: { date: string; xp: number }[];
};

export async function loadStats(deps: Deps, userId: string): Promise<Result<StatsData>> {
  const profile = await deps.store.getProfile(userId);
  if (!profile) return { ok: false, error: "not_started", message: "Start your season first." };
  const today = localDate(deps.now, profile.timeZone);
  const [missions, xp, activeDays, entitlements] = await Promise.all([
    deps.store.listMissions(userId, profile.seasonStart, today),
    deps.store.xpTotal(userId),
    deps.store.activeDays(userId),
    deps.store.entitlements(userId),
  ]);

  const live = missions.filter((m) => m.status !== "swapped");
  const done = live.filter((m) => m.status === "done");
  const counted = live.map((m) => ({ localDate: m.localDate, pillar: m.pillar, done: m.status === "done" }));

  // Season completion per pillar, with today's unfinished missions not counted yet.
  const season = {} as Record<Pillar, number | null>;
  for (const p of PILLARS) {
    const rows = counted.filter((m) => m.pillar === p && (m.localDate !== today || m.done));
    season[p] = rows.length ? Math.round((rows.filter((m) => m.done).length / rows.length) * 100) : null;
  }

  const streak = computeStreak({
    activeDays,
    today,
    seasonStart: profile.seasonStart,
    hasShieldOn: passCoversDate(entitlements, profile.timeZone),
  });

  const from = [addDays(today, -13), profile.seasonStart].sort().at(-1)!;
  const days = summariseDays(missions, from, today);

  return {
    ok: true,
    data: {
      missionsDone: done.length,
      minutesInvested: done.reduce((s, m) => s + m.minutes, 0),
      currentStreak: streak.current,
      bestStreak: streak.best,
      totalXp: xp,
      week: pillarScores(counted, today),
      season,
      xpByDay: days.map((d) => ({ date: d.date, xp: d.xp })),
    },
  };
}

/** "14h 30m", "45m", "0m". */
export function formatMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

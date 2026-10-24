import "server-only";
import { addDays, localDate, seasonPosition, type LocalDate } from "@/lib/game/dates";
import { DAY_COMPLETE_BONUS } from "@/lib/game/rules";
import { hasFullAccess } from "@/lib/game/access";
import { ARCHETYPE_INFO } from "@/lib/plan-engine/archetype";
import { WEEK_THEMES } from "@/lib/plan-engine/week-themes";
import type { Deps, Result } from "./season-service";
import type { Profile, UserMission } from "./store";

export type DaySummary = {
  date: LocalDate;
  assigned: number;
  done: number;
  minutes: number;
  xp: number;
};

/** One row per season day so far, from the student's real mission rows. */
export function summariseDays(missions: UserMission[], from: LocalDate, to: LocalDate): DaySummary[] {
  const byDate = new Map<LocalDate, UserMission[]>();
  for (const m of missions) {
    if (m.status === "swapped") continue;
    byDate.set(m.localDate, [...(byDate.get(m.localDate) ?? []), m]);
  }
  const days: DaySummary[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const list = byDate.get(d) ?? [];
    const done = list.filter((m) => m.status === "done");
    const allDone = list.length > 0 && done.length === list.length;
    days.push({
      date: d,
      assigned: list.length,
      done: done.length,
      minutes: done.reduce((s, m) => s + m.minutes, 0),
      xp: done.reduce((s, m) => s + m.xp, 0) + (allDone ? DAY_COMPLETE_BONUS : 0),
    });
  }
  return days;
}

export type WeekNode = {
  week: number;
  act: 1 | 2 | 3;
  theme: string;
  status: "done" | "current" | "future" | "locked";
  xp: number;
};

export type PathData = {
  archetypeName: string;
  currentWeek: number;
  fullAccess: boolean;
  weeks: WeekNode[];
};

export async function loadSeason(deps: Deps, userId: string): Promise<Result<{ profile: Profile; today: LocalDate; days: DaySummary[] }>> {
  const profile = await deps.store.getProfile(userId);
  if (!profile) return { ok: false, error: "not_started", message: "Start your season first." };
  const today = localDate(deps.now, profile.timeZone);
  const missions = await deps.store.listMissions(userId, profile.seasonStart, today);
  return { ok: true, data: { profile, today, days: summariseDays(missions, profile.seasonStart, today) } };
}

export async function loadPath(deps: Deps, userId: string): Promise<Result<PathData>> {
  const season = await loadSeason(deps, userId);
  if (!season.ok) return season;
  const { profile, today, days } = season.data;
  const pos = seasonPosition(profile.seasonStart, today);
  const fullAccess = hasFullAccess(deps.now, profile.trialEndsAt, await deps.store.entitlements(userId));
  const themes = WEEK_THEMES[profile.archetype];

  const weeks: WeekNode[] = themes.map((theme, i) => {
    const week = i + 1;
    const xp = days
      .filter((d) => seasonPosition(profile.seasonStart, d.date).week === week)
      .reduce((s, d) => s + d.xp, 0);
    // Free students see weeks 2 to 13 locked (docs/PRODUCT.md section 4).
    const status: WeekNode["status"] =
      !fullAccess && week >= 2
        ? "locked"
        : week < pos.week || (pos.finished && week === pos.week)
          ? "done"
          : week === pos.week
            ? "current"
            : "future";
    return { week, act: week <= 4 ? 1 : week <= 8 ? 2 : 3, theme, status, xp };
  });

  return {
    ok: true,
    data: { archetypeName: ARCHETYPE_INFO[profile.archetype].name, currentWeek: pos.week, fullAccess, weeks },
  };
}

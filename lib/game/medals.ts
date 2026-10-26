// Medals (docs/PRODUCT.md section 5): a service record earned from real activity.
// Pure: worked out from the student's mission rows and two counts, never typed in
// or stored, so a medal can't be faked and always matches the history.
import type { Pillar } from "@/lib/pillars";
import { daysBetween, type LocalDate } from "./dates";

export const MEDALS = [
  { id: "first_mission", name: "First mission", how: "Finish your first mission." },
  { id: "full_day", name: "Full day", how: "Finish every mission in one day." },
  { id: "early_start", name: "Early start", how: "Finish a mission between 5 and 8 in the morning." },
  { id: "comeback", name: "Comeback", how: "Do a mission again after a missed day." },
  { id: "all_four", name: "All four", how: "Finish a mission in every pillar in one week." },
  { id: "war_room", name: "War Room", how: "Finish a weekly review." },
  { id: "clean_sweep", name: "Clean sweep", how: "Finish every mission 7 days running." },
  { id: "boss", name: "Boss beaten", how: "Finish a weekly boss mission." },
  { id: "ten_hours", name: "Ten hours", how: "Put 10 hours into missions." },
  { id: "fifty", name: "Fifty missions", how: "Finish 50 missions." },
  { id: "pack", name: "Pack finished", how: "Finish all 10 missions in a pack." },
  { id: "thirty_days", name: "Thirty days", how: "Do missions on 30 different days." },
] as const;

export type MedalId = (typeof MEDALS)[number]["id"];

export const MEDALS_BY_ID = new Map<MedalId, (typeof MEDALS)[number]>(MEDALS.map((m) => [m.id, m]));

/** The numbers behind the medals, in one place. */
export const MEDAL_RULES = {
  earlyFromHour: 5,
  earlyBeforeHour: 8,
  sweepDays: 7,
  investedMinutes: 600,
  missionCount: 50,
  activeDays: 30,
} as const;

export type MedalMission = {
  id: string;
  missionId: string;
  localDate: LocalDate;
  pillar: Pillar;
  minutes: number;
  status: "assigned" | "done" | "skipped" | "swapped";
  completedAt: Date | null;
  /** The pack the mission comes from, or null for the base library. */
  pack: string | null;
};

export type MedalInput = {
  missions: MedalMission[];
  timeZone: string;
  /** Weeks for "All four" are counted in 7-day blocks from here. */
  seasonStart: LocalDate;
  /** Weekly reviews finished. */
  reviews: number;
  /** Weekly boss missions finished. */
  bosses: number;
  /** How many missions each pack has. */
  packSizes: Record<string, number>;
};

/**
 * Every medal earned, with the local date it was earned on, or null when only a
 * count is known (War Room and boss medals).
 */
export function earnedMedals(input: MedalInput): Map<MedalId, LocalDate | null> {
  const earned = new Map<MedalId, LocalDate | null>();
  // The first time a rule is met wins, so each check runs in date order.
  const award = (id: MedalId, on: LocalDate | null) => {
    if (!earned.has(id)) earned.set(id, on);
  };

  const live = input.missions.filter((m) => m.status !== "swapped");
  const done = live
    .filter((m) => m.status === "done")
    .sort(
      (a, b) =>
        a.localDate.localeCompare(b.localDate) || (a.completedAt?.getTime() ?? 0) - (b.completedAt?.getTime() ?? 0),
    );

  const hourOf = hourFormatter(input.timeZone);
  const pillarsByWeek = new Map<number, Set<Pillar>>();
  const doneByPack = new Map<string, Set<string>>();
  let minutes = 0;

  done.forEach((m, i) => {
    if (i === 0) award("first_mission", m.localDate);
    if (i + 1 === MEDAL_RULES.missionCount) award("fifty", m.localDate);

    minutes += m.minutes;
    if (minutes >= MEDAL_RULES.investedMinutes) award("ten_hours", m.localDate);

    if (m.completedAt) {
      const hour = hourOf(m.completedAt);
      if (hour >= MEDAL_RULES.earlyFromHour && hour < MEDAL_RULES.earlyBeforeHour) award("early_start", m.localDate);
    }

    const week = Math.floor(daysBetween(input.seasonStart, m.localDate) / 7);
    const pillars = pillarsByWeek.get(week) ?? new Set<Pillar>();
    pillars.add(m.pillar);
    pillarsByWeek.set(week, pillars);
    if (pillars.size === 4) award("all_four", m.localDate);

    if (m.pack) {
      const packDone = doneByPack.get(m.pack) ?? new Set<string>();
      packDone.add(m.missionId);
      doneByPack.set(m.pack, packDone);
      if (packDone.size >= (input.packSizes[m.pack] ?? Infinity)) award("pack", m.localDate);
    }
  });

  // Day by day: complete days, runs of them, and active days.
  const days = new Map<LocalDate, { live: number; done: number }>();
  for (const m of live) {
    const d = days.get(m.localDate) ?? { live: 0, done: 0 };
    d.live += 1;
    if (m.status === "done") d.done += 1;
    days.set(m.localDate, d);
  }
  const dates = [...days.keys()].sort();

  let run = 0;
  let previousComplete: LocalDate | null = null;
  for (const date of dates) {
    const d = days.get(date)!;
    if (d.done === d.live) {
      award("full_day", date);
      run = previousComplete && daysBetween(previousComplete, date) === 1 ? run + 1 : 1;
      previousComplete = date;
      if (run >= MEDAL_RULES.sweepDays) award("clean_sweep", date);
    }
  }

  const active = dates.filter((date) => days.get(date)!.done > 0);
  active.forEach((date, i) => {
    if (i > 0 && daysBetween(active[i - 1], date) >= 2) award("comeback", date);
    if (i + 1 === MEDAL_RULES.activeDays) award("thirty_days", date);
  });

  if (input.reviews > 0) award("war_room", null);
  if (input.bosses > 0) award("boss", null);
  return earned;
}

/** Medals in `after` that weren't in `before`, in the order of MEDALS. */
export function newMedals(before: Map<MedalId, unknown>, after: Map<MedalId, unknown>): MedalId[] {
  return MEDALS.map((m) => m.id).filter((id) => after.has(id) && !before.has(id));
}

function hourFormatter(timeZone: string) {
  const format = new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", hourCycle: "h23" });
  return (at: Date) => Number(format.formatToParts(at).find((p) => p.type === "hour")!.value);
}

import type { Pillar } from "@/lib/pillars";
import { PILLARS } from "@/lib/pillars";
import { addDays, daysBetween, type LocalDate } from "./dates";

export type AssignedMission = {
  localDate: LocalDate;
  pillar: Pillar;
  done: boolean;
};

/**
 * Empire score: missions completed ÷ missions assigned over the last 7 days
 * (today and the 6 days before), as 0 to 100. Today's missions that aren't done
 * yet don't count against the student, because the day isn't over. Null when
 * nothing was assigned, so the screen can say so instead of showing a fake zero.
 */
export function empireScore(missions: AssignedMission[], today: LocalDate): number | null {
  return ratio(lastSevenDays(missions, today));
}

/** The same formula per pillar, for the four pillar meters. */
export function pillarScores(
  missions: AssignedMission[],
  today: LocalDate,
): Record<Pillar, number | null> {
  const recent = lastSevenDays(missions, today);
  const result = {} as Record<Pillar, number | null>;
  for (const p of PILLARS) result[p] = ratio(recent.filter((m) => m.pillar === p));
  return result;
}

function lastSevenDays(missions: AssignedMission[], today: LocalDate) {
  const from = addDays(today, -6);
  return missions.filter(
    (m) =>
      daysBetween(from, m.localDate) >= 0 &&
      daysBetween(m.localDate, today) >= 0 &&
      (m.localDate !== today || m.done),
  );
}

function ratio(missions: AssignedMission[]): number | null {
  if (missions.length === 0) return null;
  return Math.round((missions.filter((m) => m.done).length / missions.length) * 100);
}

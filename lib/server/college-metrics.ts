// College HQ numbers (docs/PRODUCT.md section 9), computed from raw rows so the
// rules are plain and testable. A college sees only students who joined its batch
// with consent, and only their mission activity: never journals or quiz answers.
import { addDays, daysBetween, type LocalDate } from "@/lib/game/dates";

/** Missions that are mock interviews, counted for the "Mock interviews done" tile. */
export const MOCK_INTERVIEW_MISSIONS = new Set(["car-18", "pp-08"]);

/** A student "needs a nudge" after this many full days in a row without a mission. */
export const NUDGE_AFTER_DAYS = 3;

/** Three missions a day for seven days: the most a student can finish in a week. */
export const MAX_WEEKLY_MISSIONS = 21;

export type Range = "7" | "14" | "season";
export const RANGES: Range[] = ["7", "14", "season"];

export type CollegeMember = { userId: string; displayName: string; section: string | null; joinedOn: LocalDate };
export type CollegeMission = { userId: string; localDate: LocalDate; status: string; missionId: string };
export type BatchDates = { startsOn: LocalDate; endsOn: LocalDate };

/** Where the batch season stands: the date numbers are "as of", and the week. */
export function batchPosition(batch: BatchDates, today: LocalDate) {
  const started = today >= batch.startsOn;
  const asOf = today > batch.endsOn ? batch.endsOn : today;
  const totalWeeks = Math.ceil((daysBetween(batch.startsOn, batch.endsOn) + 1) / 7);
  const week = started ? Math.min(totalWeeks, Math.ceil((daysBetween(batch.startsOn, asOf) + 1) / 7)) : 0;
  return { started, finished: today > batch.endsOn, asOf, week, totalWeeks };
}

/** Days each student finished at least one mission, and their done missions. */
function index(missions: CollegeMission[]) {
  const activeDays = new Map<string, Set<LocalDate>>();
  const done: CollegeMission[] = [];
  for (const m of missions) {
    if (m.status !== "done") continue;
    done.push(m);
    if (!activeDays.has(m.userId)) activeDays.set(m.userId, new Set());
    activeDays.get(m.userId)!.add(m.localDate);
  }
  return { activeDays, done };
}

/**
 * Full days in a row without a mission, counted up to the day before `asOf`
 * (today isn't over yet), from when the student joined or the season began.
 */
export function missedDays(
  member: CollegeMember,
  activeDays: Set<LocalDate> | undefined,
  batch: BatchDates,
  asOf: LocalDate,
): number {
  if (activeDays?.has(asOf)) return 0;
  const start = member.joinedOn > batch.startsOn ? member.joinedOn : batch.startsOn;
  let last: LocalDate | null = null;
  for (const d of activeDays ?? []) if (d < asOf && d >= start && (last === null || d > last)) last = d;
  const from = last ? addDays(last, 1) : start;
  return Math.max(0, daysBetween(from, asOf));
}

type Window = { from: LocalDate; to: LocalDate };

function weekWindow(asOf: LocalDate, batch: BatchDates, weeksBack = 0): Window {
  const to = addDays(asOf, -7 * weeksBack);
  const from = addDays(to, -6);
  return { from: from < batch.startsOn ? batch.startsOn : from, to };
}

function inWindow(d: LocalDate, w: Window) {
  return d >= w.from && d <= w.to;
}

function weekSummary(members: CollegeMember[], idx: ReturnType<typeof index>, w: Window) {
  const ids = new Set(members.map((m) => m.userId));
  let active = 0;
  for (const m of members) {
    const days = idx.activeDays.get(m.userId);
    if (days && [...days].some((d) => inWindow(d, w))) active++;
  }
  const missions = idx.done.filter((m) => ids.has(m.userId) && inWindow(m.localDate, w)).length;
  return {
    active,
    missions,
    missionsPerStudent: members.length ? Math.round((missions / members.length) * 10) / 10 : 0,
  };
}

function needNudgeCount(members: CollegeMember[], idx: ReturnType<typeof index>, batch: BatchDates, asOf: LocalDate) {
  return members.filter(
    (m) => m.joinedOn <= asOf && missedDays(m, idx.activeDays.get(m.userId), batch, asOf) >= NUDGE_AFTER_DAYS,
  ).length;
}

export type NudgeRow = { userId: string; displayName: string; section: string | null; missedDays: number; nudgedToday: boolean };

export type SectionRow = {
  name: string;
  students: number;
  active: number;
  activeShare: number;
  missionsPerStudent: number;
  needNudge: number;
};

export type Overview = {
  memberCount: number;
  position: ReturnType<typeof batchPosition>;
  activeThisWeek: { count: number; prev: number | null };
  missionsPerStudent: { value: number; prev: number | null };
  needNudge: { count: number; prev: number | null };
  mockInterviews: number;
  daily: { date: LocalDate; active: number; share: number }[];
  nudgeList: NudgeRow[];
  sections: SectionRow[];
};

export type OverviewInput = {
  batch: BatchDates & { sections: string[] };
  members: CollegeMember[];
  missions: CollegeMission[];
  today: LocalDate;
  range: Range;
  /** Show one section only, or null for all. */
  section: string | null;
  /** Students who already got a reminder today. */
  nudgedToday: Set<string>;
};

export function computeOverview(input: OverviewInput): Overview {
  const { batch, today, range } = input;
  const position = batchPosition(batch, today);
  const members = input.section === null ? input.members : input.members.filter((m) => m.section === input.section);
  const idx = index(input.missions);
  const asOf = position.asOf;

  const thisWeek = weekWindow(asOf, batch);
  const lastWeek = weekWindow(asOf, batch, 1);
  const hasLastWeek = position.started && lastWeek.to >= batch.startsOn;
  const now = weekSummary(members, idx, thisWeek);
  const prev = hasLastWeek ? weekSummary(members.filter((m) => m.joinedOn <= lastWeek.to), idx, lastWeek) : null;

  const daily: Overview["daily"] = [];
  if (position.started) {
    const from = range === "season" ? batch.startsOn : addDays(asOf, -(Number(range) - 1));
    for (let d = from < batch.startsOn ? batch.startsOn : from; d <= asOf; d = addDays(d, 1)) {
      const active = members.filter((m) => idx.activeDays.get(m.userId)?.has(d)).length;
      daily.push({ date: d, active, share: members.length ? Math.round((active / members.length) * 100) : 0 });
    }
  }

  const nudgeList: NudgeRow[] = position.started
    ? members
        .map((m) => ({
          userId: m.userId,
          displayName: m.displayName,
          section: m.section,
          missedDays: missedDays(m, idx.activeDays.get(m.userId), batch, asOf),
          nudgedToday: input.nudgedToday.has(m.userId),
        }))
        .filter((r) => r.missedDays >= NUDGE_AFTER_DAYS)
        .sort((a, b) => b.missedDays - a.missedDays || a.displayName.localeCompare(b.displayName))
    : [];

  const sectionNames = batch.sections.length ? batch.sections : [];
  const groups: { name: string; members: CollegeMember[] }[] = sectionNames.map((name) => ({
    name,
    members: input.members.filter((m) => m.section === name),
  }));
  const unsectioned = input.members.filter((m) => !m.section || !sectionNames.includes(m.section));
  if (unsectioned.length || groups.length === 0) {
    groups.push({ name: groups.length ? "No section" : "All students", members: unsectioned });
  }
  const sections: SectionRow[] = groups
    .filter((g) => input.section === null || g.name === input.section)
    .map((g) => {
      const s = weekSummary(g.members, idx, thisWeek);
      return {
        name: g.name,
        students: g.members.length,
        active: position.started ? s.active : 0,
        activeShare: g.members.length && position.started ? Math.round((s.active / g.members.length) * 100) : 0,
        missionsPerStudent: position.started ? s.missionsPerStudent : 0,
        needNudge: position.started ? needNudgeCount(g.members, idx, batch, asOf) : 0,
      };
    });

  const ids = new Set(members.map((m) => m.userId));
  return {
    memberCount: members.length,
    position,
    activeThisWeek: { count: position.started ? now.active : 0, prev: prev?.active ?? null },
    missionsPerStudent: { value: position.started ? now.missionsPerStudent : 0, prev: prev?.missionsPerStudent ?? null },
    needNudge: {
      count: nudgeList.length,
      prev: hasLastWeek ? needNudgeCount(members.filter((m) => m.joinedOn <= lastWeek.to), idx, batch, lastWeek.to) : null,
    },
    mockInterviews: idx.done.filter(
      (m) => ids.has(m.userId) && MOCK_INTERVIEW_MISSIONS.has(m.missionId) && m.localDate >= batch.startsOn && m.localDate <= asOf,
    ).length,
    daily,
    nudgeList,
    sections,
  };
}

export type StudentRow = {
  userId: string;
  displayName: string;
  section: string | null;
  lastActive: LocalDate | null;
  activeDaysThisWeek: number;
  missionsThisWeek: number;
  missedDays: number;
};

/** Every member, for the Students page and the weekly report's top students. */
export function studentRows(input: Pick<OverviewInput, "batch" | "members" | "missions" | "today">): StudentRow[] {
  const position = batchPosition(input.batch, input.today);
  const idx = index(input.missions);
  const w = weekWindow(position.asOf, input.batch);
  return input.members.map((m) => {
    const days = idx.activeDays.get(m.userId) ?? new Set<LocalDate>();
    const inSeason = [...days].filter((d) => d >= input.batch.startsOn && d <= position.asOf).sort();
    return {
      userId: m.userId,
      displayName: m.displayName,
      section: m.section,
      lastActive: inSeason.at(-1) ?? null,
      activeDaysThisWeek: position.started ? inSeason.filter((d) => inWindow(d, w)).length : 0,
      missionsThisWeek: position.started
        ? idx.done.filter((x) => x.userId === m.userId && inWindow(x.localDate, w)).length
        : 0,
      missedDays: position.started ? missedDays(m, days, input.batch, position.asOf) : 0,
    };
  });
}

export type WeeklyReport = {
  weekFrom: LocalDate;
  weekTo: LocalDate;
  overview: Overview;
  /** The last four weeks, oldest first. */
  trend: { from: LocalDate; to: LocalDate; activeShare: number; missionsPerStudent: number }[];
  /** Most consistent this week: active days, then missions. First name and initial only. */
  top: StudentRow[];
};

export function computeWeeklyReport(input: Omit<OverviewInput, "range" | "section" | "nudgedToday">): WeeklyReport {
  const overview = computeOverview({ ...input, range: "7", section: null, nudgedToday: new Set() });
  const asOf = overview.position.asOf;
  const idx = index(input.missions);
  const trend: WeeklyReport["trend"] = [];
  for (let back = 3; back >= 0; back--) {
    const w = weekWindow(asOf, input.batch, back);
    if (!overview.position.started || w.to < input.batch.startsOn) continue;
    const members = input.members.filter((m) => m.joinedOn <= w.to);
    const s = weekSummary(members, idx, w);
    trend.push({
      from: w.from,
      to: w.to,
      activeShare: members.length ? Math.round((s.active / members.length) * 100) : 0,
      missionsPerStudent: s.missionsPerStudent,
    });
  }
  const top = studentRows(input)
    .filter((r) => r.activeDaysThisWeek > 0)
    .sort(
      (a, b) =>
        b.activeDaysThisWeek - a.activeDaysThisWeek ||
        b.missionsThisWeek - a.missionsThisWeek ||
        a.displayName.localeCompare(b.displayName),
    )
    .slice(0, 10);
  const w = weekWindow(asOf, input.batch);
  return { weekFrom: w.from, weekTo: w.to, overview, trend, top };
}

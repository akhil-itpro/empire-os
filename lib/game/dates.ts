// Dates are "local dates" (YYYY-MM-DD) in the student's own time zone, so a day
// counts by their clock, not the server's.

import { SEASON_DAYS, SEASON_WEEKS } from "./rules";

export type LocalDate = string; // "2026-10-24"

const LOCAL_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isLocalDate(value: string): value is LocalDate {
  if (!LOCAL_DATE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** True when the time zone name is one this runtime knows, e.g. "Asia/Kolkata". */
export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** The calendar date at `now` in `timeZone`. */
export function localDate(now: Date, timeZone: string): LocalDate {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** The moment a local date begins (midnight) in `timeZone`. */
export function startOfLocalDay(date: LocalDate, timeZone: string): Date {
  const guess = Date.parse(`${date}T00:00:00Z`);
  // The zone's offset at a moment: how far its wall clock is ahead of UTC.
  const offset = (ms: number) => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).formatToParts(new Date(ms));
    const n = (type: string) => Number(parts.find((p) => p.type === type)!.value);
    return Date.UTC(n("year"), n("month") - 1, n("day"), n("hour"), n("minute"), n("second")) - ms;
  };
  const first = guess - offset(guess);
  return new Date(guess - offset(first));
}

function toUtcMs(date: LocalDate): number {
  return Date.parse(`${date}T00:00:00Z`);
}

export function addDays(date: LocalDate, days: number): LocalDate {
  return new Date(toUtcMs(date) + days * 86_400_000).toISOString().slice(0, 10);
}

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: LocalDate, to: LocalDate): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / 86_400_000);
}

export type SeasonPosition = {
  /** 1 to 90. Days after the season are reported as 90 with `finished` set. */
  day: number;
  /** 1 to 13. Days 85 to 90 are week 13. */
  week: number;
  /** Act I Foundation (weeks 1-4), II Execution (5-8), III Ascension (9-13). */
  act: 1 | 2 | 3;
  finished: boolean;
};

export function seasonPosition(seasonStart: LocalDate, today: LocalDate): SeasonPosition {
  const raw = daysBetween(seasonStart, today) + 1;
  const day = Math.min(Math.max(raw, 1), SEASON_DAYS);
  const week = Math.min(Math.ceil(day / 7), SEASON_WEEKS);
  const act = week <= 4 ? 1 : week <= 8 ? 2 : 3;
  return { day, week, act, finished: raw > SEASON_DAYS };
}

export const ACT_NAMES = { 1: "Foundation", 2: "Execution", 3: "Ascension" } as const;

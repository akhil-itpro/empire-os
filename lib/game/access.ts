import { localDate, type LocalDate } from "./dates";
import { TRIAL_DAYS } from "./rules";

export type Entitlement = {
  kind: "season_pass" | "batch" | "referral_bonus";
  startsAt: Date;
  endsAt: Date;
  /** Where it came from, e.g. "referral:<id>:friend". One grant per source per student. */
  source?: string;
};

export type NewEntitlement = Required<Entitlement>;

/** Trial ends exactly 7 days after sign-up. */
export function trialEndsAt(signedUpAt: Date): Date {
  return new Date(signedUpAt.getTime() + TRIAL_DAYS * 86_400_000);
}

/** Full access: during the reverse trial, or while any pass, batch or referral bonus covers now. */
export function hasFullAccess(now: Date, trialEnd: Date, entitlements: Entitlement[]): boolean {
  if (now < trialEnd) return true;
  return entitlements.some((e) => e.startsAt <= now && now < e.endsAt);
}

/**
 * When the student's unbroken full access ends: the trial and every grant that starts
 * before the one before it ends. Null when nothing gives full access now.
 */
export function fullAccessUntil(now: Date, trialEnd: Date, entitlements: Entitlement[]): Date | null {
  const spans = [
    { start: -Infinity, end: trialEnd.getTime() },
    ...entitlements.map((e) => ({ start: e.startsAt.getTime(), end: e.endsAt.getTime() })),
  ];
  let cursor = now.getTime();
  let covered = false;
  for (;;) {
    const ends = spans.filter((s) => s.start <= cursor && cursor < s.end).map((s) => s.end);
    if (ends.length === 0) break;
    covered = true;
    cursor = Math.max(...ends);
  }
  return covered ? new Date(cursor) : null;
}

/** A Season Pass, or a paid college batch (which gives Season Pass access for its season). */
export function isPassLike(e: Entitlement): boolean {
  return e.kind === "season_pass" || e.kind === "batch";
}

/** True while Season Pass access covers now; streak shields are for pass holders only. */
export function hasSeasonPass(now: Date, entitlements: Entitlement[]): boolean {
  return entitlements.some((e) => isPassLike(e) && e.startsAt <= now && now < e.endsAt);
}

/** For computeStreak: true on the student's local dates that Season Pass access covered. */
export function passCoversDate(entitlements: Entitlement[], timeZone: string) {
  return (date: LocalDate) =>
    entitlements.some(
      (e) => isPassLike(e) && localDate(e.startsAt, timeZone) <= date && date < localDate(e.endsAt, timeZone),
    );
}

/** Show the day-6 banner from 24 hours before the trial ends, only if nothing continues access after it. */
export function showTrialEndingBanner(now: Date, trialEnd: Date, entitlements: Entitlement[]): boolean {
  const msLeft = trialEnd.getTime() - now.getTime();
  const until = fullAccessUntil(now, trialEnd, entitlements);
  return msLeft > 0 && msLeft <= 86_400_000 && until !== null && until.getTime() <= trialEnd.getTime();
}

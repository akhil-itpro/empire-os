import { TRIAL_DAYS } from "./rules";

export type Entitlement = {
  kind: "season_pass" | "batch" | "referral_bonus";
  startsAt: Date;
  endsAt: Date;
};

/** Trial ends exactly 7 days after sign-up. */
export function trialEndsAt(signedUpAt: Date): Date {
  return new Date(signedUpAt.getTime() + TRIAL_DAYS * 86_400_000);
}

/** Full access: during the reverse trial, or while any pass, batch or referral bonus covers now. */
export function hasFullAccess(now: Date, trialEnd: Date, entitlements: Entitlement[]): boolean {
  if (now < trialEnd) return true;
  return entitlements.some((e) => e.startsAt <= now && now < e.endsAt);
}

/** True while a Season Pass covers now; streak shields are for pass holders only. */
export function hasSeasonPass(now: Date, entitlements: Entitlement[]): boolean {
  return entitlements.some((e) => e.kind === "season_pass" && e.startsAt <= now && now < e.endsAt);
}

/** Show the day-6 banner from 24 hours before the trial ends, only if nothing else gives access. */
export function showTrialEndingBanner(now: Date, trialEnd: Date, entitlements: Entitlement[]): boolean {
  const msLeft = trialEnd.getTime() - now.getTime();
  const covered = entitlements.some((e) => e.startsAt <= now && trialEnd < e.endsAt);
  return msLeft > 0 && msLeft <= 86_400_000 && !covered;
}

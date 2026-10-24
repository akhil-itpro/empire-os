// Referrals (docs/PRODUCT.md section 7). /r/CODE remembers the code until sign-up.
// When the invited student completes missions on 3 different days, both get 7 days
// of full access, at most 5 rewards per inviter. Self-referrals (the same account, or
// the same email behind aliases) and repeat sign-ups don't count.
import { fullAccessUntil } from "@/lib/game/access";
import { REFERRAL_ACTIVE_DAYS, REFERRAL_MAX_REWARDS, REFERRAL_REWARD_DAYS } from "@/lib/game/rules";
import type { Deps } from "./season-service";
import type { SeasonStore } from "./store";

export const REFERRAL_CODE = /^[A-Z0-9]{6,10}$/;

const DAY_MS = 86_400_000;
/** The inviter's rewards are numbered 1 to 5, so the cap holds even if two friends qualify at once. */
const INVITER_SOURCE = "referral-reward:";

/** Lower case, without "+tags", and for Gmail without dots: "A.B+x@gmail.com" is "ab@gmail.com". */
export function normalizeEmail(email: string): string {
  const [local = "", domain = ""] = email.trim().toLowerCase().split("@");
  const base = local.split("+")[0];
  const gmail = domain === "gmail.com" || domain === "googlemail.com";
  return gmail ? `${base.replace(/\./g, "")}@gmail.com` : `${base}@${domain}`;
}

/**
 * Links a brand-new student to whoever invited them. Called once, when the profile is
 * created, so an existing account can never be referred later. A self-referral through
 * an email alias is kept as "blocked" (it never earns a reward).
 */
export async function linkReferral(store: SeasonStore, userId: string, rawCode: string | undefined) {
  const code = rawCode?.trim().toUpperCase();
  if (!code || !REFERRAL_CODE.test(code)) return;
  const referrerId = await store.findUserIdByReferralCode(code);
  if (!referrerId || referrerId === userId) return;
  const [theirs, mine] = await Promise.all([store.loginEmail(referrerId), store.loginEmail(userId)]);
  const sameEmail = theirs !== null && mine !== null && normalizeEmail(theirs) === normalizeEmail(mine);
  await store.insertReferral(referrerId, userId, sameEmail ? "blocked" : "signed_up");
  if (!sameEmail) await store.logEvent("referral_signup", userId);
}

/** Adds 7 days of full access, starting when the student's current access ends. */
async function grantBonus(deps: Deps, userId: string, source: string): Promise<"granted" | "taken" | "gone"> {
  const profile = await deps.store.getProfile(userId);
  if (!profile) return "gone";
  const startsAt = fullAccessUntil(deps.now, profile.trialEndsAt, await deps.store.entitlements(userId)) ?? deps.now;
  const granted = await deps.store.grantEntitlement(userId, {
    kind: "referral_bonus",
    startsAt,
    endsAt: new Date(startsAt.getTime() + REFERRAL_REWARD_DAYS * DAY_MS),
    source,
  });
  return granted ? "granted" : "taken";
}

/**
 * Called when an invited student is active on a new day. On their third active day
 * the referral qualifies, once: they get 7 days of full access, and so does the
 * inviter while they have fewer than 5 rewards. True if the student was just rewarded.
 */
export async function rewardReferral(deps: Deps, userId: string, activeDayCount: number): Promise<boolean> {
  if (activeDayCount < REFERRAL_ACTIVE_DAYS) return false;
  const referral = await deps.store.claimReferral(userId, deps.now);
  if (!referral) return false;

  const friend = (await grantBonus(deps, userId, `referral-friend:${referral.id}`)) === "granted";
  if (friend) await deps.store.logEvent("referral_reward", userId, { role: "friend" });

  const earned = (await deps.store.entitlements(referral.referrerId)).filter((e) => e.source?.startsWith(INVITER_SOURCE)).length;
  for (let n = earned + 1; n <= REFERRAL_MAX_REWARDS; n++) {
    const outcome = await grantBonus(deps, referral.referrerId, `${INVITER_SOURCE}${n}`);
    if (outcome === "gone") break;
    if (outcome === "granted") {
      await deps.store.markReferralRewarded(referral.id);
      await deps.store.logEvent("referral_reward", referral.referrerId, { role: "inviter" });
      break;
    }
  }
  return friend;
}

export type ReferralSummary = { joined: number; rewards: number; maxRewards: number };

/** For Me: how many friends joined with this student's link, and rewards earned. */
export async function loadReferrals(deps: Deps, userId: string): Promise<ReferralSummary> {
  const [referrals, entitlements] = await Promise.all([deps.store.listReferrals(userId), deps.store.entitlements(userId)]);
  return {
    joined: referrals.filter((r) => r.status !== "blocked").length,
    rewards: entitlements.filter((e) => e.source?.startsWith(INVITER_SOURCE)).length,
    maxRewards: REFERRAL_MAX_REWARDS,
  };
}

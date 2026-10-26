// The student's season on the server: start it, give each day's missions, and
// complete, undo, skip or swap a mission. Every function takes the user id from
// the caller (which read it from the session) and never trusts the browser for
// XP, dates, status or limits. Times come from `now`, so tests and the founder's
// time-travel switch can move the clock.
import { z } from "zod";
import { hasFullAccess, passCoversDate, trialEndsAt, type Entitlement } from "@/lib/game/access";
import { addDays, isValidTimeZone, localDate, seasonPosition, type LocalDate } from "@/lib/game/dates";
import {
  DAY_COMPLETE_BONUS,
  SKIP_REASONS,
  STREAK_MILESTONES,
  SWAPS_PER_DAY,
  XP_BY_DIFFICULTY,
  type RankName,
  type SkipReason,
} from "@/lib/game/rules";
import type { MedalId } from "@/lib/game/medals";
import { computeStreak, streakMilestone, type StreakState } from "@/lib/game/streak";
import { rankFor, rankUp } from "@/lib/game/xp";
import { PILLARS, type Pillar } from "@/lib/pillars";
import { answersSchema, type Answers } from "@/lib/plan-engine/answers";
import { archetypeFor } from "@/lib/plan-engine/archetype";
import { PLAN_CONFIG } from "@/lib/plan-engine/config";
import { PREVIEW_TIE_BREAK } from "@/lib/plan-engine/preview";
import { LIBRARY, LIBRARY_BY_ID } from "@/lib/plan-engine/library";
import type { Mission } from "@/lib/plan-engine/missions";
import { isPackId, PACK_IDS, PACKS_BY_ID, type PackId } from "@/lib/plan-engine/packs";
import { effectiveMinutes, selectDailyMissions, type PlanSettings, type WeekAdjustments } from "@/lib/plan-engine/select";
import { medalsFromMission } from "./medal-service";
import { linkReferral, rewardReferral } from "./referral-service";
import type { PaymentGateway } from "./payment-service";
import type { NewUserMission, Profile, SeasonStore, UserMission } from "./store";

export type Deps = {
  store: SeasonStore;
  now: Date;
  library?: Mission[];
  /** Razorpay when payments are live (Phase 10); null or missing in reserve mode. */
  payments?: PaymentGateway | null;
};

export type ErrorCode =
  | "invalid_input"
  | "not_started"
  | "not_found"
  | "not_today"
  | "swap_limit"
  | "no_replacement"
  | "free_limit"
  | "season_finished"
  | "already_has_pass"
  | "already_member"
  | "batch_closed"
  | "not_allowed";

export type Result<T> = { ok: true; data: T } | { ok: false; error: ErrorCode; message: string };

const fail = (error: ErrorCode, message: string): { ok: false; error: ErrorCode; message: string } => ({
  ok: false,
  error,
  message,
});

const idSchema = z.uuid();

// ---------------------------------------------------------------------------
// Start a season
// ---------------------------------------------------------------------------

// No 0/O or 1/I, so codes are easy to read aloud.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function randomCode(length = 8): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

export type StartOptions = { timeZone?: string; referralCode?: string };

export async function startSeason(
  deps: Deps,
  userId: string,
  input: unknown,
  options: StartOptions = {},
): Promise<Result<{ created: boolean }>> {
  const parsed = answersSchema.safeParse(input);
  if (!parsed.success) {
    return fail("invalid_input", "Some answers are missing or not on the list. Go back and check them.");
  }
  const answers = parsed.data as Answers;
  const { store, now } = deps;

  if (await store.getProfile(userId)) return { ok: true, data: { created: false } };

  const timeZone = options.timeZone && isValidTimeZone(options.timeZone) ? options.timeZone : "Asia/Kolkata";
  let code = randomCode();
  for (let i = 0; i < 5 && (await store.isReferralCodeTaken(code)); i++) code = randomCode();

  const outcome = await store.insertProfile({
    id: userId,
    firstName: answers.firstName,
    answers,
    archetype: archetypeFor(answers.goal),
    timeZone,
    seasonNumber: 1,
    seasonStart: localDate(now, timeZone),
    trialEndsAt: trialEndsAt(now),
    referralCode: code,
    adultConfirmedAt: now,
  });
  if (outcome === "exists") return { ok: true, data: { created: false } };

  await linkReferral(store, userId, options.referralCode);

  await ensureToday(deps, userId);
  await recomputeStats(deps, userId);
  await store.logEvent("signup_done", userId, { archetype: archetypeFor(answers.goal) });
  return { ok: true, data: { created: true } };
}

// ---------------------------------------------------------------------------
// Today's missions
// ---------------------------------------------------------------------------

export type Today = {
  profile: Profile;
  today: LocalDate;
  day: number;
  week: number;
  act: 1 | 2 | 3;
  seasonFinished: boolean;
  fullAccess: boolean;
  /** Today's live missions (not swapped), in slot order. */
  missions: UserMission[];
  swapsLeft: number;
};

/** The settings for a date: Me edits apply from the day after they were made. */
export function settingsOn(profile: Profile, date: LocalDate): PlanSettings {
  if (profile.pendingSettings && profile.pendingFrom && date >= profile.pendingFrom) {
    return profile.pendingSettings;
  }
  return profile.answers;
}

function live(missions: UserMission[]): UserMission[] {
  return missions.filter((m) => m.status !== "swapped").sort((a, b) => a.slot - b.slot);
}

async function loadToday(deps: Deps, profile: Profile, entitlements: Entitlement[]): Promise<Today> {
  const today = localDate(deps.now, profile.timeZone);
  const pos = seasonPosition(profile.seasonStart, today);
  const rows = await deps.store.listMissions(profile.id, today, today);
  const swapped = rows.filter((m) => m.status === "swapped").length;
  return {
    profile,
    today,
    day: pos.day,
    week: pos.week,
    act: pos.act,
    seasonFinished: pos.finished,
    fullAccess: hasFullAccess(deps.now, profile.trialEndsAt, entitlements),
    missions: live(rows),
    swapsLeft: Math.max(0, SWAPS_PER_DAY - swapped),
  };
}

function toRow(userId: string, today: LocalDate, slot: number, mission: Mission): NewUserMission {
  return {
    userId,
    localDate: today,
    slot,
    missionId: mission.id,
    pillar: mission.pillar,
    minutes: mission.minutes,
    xp: XP_BY_DIFFICULTY[mission.difficulty],
  };
}

/**
 * Packs for a day's plan: only with full access (packs are locked on Free), and
 * without pack missions already done, since a done pack mission never comes back.
 */
export async function packContext(deps: Deps, profile: Profile, today: LocalDate, fullAccess: boolean) {
  if (!fullAccess || profile.activePacks.length === 0) return {};
  const season = await deps.store.listMissions(profile.id, profile.seasonStart, today);
  const packDone = season
    .filter((m) => m.status === "done" && LIBRARY_BY_ID.get(m.missionId)?.pack)
    .map((m) => m.missionId);
  return { packs: [...profile.activePacks], packDone };
}

/** War Room changes for a week: from the review of the week before, if they were applied. */
export async function weekAdjustments(store: SeasonStore, profile: Profile, week: number): Promise<WeekAdjustments | undefined> {
  if (week < 2) return undefined;
  const review = await store.getWeeklyReview(profile.id, profile.seasonNumber, week - 1);
  if (!review?.outcome.applied) return undefined;
  const { difficultyShift, timeTierShift, freeOnly, focusTag, focusPillar, quickWinMax } = review.outcome;
  return { difficultyShift, timeTierShift, freeOnly, focusTag, focusPillar, quickWinMax };
}

async function recentHistory(deps: Deps, userId: string, today: LocalDate) {
  const rows = await deps.store.listMissions(userId, addDays(today, -PLAN_CONFIG.noRepeatDays), addDays(today, -1));
  return rows.map((m) => ({ missionId: m.missionId, date: m.localDate }));
}

/**
 * Returns today's missions, generating them once if the student has full access.
 * Free students get theirs from chooseFreePillar. Safe to call on every visit.
 */
export async function ensureToday(deps: Deps, userId: string): Promise<Result<Today>> {
  let profile = await deps.store.getProfile(userId);
  if (!profile) return fail("not_started", "Start your season first.");
  // Me edits apply from their start date: make them the current settings then.
  if (profile.pendingSettings && profile.pendingFrom && localDate(deps.now, profile.timeZone) >= profile.pendingFrom) {
    await deps.store.commitPendingSettings(userId);
    profile = (await deps.store.getProfile(userId))!;
  }
  const entitlements = await deps.store.entitlements(userId);
  const state = await loadToday(deps, profile, entitlements);
  if (state.seasonFinished || !state.fullAccess || state.missions.length > 0) {
    return { ok: true, data: state };
  }

  // Season 1, Day 1 breaks ties like the reveal's preview, so it gets exactly the
  // missions the reveal described. Every other day breaks them per student and date.
  const tieBreak = profile.seasonNumber === 1 && state.day === 1 ? PREVIEW_TIE_BREAK : { seed: userId, date: state.today };
  const picked = selectDailyMissions(deps.library ?? LIBRARY, {
    ...tieBreak,
    seasonDay: state.day,
    week: state.week,
    act: state.act,
    archetype: profile.archetype,
    settings: settingsOn(profile, state.today),
    history: await recentHistory(deps, userId, state.today),
    adjustments: await weekAdjustments(deps.store, profile, state.week),
    ...(await packContext(deps, profile, state.today, true)),
  });
  await deps.store.insertMissions(picked.map((p) => toRow(userId, state.today, p.slot, p.mission)));
  return { ok: true, data: await loadToday(deps, profile, entitlements) };
}

/**
 * After Day 90: the next season starts today with the same plan settings
 * (docs/PRODUCT.md section 5). XP, rank, medals and history stay. There is no
 * second free week: access is whatever the student has now (Free or Season Pass).
 */
export async function startNextSeason(deps: Deps, userId: string): Promise<Result<{ seasonNumber: number }>> {
  const profile = await deps.store.getProfile(userId);
  if (!profile) return fail("not_started", "Start your season first.");
  const today = localDate(deps.now, profile.timeZone);
  if (!seasonPosition(profile.seasonStart, today).finished) {
    // A second tap, or a second tab, after the new season started today: already done.
    if (profile.seasonNumber > 1 && profile.seasonStart === today) {
      return { ok: true, data: { seasonNumber: profile.seasonNumber } };
    }
    return fail("not_allowed", `Season ${profile.seasonNumber} is still running. The next one opens after Day 90.`);
  }
  const next = profile.seasonNumber + 1;
  if (await deps.store.startNewSeason(userId, profile.seasonNumber, next, today)) {
    await deps.store.logEvent("season_start", userId, { season: next });
  }
  // Day 1's missions, and the streak and stats on the new season's weeks.
  const started = await ensureToday(deps, userId);
  if (!started.ok) return started;
  await recomputeStats(deps, userId);
  return { ok: true, data: { seasonNumber: started.data.profile.seasonNumber } };
}

/** Free plan after the trial: one mission a day, in the pillar the student picks. */
export async function chooseFreePillar(deps: Deps, userId: string, pillar: unknown): Promise<Result<Today>> {
  if (!PILLARS.includes(pillar as Pillar)) return fail("invalid_input", "Pick one of the four pillars.");
  const current = await ensureToday(deps, userId);
  if (!current.ok) return current;
  const state = current.data;
  if (state.seasonFinished) return fail("season_finished", "This season is complete.");
  if (state.fullAccess || state.missions.length > 0) return current;

  const settings = settingsOn(state.profile, state.today);
  const picked = selectDailyMissions(deps.library ?? LIBRARY, {
    seed: userId,
    date: state.today,
    seasonDay: state.day,
    week: state.week,
    act: state.act,
    archetype: state.profile.archetype,
    settings,
    history: await recentHistory(deps, userId, state.today),
    singlePillar: pillar as Pillar,
  });
  await deps.store.insertMissions(picked.map((p) => toRow(userId, state.today, 1, p.mission)));
  return ensureToday(deps, userId);
}

// ---------------------------------------------------------------------------
// Complete, undo, skip, swap
// ---------------------------------------------------------------------------

export type Progress = {
  xpGained: number;
  dayComplete: boolean;
  totalXp: number;
  rank: RankName;
  rankUp: RankName | null;
  streak: number;
  streakState: StreakState;
  streakMilestone: number | null;
  /** True when this mission made an invite pay off: 7 days of full access for both. */
  referralReward: boolean;
  /** Medals this mission just earned (lib/game/medals.ts). */
  medals: MedalId[];
};

export async function completeMission(deps: Deps, userId: string, missionRowId: unknown): Promise<Result<Progress>> {
  if (!idSchema.safeParse(missionRowId).success) return fail("invalid_input", "That mission doesn't exist.");
  const id = missionRowId as string;
  const profile = await deps.store.getProfile(userId);
  if (!profile) return fail("not_started", "Start your season first.");
  const today = localDate(deps.now, profile.timeZone);
  const { store } = deps;

  const xpBefore = await store.xpTotal(userId);
  const daysBefore = await store.activeDays(userId);
  const row = await store.updateMissionStatus(userId, id, today, ["assigned"], {
    status: "done",
    completedAt: deps.now,
  });
  if (!row) return fail("not_today", "Only today's open missions can be marked done.");

  let xpGained = (await store.addXp(userId, "mission", row.id, row.xp)) ? row.xp : 0;
  const todays = live(await store.listMissions(userId, today, today));
  const dayComplete = todays.length > 0 && todays.every((m) => m.status === "done");
  if (dayComplete && (await store.addXp(userId, "day_bonus", today, DAY_COMPLETE_BONUS))) {
    xpGained += DAY_COMPLETE_BONUS;
  }

  const stats = await recomputeStats(deps, userId, profile);
  await store.logEvent("mission_done", userId, { mission: row.missionId, pillar: row.pillar });
  if (daysBefore.length === 0) await store.logEvent("first_mission_done", userId);
  if (dayComplete) await store.logEvent("day_complete", userId);
  // A new active day may complete an invite (3 different days).
  const referralReward = daysBefore.includes(today) ? false : await rewardReferral(deps, userId, daysBefore.length + 1);
  const medals = await medalsFromMission(deps, profile, row.id);

  return {
    ok: true,
    data: {
      xpGained,
      dayComplete,
      totalXp: stats.xp,
      rank: rankFor(stats.xp).rank,
      rankUp: rankUp(xpBefore, stats.xp),
      streak: stats.current,
      streakState: stats.state,
      streakMilestone: daysBefore.includes(today) ? null : streakMilestone(stats.current, STREAK_MILESTONES),
      referralReward,
      medals,
    },
  };
}

/** Takes back a mission marked done by mistake, today only, with its XP. */
export async function undoMission(deps: Deps, userId: string, missionRowId: unknown): Promise<Result<{ totalXp: number }>> {
  if (!idSchema.safeParse(missionRowId).success) return fail("invalid_input", "That mission doesn't exist.");
  const profile = await deps.store.getProfile(userId);
  if (!profile) return fail("not_started", "Start your season first.");
  const today = localDate(deps.now, profile.timeZone);

  const row = await deps.store.updateMissionStatus(userId, missionRowId as string, today, ["done"], {
    status: "assigned",
    completedAt: null,
  });
  if (!row) return fail("not_today", "Only today's missions can be changed.");
  await deps.store.removeXp(userId, "mission", row.id);
  await deps.store.removeXp(userId, "day_bonus", today);
  const stats = await recomputeStats(deps, userId, profile);
  return { ok: true, data: { totalXp: stats.xp } };
}

export async function skipMission(deps: Deps, userId: string, missionRowId: unknown, reason: unknown): Promise<Result<{ skipped: true }>> {
  if (!idSchema.safeParse(missionRowId).success) return fail("invalid_input", "That mission doesn't exist.");
  if (!SKIP_REASONS.includes(reason as SkipReason)) return fail("invalid_input", "Pick a reason: no time, not relevant or too hard.");
  const profile = await deps.store.getProfile(userId);
  if (!profile) return fail("not_started", "Start your season first.");
  const today = localDate(deps.now, profile.timeZone);

  const row = await deps.store.updateMissionStatus(userId, missionRowId as string, today, ["assigned"], {
    status: "skipped",
    skipReason: reason as string,
  });
  if (!row) return fail("not_today", "Only today's open missions can be skipped.");
  await deps.store.logEvent("mission_skipped", userId, { mission: row.missionId, reason: reason as string });
  return { ok: true, data: { skipped: true } };
}

/** Swaps an open mission for another in the same pillar. Once a day. */
export async function swapMission(deps: Deps, userId: string, missionRowId: unknown): Promise<Result<{ mission: UserMission }>> {
  if (!idSchema.safeParse(missionRowId).success) return fail("invalid_input", "That mission doesn't exist.");
  const current = await ensureToday(deps, userId);
  if (!current.ok) return current;
  const state = current.data;
  const target = state.missions.find((m) => m.id === missionRowId);
  if (!target || target.status !== "assigned") return fail("not_today", "Only today's open missions can be swapped.");
  if (state.swapsLeft <= 0) return fail("swap_limit", "You've used today's swap. You get a new one tomorrow.");

  const settings = settingsOn(state.profile, state.today);
  const adjustments = state.fullAccess ? await weekAdjustments(deps.store, state.profile, state.week) : undefined;
  const allToday = await deps.store.listMissions(userId, state.today, state.today);
  const usedMinutes = state.missions.filter((m) => m.id !== target.id).reduce((s, m) => s + m.minutes, 0);
  const maxMinutes = Math.max(target.minutes, effectiveMinutes(settings.dailyMinutes, adjustments?.timeTierShift ?? 0) - usedMinutes);

  const [replacement] = selectDailyMissions(deps.library ?? LIBRARY, {
    seed: `${userId}|swap`,
    date: state.today,
    seasonDay: state.day,
    week: state.week,
    act: state.act,
    archetype: state.profile.archetype,
    settings,
    history: await recentHistory(deps, userId, state.today),
    singlePillar: target.pillar,
    excludeIds: allToday.map((m) => m.missionId),
    maxMinutes,
    adjustments,
    ...(await packContext(deps, state.profile, state.today, state.fullAccess)),
  });
  if (!replacement) {
    return fail("no_replacement", "There's no other mission in this pillar that fits today. Try Skip instead.");
  }

  const swapped = await deps.store.updateMissionStatus(userId, target.id, state.today, ["assigned"], { status: "swapped" });
  if (!swapped) return fail("not_today", "Only today's open missions can be swapped.");
  await deps.store.insertMissions([toRow(userId, state.today, target.slot, replacement.mission)]);
  await deps.store.logEvent("mission_swapped", userId, { from: target.missionId, to: replacement.mission.id });

  const after = live(await deps.store.listMissions(userId, state.today, state.today));
  const inSlot = after.find((m) => m.slot === target.slot)!;
  return { ok: true, data: { mission: inSlot } };
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

/** The streak on `today`, with one shield a week on days a Season Pass covered. */
export function seasonStreak(profile: Profile, today: LocalDate, activeDays: LocalDate[], entitlements: Entitlement[]) {
  return computeStreak({
    activeDays,
    today,
    seasonStart: profile.seasonStart,
    hasShieldOn: passCoversDate(entitlements, profile.timeZone),
  });
}

/** Recomputes XP and streaks from the source rows and saves them. */
export async function recomputeStats(deps: Deps, userId: string, known?: Profile) {
  const profile = known ?? (await deps.store.getProfile(userId));
  if (!profile) throw new Error("recomputeStats: no profile");
  const [xp, activeDays, entitlements] = await Promise.all([
    deps.store.xpTotal(userId),
    deps.store.activeDays(userId),
    deps.store.entitlements(userId),
  ]);
  const streak = seasonStreak(profile, localDate(deps.now, profile.timeZone), activeDays, entitlements);
  const lastActiveDate = activeDays.length ? [...activeDays].sort().at(-1)! : null;
  await deps.store.saveStats({
    userId,
    xp,
    currentStreak: streak.current,
    bestStreak: streak.best,
    lastActiveDate,
  });
  return { xp, ...streak };
}

// ---------------------------------------------------------------------------
// Packs
// ---------------------------------------------------------------------------

export type PackState = {
  id: PackId;
  on: boolean;
  /** Pack missions finished this season, out of 10. */
  done: number;
};

/** Turns a pack on or off. Turning one on needs full access; turning off always works. */
export async function setPack(deps: Deps, userId: string, packId: unknown, on: unknown): Promise<Result<{ activePacks: PackId[] }>> {
  if (!isPackId(packId) || typeof on !== "boolean") return fail("invalid_input", "That pack doesn't exist.");
  const profile = await deps.store.getProfile(userId);
  if (!profile) return fail("not_started", "Start your season first.");
  if (on && !hasFullAccess(deps.now, profile.trialEndsAt, await deps.store.entitlements(userId))) {
    return fail("free_limit", "Packs are part of Season Pass. Free keeps one mission a day.");
  }
  const activePacks = PACK_IDS.filter((id) => (id === packId ? on : profile.activePacks.includes(id)));
  await deps.store.setActivePacks(userId, activePacks);
  return { ok: true, data: { activePacks } };
}

export async function loadPacks(deps: Deps, userId: string): Promise<Result<{ fullAccess: boolean; packs: PackState[] }>> {
  const profile = await deps.store.getProfile(userId);
  if (!profile) return fail("not_started", "Start your season first.");
  const today = localDate(deps.now, profile.timeZone);
  const [entitlements, season] = await Promise.all([
    deps.store.entitlements(userId),
    deps.store.listMissions(userId, profile.seasonStart, today),
  ]);
  const doneIds = new Set(season.filter((m) => m.status === "done").map((m) => m.missionId));
  return {
    ok: true,
    data: {
      fullAccess: hasFullAccess(deps.now, profile.trialEndsAt, entitlements),
      packs: PACK_IDS.map((id) => ({
        id,
        on: profile.activePacks.includes(id),
        done: [...doneIds].filter((m) => LIBRARY_BY_ID.get(m)?.pack === id).length,
      })),
    },
  };
}

/** The pack a mission comes from, for the ticket sheet. */
export function packNameOf(missionId: string): string | null {
  const pack = LIBRARY_BY_ID.get(missionId)?.pack;
  return pack && isPackId(pack) ? PACKS_BY_ID.get(pack)!.name : null;
}

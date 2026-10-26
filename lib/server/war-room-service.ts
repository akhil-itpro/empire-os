// The War Room on the server (docs/PRODUCT.md section 8). Every 7 days a student
// reviews their week; the rules in lib/plan-engine/war-room.ts set next week's
// plan. History, XP and rank never change. Free students see what would change,
// with one upgrade button; nothing is applied for them.
import { hasFullAccess } from "@/lib/game/access";
import { addDays, localDate, seasonPosition, type LocalDate } from "@/lib/game/dates";
import { PILLARS, type Pillar } from "@/lib/pillars";
import type { Answers } from "@/lib/plan-engine/answers";
import { archetypeFor } from "@/lib/plan-engine/archetype";
import { PLAN_CONFIG } from "@/lib/plan-engine/config";
import { LIBRARY, LIBRARY_BY_ID } from "@/lib/plan-engine/library";
import { previewPlan } from "@/lib/plan-engine/preview";
import { selectBossMission } from "@/lib/plan-engine/select";
import { adaptNextWeek, reviewSchema, weakestPillar, type WeekStats } from "@/lib/plan-engine/war-room";
import { rankUp } from "@/lib/game/xp";
import { recomputeStats, type Deps, type Result } from "./season-service";
import type { PendingSettings, Profile, ReviewOutcome, WeeklyReview } from "./store";

const fail = (error: "invalid_input" | "not_started" | "not_found" | "free_limit" | "not_today", message: string) => ({
  ok: false as const,
  error,
  message,
});

/** The week a review is for: the latest finished week (from its last day), weeks 1 to 12. */
export function reviewWeek(seasonStart: LocalDate, today: LocalDate): number | null {
  const pos = seasonPosition(seasonStart, today);
  if (pos.finished) return null;
  const week = Math.min(Math.floor(pos.day / 7), PLAN_CONFIG.warRoom.lastReviewWeek);
  return week >= 1 ? week : null;
}

function weekDates(seasonStart: LocalDate, week: number) {
  const from = addDays(seasonStart, (week - 1) * 7);
  return { from, to: addDays(from, 6) };
}

async function weekStats(deps: Deps, profile: Profile, week: number): Promise<WeekStats> {
  const { from, to } = weekDates(profile.seasonStart, week);
  const rows = (await deps.store.listMissions(profile.id, from, to)).filter((m) => m.status !== "swapped");
  const byPillar = Object.fromEntries(PILLARS.map((p) => [p, { assigned: 0, done: 0 }])) as WeekStats["byPillar"];
  for (const m of rows) {
    byPillar[m.pillar].assigned++;
    if (m.status === "done") byPillar[m.pillar].done++;
  }
  return { assigned: rows.length, done: rows.filter((m) => m.status === "done").length, byPillar };
}

/** The settings the student's plan runs on now, including Me edits that start tomorrow. */
function latestSettings(profile: Profile): PendingSettings {
  return profile.pendingSettings ?? { ...profile.answers, archetype: profile.archetype };
}

export type WarRoomData = {
  firstName: string;
  fullAccess: boolean;
  /** The week to review now, or null (before day 7, or after the season). */
  week: number | null;
  /** The saved review for that week, if done. */
  review: WeeklyReview | null;
  stats: WeekStats | null;
  /** Pre-selected focus: this week's weakest pillar. */
  suggestedFocus: Pillar;
  pillarOrder: Pillar[];
  current: { dailyMinutes: number; budget: string; city: string; goal: string };
  /** City or goal change waiting for "Apply new plan?": before and after. */
  proposal: null | {
    before: { archetype: string; missions: string[] };
    after: { archetype: string; missions: string[] };
    cityChanged: boolean;
    goalChanged: boolean;
    status: "open" | "applied" | "kept";
  };
  /** Day the student can do their first review. */
  firstReviewDay: number;
};

export async function loadWarRoom(deps: Deps, userId: string): Promise<Result<WarRoomData>> {
  const profile = await deps.store.getProfile(userId);
  if (!profile) return fail("not_started", "Start your season first.");
  const today = localDate(deps.now, profile.timeZone);
  const week = reviewWeek(profile.seasonStart, today);
  const [entitlements, review, stats] = await Promise.all([
    deps.store.entitlements(userId),
    week ? deps.store.getWeeklyReview(userId, profile.seasonNumber, week) : Promise.resolve(null),
    week ? weekStats(deps, profile, week) : Promise.resolve(null),
  ]);
  const settings = latestSettings(profile);

  let proposal: WarRoomData["proposal"] = null;
  const p = review?.outcome.proposal;
  if (p) {
    // Before and after use the same answers apart from the goal and city.
    const base: Answers = { ...profile.answers, ...settings };
    const before = previewPlan({ ...base, goal: p.fromGoal, city: p.fromCity });
    const after = previewPlan({ ...base, goal: p.goal, city: p.city });
    proposal = {
      before: { archetype: before.archetype.name, missions: before.sampleMissions.map((m) => m.title) },
      after: { archetype: after.archetype.name, missions: after.sampleMissions.map((m) => m.title) },
      cityChanged: p.city !== p.fromCity,
      goalChanged: p.goal !== p.fromGoal,
      status: p.status,
    };
  }

  return {
    ok: true,
    data: {
      firstName: profile.firstName,
      fullAccess: hasFullAccess(deps.now, profile.trialEndsAt, entitlements),
      week,
      review,
      stats,
      suggestedFocus: stats ? weakestPillar(stats, settings.pillarOrder) : settings.pillarOrder[0],
      pillarOrder: settings.pillarOrder,
      current: { dailyMinutes: settings.dailyMinutes, budget: settings.budget, city: settings.city, goal: settings.goal },
      proposal,
      firstReviewDay: 7,
    },
  };
}

/** Saves this week's review once, and sets next week's plan by the War Room rules. */
export async function submitReview(deps: Deps, userId: string, input: unknown): Promise<Result<{ week: number }>> {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return fail("invalid_input", "Answer each question, including the follow-up for anything that changed.");
  const r = parsed.data;
  const profile = await deps.store.getProfile(userId);
  if (!profile) return fail("not_started", "Start your season first.");
  const today = localDate(deps.now, profile.timeZone);
  const week = reviewWeek(profile.seasonStart, today);
  if (!week) return fail("not_today", "Your first War Room opens on day 7.");
  if (await deps.store.getWeeklyReview(userId, profile.seasonNumber, week)) return { ok: true, data: { week } };

  const fullAccess = hasFullAccess(deps.now, profile.trialEndsAt, await deps.store.entitlements(userId));
  const before = latestSettings(profile);
  // Schedule and budget changes apply from tomorrow, like edits in Me. History never changes.
  const next: PendingSettings = {
    ...before,
    dailyMinutes: r.changes.includes("schedule") && r.dailyMinutes ? r.dailyMinutes : before.dailyMinutes,
    budget: r.changes.includes("budget") && r.budget ? (r.budget as PendingSettings["budget"]) : before.budget,
  };
  if (next.dailyMinutes !== before.dailyMinutes || next.budget !== before.budget) {
    await deps.store.savePendingSettings(userId, next, addDays(today, 1));
  }

  const stats = await weekStats(deps, profile, week);
  const adaptation = adaptNextWeek({
    stats,
    review: r,
    settings: next,
    previousBudget: before.budget,
    nextWeek: week + 1,
  });

  const outcome: ReviewOutcome = {
    ...adaptation.adjustments,
    reasons: adaptation.reasons,
    lowWeek: adaptation.lowWeek,
    applied: fullAccess,
    done: stats.done,
    assigned: stats.assigned,
  };
  if (adaptation.adjustments.boss) {
    const boss = selectBossMission(LIBRARY, {
      seed: userId,
      date: today,
      settings: next,
      history: (await deps.store.listMissions(userId, addDays(today, -13), today)).map((m) => ({
        missionId: m.missionId,
        date: m.localDate,
      })),
      adjustments: adaptation.adjustments,
      act: seasonPosition(profile.seasonStart, addDays(today, 1)).act,
      pillar: r.focusPillar,
    });
    if (boss) outcome.bossMissionId = boss.id;
    else delete outcome.boss;
  }
  const goal = r.changes.includes("goal") && r.goal ? (r.goal as Answers["goal"]) : before.goal;
  const city = r.changes.includes("city") && r.city ? (r.city as Answers["city"]) : before.city;
  if (goal !== before.goal || city !== before.city) {
    outcome.proposal = { goal, city, fromGoal: before.goal, fromCity: before.city, status: "open" };
  }

  await deps.store.insertWeeklyReview(userId, {
    seasonNumber: profile.seasonNumber,
    week,
    felt: r.felt,
    blocker: r.blocker,
    changes: r.changes,
    focusPillar: r.focusPillar,
    outcome,
  });
  await deps.store.logEvent("weekly_review_done", userId, {
    week,
    felt: r.felt,
    blocker: r.blocker,
    low: adaptation.lowWeek,
    applied: fullAccess,
  });
  return { ok: true, data: { week } };
}

/**
 * "Apply new plan?" after a city or goal change: the new goal and city (and the
 * archetype the goal implies) apply from tomorrow. Past days, XP and rank stay.
 */
export async function decideProposal(deps: Deps, userId: string, apply: unknown): Promise<Result<{ applied: boolean }>> {
  if (typeof apply !== "boolean") return fail("invalid_input", "Choose Apply or Keep.");
  const profile = await deps.store.getProfile(userId);
  if (!profile) return fail("not_started", "Start your season first.");
  const today = localDate(deps.now, profile.timeZone);
  const week = reviewWeek(profile.seasonStart, today);
  const review = week ? await deps.store.getWeeklyReview(userId, profile.seasonNumber, week) : null;
  const proposal = review?.outcome.proposal;
  if (!review || !proposal || proposal.status !== "open") return fail("not_found", "There's no plan change waiting.");
  if (apply) {
    const settings: PendingSettings = {
      ...latestSettings(profile),
      goal: proposal.goal,
      city: proposal.city,
      archetype: archetypeFor(proposal.goal),
    };
    await deps.store.savePendingSettings(userId, settings, addDays(today, 1));
  }
  await deps.store.updateReviewOutcome(userId, profile.seasonNumber, review.week, {
    ...review.outcome,
    proposal: { ...proposal, status: apply ? "applied" : "kept" },
  });
  return { ok: true, data: { applied: apply } };
}

// ---------------------------------------------------------------------------
// The weekly boss mission (+150 XP), after a strong week
// ---------------------------------------------------------------------------

export type BossData = { title: string; howTo: string; pillar: Pillar; minutes: number; xp: number; done: boolean };

async function currentBoss(deps: Deps, profile: Profile) {
  const today = localDate(deps.now, profile.timeZone);
  const pos = seasonPosition(profile.seasonStart, today);
  if (pos.finished || pos.week < 2) return null;
  const review = await deps.store.getWeeklyReview(profile.id, profile.seasonNumber, pos.week - 1);
  const o = review?.outcome;
  const mission = o?.boss && o.applied && o.bossMissionId ? LIBRARY_BY_ID.get(o.bossMissionId) : undefined;
  if (!mission) return null;
  return { mission, ref: `boss:${profile.seasonNumber}:${pos.week}` };
}

export async function loadBoss(deps: Deps, userId: string): Promise<BossData | null> {
  const profile = await deps.store.getProfile(userId);
  if (!profile) return null;
  const boss = await currentBoss(deps, profile);
  if (!boss) return null;
  return {
    title: boss.mission.title,
    howTo: boss.mission.howTo,
    pillar: boss.mission.pillar,
    minutes: boss.mission.minutes,
    xp: PLAN_CONFIG.warRoom.bossXp,
    done: await deps.store.hasXp(userId, "boss", boss.ref),
  };
}

/** Marks this week's boss mission done, once, with full access. */
export async function completeBoss(
  deps: Deps,
  userId: string,
): Promise<Result<{ xpGained: number; totalXp: number; rankUp: string | null; firstBoss: boolean }>> {
  const profile = await deps.store.getProfile(userId);
  if (!profile) return fail("not_started", "Start your season first.");
  if (!hasFullAccess(deps.now, profile.trialEndsAt, await deps.store.entitlements(userId))) {
    return fail("free_limit", "Boss missions are part of Season Pass.");
  }
  const boss = await currentBoss(deps, profile);
  if (!boss) return fail("not_found", "There's no boss mission this week.");
  const before = await deps.store.xpTotal(userId);
  const added = await deps.store.addXp(userId, "boss", boss.ref, PLAN_CONFIG.warRoom.bossXp);
  const stats = await recomputeStats(deps, userId, profile);
  // The first boss ever finished earns the "Boss beaten" medal.
  const firstBoss = added && (await deps.store.countXp(userId, "boss")) === 1;
  return {
    ok: true,
    data: { xpGained: added ? PLAN_CONFIG.warRoom.bossXp : 0, totalXp: stats.xp, rankUp: rankUp(before, stats.xp), firstBoss },
  };
}

/** For HQ: the week waiting for a review (or null), and this week's boss mission. */
export async function hqWarRoom(deps: Deps, userId: string): Promise<{ dueWeek: number | null; boss: BossData | null }> {
  const profile = await deps.store.getProfile(userId);
  if (!profile) return { dueWeek: null, boss: null };
  const week = reviewWeek(profile.seasonStart, localDate(deps.now, profile.timeZone));
  const reviewed = week ? await deps.store.getWeeklyReview(profile.id, profile.seasonNumber, week) : null;
  return { dueWeek: week && !reviewed ? week : null, boss: await loadBoss(deps, userId) };
}

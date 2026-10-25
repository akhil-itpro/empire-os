// The War Room (docs/PRODUCT.md section 8): a 60-second weekly review that changes
// next week's plan by fixed rules, explained in plain words with real numbers.
// Pure: no database, no clock. The thresholds live in PLAN_CONFIG.warRoom.
import { PILLAR_LABEL, PILLARS, type Pillar } from "@/lib/pillars";
import { z } from "zod";
import { answersSchema, type Budget } from "./answers";
import { PLAN_CONFIG } from "./config";
import { effectiveMinutes, targetDifficulty, type PlanSettings, type WeekAdjustments } from "./select";

export const FELT = [
  { id: "too_easy", label: "Too easy" },
  { id: "just_right", label: "Just right" },
  { id: "too_hard", label: "Too hard" },
] as const;

export const BLOCKERS = [
  { id: "time", label: "Time" },
  { id: "energy", label: "Energy" },
  { id: "motivation", label: "Motivation" },
  { id: "money", label: "Money" },
  { id: "nothing", label: "Nothing" },
] as const;

export const CHANGES = [
  { id: "schedule", label: "My schedule" },
  { id: "budget", label: "My budget" },
  { id: "city", label: "My city" },
  { id: "goal", label: "My goal" },
] as const;

type Ids<T extends readonly { id: string }[]> = T[number]["id"];
export type Felt = Ids<typeof FELT>;
export type Blocker = Ids<typeof BLOCKERS>;
export type Change = Ids<typeof CHANGES>;

const ids = <T extends readonly { id: string }[]>(list: T) => list.map((o) => o.id) as [Ids<T>, ...Ids<T>[]];

/** The review form. Follow-up answers are required only for the changes ticked. */
export const reviewSchema = z
  .object({
    felt: z.enum(ids(FELT)),
    blocker: z.enum(ids(BLOCKERS)),
    changes: z.array(z.enum(ids(CHANGES))).max(4),
    focusPillar: z.enum(PILLARS),
    dailyMinutes: answersSchema.shape.dailyMinutes.optional(),
    budget: answersSchema.shape.budget.optional(),
    city: answersSchema.shape.city.optional(),
    goal: answersSchema.shape.goal.optional(),
  })
  .refine((r) => new Set(r.changes).size === r.changes.length)
  .refine((r) => !r.changes.includes("schedule") || r.dailyMinutes !== undefined)
  .refine((r) => !r.changes.includes("budget") || r.budget !== undefined)
  .refine((r) => !r.changes.includes("city") || r.city !== undefined)
  .refine((r) => !r.changes.includes("goal") || r.goal !== undefined);

export type ReviewInput = z.infer<typeof reviewSchema>;

export type PillarCount = { assigned: number; done: number };
export type WeekStats = { assigned: number; done: number; byPillar: Record<Pillar, PillarCount> };

const BUDGET_ORDER: Budget[] = ["free", "under_500", "500_2000", "flexible"];

const pct = (done: number, assigned: number) => (assigned ? Math.round((done / assigned) * 100) : 0);

/** The pillar with the lowest share done this week (ties: lower in the student's order). */
export function weakestPillar(stats: WeekStats, order: Pillar[]): Pillar {
  const share = (p: Pillar) => {
    const c = stats.byPillar[p];
    return c.assigned ? c.done / c.assigned : Infinity;
  };
  return [...order].reverse().reduce((a, b) => (share(b) < share(a) ? b : a));
}

export type Adaptation = {
  adjustments: WeekAdjustments & { boss?: boolean };
  /** "What changed and why": 2 to 4 plain bullets with real numbers. */
  reasons: string[];
  /** A low week gets "Reset, don't quit" copy. */
  lowWeek: boolean;
};

/**
 * Next week's changes from this week's numbers and answers. `settings` are the plan
 * settings next week will use (after any schedule or budget change).
 */
export function adaptNextWeek(input: {
  stats: WeekStats;
  review: Pick<ReviewInput, "felt" | "blocker" | "focusPillar">;
  settings: PlanSettings;
  /** The budget before this review, to spot a lower budget. */
  previousBudget: Budget;
  nextWeek: number;
}): Adaptation {
  const { stats, review, settings, nextWeek } = input;
  const rules = PLAN_CONFIG.warRoom;
  const rate = stats.assigned ? stats.done / stats.assigned : null;
  const share = pct(stats.done, stats.assigned);
  const finished = `You finished ${stats.done} of ${stats.assigned} missions (${share}%)`;
  const adjustments: Adaptation["adjustments"] = {};
  const reasons: string[] = [];

  const low = (rate !== null && rate < rules.lowCompletion) || review.felt === "too_hard";
  const high = !low && rate !== null && rate > rules.highCompletion;
  const minutesNow = effectiveMinutes(settings.dailyMinutes);
  const levelNow = targetDifficulty(settings.intensity, nextWeek);

  if (low) {
    adjustments.timeTierShift = -1;
    adjustments.difficultyShift = -1;
    adjustments.quickWinMax = rules.lowWeekQuickWinMinutes;
    const minutesNext = effectiveMinutes(settings.dailyMinutes, -1);
    const why =
      rate !== null && rate < rules.lowCompletion
        ? `${finished}, under half.`
        : `You said this week felt too hard.`;
    const shorter =
      minutesNext < minutesNow
        ? `each day is shorter, about ${minutesNext} minutes instead of ${minutesNow}`
        : `each day stays at ${minutesNow} minutes, the shortest plan`;
    const easier = targetDifficulty(settings.intensity, nextWeek, -1) < levelNow ? "one step easier" : "at the easiest level";
    reasons.push(`${why} Next week ${shorter}, and ${easier}. A ${rules.lowWeekQuickWinMinutes}-minute quick win stays every day.`);
  } else if (high) {
    adjustments.difficultyShift = 1;
    adjustments.boss = true;
    const harder = targetDifficulty(settings.intensity, nextWeek, 1) > levelNow;
    reasons.push(
      `${finished}. Next week is ${harder ? "one step harder" : "already at the hardest level"}, plus a boss mission worth ${rules.bossXp} XP.`,
    );
  } else {
    reasons.push(
      rate === null
        ? "There were no missions to count this week, so next week keeps the same pace."
        : `${finished} and it felt ${review.felt === "too_easy" ? "easy" : "about right"}. Next week keeps the same pace.`,
    );
  }

  const lowerBudget = BUDGET_ORDER.indexOf(settings.budget) < BUDGET_ORDER.indexOf(input.previousBudget);
  if (review.blocker === "money" || lowerBudget) {
    adjustments.freeOnly = true;
    reasons.push(
      review.blocker === "money"
        ? "Money was the blocker, so every mission next week is free."
        : "Your budget went down, so every mission next week is free.",
    );
  }

  if (review.blocker === "energy") {
    adjustments.focusTag = rules.energyTag;
    reasons.push("Energy was the blocker, so next week adds sleep and energy missions.");
  }

  const focus = review.focusPillar;
  const c = stats.byPillar[focus];
  const shareOf = (p: Pillar) => (stats.byPillar[p].assigned ? stats.byPillar[p].done / stats.byPillar[p].assigned : null);
  // "Weakest" only when another pillar really did better.
  const weakest =
    weakestPillar(stats, settings.pillarOrder) === focus &&
    c.assigned > 0 &&
    PILLARS.some((p) => p !== focus && (shareOf(p) ?? -1) > (shareOf(focus) ?? 0));
  const inTopTwo = settings.pillarOrder[0] === focus || settings.pillarOrder[1] === focus;
  if (!inTopTwo) adjustments.focusPillar = focus;
  if (reasons.length < 4) {
    const which = weakest ? `, your weakest pillar this week at ${pct(c.done, c.assigned)}%` : "";
    reasons.push(
      inTopTwo
        ? `Your focus next week is ${PILLAR_LABEL[focus]}${which}. It already has a mission every day.`
        : `Your focus next week is ${PILLAR_LABEL[focus]}${which}, so it gets a mission every day.`,
    );
  }

  return { adjustments, reasons, lowWeek: low };
}

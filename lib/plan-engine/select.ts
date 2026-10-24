// Daily mission selection (docs/PRODUCT.md section 6). Deterministic: the same
// student, date and history always give the same missions. No AI, no randomness.
import type { LocalDate } from "@/lib/game/dates";
import type { Pillar } from "@/lib/pillars";
import type { Answers, Intensity } from "./answers";
import { PLAN_CONFIG } from "./config";
import type { Archetype, Mission, MissionTag } from "./missions";

export type PlanSettings = Pick<
  Answers,
  "pillarOrder" | "dailyMinutes" | "budget" | "gym" | "laptop" | "enemy" | "intensity"
>;

/** War Room changes for one week (docs/PRODUCT.md section 8). All optional. */
export type WeekAdjustments = {
  /** -1 drops one difficulty level, +1 raises one. */
  difficultyShift?: -1 | 0 | 1;
  /** -1 drops one time tier (90 to 60, 60 to 45 ...). */
  timeTierShift?: -1 | 0;
  /** Money blocker or a lower budget: free missions only. */
  freeOnly?: boolean;
  /** Extra preference, e.g. "energy" for an energy blocker. */
  focusTag?: MissionTag;
};

export type DayContext = {
  /** The student's id or any stable string; used only to break ties. */
  seed: string;
  date: LocalDate;
  /** Season day 1 to 90, week 1 to 13, act 1 to 3. */
  seasonDay: number;
  week: number;
  act: 1 | 2 | 3;
  archetype: Archetype;
  settings: PlanSettings;
  /** Missions given on earlier days, newest first is not required. */
  history: { missionId: string; date: LocalDate }[];
  adjustments?: WeekAdjustments;
  /** Free plan after the trial: one mission, in the pillar the student picked. */
  singlePillar?: Pillar;
  /** Missions already used today (after a swap), never picked again today. */
  excludeIds?: string[];
  /** With singlePillar: the longest mission allowed (a swap keeps the day's time). */
  maxMinutes?: number;
};

export type SelectedMission = { slot: number; pillar: Pillar; mission: Mission };

/** FNV-1a: a small, stable string hash mapped to 0..1, for fair tie-breaking. */
function stableFraction(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) / 0x1_0000_0000;
}

function daysAgo(from: LocalDate, to: LocalDate): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

export function targetDifficulty(intensity: Intensity, week: number, shift = 0): 1 | 2 | 3 {
  let level: number = 1;
  for (const [fromWeek, d] of PLAN_CONFIG.difficultyByIntensity[intensity]) {
    if (week >= fromWeek) level = d;
  }
  return Math.min(3, Math.max(1, level + shift)) as 1 | 2 | 3;
}

export function effectiveMinutes(dailyMinutes: number, tierShift: number = 0): number {
  const tiers = PLAN_CONFIG.minuteTiers;
  const index = tiers.findIndex((t) => t >= dailyMinutes);
  const shifted = Math.max(0, (index === -1 ? tiers.length - 1 : index) + tierShift);
  return tiers[shifted];
}

/** Pillars for the three slots: top pillar, second pillar, then the other two in turn. */
export function slotPillars(order: Pillar[], seasonDay: number): [Pillar, Pillar, Pillar] {
  const rotating = seasonDay % 2 === 1 ? order[2] : order[3];
  return [order[0], order[1], rotating];
}

export function selectDailyMissions(library: Mission[], ctx: DayContext): SelectedMission[] {
  const { settings, adjustments = {} } = ctx;
  const budgetMinutes = effectiveMinutes(settings.dailyMinutes, adjustments.timeTierShift ?? 0);
  const difficulty = targetDifficulty(settings.intensity, ctx.week, adjustments.difficultyShift ?? 0);
  const allowedCosts: readonly string[] = adjustments.freeOnly
    ? ["free"]
    : PLAN_CONFIG.costsByBudget[settings.budget];
  const enemyTag = PLAN_CONFIG.tagByEnemy[settings.enemy];

  const usable = library.filter(
    (m) =>
      m.pack === null &&
      allowedCosts.includes(m.cost) &&
      (m.needs !== "gym" || settings.gym) &&
      (m.needs !== "laptop" || settings.laptop),
  );

  const recent = new Map<string, number>();
  for (const h of ctx.history) {
    const ago = daysAgo(h.date, ctx.date);
    if (ago > 0) recent.set(h.missionId, Math.min(recent.get(h.missionId) ?? Infinity, ago));
  }

  const usedToday = new Set(ctx.excludeIds ?? []);

  const pick = (pillar: Pillar, maxMinutes: number, targetMinutes: number, quick: boolean) => {
    const inPillar = usable.filter((m) => m.pillar === pillar && !usedToday.has(m.id));
    const fits = (m: Mission) => m.minutes <= maxMinutes;
    const fresh = (m: Mission) => (recent.get(m.id) ?? Infinity) > PLAN_CONFIG.noRepeatDays;

    // Prefer fresh missions that fit; then allow older repeats; then anything shortest.
    let pool = inPillar.filter((m) => fits(m) && fresh(m));
    let repeatPenalty = false;
    if (pool.length === 0) {
      pool = inPillar.filter(fits);
      repeatPenalty = true;
    }
    if (pool.length === 0) {
      const shortest = Math.min(...inPillar.map((m) => m.minutes));
      pool = inPillar.filter((m) => m.minutes === shortest);
      repeatPenalty = true;
    }
    if (pool.length === 0) return null;

    const w = PLAN_CONFIG.weights;
    const score = (m: Mission) => {
      let s = 0;
      const actGap = Math.abs(m.act - ctx.act);
      s += actGap === 0 ? w.actMatch : actGap === 1 ? w.actNear : 0;
      if (m.archetypes.includes(ctx.archetype)) s += w.archetype;
      if (m.tags.includes(enemyTag)) s += w.enemyTag;
      if (adjustments.focusTag && m.tags.includes(adjustments.focusTag)) s += w.focusTag;
      s -= Math.abs(m.difficulty - difficulty) * w.perDifficultyStep;
      s -= Math.abs(m.minutes - targetMinutes) * w.perMinuteOff;
      if (quick) s -= m.minutes; // the quick win leans to the shortest
      // A repeat is allowed only when nothing fresh fits: the longest-unused wins.
      if (repeatPenalty) s += Math.min(recent.get(m.id) ?? 99, 99);
      s += stableFraction(`${ctx.seed}|${ctx.date}|${m.id}`);
      return s;
    };

    const best = pool.reduce((a, b) => (score(b) > score(a) ? b : a));
    usedToday.add(best.id);
    return best;
  };

  if (ctx.singlePillar) {
    const max = Math.max(5, Math.min(ctx.maxMinutes ?? budgetMinutes, budgetMinutes));
    const mission = pick(ctx.singlePillar, max, Math.min(max, budgetMinutes * 0.5), false);
    return mission ? [{ slot: 1, pillar: ctx.singlePillar, mission }] : [];
  }

  const pillars = slotPillars(settings.pillarOrder, ctx.seasonDay);
  // The quick-win slot rotates so every pillar gets longer missions too.
  // On Day 1 it is slot 1: "Do this one now. It takes 5 minutes."
  const quickSlot = (ctx.seasonDay - 1) % 3;
  // Leave at least 5 minutes for each of the other two missions.
  const quickMax = Math.min(
    ctx.seasonDay === 1 ? 5 : PLAN_CONFIG.quickWinMaxMinutes,
    budgetMinutes - 10,
  );
  const chosen: (SelectedMission | null)[] = [null, null, null];

  const quick = pick(pillars[quickSlot], Math.max(5, quickMax), 5, true);
  if (quick) chosen[quickSlot] = { slot: quickSlot + 1, pillar: pillars[quickSlot], mission: quick };

  let remaining = budgetMinutes - (quick?.minutes ?? 0);
  const others = [0, 1, 2].filter((i) => i !== quickSlot);
  const aim = Math.round(
    (budgetMinutes * PLAN_CONFIG.timeUseByIntensity[settings.intensity] - (quick?.minutes ?? 0)) / 2,
  );

  others.forEach((i, n) => {
    const slotsLeftAfter = others.length - n - 1;
    const maxMinutes = Math.max(5, remaining - slotsLeftAfter * 5);
    const target = Math.max(5, Math.min(aim, maxMinutes));
    const mission = pick(pillars[i], maxMinutes, target, false);
    if (mission) {
      chosen[i] = { slot: i + 1, pillar: pillars[i], mission };
      remaining -= mission.minutes;
    }
  });

  return chosen.filter((c): c is SelectedMission => c !== null);
}

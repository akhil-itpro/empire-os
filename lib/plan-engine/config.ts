// Every weight and map the plan engine uses, in one object (docs/PRODUCT.md section 6).
// Change behaviour here, not inside the selection code.
import type { Budget, Enemy, Goal, Intensity } from "./answers";
import type { Archetype, MissionCost, MissionTag } from "./missions";

export const PLAN_CONFIG = {
  /** The main goal decides the archetype. */
  archetypeByGoal: {
    first_job: "grinder",
    earn_more: "climber",
    side_income: "founder",
    fitness: "warrior",
    discipline: "phoenix",
    money: "strategist",
  } satisfies Record<Goal, Archetype>,

  /** Which mission costs each budget allows. */
  costsByBudget: {
    free: ["free"],
    under_500: ["free", "low"],
    "500_2000": ["free", "low", "paid"],
    flexible: ["free", "low", "paid"],
  } satisfies Record<Budget, MissionCost[]>,

  /** The mission tag preferred for each biggest enemy. */
  tagByEnemy: {
    phone: "phone",
    low_energy: "energy",
    no_plan: "planning",
    no_money: "earn",
    overthinking: "focus",
  } satisfies Record<Enemy, MissionTag>,

  /**
   * Target difficulty by intensity and week: [first week it applies, difficulty].
   * Steady stays gentle, beast mode climbs fast. The War Room can shift it by one.
   */
  difficultyByIntensity: {
    steady: [
      [1, 1],
      [7, 2],
    ],
    ambitious: [
      [1, 1],
      [4, 2],
      [10, 3],
    ],
    beast: [
      [1, 2],
      [5, 3],
    ],
  } satisfies Record<Intensity, [number, 1 | 2 | 3][]>,

  /** Share of the daily minutes the three missions aim to fill. */
  timeUseByIntensity: { steady: 0.7, ambitious: 0.85, beast: 1 } satisfies Record<Intensity, number>,

  /** Time tiers, for the War Room's "drop one time tier". */
  minuteTiers: [15, 30, 45, 60, 90],

  /** Every day has at least one mission this short. Day 1's first mission is 5 minutes. */
  quickWinMaxMinutes: 10,

  /** A mission doesn't come back within this many days. */
  noRepeatDays: 5,

  /** War Room rules (docs/PRODUCT.md section 8): how one week's review changes the next. */
  warRoom: {
    /** Under this share of missions done (or "too hard"): one time tier and one difficulty level down. */
    lowCompletion: 0.5,
    /** Over this share (and not "too hard"): one difficulty level up and a boss mission. */
    highCompletion: 0.85,
    /** XP for the weekly boss mission. */
    bossXp: 150,
    /** In a low week the daily quick win is this short. */
    lowWeekQuickWinMinutes: 5,
    /** The mission tag an energy blocker adds (sleep and energy missions). */
    energyTag: "energy",
    /** Reviews exist for weeks 1 to 12; week 13 ends the season. */
    lastReviewWeek: 12,
  },

  /** Scoring weights: higher scores win; ties break by a stable per-student hash. */
  weights: {
    actMatch: 30,
    actNear: 10,
    archetype: 15,
    enemyTag: 12,
    focusTag: 20,
    /** A turned-on pack's mission beats the base library in its pillar while it fits. */
    pack: 60,
    perDifficultyStep: 10,
    perMinuteOff: 0.8,
  },
} as const;

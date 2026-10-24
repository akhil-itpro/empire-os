// Game rules from docs/PRODUCT.md section 5. All numbers live here, in one place.

export const SEASON_DAYS = 90;
export const SEASON_WEEKS = 13;

// Missions give 30, 45 or 60 XP by difficulty. XP measures activity in the app only.
export const XP_BY_DIFFICULTY = { 1: 30, 2: 45, 3: 60 } as const;
export type Difficulty = keyof typeof XP_BY_DIFFICULTY;

// Finishing all of today's missions adds this.
export const DAY_COMPLETE_BONUS = 30;

// War Room weekly boss mission (docs/PRODUCT.md section 8).
export const BOSS_MISSION_XP = 150;

export const RANKS = [
  { name: "Rookie", minXp: 0 },
  { name: "Operator", minXp: 400 },
  { name: "Strategist", minXp: 1500 },
  { name: "Architect", minXp: 3500 },
  { name: "Commander", minXp: 6500 },
  { name: "Legend", minXp: 10000 },
] as const;

export type RankName = (typeof RANKS)[number]["name"];

// Days with at least one mission done in a row that get a full-screen moment.
export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 90] as const;

// Free-forever limits after the reverse trial (docs/PRODUCT.md section 2).
export const TRIAL_DAYS = 7;
export const FREE_MISSIONS_PER_DAY = 1;
export const PASS_MISSIONS_PER_DAY = 3;
export const SWAPS_PER_DAY = 1;
export const SKIP_REASONS = ["no_time", "not_relevant", "too_hard"] as const;
export type SkipReason = (typeof SKIP_REASONS)[number];

// Referrals (docs/PRODUCT.md section 7): when an invited student completes missions
// on 3 different days, both get 7 days of full access. At most 5 rewards per inviter.
export const REFERRAL_ACTIVE_DAYS = 3;
export const REFERRAL_REWARD_DAYS = 7;
export const REFERRAL_MAX_REWARDS = 5;

// Archetypes (docs/PRODUCT.md section 5): name, identity line and the three-act arc.
// Milestones are targets for the season, never promises of results.
import type { Goal } from "./answers";
import { PLAN_CONFIG } from "./config";
import type { Archetype } from "./missions";

export type ArchetypeInfo = {
  id: Archetype;
  name: string;
  identity: string;
  /** Two milestones for each act: I Foundation, II Execution, III Ascension. */
  milestones: [string[], string[], string[]];
};

export const ARCHETYPE_INFO: Record<Archetype, ArchetypeInfo> = {
  grinder: {
    id: "grinder",
    name: "The Grinder",
    identity: "You win by stacking small reps, every single day.",
    milestones: [
      ["Resume version 1 done", "Aptitude practice every day"],
      ["20 tailored applications", "Three mock interviews"],
      ["Two portfolio projects live", "Ready for placement interviews"],
    ],
  },
  climber: {
    id: "climber",
    name: "The Climber",
    identity: "You win by turning spare hours into a stronger profile.",
    milestones: [
      ["Resume and LinkedIn rewritten for the role you want", "One skill picked and started"],
      ["One project that proves the skill", "Ten conversations with people in that role"],
      ["Applications or an internal pitch sent", "Your salary range researched and practised"],
    ],
  },
  founder: {
    id: "founder",
    name: "The Founder",
    identity: "You win by testing small ideas fast with real customers.",
    milestones: [
      ["Three skills people would pay for, listed", "One clear offer written"],
      ["Your offer shown to 30 people", "A first paying customer, or a clear lesson why not"],
      ["A repeatable way to find customers", "Every rupee of side income tracked"],
    ],
  },
  warrior: {
    id: "warrior",
    name: "The Warrior",
    identity: "You win by showing up for your body before anything else.",
    milestones: [
      ["A home or gym routine four days a week", "Your Day 1 push-ups and steps recorded"],
      ["Protein in two meals most days", "Your strength numbers up from Day 1"],
      ["Training is a habit, not a debate", "A retest against your Day 1 numbers"],
    ],
  },
  phoenix: {
    id: "phoenix",
    name: "The Phoenix",
    identity: "You win by rebuilding your routine one habit at a time.",
    milestones: [
      ["Phone-free first 30 minutes most mornings", "A top 3 written every night"],
      ["Two focus blocks a day", "Sleep at a steady time"],
      ["A routine that runs without motivation", "One long-avoided task finished"],
    ],
  },
  strategist: {
    id: "strategist",
    name: "The Strategist",
    identity: "You win by knowing exactly where every rupee goes.",
    milestones: [
      ["Every rupee tracked for 30 days", "Your top 3 money leaks named"],
      ["A weekly cap you keep", "A savings pocket that grows every week"],
      ["An emergency-fund target with a plan to reach it", "Your own three money rules written"],
    ],
  },
};

export function archetypeFor(goal: Goal): Archetype {
  return PLAN_CONFIG.archetypeByGoal[goal];
}

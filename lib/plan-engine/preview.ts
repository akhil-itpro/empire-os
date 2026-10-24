// previewPlan (docs/PRODUCT.md section 6): what the reveal screen shows before
// sign-up. Pure: it reads the local mission library and writes nothing.
import type { Pillar } from "@/lib/pillars";
import { labelOf, SITUATIONS, type Answers } from "./answers";
import { ARCHETYPE_INFO, archetypeFor, type ArchetypeInfo } from "./archetype";
import { MISSIONS, type Mission } from "./missions";
import { effectiveMinutes, selectDailyMissions } from "./select";

export type PlanPreview = {
  archetype: ArchetypeInfo;
  /** "College student, 45 minutes a day, no gym." */
  summary: string;
  topPillars: [Pillar, Pillar];
  /** Day 1's missions, in slot order. */
  sampleMissions: Mission[];
  milestones: ArchetypeInfo["milestones"];
  /** Two or three bullets that quote the student's real answers. */
  whyThisPlan: string[];
};

function minutesRange(missions: Mission[]): string {
  const mins = missions.map((m) => m.minutes);
  const lo = Math.min(...mins);
  const hi = Math.max(...mins);
  return lo === hi ? `${lo} minutes each` : `${lo} to ${hi} minutes`;
}

const ENEMY_LINE: Record<Answers["enemy"], string> = {
  phone: "Your phone is your biggest enemy, so missions that cut screen time get priority.",
  low_energy: "Low energy is your biggest enemy, so sleep and energy missions get priority.",
  no_plan: "Not having a plan is your biggest enemy, so planning missions get priority.",
  no_money: "Money is your biggest enemy, so missions that can bring some in get priority.",
  overthinking: "Overthinking is your biggest enemy, so focus missions get priority.",
};

export function previewPlan(answers: Answers): PlanPreview {
  const archetypeId = archetypeFor(answers.goal);
  const archetype = ARCHETYPE_INFO[archetypeId];
  const selected = selectDailyMissions(MISSIONS, {
    seed: "preview",
    date: "2000-01-01",
    seasonDay: 1,
    week: 1,
    act: 1,
    archetype: archetypeId,
    settings: answers,
    history: [],
  });
  const sampleMissions = selected.map((s) => s.mission);
  const minutes = effectiveMinutes(answers.dailyMinutes);
  const minutesLabel = answers.dailyMinutes === 90 ? "90 minutes or more" : `${minutes} minutes`;

  const equipment = !answers.laptop
    ? "Phone only, so nothing needs a laptop."
    : answers.gym
      ? "You have a gym, so some workouts can use it."
      : "No gym, so workouts are home circuits.";

  const whyThisPlan = [
    `You have ${minutesLabel} a day, so your Day 1 missions take ${minutesRange(sampleMissions)}.`,
    equipment,
    answers.budget === "free"
      ? "Free resources only, because you asked for that."
      : ENEMY_LINE[answers.enemy],
  ];

  const situation = labelOf(SITUATIONS, answers.situation);
  const summary = `${situation}, ${minutesLabel} a day, ${answers.gym ? "gym access" : "no gym"}.`;

  return {
    archetype,
    summary,
    topPillars: [answers.pillarOrder[0], answers.pillarOrder[1]],
    sampleMissions,
    milestones: archetype.milestones,
    whyThisPlan,
  };
}

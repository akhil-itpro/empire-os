// The two reflection screens and the "Building your season" checklist.
// True arithmetic only (docs/PRODUCT.md section 3).
import { PILLAR_LABEL } from "@/lib/pillars";
import type { Answers } from "@/lib/plan-engine/answers";
import { ARCHETYPE_INFO, archetypeFor } from "@/lib/plan-engine/archetype";

const nf = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 });

/** After question 4: what a season adds up to. */
export function seasonReflection(firstName: string) {
  return {
    title: `${firstName}, 90 days is 13 weeks.`,
    body: "Three missions a day adds up to 270 small wins by Day 90. Next, let's size them to your life.",
  };
}

/** After question 7: their daily minutes over the season, e.g. 45 × 90 = 4,050 minutes = 67.5 hours. */
export function timeReflection(firstName: string, dailyMinutes: number, budget: Answers["budget"]) {
  const hours = (dailyMinutes * 90) / 60;
  const atLeast = dailyMinutes >= 90 ? "at least " : "";
  return {
    title: `${firstName}, ${dailyMinutes} minutes a day is ${atLeast}${nf.format(hours)} hours by Day 90.`,
    body:
      budget === "free"
        ? "That's a real investment in yourself, and every mission can be free."
        : "That's a real investment in yourself, and every mission stays inside your budget.",
  };
}

const ENEMY_STEP: Record<Answers["enemy"], string> = {
  phone: "Cutting screen time first",
  low_energy: "Adding sleep and energy missions",
  no_plan: "Adding planning missions",
  no_money: "Adding missions that can earn",
  overthinking: "Adding focus missions",
};

/** "Building your season": the real steps the plan engine takes with their answers. */
export function buildingSteps(answers: Answers): string[] {
  const steps = [`Fitting three missions into ${answers.dailyMinutes === 90 ? "90+" : answers.dailyMinutes} minutes a day`];
  steps.push(answers.budget === "free" ? "Free resources only" : "Keeping every mission inside your budget");
  steps.push(answers.gym ? "Adding gym sessions where they help" : "Home workouts, no gym needed");
  if (!answers.laptop) steps.push("Phone-friendly missions only");
  steps.push(`Putting ${PILLAR_LABEL[answers.pillarOrder[0]]} first, then ${PILLAR_LABEL[answers.pillarOrder[1]]}`);
  steps.push(ENEMY_STEP[answers.enemy]);
  steps.push(`Shaping Act I for ${ARCHETYPE_INFO[archetypeFor(answers.goal)].name}`);
  return steps;
}

// The eleven quiz questions (docs/PRODUCT.md section 3). Every promise in the
// helper text is something the plan engine really does.
import {
  BUDGETS,
  CITIES,
  DAILY_MINUTES,
  ENEMIES,
  GOALS,
  INTENSITIES,
  SITUATIONS,
  type Answers,
} from "@/lib/plan-engine/answers";

export type QuestionId = keyof Answers | "ageBracket";

export type ChoiceOption = { value: string | number | boolean; label: string; description?: string; icon?: string };

export type Question =
  | { id: "firstName"; kind: "text"; title: string; help: string }
  | { id: "pillarOrder"; kind: "order"; title: string; help: string }
  | {
      id: Exclude<keyof Answers, "firstName" | "pillarOrder">;
      kind: "choice";
      title: string;
      help: string;
      options: ChoiceOption[];
      /** Tall tiles with an icon and description, two per row. */
      layout: "tiles" | "compact";
    };

const choices = <T extends { id: string | number; label: string; description?: string }>(list: readonly T[]) =>
  list.map((o) => ({ value: o.id, label: o.label, description: o.description }));

// Icon names map to lucide icons in the quiz screen.
const GOAL_ICONS: Record<string, string> = {
  first_job: "briefcase",
  earn_more: "trending-up",
  side_income: "store",
  fitness: "dumbbell",
  discipline: "moon",
  money: "wallet",
};

export const QUESTIONS: Question[] = [
  {
    id: "firstName",
    kind: "text",
    title: "What should we call you?",
    help: "Just your first name. It's how your plan talks to you.",
  },
  {
    id: "city",
    kind: "choice",
    title: "Where are you based?",
    help: "It helps us understand who EMPIRE OS is for. It never appears on share cards.",
    options: choices(CITIES),
    layout: "compact",
  },
  {
    id: "situation",
    kind: "choice",
    title: "Right now, you are…",
    help: "Pick the one that fits best today.",
    options: choices(SITUATIONS),
    layout: "compact",
  },
  {
    id: "goal",
    kind: "choice",
    title: "What do you want most from the next 90 days?",
    help: "Pick one. Your season is built around it, and you can change it later.",
    options: GOALS.map((g) => ({ value: g.id, label: g.label, description: g.description, icon: GOAL_ICONS[g.id] })),
    layout: "tiles",
  },
  {
    id: "pillarOrder",
    kind: "order",
    title: "Put the four pillars in order.",
    help: "Tap them from most to least important. Your top two get a mission every day.",
  },
  {
    id: "dailyMinutes",
    kind: "choice",
    title: "How much free time do you have a day?",
    help: "Be honest. All three missions fit inside it.",
    options: choices(DAILY_MINUTES),
    layout: "compact",
  },
  {
    id: "budget",
    kind: "choice",
    title: "How much do you spend on yourself a month?",
    help: "Books, courses, food extras. Every mission stays inside it.",
    options: choices(BUDGETS),
    layout: "compact",
  },
  {
    id: "gym",
    kind: "choice",
    title: "Do you have a gym?",
    help: "Without one, workouts are home circuits.",
    options: [
      { value: true, label: "Yes" },
      { value: false, label: "Home only" },
    ],
    layout: "compact",
  },
  {
    id: "laptop",
    kind: "choice",
    title: "Do you have a laptop?",
    help: "Phone only is fine. Nothing will need a laptop.",
    options: [
      { value: true, label: "Yes" },
      { value: false, label: "Phone only" },
    ],
    layout: "compact",
  },
  {
    id: "enemy",
    kind: "choice",
    title: "What gets in your way most?",
    help: "Your plan gives priority to missions that work against it.",
    options: choices(ENEMIES),
    layout: "compact",
  },
  {
    id: "intensity",
    kind: "choice",
    title: "How hard should we push?",
    help: "Even beast mode stays inside your daily time.",
    options: choices(INTENSITIES),
    layout: "compact",
  },
];

export const QUESTION_COUNT = QUESTIONS.length;

/** A reflection screen appears after these question numbers (1-based): after the goal and after the budget. */
export const REFLECT_AFTER = [4, 7] as const;

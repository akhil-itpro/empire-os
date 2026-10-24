// The quiz answers (docs/PRODUCT.md section 3) and how to check them.
// The quiz screens use the labels; the server uses the schema and never trusts
// anything the browser sends without it.
import { z } from "zod";
import { PILLARS, type Pillar } from "@/lib/pillars";

export const AGE_BRACKETS = [
  { id: "18-20", label: "18–20" },
  { id: "21-24", label: "21–24" },
  { id: "25-28", label: "25–28" },
  { id: "29-34", label: "29–34" },
  { id: "35+", label: "35+" },
] as const;

export const CITIES = [
  { id: "hyderabad", label: "Hyderabad" },
  { id: "bengaluru", label: "Bengaluru" },
  { id: "pune", label: "Pune" },
  { id: "mumbai", label: "Mumbai" },
  { id: "delhi_ncr", label: "Delhi NCR" },
  { id: "chennai", label: "Chennai" },
  { id: "kolkata", label: "Kolkata" },
  { id: "other", label: "Other" },
] as const;

export const SITUATIONS = [
  { id: "student", label: "College student" },
  { id: "job_hunting", label: "Job hunting" },
  { id: "working_tech", label: "Working in IT or tech" },
  { id: "working_other", label: "Working in another field" },
  { id: "own_thing", label: "Running my own thing" },
] as const;

export const GOALS = [
  { id: "first_job", label: "Get my first job", description: "Placements, interviews, projects" },
  { id: "earn_more", label: "Earn more or switch", description: "New skills, a stronger profile" },
  { id: "side_income", label: "Build a side income", description: "Freelance or a small business" },
  { id: "fitness", label: "Get fit and strong", description: "Home or gym training" },
  { id: "discipline", label: "Fix my discipline", description: "Phone, sleep and routine" },
  { id: "money", label: "Control my money", description: "Budget, save, stop the leaks" },
] as const;

export const DAILY_MINUTES = [
  { id: 15, label: "15 minutes" },
  { id: 30, label: "30 minutes" },
  { id: 45, label: "45 minutes" },
  { id: 60, label: "60 minutes" },
  { id: 90, label: "90+ minutes" },
] as const;

export const BUDGETS = [
  { id: "free", label: "Only free stuff" },
  { id: "under_500", label: "Under ₹500" },
  { id: "500_2000", label: "₹500 to ₹2,000" },
  { id: "flexible", label: "Flexible" },
] as const;

export const ENEMIES = [
  { id: "phone", label: "Phone" },
  { id: "low_energy", label: "Low energy" },
  { id: "no_plan", label: "No plan" },
  { id: "no_money", label: "No money" },
  { id: "overthinking", label: "Overthinking" },
] as const;

export const INTENSITIES = [
  { id: "steady", label: "Steady", description: "Small steps, every day" },
  { id: "ambitious", label: "Ambitious", description: "Push a little each week" },
  { id: "beast", label: "Beast mode", description: "Hard missions, still capped by your time" },
] as const;

type Ids<T extends readonly { id: string | number }[]> = T[number]["id"];

export type AgeBracket = Ids<typeof AGE_BRACKETS>;
export type City = Ids<typeof CITIES>;
export type Situation = Ids<typeof SITUATIONS>;
export type Goal = Ids<typeof GOALS>;
export type DailyMinutes = Ids<typeof DAILY_MINUTES>;
export type Budget = Ids<typeof BUDGETS>;
export type Enemy = Ids<typeof ENEMIES>;
export type Intensity = Ids<typeof INTENSITIES>;

const ids = <T extends readonly { id: string }[]>(list: T) =>
  list.map((o) => o.id) as unknown as [Ids<T>, ...Ids<T>[]];

// Letters (any script), spaces, apostrophes, dots and hyphens; 1 to 40 characters.
const FIRST_NAME = /^[\p{L}\p{M}][\p{L}\p{M} .'-]{0,39}$/u;

export const answersSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "Tell us your first name.")
    .max(40, "Keep it under 40 characters.")
    .regex(FIRST_NAME, "Use letters only."),
  ageBracket: z.enum(ids(AGE_BRACKETS)),
  city: z.enum(ids(CITIES)),
  situation: z.enum(ids(SITUATIONS)),
  goal: z.enum(ids(GOALS)),
  pillarOrder: z
    .array(z.enum(PILLARS))
    .length(4)
    .refine((order) => new Set(order).size === 4, "Order all four pillars."),
  dailyMinutes: z.union([z.literal(15), z.literal(30), z.literal(45), z.literal(60), z.literal(90)]),
  budget: z.enum(ids(BUDGETS)),
  gym: z.boolean(),
  laptop: z.boolean(),
  enemy: z.enum(ids(ENEMIES)),
  intensity: z.enum(ids(INTENSITIES)),
});

export type Answers = Omit<z.infer<typeof answersSchema>, "pillarOrder"> & {
  pillarOrder: Pillar[];
};

export function labelOf<T extends readonly { id: string | number; label: string }[]>(
  list: T,
  id: T[number]["id"],
): string {
  return list.find((o) => o.id === id)?.label ?? String(id);
}

import { expect, type BrowserContext, type Page } from "@playwright/test";

export const RAHUL = {
  firstName: "Rahul",
  city: "pune",
  situation: "student",
  goal: "first_job",
  pillarOrder: ["career", "mind", "body", "money"],
  dailyMinutes: 45,
  budget: "free",
  gym: false,
  laptop: false,
  enemy: "phone",
  intensity: "steady",
};

/**
 * Signs in a brand-new student (local test mode) with a finished quiz and lands on HQ.
 * Each call is a new student, so tests don't share state.
 */
export async function startSeason(page: Page, answers: Record<string, unknown> = RAHUL) {
  await page.goto("/quiz");
  await page.evaluate((a) => {
    localStorage.setItem("empire.quiz.v1", JSON.stringify({ ageBracket: "21-24", answers: a, step: "" }));
  }, answers);
  await page.goto("/quiz?s=signup");
  await page.getByRole("button", { name: "Test sign-in (local test mode)" }).click();
  await page.waitForURL(/\/hq/);
  await expect(page.getByRole("heading", { name: "Today's missions" })).toBeVisible();
}

/** Moves this browser's clock forward (time travel; local test mode allows it for everyone). */
export async function travelDays(context: BrowserContext, days: number) {
  await context.addCookies([{ name: "empire_time_travel", value: String(days), url: "http://localhost:3100" }]);
}

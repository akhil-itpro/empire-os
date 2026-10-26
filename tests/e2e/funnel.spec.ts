import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const shots = process.env.SHOTS_DIR;
async function shot(page: Page, name: string) {
  if (shots) await page.screenshot({ caret: "initial", path: `${shots}/${name}.png`, fullPage: true });
}

async function noA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page }).exclude("button:disabled").analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes[0]?.target})`)).toEqual([]);
}

async function pick(page: Page, name: string | RegExp) {
  await page.getByRole("button", { name, exact: typeof name === "string" }).click();
}

/** Answers the eleven questions as a Pune student with 45 minutes, free only, phone only. */
async function answerQuiz(page: Page) {
  await page.getByLabel("First name").fill("Rahul");
  await page.getByRole("button", { name: "Continue" }).click();
  await pick(page, "Pune");
  await pick(page, "College student");
  await pick(page, /Get my first job/);
  await expect(page.getByRole("heading", { name: "Rahul, 90 days is 13 weeks." })).toBeVisible();
  await shot(page, "05-reflection-1");
  await page.getByRole("button", { name: "Continue" }).click();
  for (const p of ["Career", "Mind", "Body", "Money"]) await page.getByRole("button", { name: new RegExp(`^${p}`) }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await pick(page, "45 minutes");
  await pick(page, "Only free stuff");
  await expect(page.getByRole("heading", { name: "Rahul, 45 minutes a day is 67.5 hours by Day 90." })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await pick(page, "Home only");
  await expect(page.getByRole("heading", { name: "Do you have a laptop?" })).toBeVisible();
  await pick(page, "Phone only");
  await expect(page.getByRole("heading", { name: "What gets in your way most?" })).toBeVisible();
  await pick(page, "Phone");
  await pick(page, /^Steady/);
}

test.describe("the hook: landing to sign-up", () => {
  // Any console error (a hydration mismatch, a crash) fails the test.
  let errors: string[] = [];
  test.beforeEach(({ page }) => {
    errors = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(String(e)));
  });
  test.afterEach(() => {
    expect(errors).toEqual([]);
  });

  test("landing page shows the promise and one button", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "Make the next 90 days your best season." })).toBeVisible();
    await expect(page.getByText("Free 2-minute quiz. No card needed.")).toBeVisible();
    await shot(page, "01-landing");
    await noA11yViolations(page);
  });

  test("a student goes from landing to the sign-up screen with a plan built from their answers", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Find your archetype" }).click();
    await expect(page.getByRole("heading", { name: "First, how old are you?" })).toBeVisible();
    await shot(page, "02-age");
    await pick(page, "21–24");
    await expect(page.getByRole("heading", { name: "What should we call you?" })).toBeVisible();
    await expect(page.getByText("1 of 11")).toBeVisible();
    await shot(page, "03-name");

    await page.getByLabel("First name").fill("Rahul");
    await page.getByRole("button", { name: "Continue" }).click();
    await shot(page, "04-city");
    await page.goBack();
    await expect(page.getByLabel("First name")).toHaveValue("Rahul");
    await page.goto("/quiz?s=q1");
    await answerQuiz(page);

    await expect(page.getByRole("heading", { name: "Building your season" })).toBeVisible();
    await expect(page.getByText("Phone-friendly missions only")).toBeVisible();
    await shot(page, "06-building");

    await expect(page.getByRole("heading", { name: "The Grinder" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("You have 45 minutes a day, so your Day 1 missions take")).toBeVisible();
    await expect(page.getByText("Phone only, so nothing needs a laptop.")).toBeVisible();
    await expect(page.getByText("Free resources only, because you asked for that.")).toBeVisible();
    await shot(page, "07-reveal");
    await noA11yViolations(page);

    // Back from the reveal returns to the last question, not to the checklist.
    await page.goBack();
    await expect(page.getByRole("heading", { name: "How hard should we push?" })).toBeVisible();
    await page.goForward();
    await expect(page.getByRole("heading", { name: "The Grinder" })).toBeVisible();

    await page.getByRole("button", { name: "Start Season 1" }).click();
    await expect(page.getByRole("heading", { name: /I'll show up for 90 days/ })).toBeVisible();
    await shot(page, "08-oath");
    const hold = page.getByRole("button", { name: /Press and hold/ });
    const box = (await hold.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(2300);
    await page.mouse.up();

    await expect(page.getByRole("heading", { name: "Save your plan to start Day 1." })).toBeVisible();
    await shot(page, "09-signup");
  });

  test("letting go of the oath early doesn't count", async ({ page }) => {
    await page.goto("/quiz");
    await pick(page, "25–28");
    await answerQuiz(page);
    await page.getByRole("button", { name: "Start Season 1" }).click({ timeout: 15_000 });
    const hold = page.getByRole("button", { name: /Press and hold/ });
    const box = (await hold.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(600);
    await page.mouse.up();
    await page.waitForTimeout(2000);
    await expect(page.getByRole("heading", { name: /I'll show up for 90 days/ })).toBeVisible();
  });

  test.describe("with reduced motion", () => {
    test.use({ reducedMotion: "reduce" });
    test("the oath is a single tap and the checklist shows at once", async ({ page }) => {
      await page.goto("/quiz");
      await pick(page, "21–24");
      await answerQuiz(page);
      await expect(page.getByText("Shaping Act I for The Grinder, done")).toBeAttached();
      await page.getByRole("button", { name: "See your archetype" }).click();
      await page.getByRole("button", { name: "Start Season 1" }).click();
      await page.getByRole("button", { name: "Take the oath" }).click();
      await expect(page.getByRole("heading", { name: "Save your plan to start Day 1." })).toBeVisible();
    });
  });

  test("two different students get different archetypes", async ({ page }) => {
    await page.goto("/quiz");
    await pick(page, "25–28");
    await page.getByLabel("First name").fill("Priya");
    await page.getByRole("button", { name: "Continue" }).click();
    await pick(page, "Bengaluru");
    await pick(page, "Working in IT or tech");
    await pick(page, /Get fit and strong/);
    await expect(page.getByRole("heading", { name: "Priya, 90 days is 13 weeks." })).toBeVisible();
    await page.getByRole("button", { name: "Continue" }).click();
    for (const p of ["Body", "Career", "Money", "Mind"]) await page.getByRole("button", { name: new RegExp(`^${p}`) }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await pick(page, "90+ minutes");
    await pick(page, "Flexible");
    await expect(page.getByRole("heading", { name: /at least 135 hours/ })).toBeVisible();
    await page.getByRole("button", { name: "Continue" }).click();
    await pick(page, "Yes");
    await expect(page.getByRole("heading", { name: "Do you have a laptop?" })).toBeVisible();
    await pick(page, "Yes");
    await expect(page.getByRole("heading", { name: "What gets in your way most?" })).toBeVisible();
    await pick(page, "Low energy");
    await pick(page, /^Beast mode/);
    await expect(page.getByRole("heading", { name: "The Warrior" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("You have a gym, so some workouts can use it.")).toBeVisible();
    await expect(page.getByText("Low energy is your biggest enemy")).toBeVisible();
  });

  test("Under 18 ends politely and stores nothing", async ({ page }) => {
    await page.goto("/quiz");
    await pick(page, "Under 18");
    await expect(page.getByRole("heading", { name: /EMPIRE OS is for adults/ })).toBeVisible();
    const stored = await page.evaluate(() => localStorage.getItem("empire.quiz.v1"));
    expect(stored).toBeNull();
  });

  test("the quiz can't skip ahead to the reveal", async ({ page }) => {
    await page.goto("/quiz?s=reveal");
    await expect(page.getByRole("heading", { name: "First, how old are you?" })).toBeVisible();
  });
});

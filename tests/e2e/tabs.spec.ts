import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { startSeason, travelDays } from "./helpers";

async function noA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page }).exclude("button:disabled").analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes[0]?.target})`)).toEqual([]);
}

test.describe("Path, Stats and Me", () => {
  let errors: string[] = [];
  test.beforeEach(({ page }) => {
    errors = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(String(e)));
  });
  test.afterEach(() => expect(errors).toEqual([]));

  test("Path shows 13 weeks in three acts with this week marked", async ({ page }) => {
    await startSeason(page);
    await page.getByRole("link", { name: "Path" }).click();
    await expect(page.getByRole("heading", { name: "Your campaign" })).toBeVisible();
    // Count visible items only: Next.js keeps the previous screen hidden for instant back.
    await expect(page.getByRole("main").getByRole("listitem")).toHaveCount(13);
    await expect(page.getByText("Week 1: Set-up week")).toBeVisible();
    await expect(page.getByText("Week 6: Interview week")).toBeVisible();
    await expect(page.locator('li[aria-current="step"]')).toContainText("Week 1");
    await noA11yViolations(page);
  });

  test("free students see weeks 2 to 13 locked", async ({ page, context }) => {
    await startSeason(page);
    await travelDays(context, 8);
    await page.goto("/path");
    await expect(page.getByText("Locked on Free")).toHaveCount(12);
  });

  test("Stats counts real missions and offers the chart as a table", async ({ page }) => {
    await startSeason(page);
    await page.getByRole("button", { name: /^Mark done:/ }).first().click();
    await expect(page.getByText("1 of 3 done")).toBeVisible();
    await page.getByRole("link", { name: "Stats" }).click();
    await expect(page.getByText("You've invested 5m in yourself this season.")).toBeVisible();
    await page.getByRole("button", { name: "Show as a table" }).click();
    await expect(page.getByRole("table")).toContainText("30");
    await noA11yViolations(page);
  });

  test("the journal line is saved and private", async ({ page }) => {
    await startSeason(page);
    await page.goto("/me");
    await page.getByRole("textbox", { name: "One line for today" }).fill("Finished the resume headline.");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText("Saved.")).toBeVisible();
    await page.reload();
    await expect(page.getByRole("textbox", { name: "One line for today" })).toHaveValue("Finished the resume headline.");
    await noA11yViolations(page);
  });

  test("plan edits apply from tomorrow, not today", async ({ page, context }) => {
    await startSeason(page);
    const todaysFirst = await page.getByRole("button", { name: /^Mark done:/ }).first().getAttribute("aria-label");
    await page.goto("/me");
    await page.getByRole("button", { name: "Edit my plan" }).click();
    for (const p of ["Career", "Mind", "Body", "Money"]) await page.getByRole("button", { name: new RegExp(`^${p}`) }).click();
    for (const p of ["Money", "Body", "Mind", "Career"]) await page.getByRole("button", { name: new RegExp(`^${p}`) }).click();
    await page.getByRole("button", { name: "Save changes for tomorrow" }).click();
    await expect(page.getByText("Saved. Your updated plan starts tomorrow.")).toBeVisible();
    await expect(page.getByText(/Your updated plan starts on/)).toBeVisible();

    // Today is unchanged.
    await page.goto("/hq");
    await expect(page.getByRole("button", { name: /^Mark done:/ }).first()).toHaveAttribute("aria-label", todaysFirst!);

    // Tomorrow's first mission is in the new top pillar, Money.
    await travelDays(context, 1);
    await page.goto("/hq");
    await expect(page.getByRole("button", { name: /Open details/ }).first()).toContainText("Money");
  });

  test("founder tools move the clock to the next day", async ({ page }) => {
    await startSeason(page);
    await page.goto("/me");
    await page.getByRole("button", { name: "+1 day" }).click();
    await expect(page.getByText("Your clock is now 1 day ahead.")).toBeVisible();
    await page.goto("/hq");
    await expect(page.getByText("Day 2", { exact: true })).toBeVisible();
  });

  test("the app is installable: manifest and icons", async ({ request }) => {
    const res = await request.get("/manifest.webmanifest");
    expect(res.ok()).toBe(true);
    const manifest = await res.json();
    expect(manifest).toMatchObject({ name: "EMPIRE OS", start_url: "/hq", display: "standalone" });
    for (const icon of manifest.icons) expect((await request.get(icon.src)).ok()).toBe(true);
  });
});

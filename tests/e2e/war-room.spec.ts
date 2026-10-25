import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { startSeason, travelDays } from "./helpers";

async function noA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes[0]?.target})`)).toEqual([]);
}

test.describe("the War Room", () => {
  let errors: string[] = [];
  test.beforeEach(({ page }) => {
    errors = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(String(e)));
  });
  test.afterEach(() => expect(errors).toEqual([]));

  test("opens on day 7: a hard week gets lighter, and a goal change asks before applying", async ({ page, context }) => {
    await startSeason(page);
    await page.goto("/war-room");
    await expect(page.getByText(/Your first War Room opens on day 7/)).toBeVisible();

    await travelDays(context, 6);
    await page.goto("/hq");
    await page.getByRole("link", { name: /War Room: week 1/ }).click();
    await expect(page.getByRole("heading", { name: "War Room" })).toBeVisible();
    await expect(page.getByRole("group", { name: "Next week's focus" }).getByRole("button", { pressed: true })).toHaveCount(1);
    await noA11yViolations(page);

    await page.getByRole("button", { name: "Set next week" }).click();
    await expect(page.getByRole("main").getByRole("alert")).toHaveText("Answer how the week felt and your biggest blocker.");
    await page.getByRole("button", { name: "Too hard" }).click();
    await page.getByRole("button", { name: "Energy" }).click();
    await page.getByRole("button", { name: "My goal" }).click();
    await page.getByRole("button", { name: /Get fit and strong/ }).click();
    const saved = page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/war-room"));
    await page.getByRole("button", { name: "Set next week" }).click();
    await saved;

    await expect(page.getByRole("heading", { name: "Reset, don't quit." })).toBeVisible();
    await expect(
      page.getByText(/^You finished 0 of \d+ missions \(0%\), under half\. Next week each day is shorter, about 30 minutes instead of 45/),
    ).toBeVisible();
    await expect(page.getByText("Energy was the blocker, so next week adds sleep and energy missions.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Apply new plan?" })).toBeVisible();
    await expect(page.getByText("The Warrior")).toBeVisible();
    await expect(page.getByRole("button", { name: "Keep my current plan" })).toBeVisible();
    await noA11yViolations(page);
    await page.getByRole("button", { name: "Apply new plan" }).click();
    await expect(page.getByRole("heading", { name: "New plan applied" })).toBeVisible();

    // HQ no longer asks for this week's review.
    await page.goto("/hq");
    await expect(page.getByRole("heading", { name: "Today's missions" })).toBeVisible();
    await expect(page.getByRole("link", { name: /War Room: week 1/ })).toHaveCount(0);
  });

  test("Free students see what would change and one upgrade button", async ({ page, context }) => {
    await startSeason(page);
    await travelDays(context, 13);
    await page.goto("/war-room");
    await page.getByRole("button", { name: "Just right" }).click();
    await page.getByRole("button", { name: "Nothing" }).click();
    const saved = page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/war-room"));
    await page.getByRole("button", { name: "Set next week" }).click();
    await saved;
    await expect(page.getByText("Free keeps one mission a day, so this is what would change with Season Pass.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Unlock with Season Pass" })).toHaveAttribute("href", "/pass?from=war_room");
  });
});

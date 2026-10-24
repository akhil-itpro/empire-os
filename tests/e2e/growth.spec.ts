import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { startSeason, travelDays } from "./helpers";

async function noA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes[0]?.target})`)).toEqual([]);
}

test.describe("Season Pass in reserve mode", () => {
  let errors: string[] = [];
  test.beforeEach(({ page }) => {
    errors = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(String(e)));
  });
  test.afterEach(() => expect(errors).toEqual([]));

  test("the last day of the free week shows one true, dismissible banner", async ({ page, context }) => {
    await startSeason(page);
    await travelDays(context, 6);
    await page.goto("/hq");
    const banner = page.getByRole("complementary", { name: "Free week ending" });
    await expect(banner).toContainText("Your full access ends tomorrow. Keep three missions a day with Season Pass.");
    await banner.getByRole("link", { name: "See Season Pass" }).click();
    await expect(page).toHaveURL(/\/pass\?from=trial_banner/);
    await expect(page.getByText(/^Everything is unlocked until/)).toBeVisible();
    await page.getByRole("link", { name: "Maybe later" }).click();
    await page.getByRole("button", { name: "Dismiss" }).click();
    await expect(banner).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole("heading", { name: "Today's missions" })).toBeVisible();
    await expect(banner).toHaveCount(0);
  });

  test("after the free week the paywall opens once, uninvited, with a clear Maybe later", async ({ page, context }) => {
    await startSeason(page);
    await travelDays(context, 8);
    await page.goto("/hq");
    await page.waitForURL(/\/pass\?from=trial_end/);
    await expect(page.getByRole("heading", { name: "Keep all three missions." })).toBeVisible();
    await expect(page.getByRole("main").getByText(/^Your free week is over. Free stays free with one mission a day. Season Pass/)).toBeVisible();
    await expect(page.getByText("Built for The Grinder, Rahul")).toBeVisible();
    await expect(page.getByText("₹299")).toBeVisible();
    await expect(page.getByText("About ₹3.30 a day")).toBeVisible();
    await expect(page.getByText(/Founder price for the first 500 members, then ₹499\. \d+ of 500 reserved so far\./)).toBeVisible();
    await expect(page.getByRole("link", { name: "Maybe later" })).toBeVisible();
    await noA11yViolations(page);
    await page.getByRole("link", { name: "Maybe later" }).click();
    await page.waitForURL(/\/hq$/);
    await page.reload();
    await expect(page.getByRole("heading", { name: "Today's missions" })).toBeVisible();
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/hq$/);
  });

  test("reserving saves the founder price and takes no payment", async ({ page, context }) => {
    await startSeason(page);
    await travelDays(context, 8);
    await page.goto("/pass?from=me");
    await page.getByRole("button", { name: "Reserve founder price" }).click();
    await expect(page.getByRole("status")).toContainText(
      "Reserved at ₹299. No payment taken. We'll tell you in the app when Season Pass opens.",
    );
    await page.reload();
    await expect(page.getByText(/Reserved at ₹299/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Reserve founder price" })).toHaveCount(0);
    await page.goto("/me");
    await expect(page.getByText("You reserved Season Pass at ₹299. No payment taken.", { exact: false })).toBeVisible();
  });

  test("on Free, locked weeks and packs open the paywall", async ({ page, context }) => {
    await startSeason(page);
    await travelDays(context, 8);
    await page.goto("/path");
    await page.getByRole("link", { name: /Week 2:.*Locked on Free/ }).click();
    await expect(page).toHaveURL(/\/pass\?from=path_week/);
    await page.getByRole("link", { name: "Maybe later" }).click();
    await expect(page).toHaveURL(/\/path$/);
    await expect(page.getByRole("button", { name: /^Add to my plan/ })).toHaveCount(0);
    await page.getByRole("link", { name: /^Unlock\s?: Placement Prep, with Season Pass$/ }).click();
    await expect(page).toHaveURL(/\/pass\?from=pack/);
    await expect(page.getByRole("heading", { name: "Keep all three missions." })).toBeVisible();
  });

  test("with full access a pack turns on and its missions arrive from tomorrow", async ({ page, context }) => {
    await startSeason(page);
    await page.goto("/path");
    await page.getByRole("button", { name: /^Add to my plan\s?: Placement Prep$/ }).click();
    await expect(page.getByRole("status")).toContainText("Placement Prep is on.");
    await expect(page.getByText("In your plan, 0 of 10 done")).toBeVisible();
    await noA11yViolations(page);
    await travelDays(context, 1);
    await page.goto("/hq");
    // Career is Rahul's top pillar, so slot 1 comes from the pack.
    await page.getByRole("button", { name: /Open details/ }).first().click();
    await expect(page.getByText("From the Placement Prep pack")).toBeVisible();
  });

  test("paywall views reach Founder HQ with their source", async ({ page, context }) => {
    await startSeason(page);
    await travelDays(context, 8);
    await page.goto("/pass?from=path_week");
    await expect(page.getByRole("heading", { name: "Keep all three missions." })).toBeVisible();
    await page.waitForTimeout(500);
    await page.goto("/api/test-login");
    await expect(page.getByRole("region", { name: "Paywall views by source" })).toContainText("path_week");
  });
});

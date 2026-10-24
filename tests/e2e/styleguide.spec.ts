import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("style guide", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/styleguide");
  });

  test("fits a 390px phone without sideways scrolling", async ({ page }) => {
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(width).toBeLessThanOrEqual(390);
  });

  test("marking a mission done stamps it, and undo removes the stamp", async ({ page }) => {
    const markDone = page.getByRole("button", {
      name: "Mark done: 20-minute push and pull circuit at home",
    });
    await markDone.click();
    const undo = page.getByRole("button", {
      name: "Undo, mark not done: 20-minute push and pull circuit at home",
    });
    await expect(undo).toBeVisible();
    await undo.click();
    await expect(markDone).toBeVisible();
  });

  test("tapping a ticket opens its sheet, and Escape closes it", async ({ page }) => {
    await page
      .getByRole("button", { name: /Find 3 money leaks in your UPI history.*Open details/ })
      .click();
    const sheet = page.getByRole("dialog", { name: "Find 3 money leaks in your UPI history" });
    await expect(sheet).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
  });

  test("the sheet closes with its Close button", async ({ page }) => {
    await page.getByRole("button", { name: "Open a sheet" }).click();
    const sheet = page.getByRole("dialog", { name: "Skip this mission?" });
    await expect(sheet).toBeVisible();
    await sheet.getByRole("button", { name: "Close" }).click();
    await expect(sheet).toBeHidden();
  });

  test("option tiles report which one is selected", async ({ page }) => {
    const tile = page.getByRole("button", { name: /Control my money/ });
    await expect(tile).toHaveAttribute("aria-pressed", "false");
    await tile.click();
    await expect(tile).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: /Get my first job/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  test("has no accessibility violations", async ({ page }) => {
    const results = await new AxeBuilder({ page })
      // Disabled examples are meant to look faded; WCAG exempts disabled controls.
      .exclude("button:disabled")
      .analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});

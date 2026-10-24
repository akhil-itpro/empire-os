// Screenshots of the main screens for design reviews. Skipped unless SHOTS_DIR is set:
//   SHOTS_DIR=some/folder npx playwright test tests/e2e/screens.spec.ts
import { test } from "@playwright/test";
import { startSeason, travelDays } from "./helpers";

const dir = process.env.SHOTS_DIR;
test.skip(!dir, "Set SHOTS_DIR to save screenshots.");

test("HQ through a day", async ({ page, context }) => {
  await startSeason(page);
  await page.screenshot({ path: `${dir}/hq-1-start.png`, fullPage: true });
  await page.getByRole("button", { name: /^Mark done:/ }).first().click();
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${dir}/hq-2-one-done.png`, fullPage: true });
  await page.getByRole("button", { name: /Open details/ }).nth(1).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${dir}/hq-3-sheet.png` });
  await page.keyboard.press("Escape");
  for (let i = 0; i < 2; i++) {
    await page.getByRole("button", { name: /^Mark done:/ }).first().click();
    await page.waitForTimeout(500);
  }
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${dir}/hq-4-day-complete.png`, fullPage: true });
  await travelDays(context, 8);
  await page.goto("/hq");
  await page.screenshot({ path: `${dir}/hq-5-free.png`, fullPage: true });
});

test("Path, Stats and Me", async ({ page }) => {
  await startSeason(page);
  for (let i = 0; i < 2; i++) {
    await page.getByRole("button", { name: /^Mark done:/ }).first().click();
    await page.waitForTimeout(600);
  }
  for (const route of ["path", "stats", "me"]) {
    await page.goto(`/${route}`);
    await page.screenshot({ path: `${dir}/${route}.png`, fullPage: true });
  }
});

// Screenshots of the main screens for design reviews. Skipped unless SHOTS_DIR is set:
//   SHOTS_DIR=some/folder npx playwright test tests/e2e/screens.spec.ts
import { expect, test } from "@playwright/test";
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
  await page.waitForURL(/\/pass/);
  await page.getByRole("heading", { name: "Keep all three missions." }).waitFor();
  await page.screenshot({ path: `${dir}/pass.png`, fullPage: true });
  await page.getByRole("link", { name: "Maybe later" }).click();
  await page.waitForURL(/\/hq$/);
  await page.screenshot({ path: `${dir}/hq-5-free.png`, fullPage: true });
  await page.goto("/path");
  await page.screenshot({ path: `${dir}/path-free.png`, fullPage: true });
});

test("Path, Stats and Me", async ({ page }) => {
  await startSeason(page);
  for (let i = 0; i < 2; i++) {
    await page.getByRole("button", { name: /^Mark done:/ }).first().click();
    await page.waitForTimeout(600);
  }
  for (const route of ["path", "stats", "me"]) {
    await page.goto(`/${route}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${dir}/${route}.png`, fullPage: true });
    if (route === "path") await page.screenshot({ path: `${dir}/path-viewport.png` });
  }
});

test("College HQ (sample batch) at laptop and phone width", async ({ page }) => {
  await page.goto("/api/test-login");
  await page.getByRole("button", { name: "Create a sample batch" }).click();
  await expect(page.getByText(/Sample batch created/)).toBeVisible();
  // Other scenarios can create samples in the shared store. This list is
  // scoped to the current founder's memberships, so the link is theirs.
  await page.goto("/college/batches");
  await page.getByRole("link", { name: "Open overview", exact: true }).click();
  await page.getByRole("heading", { name: "CSE 2027 batch", level: 1 }).waitFor();
  const overview = page.url();
  await page.setViewportSize({ width: 1280, height: 980 });
  await page.screenshot({ path: `${dir}/college-overview-laptop.png`, fullPage: true });
  await page.getByRole("button", { name: /active,/ }).last().hover();
  await page.screenshot({ path: `${dir}/college-tooltip.png` });
  await page.goto(`${overview}/report`);
  await page.getByRole("button", { name: "Save as PDF" }).waitFor();
  await page.screenshot({ path: `${dir}/college-report.png`, fullPage: true });
  await page.goto(`${overview}/poster`);
  await page.getByRole("img", { name: /QR code/ }).waitFor();
  await page.screenshot({ path: `${dir}/college-poster.png`, fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(overview);
  await page.getByRole("heading", { name: "Sections this week" }).waitFor();
  await page.screenshot({ path: `${dir}/college-overview-phone.png`, fullPage: true });
});

test("War Room form and results", async ({ page, context }) => {
  await startSeason(page);
  await travelDays(context, 6);
  await page.goto("/war-room");
  await page.getByRole("button", { name: "Set next week" }).waitFor();
  await page.getByRole("button", { name: "Too hard" }).click();
  await page.getByRole("button", { name: "Energy" }).click();
  await page.getByRole("button", { name: "My goal" }).click();
  await page.screenshot({ path: `${dir}/war-room-form.png`, fullPage: true });
  await page.screenshot({ path: `${dir}/war-room-viewport.png` });
  await page.getByRole("button", { name: /Get fit and strong/ }).click();
  await page.getByRole("button", { name: "Set next week" }).click();
  await page.getByRole("heading", { name: "Apply new plan?" }).waitFor();
  await page.screenshot({ path: `${dir}/war-room-results.png`, fullPage: true });
});

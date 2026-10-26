// Real College HQ screens (sample batch, labelled "Sample data") for the /colleges page.
// Skipped unless MARKETING_SHOTS=1:
//   MARKETING_SHOTS=1 npx playwright test tests/e2e/marketing-shots.spec.ts
import { test } from "@playwright/test";

test.skip(process.env.MARKETING_SHOTS !== "1", "Set MARKETING_SHOTS=1 to refresh the /colleges screenshots.");

test("College HQ screens for /colleges", async ({ page }) => {
  await page.goto("/api/test-login");
  await page.getByRole("button", { name: "Create a sample batch" }).click();
  await page.getByRole("link", { name: "Open the demo" }).last().click();
  await page.getByRole("heading", { name: "Sections this week" }).waitFor();
  const overview = page.url();

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.screenshot({ caret: "initial", path: "public/colleges/college-hq-laptop.png", scale: "css" });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(overview);
  await page.getByRole("heading", { name: "Need a nudge" }).scrollIntoViewIfNeeded();
  await page.getByRole("region", { name: "Need a nudge" }).screenshot({ caret: "initial", path: "public/colleges/college-hq-nudge.png", scale: "css" });

  await page.setViewportSize({ width: 900, height: 1100 });
  await page.goto(`${overview}/report`);
  await page.getByRole("article", { name: "Weekly report" }).screenshot({ caret: "initial", path: "public/colleges/college-hq-report.png", scale: "css" });
});

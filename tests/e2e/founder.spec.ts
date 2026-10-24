import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { startSeason } from "./helpers";

test.describe("Founder HQ", () => {
  test("a normal student sees nothing at /founder", async ({ page }) => {
    await startSeason(page);
    await page.goto("/founder");
    await expect(page.getByText(/could not be found|not found/i).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Founder HQ" })).toHaveCount(0);
    await expect(page.getByText("Launch checklist")).toHaveCount(0);
  });

  test("the founder sees the cards and can tick the launch checklist", async ({ page }) => {
    await page.goto("/api/test-login");
    await expect(page.getByRole("heading", { name: "Founder HQ" })).toBeVisible();
    for (const title of ["Sign-ups per day", "Funnel", "Return", "Missions done by pillar", "Launch checklist"]) {
      await expect(page.getByRole("region", { name: title })).toBeVisible();
    }
    const item = page.getByLabel("Data export and account delete work");
    await page.getByText("Data export and account delete work").click();
    await expect(item).toBeChecked();
    await page.reload();
    await expect(page.getByLabel("Data export and account delete work")).toBeChecked();
    await page.getByRole("link", { name: "Last 7 days" }).click();
    await expect(page).toHaveURL(/range=7/);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.map((v) => `${v.id} (${v.nodes[0]?.target})`)).toEqual([]);
  });
});

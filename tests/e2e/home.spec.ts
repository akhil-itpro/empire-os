import { expect, test } from "@playwright/test";

test("home page shows the EMPIRE OS wordmark", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "EMPIRE OS" }),
  ).toBeVisible();
});

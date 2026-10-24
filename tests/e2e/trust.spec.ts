import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { startSeason } from "./helpers";

test.describe("trust layer", () => {
  test("Privacy Policy and Terms are linked from the landing page and marked as drafts", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("navigation", { name: "Legal" }).getByRole("link", { name: "Privacy" }).click();
    await expect(page.getByRole("heading", { name: "Privacy Policy" })).toBeVisible();
    await expect(page.getByText("Draft, pending legal review.")).toBeVisible();
    await expect(page.getByText("[GRIEVANCE CONTACT]").first()).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.map((v) => v.id)).toEqual([]);
    await page.goto("/terms");
    await expect(page.getByText("[REFUND POLICY]")).toBeVisible();
  });

  test("Download my data returns everything linked to the student", async ({ page }) => {
    await startSeason(page);
    await page.getByRole("button", { name: /^Mark done:/ }).first().click();
    await expect(page.getByText("1 of 3 done")).toBeVisible();
    const res = await page.request.get("/me/data/export");
    expect(res.ok()).toBe(true);
    expect(res.headers()["content-disposition"]).toContain("attachment");
    const data = await res.json();
    expect(data.profile.firstName).toBe("Rahul");
    expect(data.missions).toHaveLength(3);
    expect(data.xp.length).toBeGreaterThan(0);
  });

  test("the export refuses anyone who isn't signed in", async ({ request }) => {
    const res = await request.get("/me/data/export");
    expect(res.status()).toBe(401);
  });

  test("Delete my account needs DELETE, removes everything and signs out", async ({ page }) => {
    await startSeason(page);
    await page.goto("/me/data");
    const button = page.getByRole("button", { name: "Delete my account" });
    await page.getByLabel("Type DELETE").fill("delete");
    await expect(button).toBeDisabled();
    await page.getByLabel("Type DELETE").fill("DELETE");
    await button.click();
    await expect(page.getByRole("heading", { name: "Your account is deleted." })).toBeVisible();
    await page.goto("/hq");
    await expect(page).toHaveURL(/\/login/);
  });

  test("a script in the journal shows as plain text, and very long text is refused", async ({ page }) => {
    let dialog = false;
    page.on("dialog", (d) => {
      dialog = true;
      void d.dismiss();
    });
    await startSeason(page);
    await page.goto("/me");
    const box = page.getByRole("textbox", { name: "One line for today" });
    await box.fill("<script>alert(1)</script>");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText("Saved.")).toBeVisible();
    await page.reload();
    await expect(box).toHaveValue("<script>alert(1)</script>");
    expect(dialog).toBe(false);

    // The box stops at 280 characters; the server refuses anything longer.
    await box.fill("x".repeat(10_000));
    await expect(box).toHaveValue("x".repeat(280));
  });

  test("a script as a first name is refused by the quiz", async ({ page }) => {
    await page.goto("/quiz");
    await page.getByRole("button", { name: "21–24", exact: true }).click();
    await page.getByLabel("First name").fill("<script>alert(1)</script>");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("Use letters only.")).toBeVisible();
  });
});

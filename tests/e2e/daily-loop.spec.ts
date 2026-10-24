import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { startSeason, travelDays } from "./helpers";

test.describe("the daily loop", () => {
  let errors: string[] = [];
  test.beforeEach(({ page }) => {
    errors = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(String(e)));
  });
  test.afterEach(() => expect(errors).toEqual([]));

  test("HQ opens with mission 1 highlighted and three missions", async ({ page }) => {
    await startSeason(page);
    await expect(page).toHaveURL(/\/hq\?first=1/);
    await expect(page.getByText("Do this one now. It takes 5 minutes.")).toBeVisible();
    await expect(page.getByRole("button", { name: /^Mark done:/ })).toHaveCount(3);
    await expect(page.getByText("Day 1", { exact: true })).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes[0]?.target})`)).toEqual([]);
  });

  test("completing three missions stamps them, adds the day bonus, and survives a refresh", async ({ page }) => {
    await startSeason(page);
    const ticketXp = await page.locator("main li").getByText(/^\+\d+$/).allTextContents();
    const expected = ticketXp.reduce((sum, t) => sum + Number(t.slice(1)), 0) + 30;
    for (let i = 0; i < 3; i++) {
      await page.getByRole("button", { name: /^Mark done:/ }).first().click();
      await expect(page.getByText(`${i + 1} of 3 done`)).toBeVisible();
    }
    await expect(page.getByText("Day complete. Bonus +30 XP.")).toBeVisible();
    await expect(page.getByText(/Tomorrow starts with:/)).toBeVisible();
    // Close the one-time install tip if it appeared.
    const gotIt = page.getByRole("button", { name: "Got it" });
    if (await gotIt.isVisible().catch(() => false)) await gotIt.click();

    await page.reload();
    await expect(page.getByText("3 of 3 done")).toBeVisible();
    await expect(page.getByText("Day complete. Bonus +30 XP.")).toBeVisible();
    await expect(page.getByText(/^\d[\d,]* XP$/).first()).toHaveText(`${expected} XP`);
    await expect(page.getByRole("button", { name: /Undo, mark not done/ })).toHaveCount(3);
  });

  test("the next day brings fresh missions with no duplicates, and the streak grows", async ({ page, context }) => {
    await startSeason(page);
    const day1 = await page.getByRole("button", { name: /^Mark done:/ }).evaluateAll((els) =>
      els.map((e) => e.getAttribute("aria-label")!.replace("Mark done: ", "")),
    );
    await page.getByRole("button", { name: /^Mark done:/ }).first().click();
    await expect(page.getByText("1 of 3 done")).toBeVisible();

    await travelDays(context, 1);
    await page.goto("/hq");
    await expect(page.getByText("Day 2", { exact: true })).toBeVisible();
    const day2 = await page.getByRole("button", { name: /^Mark done:/ }).evaluateAll((els) =>
      els.map((e) => e.getAttribute("aria-label")!.replace("Mark done: ", "")),
    );
    expect(day2).toHaveLength(3);
    expect(new Set(day2).size).toBe(3);
    for (const title of day2) expect(day1).not.toContain(title);

    await page.getByRole("button", { name: /^Mark done:/ }).first().click();
    await expect(page.getByText("1 of 3 done")).toBeVisible();
    await expect(page.getByText(/^2 day streak$/)).toBeAttached();
  });

  test("a 3-day streak gets its full-screen moment", async ({ page, context }) => {
    await startSeason(page);
    for (const day of [0, 1, 2]) {
      if (day > 0) {
        await travelDays(context, day);
        await page.goto("/hq");
      }
      await page.getByRole("button", { name: /^Mark done:/ }).first().click();
      await expect(page.getByText("1 of 3 done")).toBeVisible();
    }
    const moment = page.getByRole("dialog", { name: "3-day streak." });
    await expect(moment).toBeVisible();
    await expect(moment.getByText("Three days in a row. The habit is starting.")).toBeVisible();
    await moment.getByRole("button", { name: "Keep going" }).click();
    await expect(moment).toBeHidden();
  });

  test("a missed day resets the streak with the gentle message", async ({ page, context }) => {
    await startSeason(page);
    await page.getByRole("button", { name: /^Mark done:/ }).first().click();
    await expect(page.getByText("1 of 3 done")).toBeVisible();
    await travelDays(context, 2);
    await page.goto("/hq");
    await expect(page.getByText("Day 3", { exact: true })).toBeVisible();
    await expect(page.getByText("Streak paused. Your XP and rank are safe. Go again today.")).toBeVisible();
    await expect(page.getByText(/^0 day streak$/)).toBeAttached();
  });

  test("a mission can be swapped once a day and skipped with a reason", async ({ page }) => {
    await startSeason(page);
    const titles = await page.getByRole("button", { name: /^Mark done:/ }).evaluateAll((els) =>
      els.map((e) => e.getAttribute("aria-label")!.replace("Mark done: ", "")),
    );
    await page.getByRole("button", { name: new RegExp(`${titles[1]}.*Open details`) }).click();
    await page.getByRole("button", { name: "Swap for another mission" }).click();
    await expect(page.getByText("Swapped. Here's a new one.")).toBeVisible();
    await expect(page.getByRole("button", { name: `Mark done: ${titles[1]}` })).toHaveCount(0);

    const after = await page.getByRole("button", { name: /^Mark done:/ }).evaluateAll((els) =>
      els.map((e) => e.getAttribute("aria-label")!.replace("Mark done: ", "")),
    );
    await page.getByRole("button", { name: new RegExp(`${after[0]}.*Open details`) }).click();
    await expect(page.getByRole("button", { name: "Swap used today" })).toBeDisabled();
    await page.getByRole("button", { name: "Skip" }).click();
    await page.getByRole("button", { name: "Too hard" }).click();
    await expect(page.getByText("Skipped. No guilt. Do the others if you can.")).toBeVisible();
    await expect(page.getByText("Skipped", { exact: true })).toBeVisible();
  });

  test("after the free week, a student picks one pillar for one mission", async ({ page, context }) => {
    await startSeason(page);
    await travelDays(context, 8);
    await page.goto("/hq");
    // The first visit after the free week opens Season Pass once; "Maybe later" goes back.
    await page.waitForURL(/\/pass\?from=trial_end/);
    await page.getByRole("link", { name: "Maybe later" }).click();
    await page.waitForURL(/\/hq$/);
    await expect(page.getByRole("main").getByText(/Your free week is over. Free stays free with one mission a day./)).toBeVisible();
    await page.getByRole("button", { name: "Money" }).click();
    await expect(page.getByRole("button", { name: /^Mark done:/ })).toHaveCount(1);
    await expect(page.getByText("0 of 1 done")).toBeVisible();
  });
});

import { writeFileSync } from "node:fs";
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

/** Reads a PNG's width and height from its header. */
function pngSize(body: Buffer) {
  return { width: body.readUInt32BE(16), height: body.readUInt32BE(20) };
}

/** Stands in for the phone's share sheet and records the file it was given. */
async function stubShareSheet(page: Page, canShareFiles: boolean) {
  await page.addInitScript((can) => {
    const w = window as unknown as { sharedFile?: string };
    navigator.canShare = () => can;
    navigator.share = async (data?: ShareData) => {
      w.sharedFile = data?.files?.[0]?.name;
    };
  }, canShareFiles);
}

/** Closes any milestone moment, and the one-time home-screen tip. */
async function closeMoments(page: Page) {
  const close = page.getByRole("button", { name: /^(Keep going|Got it)$/ });
  while (await close.first().isVisible().catch(() => false)) {
    await close.first().click();
    await page.waitForTimeout(200);
  }
}

test.describe("share cards", () => {
  let errors: string[] = [];
  test.beforeEach(({ page }) => {
    errors = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(String(e)));
  });
  test.afterEach(() => expect(errors).toEqual([]));

  test("the archetype card shares through the phone's share sheet, with initials by default", async ({ page }) => {
    await stubShareSheet(page, true);
    await startSeason(page);
    await page.goto("/me");
    await page.getByRole("button", { name: "I'm The Grinder card" }).click();
    const preview = page.getByRole("img", { name: "Your share card: I'm The Grinder" });
    await expect(preview).toBeVisible();
    expect(await preview.evaluate((img: HTMLImageElement) => [img.naturalWidth, img.naturalHeight])).toEqual([1080, 1920]);
    await expect(page.getByRole("radio", { name: "Initials (R.)" })).toBeChecked();
    await noA11yViolations(page);
    await page.getByRole("button", { name: "Share card" }).click();
    await expect.poll(() => page.evaluate(() => (window as unknown as { sharedFile?: string }).sharedFile)).toBe("empire-os-archetype.png");
  });

  test("without file sharing it falls back to saving the image, and the name choice sticks", async ({ page }) => {
    await stubShareSheet(page, false);
    await startSeason(page);
    await page.goto("/me");
    await page.getByRole("button", { name: "I'm The Grinder card" }).click();
    await page.getByText("First name (Rahul)").click();
    await expect(page.getByRole("radio", { name: "First name (Rahul)" })).toBeChecked();
    await expect(page.getByRole("img", { name: /Your share card/ })).toBeVisible();
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Share card" }).click();
    expect((await download).suggestedFilename()).toBe("empire-os-archetype.png");
    await expect(page.getByText("Saved. Post it from your photos.")).toBeVisible();
    await page.reload();
    await page.getByRole("button", { name: "I'm The Grinder card" }).click();
    await expect(page.getByRole("radio", { name: "First name (Rahul)" })).toBeChecked();
  });

  test("cards that aren't earned can't be made, and nobody else can make yours", async ({ page, browser }) => {
    await startSeason(page);
    expect((await page.request.get("/api/share/streak-30")).status()).toBe(404);
    expect((await page.request.get("/api/share/season")).status()).toBe(404);
    const stranger = await browser.newContext();
    expect((await stranger.request.get("http://localhost:3100/api/share/archetype")).status()).toBe(401);
    await stranger.close();
  });

  test("a student who plays the season can share all four card types", async ({ page, context }) => {
    test.setTimeout(180_000);
    await stubShareSheet(page, true);
    await startSeason(page);
    for (let day = 0; day < 7; day++) {
      await travelDays(context, day);
      await page.goto("/hq");
      await expect(page.getByRole("heading", { name: "Today's missions" })).toBeVisible();
      for (let i = 0; i < 3; i++) {
        await closeMoments(page);
        // Wait for the server's answer: a rank-up or streak moment arrives with it.
        const answered = page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/hq"));
        await page.getByRole("button", { name: /^Mark done:/ }).first().click({ timeout: 10_000 });
        await answered;
        await expect(page.getByText(`${i + 1} of 3 done`)).toBeVisible();
        await page.waitForTimeout(300);
        if (day === 6 && i === 0) {
          // Day 7's first mission brings the 7-day streak moment; its Share opens the image card.
          await expect(page.getByRole("heading", { name: "7-day streak." })).toBeVisible();
          await page.getByRole("button", { name: "Share", exact: true }).click();
          await expect(page.getByRole("img", { name: "Your share card: 7-day streak" })).toBeVisible();
          await page.getByRole("button", { name: "Close" }).click();
        }
      }
      await closeMoments(page);
    }

    await travelDays(context, 89);
    await page.goto("/me");
    const list = page.getByRole("region", { name: "Share cards" });
    for (const label of ["I'm The Grinder", /^Rank: /, "7-day streak", "Season 1 complete"]) {
      await list.getByRole("button", { name: label }).click();
      const preview = page.getByRole("img", { name: /^Your share card:/ });
      await expect(preview).toBeVisible();
      expect(await preview.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(1080);
      await page.getByRole("button", { name: "Close" }).click();
    }
    for (const kind of ["archetype", "rank", "streak-7", "season"]) {
      const res = await page.request.get(`/api/share/${kind}`);
      expect(res.headers()["content-type"]).toBe("image/png");
      expect(pngSize(await res.body())).toEqual({ width: 1080, height: 1920 });
      // For design reviews: SHOTS_DIR=some/folder saves each card.
      if (process.env.SHOTS_DIR) writeFileSync(`${process.env.SHOTS_DIR}/card-${kind}.png`, await res.body());
    }
  });
});

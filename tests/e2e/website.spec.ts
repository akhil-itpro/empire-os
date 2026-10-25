import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function noA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes[0]?.target})`)).toEqual([]);
}

async function noSidewaysScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

test.describe("the website", () => {
  let errors: string[] = [];
  test.beforeEach(({ page }) => {
    errors = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(String(e)));
  });
  test.afterEach(() => expect(errors).toEqual([]));

  test("/colleges shows real screens, honest prices and saves a demo request", async ({ page, browser }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "See College HQ" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("See who's preparing every day, not just on drive day.");
    await expect(page).toHaveTitle("College HQ for training and placement cells | EMPIRE OS");
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /\/colleges\/opengraph-image/);
    await expect(page.getByRole("img", { name: /College HQ overview with sample data/ })).toBeVisible();
    await expect(page.getByText("₹15,000")).toBeVisible();
    await expect(page.getByText(/we don't promise placement results/)).toBeVisible();
    await noSidewaysScroll(page);
    await noA11yViolations(page);

    await page.getByRole("link", { name: "Book a 20-minute demo" }).click();
    await page.getByLabel("Your name").fill("Anita Rao");
    await page.getByLabel("Your role").selectOption("tpo");
    await page.getByLabel("College").fill("Test Institute of Engineering");
    await page.getByLabel("City").fill("Pune");
    const email = `anita.${Date.now()}@example.edu`;
    await page.getByLabel("Work email").fill(email);
    await page.getByLabel("Students in your final-year batch").selectOption("100_300");
    await page.getByRole("button", { name: "Book a 20-minute demo" }).click();
    await expect(page.getByText("Thanks, Anita.")).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();

    // The founder sees it, and the colleges page visit.
    const founder = await (await browser.newContext()).newPage();
    await founder.goto("/api/test-login");
    const demos = founder.getByRole("region", { name: "Demo requests" });
    await expect(demos.getByText("Anita Rao, Training and placement officer")).toBeVisible();
    await expect(demos.getByText(email)).toBeVisible();
    const website = founder.getByRole("region", { name: "Website" });
    await expect(website.getByText("Colleges page visitors")).toBeVisible();
    await founder.context().close();
  });

  test("guides read well on a phone and lead to the quiz", async ({ page }) => {
    await page.goto("/guides");
    await page.getByRole("link", { name: /90-day placement preparation plan/ }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("A 90-day placement preparation plan for final-year students");
    await expect(page.getByRole("heading", { name: "Weeks 5 to 8: execution" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Find your archetype" })).toHaveAttribute("href", "/quiz");
    await noSidewaysScroll(page);
    await noA11yViolations(page);
    await page.goto("/guides/no-gym-home-workout-plan-for-students");
    await expect(page.getByText(/Check with a doctor first if you have a health condition/)).toBeVisible();
    expect((await page.request.get("/guides/not-a-guide")).status()).toBe(404);
  });

  test("search engines get a sitemap, robots rules and share images", async ({ request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();
    for (const path of ["/colleges", "/guides/90-day-placement-preparation-plan", "/guides/no-gym-home-workout-plan-for-students"]) {
      expect(sitemap).toContain(path);
    }
    expect(sitemap).not.toContain("/hq");
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /college/");
    expect(robots).toContain("Disallow: /founder");
    expect(robots).not.toMatch(/Disallow: \/colleges/);
    // Each page's share image, at the exact address its meta tag gives, as WhatsApp's
    // link preview sees it (link-preview bots get the tags in the first response).
    for (const page of ["/", "/colleges", "/guides/90-day-placement-preparation-plan"]) {
      const asWhatsApp = { headers: { "user-agent": "WhatsApp/2.24.1 A" } };
      await request.get(page, asWhatsApp); // the dev server builds the page on its first visit
      const html = await (await request.get(page, asWhatsApp)).text();
      const image = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
      expect(image, page).toBeTruthy();
      const res = await request.get(new URL(image!).pathname + new URL(image!).search);
      expect(res.status(), image).toBe(200);
      expect(res.headers()["content-type"]).toBe("image/png");
    }
  });
});

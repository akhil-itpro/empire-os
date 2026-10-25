import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { startSeason, travelDays } from "./helpers";

async function noA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes[0]?.target})`)).toEqual([]);
}

/** Today in India, plus some days, as YYYY-MM-DD. */
function indiaDate(days = 0) {
  return new Date(Date.now() + 5.5 * 3_600_000 + days * 86_400_000).toISOString().slice(0, 10);
}

function watchErrors(page: Page, errors: string[]) {
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));
}

test.describe("College HQ", () => {
  test("founder sets up a college, a student joins with consent, the TPO sees and nudges them, the student leaves", async ({
    browser,
  }) => {
    test.setTimeout(120_000);
    const errors: string[] = [];
    const collegeName = `Test College ${Date.now()}`;

    // The founder adds a college, a paid batch and a TPO invite.
    const founderContext = await browser.newContext();
    const founder = await founderContext.newPage();
    watchErrors(founder, errors);
    await founder.goto("/api/test-login");
    await expect(founder.getByRole("heading", { name: "Founder HQ" })).toBeVisible();
    const addCollege = founder.getByRole("form", { name: "Add a college" });
    await addCollege.getByLabel("College name").fill(collegeName);
    await addCollege.getByLabel("City (optional)").fill("Pune");
    await addCollege.getByRole("button", { name: "Add college" }).click();
    await expect(founder.getByText("College added.")).toBeVisible();

    const addBatch = founder.getByRole("form", { name: "Add a batch" });
    await addBatch.getByLabel("College").selectOption({ label: collegeName });
    await addBatch.getByLabel("Batch name").fill("CSE 2027 batch");
    await addBatch.getByLabel("Season starts").fill(indiaDate(-5));
    await addBatch.getByLabel("Season ends").fill(indiaDate(60));
    await addBatch.getByLabel(/Sections/).fill("CSE-A, CSE-B");
    await addBatch.getByLabel(/Paid batch/).check();
    await addBatch.getByRole("button", { name: "Add batch" }).click();
    await expect(founder.getByText(/Batch added/)).toBeVisible();
    const batchLine = founder.getByRole("listitem").filter({ hasText: "CSE 2027 batch" }).filter({ hasText: "0 joined" }).last();
    const code = (await batchLine.textContent())!.match(/code ([A-Z0-9]{8})/)![1];

    const inviteForm = founder.getByRole("form", { name: "Invite a TPO" });
    await inviteForm.getByLabel("College").selectOption({ label: collegeName });
    await inviteForm.getByRole("button", { name: "Create invite link" }).click();
    const inviteLink = (await founder.getByTestId("tpo-invite-link").textContent())!.trim();
    expect(inviteLink).toMatch(/\/college\/invite\/[A-Za-z0-9_-]+$/);

    // A student joins from Me with the code, after seeing exactly what is shared.
    const studentContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const student = await studentContext.newPage();
    watchErrors(student, errors);
    await startSeason(student);
    await student.goto("/me");
    await student.getByLabel("Batch code").fill(code.toLowerCase());
    await student.getByRole("button", { name: "Continue" }).click();
    await expect(student.getByRole("heading", { name: "Join the CSE 2027 batch season" })).toBeVisible();
    await expect(
      student.getByText(
        `Your mission progress (not your journal or quiz answers) will be shared with ${collegeName} training and placement cell. You can leave any time; your account stays.`,
      ),
    ).toBeVisible();
    await expect(student.getByRole("link", { name: "Maybe later" })).toBeVisible();
    await noA11yViolations(student);
    await student.getByRole("button", { name: "Join and share my progress" }).click();
    await expect(student.getByRole("main").getByRole("alert")).toHaveText("Pick your section.");
    await student.getByLabel("Your section").selectOption("CSE-B");
    await student.getByLabel(/Initial of your last name/).fill("k");
    await expect(student.getByText("They'll see you as Rahul K.")).toBeVisible();
    const joined = student.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/me/college"));
    await student.getByRole("button", { name: "Join and share my progress" }).click();
    await joined;
    await student.waitForURL(/\/me$/);
    await expect(student.getByText(`CSE 2027 batch, ${collegeName}`)).toBeVisible();
    await expect(student.getByRole("heading", { name: "Season Pass from your college" })).toBeVisible();

    // The TPO accepts the invite and sees the student in College HQ.
    const tpoContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const tpo = await tpoContext.newPage();
    watchErrors(tpo, errors);
    await tpo.goto(inviteLink);
    await tpo.getByRole("button", { name: "Test sign-in (local test mode)" }).click();
    await tpo.getByRole("button", { name: "Accept and open College HQ" }).click();
    await expect(tpo.getByRole("heading", { name: "CSE 2027 batch", level: 1 })).toBeVisible();
    const overviewUrl = tpo.url();
    await expect(tpo.getByText("Week 1 of 10. 1 student joined with your batch code.")).toBeVisible();
    await expect(tpo.getByText(`${collegeName}`).first()).toBeVisible();
    for (const label of ["Active this week", "Missions per student", "Need a nudge", "Mock interviews done"]) {
      await expect(tpo.getByText(label, { exact: true }).first()).toBeVisible();
    }
    await expect(tpo.getByRole("button", { name: "Table" })).toBeVisible();
    await tpo.getByRole("button", { name: "Table" }).click();
    await expect(tpo.getByRole("columnheader", { name: "Students active" })).toBeVisible();
    await tpo.getByRole("link", { name: "Last 7 days" }).click();
    await expect(tpo).toHaveURL(/range=7/);
    await tpo.getByLabel("Section", { exact: true }).selectOption("CSE-B");
    await expect(tpo).toHaveURL(/section=CSE-B/);
    await noA11yViolations(tpo);

    // Four days later the student hasn't done a mission since joining: the TPO sends a reminder.
    await travelDays(tpoContext, 4);
    await tpo.goto(overviewUrl);
    const nudgeList = tpo.getByRole("region", { name: "Need a nudge" });
    await expect(nudgeList.getByText("Rahul K.")).toBeVisible();
    await expect(nudgeList.getByText("CSE-B, missed 4 days")).toBeVisible();
    await nudgeList.getByRole("button", { name: "Send reminder" }).click();
    await expect(nudgeList.getByRole("button", { name: "Reminder sent today" })).toBeDisabled();

    // The weekly report and the poster.
    await tpo.getByRole("link", { name: "Download weekly report" }).click();
    await expect(tpo.getByRole("button", { name: "Save as PDF" })).toBeVisible();
    await expect(tpo.getByRole("article", { name: "Weekly report" })).toContainText("Most consistent this week");
    await noA11yViolations(tpo);
    await tpo.goto(overviewUrl.replace(/\?.*$/, "") + "/poster");
    await expect(tpo.getByRole("img", { name: /QR code for .*\/join\// })).toBeVisible();
    await expect(tpo.getByText(code, { exact: true })).toBeVisible();

    // The student sees the reminder once, and can dismiss it.
    await travelDays(studentContext, 4);
    await student.goto("/hq");
    const reminder = student.getByRole("complementary", { name: `Reminder from ${collegeName}` });
    await expect(reminder).toContainText("One mission today is enough to get back in.");
    await reminder.getByRole("button", { name: "Dismiss the reminder" }).click();
    await expect(reminder).toHaveCount(0);

    // A student can't open College HQ pages.
    await student.goto(overviewUrl);
    await expect(student.getByText(/could not be found|not found/i).first()).toBeVisible();

    // Leaving: the college stops seeing the student.
    await student.goto("/me");
    await student.getByRole("button", { name: "Leave this batch" }).click();
    const left = student.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/me"));
    await student.getByRole("button", { name: "Leave the batch" }).click();
    await left;
    await expect(student.getByLabel("Batch code")).toBeVisible();
    await tpo.goto(overviewUrl);
    await expect(tpo.getByRole("heading", { name: "No students yet" })).toBeVisible();

    expect(errors).toEqual([]);
    await Promise.all([founderContext.close(), studentContext.close(), tpoContext.close()]);
  });

  test("the founder's sample batch is labelled and full of generated students", async ({ page }) => {
    await page.goto("/api/test-login");
    await page.getByRole("button", { name: "Create a sample batch" }).click();
    await expect(page.getByText(/Sample batch created/)).toBeVisible();
    await page.getByRole("link", { name: "Open the demo" }).last().click();
    await expect(page.getByRole("heading", { name: "CSE 2027 batch", level: 1 })).toBeVisible();
    await expect(page.getByText("Sample data").first()).toBeVisible();
    await expect(page.getByText(/Week 4 of 13\. 264 students joined/)).toBeVisible();
    await expect(page.getByRole("link", { name: /See all \d+ students/ })).toBeVisible();
    await noA11yViolations(page);
  });

  test("a join link for someone new remembers the code until they have an account", async ({ page }) => {
    await page.goto("/join/NOPE1234");
    await expect(page.getByRole("heading", { name: "This link doesn't open a batch." })).toBeVisible();
    await page.goto("/college");
    await expect(page.getByRole("heading", { name: "College HQ" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Test sign-in (local test mode)" })).toBeVisible();
  });
});

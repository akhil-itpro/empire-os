import { createHmac } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { startSeason, travelDays } from "./helpers";

// Live payments through the stand-in Razorpay of local test mode (the cookie turns it on).
test.describe("Season Pass checkout", () => {
  let errors: string[] = [];
  test.beforeEach(({ page }) => {
    errors = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(String(e)));
  });
  test.afterEach(() => expect(errors).toEqual([]));

  test("closed checkout and a failed payment charge nothing; a real payment unlocks the pass once", async ({ page, context }) => {
    test.setTimeout(90_000);
    await startSeason(page);
    await context.addCookies([{ name: "empire_test_payments", value: "1", url: "http://localhost:3100" }]);
    await travelDays(context, 8);
    await page.goto("/pass?from=me");

    const buy = page.getByRole("button", { name: "Get Season Pass for ₹299" });
    await expect(buy).toBeVisible();
    await expect(page.getByText(/₹299, paid once by UPI or card through Razorpay\. Season Pass lasts 90 days and doesn't renew\./)).toBeVisible();
    await expect(page.getByRole("link", { name: "refund policy" })).toHaveAttribute("href", "/terms#refunds");
    await expect(page.getByRole("link", { name: "Maybe later" })).toBeVisible();
    const a11y = await new AxeBuilder({ page }).analyze();
    expect(a11y.violations.map((v) => `${v.id} (${v.nodes[0]?.target})`)).toEqual([]);

    const checkout = page.getByRole("dialog", { name: "Test checkout" });
    await buy.click();
    await checkout.getByRole("button", { name: "Close checkout" }).click();
    await expect(page.getByText("Checkout closed. You haven't been charged.")).toBeVisible();

    await buy.click();
    await checkout.getByRole("button", { name: "Payment fails" }).click();
    await expect(page.getByText(/The payment didn't go through\. You haven't been charged\./)).toBeVisible();

    await buy.click();
    const confirmed = page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/pass"));
    await checkout.getByRole("button", { name: "Pay ₹299" }).click();
    await confirmed;
    await expect(page.getByRole("heading", { name: "You have Season Pass." })).toBeVisible();

    // A repeated webhook for the same payment grants nothing more.
    await page.goto("/me");
    const receipt = page.getByRole("region", { name: "Receipts" }).getByRole("listitem");
    await expect(receipt).toHaveCount(1);
    await expect(receipt).toContainText("Season Pass, 90 days: ₹299");
    const text = (await receipt.textContent())!;
    const paymentId = text.match(/pay_[A-Za-z0-9]+/)![0];
    const orderId = text.match(/order_[A-Za-z0-9]+/)![0];
    const body = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: paymentId, order_id: orderId } } } });
    const signature = createHmac("sha256", "fake_webhook_secret").update(body).digest("hex");
    const res = await page.request.post("/api/payments/webhook", {
      data: body,
      headers: { "x-razorpay-signature": signature, "content-type": "application/json" },
    });
    expect(await res.json()).toEqual({ ok: true, handled: "already_granted" });
    const forged = await page.request.post("/api/payments/webhook", { data: body, headers: { "x-razorpay-signature": "0".repeat(64) } });
    expect(forged.status()).toBe(400);
    await page.reload();
    await expect(page.getByRole("region", { name: "Receipts" }).getByRole("listitem")).toHaveCount(1);
    await expect(page.getByRole("heading", { name: "Season Pass", exact: true })).toBeVisible();
  });
});

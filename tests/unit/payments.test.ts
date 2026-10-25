import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import type { Answers } from "@/lib/plan-engine/answers";
import {
  checkoutSignatureValid,
  confirmPayment,
  confirmRedirect,
  handleWebhook,
  receipts,
  startCheckout,
  webhookSignatureValid,
} from "@/lib/server/payment-service";
import { loadPass, reservePass } from "@/lib/server/pass-service";
import { FakeGateway } from "@/lib/server/payments-fake";
import { startSeason, type Deps } from "@/lib/server/season-service";
import { MemoryStore } from "@/lib/server/store-memory";

const ASHA = "11111111-1111-4111-8111-111111111111";
const RAVI = "22222222-2222-4222-8222-222222222222";
const START = new Date("2026-11-01T04:30:00Z");
const at = (days: number) => new Date(START.getTime() + days * 86_400_000);

const answers: Answers = {
  firstName: "Asha",
  ageBracket: "21-24",
  city: "hyderabad",
  situation: "student",
  goal: "first_job",
  pillarOrder: ["career", "mind", "body", "money"],
  dailyMinutes: 45,
  budget: "free",
  gym: false,
  laptop: true,
  enemy: "no_plan",
  intensity: "ambitious",
};

let store: MemoryStore;
let gateway: FakeGateway;
const deps = (now = at(8), live = true): Deps => ({ store, now, payments: live ? gateway : null });
const passes = (userId: string) => store.grants.filter((g) => g.userId === userId && g.kind === "season_pass");

async function checkout(userId = ASHA, now = at(8)) {
  const r = await startCheckout(deps(now), userId);
  if (!r.ok) throw new Error(r.message);
  return r.data;
}

beforeEach(async () => {
  store = new MemoryStore();
  gateway = new FakeGateway();
  for (const id of [ASHA, RAVI]) await startSeason(deps(START), id, answers, { timeZone: "Asia/Kolkata" });
});

describe("signatures", () => {
  it("match Razorpay's HMAC-SHA256 and reject anything else", () => {
    const sig = createHmac("sha256", "secret").update("order_ABC123|pay_XYZ789").digest("hex");
    expect(checkoutSignatureValid("secret", "order_ABC123", "pay_XYZ789", sig)).toBe(true);
    expect(checkoutSignatureValid("secret", "order_ABC123", "pay_OTHER1", sig)).toBe(false);
    expect(checkoutSignatureValid("other", "order_ABC123", "pay_XYZ789", sig)).toBe(false);
    expect(checkoutSignatureValid("secret", "order_ABC123", "pay_XYZ789", "short")).toBe(false);
    const body = '{"event":"order.paid"}';
    expect(webhookSignatureValid("wh", body, createHmac("sha256", "wh").update(body).digest("hex"))).toBe(true);
    expect(webhookSignatureValid("wh", `${body} `, createHmac("sha256", "wh").update(body).digest("hex"))).toBe(false);
  });
});

describe("starting checkout", () => {
  it("stays in reserve mode until payments are live", async () => {
    expect((await startCheckout(deps(at(8), false), ASHA)).ok).toBe(false);
    const pass = await loadPass(deps(at(8), false), ASHA);
    expect(pass.ok && pass.data.paymentsLive).toBe(false);
    expect((await reservePass(deps(at(8), true), ASHA, "me")).ok).toBe(false);
  });

  it("makes the order at the server's price and records it", async () => {
    const order = await checkout();
    expect(order).toMatchObject({ amountInr: 299, founderPrice: true, keyId: gateway.keyId });
    expect(gateway.orders.get(order.orderId)?.amount).toBe(29_900);
    expect(store.payments).toMatchObject([{ userId: ASHA, orderId: order.orderId, amountInr: 299, status: "created" }]);
    expect(store.events.some((e) => e.name === "checkout_start")).toBe(true);
  });

  it("charges ₹499 after 500 founder places, but keeps a reserved founder price", async () => {
    await reservePass(deps(at(8), false), RAVI, "me");
    for (let i = 0; i < 500; i++) store.reservations.push({ userId: `x${i}`, priceInr: 299, founderPrice: true, createdAt: START });
    expect((await checkout(ASHA)).amountInr).toBe(499);
    expect((await checkout(RAVI)).amountInr).toBe(299);
  });

  it("doesn't sell a pass to someone who has one", async () => {
    store.grants.push({ userId: ASHA, kind: "season_pass", startsAt: START, endsAt: at(90), source: "test" });
    expect(await startCheckout(deps(), ASHA)).toMatchObject({ ok: false, error: "already_has_pass" });
  });
});

describe("confirming a payment", () => {
  it("grants 90 days of Season Pass once, only after Razorpay confirms it", async () => {
    const { orderId } = await checkout();
    const paid = gateway.pay(orderId, "success")!;
    const input = { orderId, paymentId: paid.paymentId, signature: paid.signature };

    const first = await confirmPayment(deps(), ASHA, input);
    expect(first).toMatchObject({ ok: true, data: { granted: true, until: "2027-02-07" } });
    expect(passes(ASHA)).toHaveLength(1);
    expect(passes(ASHA)[0].endsAt.getTime() - passes(ASHA)[0].startsAt.getTime()).toBe(90 * 86_400_000);
    expect(store.payments[0]).toMatchObject({ status: "paid", paymentId: paid.paymentId });

    // A replay grants nothing more.
    const again = await confirmPayment(deps(), ASHA, input);
    expect(again).toMatchObject({ ok: true, data: { granted: false } });
    expect(passes(ASHA)).toHaveLength(1);
    expect(store.events.filter((e) => e.name === "payment_done")).toHaveLength(1);
    expect(await receipts(store, ASHA, "Asia/Kolkata")).toEqual([
      { orderId, paymentId: paid.paymentId, amountInr: 299, paidOn: "2026-11-09" },
    ]);
  });

  it("refuses a forged signature, someone else's order, or a payment that didn't go through", async () => {
    const { orderId } = await checkout();
    const paid = gateway.pay(orderId, "success")!;
    expect((await confirmPayment(deps(), ASHA, { orderId, paymentId: paid.paymentId, signature: "0".repeat(64) })).ok).toBe(false);
    expect((await confirmPayment(deps(), RAVI, { orderId, paymentId: paid.paymentId, signature: paid.signature })).ok).toBe(false);

    const second = await checkout(RAVI);
    const failed = gateway.pay(second.orderId, "fail")!;
    expect((await confirmPayment(deps(), RAVI, { orderId: second.orderId, paymentId: failed.paymentId, signature: failed.signature })).ok).toBe(false);
    expect(passes(ASHA)).toHaveLength(0);
    expect(passes(RAVI)).toHaveLength(0);
  });

  it("refuses a payment for a different amount than the order the server made", async () => {
    const { orderId } = await checkout();
    const paid = gateway.pay(orderId, "success")!;
    gateway.payments.get(paid.paymentId)!.amount = 100; // ₹1 instead of ₹299
    expect((await confirmPayment(deps(), ASHA, { orderId, paymentId: paid.paymentId, signature: paid.signature })).ok).toBe(false);
    expect(passes(ASHA)).toHaveLength(0);
  });

  it("works through the redirect flow, without a session", async () => {
    const { orderId } = await checkout();
    const paid = gateway.pay(orderId, "success")!;
    const ok = await confirmRedirect(deps(), {
      razorpay_order_id: orderId,
      razorpay_payment_id: paid.paymentId,
      razorpay_signature: paid.signature,
    });
    expect(ok.ok).toBe(true);
    expect(passes(ASHA)).toHaveLength(1);
    expect((await confirmRedirect(deps(), { razorpay_order_id: orderId })).ok).toBe(false);
  });
});

describe("webhooks", () => {
  it("need a valid signature, grant once, and are safe to repeat", async () => {
    const { orderId } = await checkout();
    const paid = gateway.pay(orderId, "success")!;
    const captured = gateway.webhook("payment.captured", orderId, paid.paymentId);
    expect(await handleWebhook(deps(), captured.body, "f".repeat(64))).toEqual({ status: 400, handled: "bad_signature" });
    expect(passes(ASHA)).toHaveLength(0);

    expect(await handleWebhook(deps(), captured.body, captured.signature)).toEqual({ status: 200, handled: "granted" });
    expect(await handleWebhook(deps(), captured.body, captured.signature)).toEqual({ status: 200, handled: "already_granted" });
    const orderPaid = gateway.webhook("order.paid", orderId, paid.paymentId);
    expect(await handleWebhook(deps(), orderPaid.body, orderPaid.signature)).toEqual({ status: 200, handled: "already_granted" });
    expect(passes(ASHA)).toHaveLength(1);
  });

  it("record failures, ignore unknown orders, and do nothing while payments are off", async () => {
    const { orderId } = await checkout();
    const failed = gateway.pay(orderId, "fail")!;
    const hook = gateway.webhook("payment.failed", orderId, failed.paymentId);
    expect(await handleWebhook(deps(), hook.body, hook.signature)).toEqual({ status: 200, handled: "failed" });
    expect(store.payments[0].status).toBe("failed");
    expect(store.events.filter((e) => e.name === "payment_failed")).toHaveLength(1);

    const unknown = gateway.webhook("payment.captured", "order_NOTOURS123", "pay_NOTOURS123");
    expect(await handleWebhook(deps(), unknown.body, unknown.signature)).toEqual({ status: 200, handled: "ignored" });
    expect(await handleWebhook(deps(at(8), false), hook.body, hook.signature)).toEqual({ status: 503, handled: "payments_off" });
  });

  it("a payment that failed first and succeeded on retry still grants once", async () => {
    const { orderId } = await checkout();
    gateway.pay(orderId, "fail");
    const retry = gateway.pay(orderId, "success")!;
    const hook = gateway.webhook("payment.captured", orderId, retry.paymentId);
    expect((await handleWebhook(deps(), hook.body, hook.signature)).handled).toBe("granted");
    expect(passes(ASHA)).toHaveLength(1);
  });
});

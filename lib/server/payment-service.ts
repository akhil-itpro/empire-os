// Season Pass payments (docs/BUILD_PLAN.md Phase 10). The server computes the
// price, creates the Razorpay order and records it. A pass is granted only after
// the payment signature checks out AND Razorpay itself says the payment is
// captured and the order paid, for the right amount. Granting is idempotent (one
// entitlement per order), so a repeated callback or webhook never grants twice.
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { hasSeasonPass } from "@/lib/game/access";
import { localDate } from "@/lib/game/dates";
import { FOUNDER_PRICE_INR, passOffer, perDayInr, type PassOffer } from "@/lib/game/pass";
import { SEASON_DAYS } from "@/lib/game/rules";
import type { Deps, Result } from "./season-service";
import type { SeasonStore } from "./store";

const DAY_MS = 86_400_000;

/** What the server needs from Razorpay. The real one is in razorpay.ts; tests use a stand-in. */
export interface PaymentGateway {
  /** The public key id, given to the checkout in the browser. */
  keyId: string;
  /** Signs checkout results (the key secret). Never sent to the browser. */
  keySecret: string;
  /** Signs webhooks. Never sent to the browser. */
  webhookSecret: string;
  createOrder(amountPaise: number, receipt: string, notes: Record<string, string>): Promise<{ id: string; amount: number; currency: string }>;
  fetchPayment(paymentId: string): Promise<{ id: string; order_id: string; status: string; amount: number; currency: string } | null>;
  fetchOrder(orderId: string): Promise<{ id: string; status: string; amount: number; amount_paid: number } | null>;
}

export type PaymentDeps = Deps;

const fail = (error: "not_allowed" | "not_started" | "already_has_pass" | "invalid_input" | "not_found", message: string) => ({
  ok: false as const,
  error,
  message,
});

function hmac(secret: string, data: string) {
  return createHmac("sha256", secret).update(data).digest("hex");
}

/** Compares two hex signatures in constant time. */
function sameSignature(expected: string, given: string) {
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(given, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Razorpay's checkout signature: HMAC-SHA256 of "order_id|payment_id" with the key secret. */
export function checkoutSignatureValid(keySecret: string, orderId: string, paymentId: string, signature: string) {
  return sameSignature(hmac(keySecret, `${orderId}|${paymentId}`), signature);
}

/** Razorpay's webhook signature: HMAC-SHA256 of the raw request body with the webhook secret. */
export function webhookSignatureValid(webhookSecret: string, rawBody: string, signature: string) {
  return sameSignature(hmac(webhookSecret, rawBody), signature);
}

export function paymentSource(orderId: string) {
  return `payment:${orderId}`;
}

/**
 * The price for this student, from the server's own count. A student who reserved
 * the founder price keeps it; otherwise it's the founder price while places remain.
 */
export async function priceFor(store: SeasonStore, userId: string): Promise<PassOffer & { reserved: boolean }> {
  const [reservation, taken] = await Promise.all([store.getReservation(userId), store.countFounderPlaces()]);
  const offer = passOffer(taken);
  if (reservation?.founderPrice) {
    return { ...offer, priceInr: FOUNDER_PRICE_INR, founderPrice: true, perDay: perDayInr(FOUNDER_PRICE_INR), reserved: true };
  }
  return { ...offer, reserved: false };
}

/** Creates a Razorpay order at the server's price and records it. */
export async function startCheckout(
  deps: PaymentDeps,
  userId: string,
): Promise<Result<{ orderId: string; amountInr: number; keyId: string; founderPrice: boolean }>> {
  if (!deps.payments) return fail("not_allowed", "Season Pass payments aren't open yet.");
  const profile = await deps.store.getProfile(userId);
  if (!profile) return fail("not_started", "Start your season first.");
  if (hasSeasonPass(deps.now, await deps.store.entitlements(userId))) {
    return fail("already_has_pass", "You already have Season Pass.");
  }
  const price = await priceFor(deps.store, userId);
  const amountPaise = price.priceInr * 100;
  const order = await deps.payments.createOrder(amountPaise, `pass_${deps.now.getTime().toString(36)}`, {
    user_id: userId,
    product: "season_pass_90_days",
  });
  if (order.amount !== amountPaise || order.currency !== "INR") throw new Error("Razorpay returned a different amount.");
  await deps.store.insertPayment({ userId, orderId: order.id, amountInr: price.priceInr, founderPrice: price.founderPrice });
  await deps.store.logEvent("checkout_start", userId, { price: price.priceInr });
  return { ok: true, data: { orderId: order.id, amountInr: price.priceInr, keyId: deps.payments.keyId, founderPrice: price.founderPrice } };
}

export type Finalized = { granted: boolean; until: string };

/**
 * Asks Razorpay whether the order really was paid with this payment, then marks it
 * paid and grants 90 days of Season Pass, once. Used by the checkout handler, the
 * redirect callback and webhooks alike.
 */
async function finalize(deps: PaymentDeps, orderId: string, paymentId: string): Promise<Result<Finalized>> {
  const gateway = deps.payments!;
  const payment = await deps.store.getPayment(orderId);
  if (!payment) return fail("not_found", "We couldn't find that order.");
  const amountPaise = payment.amountInr * 100;
  const [remotePayment, remoteOrder] = await Promise.all([gateway.fetchPayment(paymentId), gateway.fetchOrder(orderId)]);
  const verified =
    remotePayment !== null &&
    remotePayment.order_id === orderId &&
    remotePayment.status === "captured" &&
    remotePayment.amount === amountPaise &&
    remotePayment.currency === "INR" &&
    remoteOrder !== null &&
    remoteOrder.status === "paid" &&
    remoteOrder.amount_paid === amountPaise;
  if (!verified) return fail("invalid_input", "The payment hasn't gone through. You haven't been charged for Season Pass.");

  const changed = await deps.store.markPaymentPaid(orderId, paymentId, deps.now);
  // Granting is keyed by the order, so running this twice (or after a crash) is safe.
  const granted = await deps.store.grantEntitlement(payment.userId, {
    kind: "season_pass",
    startsAt: deps.now,
    endsAt: new Date(deps.now.getTime() + SEASON_DAYS * DAY_MS),
    source: paymentSource(orderId),
  });
  if (changed) await deps.store.logEvent("payment_done", payment.userId, { price: payment.amountInr });
  const pass = (await deps.store.entitlements(payment.userId)).find((e) => e.source === paymentSource(orderId))!;
  const profile = await deps.store.getProfile(payment.userId);
  return {
    ok: true,
    data: { granted, until: localDate(new Date(pass.endsAt.getTime() - 1), profile?.timeZone ?? "Asia/Kolkata") },
  };
}

const ORDER_ID = /^order_[A-Za-z0-9]{6,40}$/;
const PAYMENT_ID = /^pay_[A-Za-z0-9]{6,40}$/;
const checkoutSchema = z.object({
  orderId: z.string().regex(ORDER_ID),
  paymentId: z.string().regex(PAYMENT_ID),
  signature: z.string().regex(/^[0-9a-f]{64}$/),
});

/** The checkout handler in the browser sends Razorpay's result here. */
export async function confirmPayment(deps: PaymentDeps, userId: string, input: unknown): Promise<Result<Finalized>> {
  if (!deps.payments) return fail("not_allowed", "Season Pass payments aren't open yet.");
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return fail("invalid_input", "That payment result isn't valid.");
  const { orderId, paymentId, signature } = parsed.data;
  const payment = await deps.store.getPayment(orderId);
  if (!payment || payment.userId !== userId) return fail("not_found", "We couldn't find that order.");
  if (!checkoutSignatureValid(deps.payments.keySecret, orderId, paymentId, signature)) {
    return fail("invalid_input", "That payment result isn't valid.");
  }
  return finalize(deps, orderId, paymentId);
}

/**
 * The redirect flow (for in-app browsers like Instagram's): Razorpay posts the result
 * to our callback page. The browser may not send the session cookie on that post, so
 * the order (created for one student) and the signature identify the payment.
 */
export async function confirmRedirect(deps: PaymentDeps, form: Record<string, string>): Promise<Result<Finalized>> {
  if (!deps.payments) return fail("not_allowed", "Season Pass payments aren't open yet.");
  const parsed = checkoutSchema.safeParse({
    orderId: form.razorpay_order_id,
    paymentId: form.razorpay_payment_id,
    signature: form.razorpay_signature,
  });
  if (!parsed.success) return fail("invalid_input", "The payment didn't go through. You haven't been charged for Season Pass.");
  const { orderId, paymentId, signature } = parsed.data;
  if (!checkoutSignatureValid(deps.payments.keySecret, orderId, paymentId, signature)) {
    return fail("invalid_input", "That payment result isn't valid.");
  }
  return finalize(deps, orderId, paymentId);
}

const webhookSchema = z.object({
  event: z.string(),
  payload: z.object({
    payment: z.object({ entity: z.object({ id: z.string(), order_id: z.string().nullable().optional() }) }).optional(),
    order: z.object({ entity: z.object({ id: z.string() }) }).optional(),
  }),
});

/**
 * Razorpay webhooks: payment.captured, order.paid and payment.failed. The body must
 * be signed with the webhook secret. Unknown orders and events are acknowledged and
 * ignored, so Razorpay doesn't keep retrying them.
 */
export async function handleWebhook(
  deps: PaymentDeps,
  rawBody: string,
  signature: string | null,
): Promise<{ status: 200 | 400 | 503; handled: string }> {
  if (!deps.payments) return { status: 503, handled: "payments_off" };
  if (!signature || !webhookSignatureValid(deps.payments.webhookSecret, rawBody, signature)) {
    return { status: 400, handled: "bad_signature" };
  }
  let parsed;
  try {
    parsed = webhookSchema.safeParse(JSON.parse(rawBody));
  } catch {
    return { status: 400, handled: "bad_json" };
  }
  if (!parsed.success) return { status: 200, handled: "ignored" };
  const { event, payload } = parsed.data;
  const orderId = payload.order?.entity.id ?? payload.payment?.entity.order_id ?? null;
  const paymentId = payload.payment?.entity.id ?? null;
  if (!orderId || !ORDER_ID.test(orderId) || !(await deps.store.getPayment(orderId))) return { status: 200, handled: "ignored" };

  if (event === "payment.failed") {
    const before = await deps.store.getPayment(orderId);
    await deps.store.markPaymentFailed(orderId);
    if (before?.status === "created") await deps.store.logEvent("payment_failed", before.userId);
    return { status: 200, handled: "failed" };
  }
  if ((event === "payment.captured" || event === "order.paid") && paymentId && PAYMENT_ID.test(paymentId)) {
    const r = await finalize(deps, orderId, paymentId);
    return { status: 200, handled: r.ok ? (r.data.granted ? "granted" : "already_granted") : "not_verified" };
  }
  return { status: 200, handled: "ignored" };
}

export type Receipt = { orderId: string; paymentId: string; amountInr: number; paidOn: string };

/** Paid Season Passes, for the receipt in Me. */
export async function receipts(store: SeasonStore, userId: string, timeZone: string): Promise<Receipt[]> {
  return (await store.listPayments(userId))
    .filter((p) => p.status === "paid" && p.paymentId && p.paidAt)
    .map((p) => ({ orderId: p.orderId, paymentId: p.paymentId!, amountInr: p.amountInr, paidOn: localDate(p.paidAt!, timeZone) }));
}

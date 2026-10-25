// A stand-in for Razorpay, for unit tests and the local test mode only (never
// production). It keeps orders and payments in memory and signs results with fixed
// test secrets, exactly the way Razorpay signs them.
import { createHmac, randomBytes } from "node:crypto";
import { FAKE_KEY_ID } from "@/lib/payments-shared";
import type { PaymentGateway } from "./payment-service";

const id = (prefix: string) => `${prefix}_${randomBytes(9).toString("base64url").replace(/[-_]/g, "x").slice(0, 14)}`;

export class FakeGateway implements PaymentGateway {
  keyId = FAKE_KEY_ID;
  keySecret = "fake_key_secret";
  webhookSecret = "fake_webhook_secret";
  orders = new Map<string, { id: string; amount: number; status: string; amount_paid: number }>();
  payments = new Map<string, { id: string; order_id: string; status: string; amount: number; currency: string }>();

  async createOrder(amountPaise: number) {
    const order = { id: id("order"), amount: amountPaise, status: "created", amount_paid: 0 };
    this.orders.set(order.id, order);
    return { id: order.id, amount: amountPaise, currency: "INR" };
  }

  async fetchPayment(paymentId: string) {
    return this.payments.get(paymentId) ?? null;
  }

  async fetchOrder(orderId: string) {
    return this.orders.get(orderId) ?? null;
  }

  /** The customer pays (or fails to) in checkout. Returns what the checkout hands the browser. */
  pay(orderId: string, outcome: "success" | "fail") {
    const order = this.orders.get(orderId);
    if (!order) return null;
    const payment = { id: id("pay"), order_id: orderId, status: outcome === "success" ? "captured" : "failed", amount: order.amount, currency: "INR" };
    this.payments.set(payment.id, payment);
    if (outcome === "success") Object.assign(order, { status: "paid", amount_paid: order.amount });
    const signature = createHmac("sha256", this.keySecret).update(`${orderId}|${payment.id}`).digest("hex");
    return { paymentId: payment.id, signature };
  }

  /** A webhook body and its signature, as Razorpay would send them. */
  webhook(event: string, orderId: string, paymentId: string) {
    const body = JSON.stringify({
      event,
      payload: {
        payment: { entity: { id: paymentId, order_id: orderId } },
        ...(event === "order.paid" ? { order: { entity: { id: orderId } } } : {}),
      },
    });
    return { body, signature: createHmac("sha256", this.webhookSecret).update(body).digest("hex") };
  }
}

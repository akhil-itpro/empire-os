import "server-only";
import type { PaymentGateway } from "./payment-service";

const API = "https://api.razorpay.com/v1";

/**
 * Razorpay's Orders and Payments API over HTTPS (no SDK). Keys come from the
 * server's environment only: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET and
 * RAZORPAY_WEBHOOK_SECRET, typed by the founder into .env.local and Vercel.
 */
export class RazorpayGateway implements PaymentGateway {
  constructor(
    readonly keyId: string,
    readonly keySecret: string,
    readonly webhookSecret: string,
  ) {}

  private async call<T>(path: string, init?: RequestInit): Promise<T | null> {
    const res = await fetch(`${API}${path}`, {
      ...init,
      headers: {
        authorization: `Basic ${Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64")}`,
        "content-type": "application/json",
      },
      cache: "no-store",
    });
    if (res.status === 404 || res.status === 400) return null;
    if (!res.ok) throw new Error(`Razorpay ${path}: ${res.status}`);
    return (await res.json()) as T;
  }

  async createOrder(amountPaise: number, receipt: string, notes: Record<string, string>) {
    const order = await this.call<{ id: string; amount: number; currency: string }>("/orders", {
      method: "POST",
      body: JSON.stringify({ amount: amountPaise, currency: "INR", receipt, notes }),
    });
    if (!order) throw new Error("Razorpay refused the order.");
    return order;
  }

  fetchPayment(paymentId: string) {
    return this.call<{ id: string; order_id: string; status: string; amount: number; currency: string }>(
      `/payments/${encodeURIComponent(paymentId)}`,
    );
  }

  fetchOrder(orderId: string) {
    return this.call<{ id: string; status: string; amount: number; amount_paid: number }>(`/orders/${encodeURIComponent(orderId)}`);
  }
}

/**
 * Payments are live only when the founder turns them on (PAYMENTS_LIVE=1) and all
 * three keys are set. Otherwise the paywall stays in reserve mode.
 */
export function razorpayFromEnv(): RazorpayGateway | null {
  const { PAYMENTS_LIVE, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET } = process.env;
  if (PAYMENTS_LIVE !== "1" || !RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET || !RAZORPAY_WEBHOOK_SECRET) return null;
  return new RazorpayGateway(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET);
}

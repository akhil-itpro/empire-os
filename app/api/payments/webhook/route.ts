import { NextResponse, type NextRequest } from "next/server";
import { paymentGateway, storeForRequest } from "@/lib/server/deps";
import { handleWebhook } from "@/lib/server/payment-service";

// Razorpay webhooks (payment.captured, order.paid, payment.failed). The raw body is
// checked against X-Razorpay-Signature with the webhook secret before anything else.
export async function POST(request: NextRequest) {
  const raw = await request.text();
  if (raw.length > 100_000) return NextResponse.json({ ok: false }, { status: 413 });
  const deps = { store: storeForRequest(), now: new Date(), payments: await paymentGateway() };
  const result = await handleWebhook(deps, raw, request.headers.get("x-razorpay-signature"));
  return NextResponse.json({ ok: result.status === 200, handled: result.handled }, { status: result.status });
}

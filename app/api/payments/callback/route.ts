import { NextResponse, type NextRequest } from "next/server";
import { paymentGateway, storeForRequest } from "@/lib/server/deps";
import { confirmRedirect } from "@/lib/server/payment-service";

// The redirect flow for in-app browsers (Instagram, Facebook): Razorpay posts the
// checkout result here, then the student lands back on the Season Pass page.
export async function POST(request: NextRequest) {
  const form = Object.fromEntries(
    [...(await request.formData()).entries()].map(([k, v]) => [k, typeof v === "string" ? v.slice(0, 200) : ""]),
  );
  const deps = { store: storeForRequest(), now: new Date(), payments: await paymentGateway() };
  const result = await confirmRedirect(deps, form);
  const to = new URL(result.ok ? "/pass?paid=1" : "/pass?payment=failed", request.url);
  return NextResponse.redirect(to, 303);
}

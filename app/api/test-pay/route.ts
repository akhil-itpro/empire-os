import { NextResponse, type NextRequest } from "next/server";
import { TEST_MODE, testGateway } from "@/lib/server/test-mode";

// Local test mode only: plays the customer in the stand-in checkout. Returns what
// Razorpay's checkout would hand the browser. In any other mode it doesn't exist.
export async function POST(request: NextRequest) {
  if (!TEST_MODE) return new NextResponse("Not found", { status: 404 });
  const { orderId, outcome } = (await request.json()) as { orderId?: string; outcome?: string };
  const result = typeof orderId === "string" ? testGateway().pay(orderId, outcome === "fail" ? "fail" : "success") : null;
  if (!result) return NextResponse.json({ ok: false }, { status: 404 });
  return NextResponse.json({ ok: outcome !== "fail", ...result, orderId });
}

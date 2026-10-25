"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { confirmPayment, startCheckout } from "@/app/actions/payments";
import { Button, ButtonLink } from "@/components/ui/Button";
import { FAKE_KEY_ID, RAZORPAY_CHECKOUT_JS } from "@/lib/payments-shared";

type RazorpayResult = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayCheckout = { open: () => void; on: (event: "payment.failed", cb: () => void) => void };
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayCheckout;
  }
}

const nf = new Intl.NumberFormat("en-IN");

function loadCheckoutScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = RAZORPAY_CHECKOUT_JS;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Razorpay checkout didn't load."));
    document.head.appendChild(s);
  });
}

/**
 * "Get Season Pass for ₹299": the exact amount, one-time, no auto-renewal, and a
 * clear "Maybe later". The server makes the order and checks the payment.
 */
export function Checkout({ priceInr, backHref }: { priceInr: number; backHref: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [testOrder, setTestOrder] = useState<string | null>(null);

  const finish = async (r: RazorpayResult) => {
    setBusy(true);
    const result = await confirmPayment({
      orderId: r.razorpay_order_id,
      paymentId: r.razorpay_payment_id,
      signature: r.razorpay_signature,
    });
    setBusy(false);
    if (result.ok) router.refresh();
    else setNote(result.message);
  };

  const buy = async () => {
    setNote(null);
    setBusy(true);
    const r = await startCheckout();
    if (!r.ok) {
      setBusy(false);
      setNote(r.message);
      return;
    }
    const { orderId, amountInr, keyId } = r.data;
    if (keyId === FAKE_KEY_ID) {
      setBusy(false);
      setTestOrder(orderId);
      return;
    }
    try {
      await loadCheckoutScript();
    } catch {
      setBusy(false);
      setNote("The payment window didn't load. Check your connection and try again. You haven't been charged.");
      return;
    }
    // In-app browsers (Instagram, Facebook) can lose the page during payment, so they
    // use Razorpay's redirect flow back to our callback instead of a handler.
    const inApp = /Instagram|FBAN|FBAV/i.test(navigator.userAgent);
    const checkout = new window.Razorpay!({
      key: keyId,
      order_id: orderId,
      amount: amountInr * 100,
      currency: "INR",
      name: "EMPIRE OS",
      description: "Season Pass, 90 days, one-time",
      theme: { color: "#C9A24B" },
      ...(inApp
        ? { callback_url: `${window.location.origin}/api/payments/callback`, redirect: true }
        : { handler: (res: RazorpayResult) => void finish(res) }),
      modal: {
        ondismiss: () => {
          setBusy(false);
          setNote("Checkout closed. You haven't been charged.");
        },
      },
    });
    checkout.on("payment.failed", () =>
      setNote("The payment didn't go through. You haven't been charged. Try again or use another method."),
    );
    checkout.open();
  };

  const testPay = async (outcome: "success" | "fail") => {
    const res = await fetch("/api/test-pay", { method: "POST", body: JSON.stringify({ orderId: testOrder, outcome }) });
    const body = (await res.json()) as { ok: boolean; orderId: string; paymentId: string; signature: string };
    setTestOrder(null);
    if (outcome === "fail") {
      setNote("The payment didn't go through. You haven't been charged. Try again or use another method.");
      return;
    }
    await finish({ razorpay_order_id: body.orderId, razorpay_payment_id: body.paymentId, razorpay_signature: body.signature });
  };

  return (
    <>
      <Button className="mt-5" onClick={buy} disabled={busy}>
        {busy ? "Opening checkout" : `Get Season Pass for ₹${nf.format(priceInr)}`}
      </Button>
      <ButtonLink href={backHref} variant="quiet" className="mt-2">
        Maybe later
      </ButtonLink>
      <p role="status" className="text-center text-sm text-bone empty:hidden">
        {note}
      </p>
      <p className="mt-2.5 text-center text-xs text-moss">
        ₹{nf.format(priceInr)}, paid once by UPI or card through Razorpay. Season Pass lasts 90 days and doesn&apos;t renew.
        By paying you agree to the{" "}
        <Link href="/terms" className="font-semibold text-brass hov:text-brass-light">
          Terms
        </Link>{" "}
        and the{" "}
        <Link href="/terms#refunds" className="font-semibold text-brass hov:text-brass-light">
          refund policy
        </Link>
        .
      </p>

      {testOrder ? (
        <div role="dialog" aria-label="Test checkout" className="fixed inset-0 z-50 flex items-end bg-field/80 px-5 pb-8">
          <div className="w-full rounded-2xl border border-rule bg-ledger p-5">
            <p className="text-sm font-bold">Test checkout (local test mode)</p>
            <p className="mt-1 text-sm text-moss">Stands in for Razorpay. No real payment happens here.</p>
            <div className="mt-4 flex flex-col gap-2">
              <Button onClick={() => void testPay("success")}>Pay ₹{nf.format(priceInr)}</Button>
              <Button variant="secondary" onClick={() => void testPay("fail")}>
                Payment fails
              </Button>
              <Button
                variant="quiet"
                onClick={() => {
                  setTestOrder(null);
                  setNote("Checkout closed. You haven't been charged.");
                }}
              >
                Close checkout
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

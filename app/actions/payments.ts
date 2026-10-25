"use server";

// Season Pass checkout (Phase 10). The browser never sends a price: the server
// creates the order at its own price, then verifies the result with Razorpay.
import { refresh } from "next/cache";
import { depsFor } from "@/lib/server/deps";
import * as payments from "@/lib/server/payment-service";
import type { Deps, Result } from "@/lib/server/season-service";
import { getSessionUserId } from "@/lib/server/session";

type SignedOut = { ok: false; error: "signed_out"; message: string };

const SIGNED_OUT: SignedOut = {
  ok: false,
  error: "signed_out",
  message: "Your session ended. Sign in again to continue.",
};

async function withUser<T>(run: (deps: Deps, userId: string) => Promise<Result<T>>): Promise<Result<T> | SignedOut> {
  const userId = await getSessionUserId();
  if (!userId) return SIGNED_OUT;
  const result = await run(await depsFor(userId), userId);
  if (result.ok) refresh();
  return result;
}

export async function startCheckout() {
  return withUser((deps, userId) => payments.startCheckout(deps, userId));
}

export async function confirmPayment(input: unknown) {
  return withUser((deps, userId) => payments.confirmPayment(deps, userId, input));
}

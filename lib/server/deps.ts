import "server-only";
import { cookies } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { PaymentGateway } from "./payment-service";
import { razorpayFromEnv } from "./razorpay";
import type { Deps } from "./season-service";
import type { SeasonStore } from "./store";
import { SupabaseSeasonStore } from "./store-supabase";
import { TEST_MODE, TEST_PAYMENTS_COOKIE, testGateway, testStore } from "./test-mode";

export const TIME_TRAVEL_COOKIE = "empire_time_travel";
export const MAX_TIME_TRAVEL_DAYS = 120;

export function storeForRequest(): SeasonStore {
  return TEST_MODE ? testStore() : new SupabaseSeasonStore(createSupabaseAdminClient());
}

/**
 * Founder-only "time travel": shifts this user's clock forward by whole days so the
 * founder can test tomorrow today. Ignored for everyone else (checked on the server
 * against the roles table, never trusted from the cookie alone).
 */
export async function timeTravelDays(store: SeasonStore, userId: string): Promise<number> {
  const raw = Number((await cookies()).get(TIME_TRAVEL_COOKIE)?.value ?? 0);
  if (!Number.isInteger(raw) || raw <= 0 || raw > MAX_TIME_TRAVEL_DAYS) return 0;
  if (TEST_MODE) return raw;
  return (await store.isFounder(userId)) ? raw : 0;
}

/** Razorpay when payments are live; in local test mode, a stand-in when the test asks for it. */
export async function paymentGateway(): Promise<PaymentGateway | null> {
  if (TEST_MODE) return (await cookies()).get(TEST_PAYMENTS_COOKIE)?.value === "1" ? testGateway() : null;
  return razorpayFromEnv();
}

export async function depsFor(userId: string): Promise<Deps> {
  const store = storeForRequest();
  const days = await timeTravelDays(store, userId);
  return { store, now: new Date(Date.now() + days * 86_400_000), payments: await paymentGateway() };
}

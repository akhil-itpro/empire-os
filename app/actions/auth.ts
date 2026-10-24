"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MAX_TIME_TRAVEL_DAYS, storeForRequest, TIME_TRAVEL_COOKIE } from "@/lib/server/deps";
import { getSessionUserId } from "@/lib/server/session";
import { TEST_MODE, TEST_USER_COOKIE, testStore } from "@/lib/server/test-mode";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const COOKIE = { httpOnly: true, sameSite: "lax" as const, path: "/", secure: process.env.NODE_ENV === "production" };

export async function signOut() {
  const jar = await cookies();
  jar.delete(TIME_TRAVEL_COOKIE);
  if (TEST_MODE) {
    jar.delete(TEST_USER_COOKIE);
  } else {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}

/** Local test mode only: signs in as a brand-new pretend user. */
export async function testSignIn(options: { founder?: boolean } = {}) {
  if (!TEST_MODE) return { ok: false as const };
  const id = crypto.randomUUID();
  (await cookies()).set(TEST_USER_COOKIE, id, COOKIE);
  if (options.founder) testStore().founders.add(id);
  return { ok: true as const };
}

/**
 * Founder-only time travel: shift your own clock forward by whole days to test
 * tomorrow. Students can't use it; the server checks the founder role.
 */
export async function setTimeTravel(days: unknown) {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false as const, message: "Sign in first." };
  if (!TEST_MODE && !(await storeForRequest().isFounder(userId))) {
    return { ok: false as const, message: "Only the founder can do this." };
  }
  const n = Number(days);
  if (!Number.isInteger(n) || n < 0 || n > MAX_TIME_TRAVEL_DAYS) {
    return { ok: false as const, message: `Choose 0 to ${MAX_TIME_TRAVEL_DAYS} days.` };
  }
  const jar = await cookies();
  if (n === 0) jar.delete(TIME_TRAVEL_COOKIE);
  else jar.set(TIME_TRAVEL_COOKIE, String(n), COOKIE);
  return { ok: true as const, days: n };
}

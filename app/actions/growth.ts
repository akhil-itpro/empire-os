"use server";

// Server actions for Season Pass (reserve mode), packs, share cards and referrals.
// Each one reads the user from the session and leaves checks and prices to the server.
import { refresh } from "next/cache";
import { depsFor } from "@/lib/server/deps";
import { reservePass as reservePassService } from "@/lib/server/pass-service";
import { setPack as setPackService, type Deps, type Result } from "@/lib/server/season-service";
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

export async function reservePass(source: unknown) {
  return withUser((deps, userId) => reservePassService(deps, userId, source));
}

export async function setPack(packId: unknown, on: unknown) {
  return withUser((deps, userId) => setPackService(deps, userId, packId, on));
}

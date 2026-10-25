"use server";

// Server actions for the War Room: save the weekly review, answer "Apply new plan?",
// and finish the weekly boss mission. Each reads the user from the session.
import { refresh } from "next/cache";
import { depsFor } from "@/lib/server/deps";
import type { Deps, Result } from "@/lib/server/season-service";
import { getSessionUserId } from "@/lib/server/session";
import * as warRoom from "@/lib/server/war-room-service";

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

export async function submitReview(input: unknown) {
  return withUser((deps, userId) => warRoom.submitReview(deps, userId, input));
}

export async function decideProposal(apply: unknown) {
  return withUser((deps, userId) => warRoom.decideProposal(deps, userId, apply));
}

export async function completeBoss() {
  return withUser((deps, userId) => warRoom.completeBoss(deps, userId));
}

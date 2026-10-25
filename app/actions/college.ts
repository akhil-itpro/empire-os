"use server";

// Server actions for College HQ: students join and leave batches and dismiss
// reminders; TPOs accept invites and send reminders; the founder sets things up.
// Each one reads the user from the session; rights are checked in the service.
import { refresh } from "next/cache";
import * as college from "@/lib/server/college-service";
import { depsFor } from "@/lib/server/deps";
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

export async function joinBatch(input: unknown) {
  return withUser((deps, userId) => college.joinBatch(deps, userId, input));
}

export async function leaveBatch() {
  return withUser((deps, userId) => college.leaveBatch(deps, userId));
}

export async function dismissNudge(nudgeId: unknown) {
  return withUser((deps, userId) => college.dismissNudge(deps, userId, nudgeId));
}

export async function acceptInvite(token: unknown) {
  return withUser((deps, userId) => college.acceptInvite(deps, userId, token));
}

export async function sendNudge(batchId: unknown, studentId: unknown) {
  return withUser((deps, userId) => college.sendNudge(deps, userId, batchId, studentId));
}

export async function createOrg(input: unknown) {
  return withUser((deps, userId) => college.createOrg(deps, userId, input));
}

export async function createBatch(input: unknown) {
  return withUser((deps, userId) => college.createBatch(deps, userId, input));
}

export async function createTpoInvite(input: unknown) {
  return withUser((deps, userId) => college.createTpoInvite(deps, userId, input));
}

export async function createSampleBatch() {
  return withUser((deps, userId) => college.createSampleBatch(deps, userId));
}

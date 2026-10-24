"use server";

// Server actions for the season. Each one reads the user from the session,
// validates input in the season service, and writes with the secret key.
import { refresh } from "next/cache";
import {
  chooseFreePillar as chooseFreePillarService,
  completeMission as completeMissionService,
  skipMission as skipMissionService,
  startSeason as startSeasonService,
  swapMission as swapMissionService,
  undoMission as undoMissionService,
  type Deps,
  type Result,
} from "@/lib/server/season-service";
import { getSessionUserId } from "@/lib/server/session";
import { SupabaseSeasonStore } from "@/lib/server/store-supabase";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type SignedOut = { ok: false; error: "signed_out"; message: string };

const SIGNED_OUT: SignedOut = {
  ok: false,
  error: "signed_out",
  message: "Your session ended. Sign in again to continue.",
};

async function withUser<T>(run: (deps: Deps, userId: string) => Promise<Result<T>>): Promise<Result<T> | SignedOut> {
  const userId = await getSessionUserId();
  if (!userId) return SIGNED_OUT;
  const deps: Deps = { store: new SupabaseSeasonStore(createSupabaseAdminClient()), now: new Date() };
  const result = await run(deps, userId);
  if (result.ok) refresh();
  return result;
}

export async function startSeason(answers: unknown, timeZone: unknown, referralCode: unknown) {
  return withUser((deps, userId) =>
    startSeasonService(deps, userId, answers, {
      timeZone: typeof timeZone === "string" ? timeZone.slice(0, 64) : undefined,
      referralCode: typeof referralCode === "string" ? referralCode.slice(0, 16) : undefined,
    }),
  );
}

export async function completeMission(missionId: unknown) {
  return withUser((deps, userId) => completeMissionService(deps, userId, missionId));
}

export async function undoMission(missionId: unknown) {
  return withUser((deps, userId) => undoMissionService(deps, userId, missionId));
}

export async function skipMission(missionId: unknown, reason: unknown) {
  return withUser((deps, userId) => skipMissionService(deps, userId, missionId, reason));
}

export async function swapMission(missionId: unknown) {
  return withUser((deps, userId) => swapMissionService(deps, userId, missionId));
}

export async function chooseFreePillar(pillar: unknown) {
  return withUser((deps, userId) => chooseFreePillarService(deps, userId, pillar));
}

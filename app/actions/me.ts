"use server";

import { refresh } from "next/cache";
import { depsFor } from "@/lib/server/deps";
import { saveJournalEntry, updateSettings as updateSettingsService } from "@/lib/server/me-service";
import { getSessionUserId } from "@/lib/server/session";

const SIGNED_OUT = { ok: false as const, error: "signed_out" as const, message: "Your session ended. Sign in again." };

export async function updateSettings(input: unknown) {
  const userId = await getSessionUserId();
  if (!userId) return SIGNED_OUT;
  const result = await updateSettingsService(await depsFor(userId), userId, input);
  if (result.ok) refresh();
  return result;
}

export async function saveJournal(text: unknown) {
  const userId = await getSessionUserId();
  if (!userId) return SIGNED_OUT;
  const result = await saveJournalEntry(await depsFor(userId), userId, text);
  if (result.ok) refresh();
  return result;
}

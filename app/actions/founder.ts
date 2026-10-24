"use server";

import { refresh } from "next/cache";
import { storeForRequest } from "@/lib/server/deps";
import { LAUNCH_ITEMS } from "@/lib/server/founder";
import { getSessionUserId } from "@/lib/server/session";

/** Ticks or unticks a launch checklist item. Founder only, checked on the server. */
export async function setChecklistItem(id: unknown, done: unknown) {
  const userId = await getSessionUserId();
  const store = storeForRequest();
  if (!userId || !(await store.isFounder(userId))) return { ok: false as const };
  if (typeof id !== "string" || !LAUNCH_ITEMS.some((i) => i.id === id) || typeof done !== "boolean") {
    return { ok: false as const };
  }
  await store.setChecklistItem(id, done, userId);
  refresh();
  return { ok: true as const };
}

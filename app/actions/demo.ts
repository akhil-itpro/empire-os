"use server";

import { submitDemoRequest } from "@/lib/server/demo-service";
import { storeForRequest } from "@/lib/server/deps";

/** "Book a 20-minute demo" from /colleges. No sign-in; the service checks and limits it. */
export async function bookDemo(input: unknown) {
  return submitDemoRequest(storeForRequest(), input, new Date());
}

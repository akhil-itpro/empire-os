// "Book a 20-minute demo" on /colleges (docs/BUILD_PLAN.md Phase 9). Saves only
// what the form asks for, after checking it; a hidden field and simple limits
// keep bots and repeats out. Nobody is signed in here.
import { z } from "zod";
import { BATCH_SIZES, DEMO_ROLES } from "@/lib/demo-options";
import type { DemoRequest, SeasonStore } from "./store";

const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;
const text = (min: number, max: number) =>
  z
    .string()
    .transform((s) => s.replace(CONTROL_CHARS, " ").replace(/\s+/g, " ").trim())
    .pipe(z.string().min(min).max(max));

const schema = z.object({
  name: text(2, 80),
  role: z.enum(DEMO_ROLES.map((r) => r.id) as [DemoRequest["role"], ...DemoRequest["role"][]]),
  college: text(2, 120),
  city: text(2, 60),
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
  phone: z
    .string()
    .trim()
    .transform((s) => s.replace(/[-()]/g, "").replace(/\s+/g, " "))
    .pipe(z.union([z.literal(""), z.string().regex(/^\+?[0-9 ]{8,16}$/)])),
  batchSize: z.enum(BATCH_SIZES.map((b) => b.id) as [DemoRequest["batchSize"], ...DemoRequest["batchSize"][]]),
  note: text(0, 500),
  /** A field people never see. Bots fill it in. */
  website: z.string().max(200),
});

export type DemoResult = { ok: true } | { ok: false; message: string };

const HOUR = 3_600_000;
/** Across everyone, to stop a flood. */
const MAX_PER_HOUR = 30;

export async function submitDemoRequest(store: SeasonStore, input: unknown, now: Date): Promise<DemoResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Check the fields: your name, role, college, city, a work email and batch size are needed." };
  }
  const r = parsed.data;
  // A bot filled the hidden field: say thanks, save nothing.
  if (r.website !== "") return { ok: true };
  // One request a day per email is plenty; a repeat is thanked, not saved twice.
  if ((await store.countDemoRequests(new Date(now.getTime() - 24 * HOUR), r.email)) > 0) return { ok: true };
  if ((await store.countDemoRequests(new Date(now.getTime() - HOUR))) >= MAX_PER_HOUR) {
    return { ok: false, message: "We're getting a lot of requests right now. Try again in an hour." };
  }
  await store.insertDemoRequest({
    name: r.name,
    role: r.role,
    college: r.college,
    city: r.city,
    email: r.email,
    phone: r.phone || null,
    batchSize: r.batchSize,
    note: r.note || null,
  });
  await store.logEvent("demo_request", null, { role: r.role, batch: r.batchSize });
  return { ok: true };
}

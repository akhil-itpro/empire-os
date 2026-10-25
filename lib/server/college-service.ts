// College HQ on the server (docs/PRODUCT.md section 9): the founder sets up
// colleges, batches and TPO invites; students join a batch with consent and can
// leave any time; TPOs see only their own college's consenting students. Every
// function takes the user id from the caller (read from the session) and checks
// rights itself, so a direct call can't reach another college's data.
import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { addDays, daysBetween, isLocalDate, localDate, startOfLocalDay, type LocalDate } from "@/lib/game/dates";
import {
  computeOverview,
  computeWeeklyReport,
  NUDGE_AFTER_DAYS,
  RANGES,
  studentRows,
  type CollegeMember,
  type CollegeMission,
  type Range,
} from "./college-metrics";
import { sampleBatchData } from "./college-sample";
import { randomCode, type Deps, type ErrorCode, type Result } from "./season-service";
import type { Batch, Org, SeasonStore } from "./store";

/** College seasons run on India time. */
export const COLLEGE_TZ = "Asia/Kolkata";
export const JOIN_CODE = /^[A-Z0-9]{6,10}$/;
const INVITE_DAYS = 14;
const MAX_BATCH_DAYS = 120;

const fail = (error: ErrorCode, message: string) => ({ ok: false as const, error, message });
const NOT_FOUND = fail("not_found", "That batch doesn't exist, or it isn't one of yours.");
const FOUNDER_ONLY = fail("not_allowed", "Only the founder can do this.");

const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;
const text = (min: number, max: number) =>
  z
    .string()
    .transform((s) => s.replace(CONTROL_CHARS, " ").replace(/\s+/g, " ").trim())
    .pipe(z.string().min(min).max(max));

export function batchSource(batchId: string) {
  return `batch:${batchId}`;
}

export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function isFounder(store: SeasonStore, userId: string) {
  return store.isFounder(userId);
}

async function uniqueJoinCode(store: SeasonStore, make: (code: string) => Promise<Batch | "code_taken">) {
  for (let i = 0; i < 6; i++) {
    const created = await make(randomCode(8));
    if (created !== "code_taken") return created;
  }
  throw new Error("Couldn't find a free join code.");
}

// ---------------------------------------------------------------------------
// Founder: organisations, batches, TPO invites, the demo batch
// ---------------------------------------------------------------------------

const orgSchema = z.object({ name: text(2, 80), city: text(0, 40) });

export async function createOrg(deps: Deps, userId: string, input: unknown): Promise<Result<Org>> {
  if (!(await isFounder(deps.store, userId))) return FOUNDER_ONLY;
  const parsed = orgSchema.safeParse(input);
  if (!parsed.success) return fail("invalid_input", "Give the college a name (2 to 80 characters).");
  return { ok: true, data: await deps.store.createOrg(parsed.data.name, parsed.data.city || null) };
}

const batchSchema = z.object({
  orgId: z.uuid(),
  name: text(2, 60),
  startsOn: z.string().refine(isLocalDate),
  endsOn: z.string().refine(isLocalDate),
  sections: z.string().max(400),
  grantsPass: z.boolean(),
});

export async function createBatch(deps: Deps, userId: string, input: unknown): Promise<Result<Batch>> {
  if (!(await isFounder(deps.store, userId))) return FOUNDER_ONLY;
  const parsed = batchSchema.safeParse(input);
  if (!parsed.success) return fail("invalid_input", "Fill in the batch name and both dates.");
  const b = parsed.data;
  const days = daysBetween(b.startsOn, b.endsOn);
  if (days < 1 || days > MAX_BATCH_DAYS) {
    return fail("invalid_input", `The season must end after it starts, and last at most ${MAX_BATCH_DAYS} days.`);
  }
  const sections = [...new Set(b.sections.split(",").map((s) => s.replace(CONTROL_CHARS, "").trim()).filter(Boolean))];
  if (sections.length > 30 || sections.some((s) => s.length > 30)) {
    return fail("invalid_input", "Up to 30 sections, each up to 30 characters, separated by commas.");
  }
  if (!(await deps.store.getOrg(b.orgId))) return fail("not_found", "That college doesn't exist.");
  const batch = await uniqueJoinCode(deps.store, (joinCode) =>
    deps.store.createBatch({
      orgId: b.orgId,
      name: b.name,
      startsOn: b.startsOn,
      endsOn: b.endsOn,
      joinCode,
      sections,
      grantsPass: b.grantsPass,
      isSample: false,
    }),
  );
  return { ok: true, data: batch as Batch };
}

const inviteSchema = z.object({ orgId: z.uuid(), label: text(0, 80) });

/** A one-time link for a TPO. Only its hash is saved, so the link is shown once. */
export async function createTpoInvite(
  deps: Deps,
  userId: string,
  input: unknown,
): Promise<Result<{ token: string; expiresOn: LocalDate }>> {
  if (!(await isFounder(deps.store, userId))) return FOUNDER_ONLY;
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) return fail("invalid_input", "Pick a college. The note is up to 80 characters.");
  if (!(await deps.store.getOrg(parsed.data.orgId))) return fail("not_found", "That college doesn't exist.");
  const token = randomBytes(24).toString("base64url");
  const expires = new Date(deps.now.getTime() + INVITE_DAYS * 86_400_000);
  await deps.store.createOrgInvite(parsed.data.orgId, hashInviteToken(token), parsed.data.label || null, userId, expires);
  return { ok: true, data: { token, expiresOn: localDate(expires, COLLEGE_TZ) } };
}

/** A demo college with a sample batch (generated data, clearly labelled), with the founder as its admin. */
export async function createSampleBatch(deps: Deps, userId: string): Promise<Result<Batch>> {
  if (!(await isFounder(deps.store, userId))) return FOUNDER_ONLY;
  const today = localDate(deps.now, COLLEGE_TZ);
  const org = await deps.store.createOrg("Sample Institute of Technology", "Hyderabad");
  await deps.store.addOrgAdmin(org.id, userId);
  const startsOn = addDays(today, -24);
  const batch = await uniqueJoinCode(deps.store, (joinCode) =>
    deps.store.createBatch({
      orgId: org.id,
      name: "CSE 2027 batch",
      startsOn,
      endsOn: addDays(startsOn, 89),
      joinCode,
      sections: ["CSE-A", "CSE-B", "CSE-C"],
      grantsPass: false,
      isSample: true,
    }),
  );
  return { ok: true, data: batch as Batch };
}

export async function collegesForFounder(deps: Deps, userId: string) {
  if (!(await isFounder(deps.store, userId))) return null;
  return deps.store.listOrgs();
}

// ---------------------------------------------------------------------------
// TPO: accept an invite, see your batches
// ---------------------------------------------------------------------------

export async function acceptInvite(deps: Deps, userId: string, token: unknown): Promise<Result<{ orgId: string }>> {
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{20,64}$/.test(token)) {
    return fail("not_found", "This invite link isn't valid. Ask the EMPIRE OS team for a new one.");
  }
  const orgId = await deps.store.claimOrgInvite(hashInviteToken(token), userId, deps.now);
  if (!orgId) return fail("not_found", "This invite link was already used or has expired. Ask the EMPIRE OS team for a new one.");
  await deps.store.addOrgAdmin(orgId, userId);
  return { ok: true, data: { orgId } };
}

export type AdminBatch = Batch & { orgName: string };

/** The batches of every college this user administers, newest season first. */
export async function adminBatches(deps: Deps, userId: string): Promise<AdminBatch[]> {
  const orgIds = await deps.store.adminOrgIds(userId);
  if (orgIds.length === 0) return [];
  const [batches, orgs] = await Promise.all([
    deps.store.listBatches(orgIds),
    Promise.all(orgIds.map((id) => deps.store.getOrg(id))),
  ]);
  const names = new Map(orgs.filter((o): o is Org => o !== null).map((o) => [o.id, o.name]));
  return batches
    .map((b) => ({ ...b, orgName: names.get(b.orgId) ?? "" }))
    .sort((a, b) => b.startsOn.localeCompare(a.startsOn));
}

export async function isCollegeAdmin(deps: Deps, userId: string): Promise<boolean> {
  return (await deps.store.adminOrgIds(userId)).length > 0;
}

/** The batch, only if this user administers its college. */
async function batchForAdmin(deps: Deps, userId: string, batchId: unknown) {
  if (!z.uuid().safeParse(batchId).success) return null;
  const batch = await deps.store.getBatch(batchId as string);
  if (!batch) return null;
  const orgIds = await deps.store.adminOrgIds(userId);
  if (!orgIds.includes(batch.orgId)) return null;
  const org = await deps.store.getOrg(batch.orgId);
  return org ? { batch, org } : null;
}

async function batchRows(deps: Deps, batch: Batch, today: LocalDate) {
  const asOf = today > batch.endsOn ? batch.endsOn : today;
  if (batch.isSample) return { ...sampleBatchData(batch, asOf), nudged: new Set<string>() };
  const raw = await deps.store.listMembers(batch.id);
  const members: CollegeMember[] = raw.map((m) => ({
    userId: m.userId,
    displayName: m.displayName,
    section: m.section,
    joinedOn: localDate(m.joinedAt, COLLEGE_TZ),
  }));
  const [missions, nudges] = await Promise.all([
    members.length && today >= batch.startsOn
      ? deps.store.listMemberMissions(members.map((m) => m.userId), batch.startsOn, asOf)
      : Promise.resolve([]),
    deps.store.listNudges(batch.id, today),
  ]);
  return {
    members,
    missions: missions as CollegeMission[],
    nudged: new Set(nudges.filter((n) => n.localDate === today).map((n) => n.userId)),
  };
}

export type CollegeContext = { batch: Batch; org: Org; today: LocalDate };

export async function loadOverview(deps: Deps, userId: string, batchId: unknown, rawRange: unknown, rawSection: unknown) {
  const found = await batchForAdmin(deps, userId, batchId);
  if (!found) return NOT_FOUND;
  const { batch, org } = found;
  const today = localDate(deps.now, COLLEGE_TZ);
  const range: Range = RANGES.includes(rawRange as Range) ? (rawRange as Range) : "14";
  const section = typeof rawSection === "string" && batch.sections.includes(rawSection) ? rawSection : null;
  const rows = await batchRows(deps, batch, today);
  const overview = computeOverview({
    batch,
    members: rows.members,
    missions: rows.missions,
    today,
    range,
    section,
    nudgedToday: rows.nudged,
  });
  return { ok: true as const, data: { batch, org, today, range, section, overview, totalMembers: rows.members.length } };
}

export async function loadStudents(deps: Deps, userId: string, batchId: unknown) {
  const found = await batchForAdmin(deps, userId, batchId);
  if (!found) return NOT_FOUND;
  const today = localDate(deps.now, COLLEGE_TZ);
  const rows = await batchRows(deps, found.batch, today);
  const students = studentRows({ batch: found.batch, members: rows.members, missions: rows.missions, today })
    .map((s) => ({ ...s, nudgedToday: rows.nudged.has(s.userId) }))
    .sort((a, b) => b.missedDays - a.missedDays || a.displayName.localeCompare(b.displayName));
  return { ok: true as const, data: { ...found, today, students } };
}

export async function loadReport(deps: Deps, userId: string, batchId: unknown) {
  const found = await batchForAdmin(deps, userId, batchId);
  if (!found) return NOT_FOUND;
  const today = localDate(deps.now, COLLEGE_TZ);
  const rows = await batchRows(deps, found.batch, today);
  const report = computeWeeklyReport({ batch: found.batch, members: rows.members, missions: rows.missions, today });
  return { ok: true as const, data: { ...found, today, report } };
}

export async function loadBatchAdmin(deps: Deps, userId: string, batchId: unknown) {
  const found = await batchForAdmin(deps, userId, batchId);
  if (!found) return NOT_FOUND;
  return { ok: true as const, data: { ...found, today: localDate(deps.now, COLLEGE_TZ) } };
}

/** An in-app reminder to a student who needs a nudge. One per student per day. */
export async function sendNudge(deps: Deps, userId: string, batchId: unknown, studentId: unknown): Promise<Result<{ sent: boolean }>> {
  const found = await batchForAdmin(deps, userId, batchId);
  if (!found) return NOT_FOUND;
  const { batch } = found;
  if (batch.isSample) return fail("not_allowed", "This is sample data, so reminders are off.");
  if (!z.uuid().safeParse(studentId).success) return fail("not_found", "That student isn't in this batch.");
  const member = await deps.store.getMembership(studentId as string);
  if (!member || member.batchId !== batch.id) return fail("not_found", "That student isn't in this batch.");
  const today = localDate(deps.now, COLLEGE_TZ);
  const rows = await batchRows(deps, batch, today);
  const row = studentRows({ batch, members: rows.members, missions: rows.missions, today }).find((s) => s.userId === member.userId);
  if (!row || row.missedDays < NUDGE_AFTER_DAYS) {
    return fail("not_allowed", `Reminders are for students who missed ${NUDGE_AFTER_DAYS} or more days in a row.`);
  }
  const outcome = await deps.store.insertNudge(batch.id, member.userId, userId, today);
  return { ok: true, data: { sent: outcome === "created" } };
}

// ---------------------------------------------------------------------------
// Students: join with consent, leave, see reminders
// ---------------------------------------------------------------------------

export type JoinPreview = {
  code: string;
  orgName: string;
  batchName: string;
  startsOn: LocalDate;
  endsOn: LocalDate;
  sections: string[];
  grantsPass: boolean;
  firstName: string;
  /** Why joining isn't possible right now, or null. */
  blocked: null | { reason: "ended" | "sample" | "member_elsewhere" | "member_here"; currentOrg?: string };
};

function normaliseCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const code = raw.trim().toUpperCase();
  return JOIN_CODE.test(code) ? code : null;
}

export async function previewJoin(deps: Deps, userId: string, rawCode: unknown): Promise<Result<JoinPreview>> {
  const code = normaliseCode(rawCode);
  const bad = fail("not_found", "That code doesn't match a batch. Check it with your training and placement cell.");
  if (!code) return bad;
  const profile = await deps.store.getProfile(userId);
  if (!profile) return fail("not_started", "Start your season first.");
  const batch = await deps.store.findBatchByCode(code);
  if (!batch) return bad;
  const org = await deps.store.getOrg(batch.orgId);
  if (!org) return bad;
  const today = localDate(deps.now, COLLEGE_TZ);
  const membership = await deps.store.getMembership(userId);
  let blocked: JoinPreview["blocked"] = null;
  if (membership?.batchId === batch.id) blocked = { reason: "member_here" };
  else if (membership) {
    const current = await deps.store.getBatch(membership.batchId);
    const currentOrg = current ? await deps.store.getOrg(current.orgId) : null;
    blocked = { reason: "member_elsewhere", currentOrg: currentOrg?.name ?? "another college" };
  } else if (batch.isSample) blocked = { reason: "sample" };
  else if (today > batch.endsOn) blocked = { reason: "ended" };
  return {
    ok: true,
    data: {
      code,
      orgName: org.name,
      batchName: batch.name,
      startsOn: batch.startsOn,
      endsOn: batch.endsOn,
      sections: batch.sections,
      grantsPass: batch.grantsPass,
      firstName: profile.firstName,
      blocked,
    },
  };
}

/** What a /join/CODE link shows before sign-in: the college and batch names only. */
export async function publicBatchInvite(store: SeasonStore, rawCode: unknown, now: Date) {
  const code = normaliseCode(rawCode);
  if (!code) return null;
  const batch = await store.findBatchByCode(code);
  const org = batch ? await store.getOrg(batch.orgId) : null;
  if (!batch || !org) return null;
  return {
    code,
    orgName: org.name,
    batchName: batch.name,
    open: !batch.isSample && localDate(now, COLLEGE_TZ) <= batch.endsOn,
  };
}

const joinSchema = z.object({
  code: z.string(),
  section: z.string().max(30).nullable(),
  initial: z.string().regex(/^[A-Za-z]?$/),
  consent: z.literal(true),
});

export async function joinBatch(deps: Deps, userId: string, input: unknown): Promise<Result<{ batchName: string }>> {
  const parsed = joinSchema.safeParse(input);
  if (!parsed.success) {
    return fail("invalid_input", "Check the code and your initial, and agree to share your mission progress.");
  }
  const preview = await previewJoin(deps, userId, parsed.data.code);
  if (!preview.ok) return preview;
  const p = preview.data;
  if (p.blocked?.reason === "member_here") return { ok: true, data: { batchName: p.batchName } };
  if (p.blocked?.reason === "member_elsewhere") {
    return fail("already_member", `You're already in a batch at ${p.blocked.currentOrg}. Leave it first in Me.`);
  }
  if (p.blocked?.reason === "sample") return fail("batch_closed", "This is a sample batch for demos. Ask your college for its real code.");
  if (p.blocked?.reason === "ended") return fail("batch_closed", "This batch's season has ended.");
  const section = parsed.data.section;
  if (p.sections.length > 0 ? !section || !p.sections.includes(section) : section !== null) {
    return fail("invalid_input", "Pick your section.");
  }

  const batch = (await deps.store.findBatchByCode(p.code))!;
  const profile = (await deps.store.getProfile(userId))!;
  const initial = parsed.data.initial.toUpperCase();
  const outcome = await deps.store.insertMember({
    userId,
    batchId: batch.id,
    displayName: initial ? `${profile.firstName} ${initial}.` : profile.firstName,
    section: p.sections.length ? section : null,
    consentedAt: deps.now,
  });
  if (outcome === "exists") return fail("already_member", "You're already in a batch. Leave it first in Me.");

  // A paid batch gives Season Pass access for its season dates (from now if it already started).
  if (batch.grantsPass) {
    const seasonStart = startOfLocalDay(batch.startsOn, profile.timeZone);
    const seasonEnd = startOfLocalDay(addDays(batch.endsOn, 1), profile.timeZone);
    const startsAt = seasonStart > deps.now ? seasonStart : deps.now;
    if (seasonEnd > startsAt) {
      await deps.store.upsertEntitlement(userId, { kind: "batch", startsAt, endsAt: seasonEnd, source: batchSource(batch.id) });
    }
  }
  return { ok: true, data: { batchName: batch.name } };
}

/** Leaves the batch: the college stops seeing the student from now on. The account stays. */
export async function leaveBatch(deps: Deps, userId: string): Promise<Result<{ left: boolean }>> {
  const membership = await deps.store.getMembership(userId);
  if (!membership) return { ok: true, data: { left: false } };
  await deps.store.deleteMember(userId);
  await deps.store.endEntitlement(userId, batchSource(membership.batchId), deps.now);
  return { ok: true, data: { left: true } };
}

export type Membership = {
  orgName: string;
  batchName: string;
  section: string | null;
  displayName: string;
  startsOn: LocalDate;
  endsOn: LocalDate;
  grantsPass: boolean;
};

export async function loadMembership(deps: Deps, userId: string): Promise<Membership | null> {
  const m = await deps.store.getMembership(userId);
  if (!m) return null;
  const batch = await deps.store.getBatch(m.batchId);
  const org = batch ? await deps.store.getOrg(batch.orgId) : null;
  if (!batch || !org) return null;
  return {
    orgName: org.name,
    batchName: batch.name,
    section: m.section,
    displayName: m.displayName,
    startsOn: batch.startsOn,
    endsOn: batch.endsOn,
    grantsPass: batch.grantsPass,
  };
}

/** The newest reminder from the student's college that they haven't dismissed. */
export async function studentNudge(deps: Deps, userId: string): Promise<{ id: string; orgName: string } | null> {
  const nudge = await deps.store.unseenNudge(userId);
  if (!nudge) return null;
  const membership = await deps.store.getMembership(userId);
  // Only from the batch they're still in.
  if (!membership || membership.batchId !== nudge.batchId) return null;
  const batch = await deps.store.getBatch(nudge.batchId);
  const org = batch ? await deps.store.getOrg(batch.orgId) : null;
  return org ? { id: nudge.id, orgName: org.name } : null;
}

export async function dismissNudge(deps: Deps, userId: string, nudgeId: unknown): Promise<Result<{ dismissed: true }>> {
  if (!z.uuid().safeParse(nudgeId).success) return fail("invalid_input", "That reminder doesn't exist.");
  await deps.store.markNudgeSeen(userId, nudgeId as string, deps.now);
  return { ok: true, data: { dismissed: true } };
}

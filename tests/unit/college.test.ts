import { beforeEach, describe, expect, it } from "vitest";
import { hasFullAccess, hasSeasonPass } from "@/lib/game/access";
import { addDays, localDate, startOfLocalDay } from "@/lib/game/dates";
import type { Answers } from "@/lib/plan-engine/answers";
import {
  computeOverview,
  computeWeeklyReport,
  missedDays,
  type CollegeMember,
  type CollegeMission,
} from "@/lib/server/college-metrics";
import { sampleBatchData } from "@/lib/server/college-sample";
import {
  acceptInvite,
  adminBatches,
  createBatch,
  createOrg,
  createSampleBatch,
  createTpoInvite,
  dismissNudge,
  joinBatch,
  leaveBatch,
  loadOverview,
  loadReport,
  loadStudents,
  previewJoin,
  sendNudge,
  studentNudge,
} from "@/lib/server/college-service";
import { completeMission, ensureToday, startSeason, type Deps } from "@/lib/server/season-service";
import { MemoryStore } from "@/lib/server/store-memory";

describe("startOfLocalDay", () => {
  it("finds midnight in India and across a daylight-saving change", () => {
    expect(startOfLocalDay("2026-11-01", "Asia/Kolkata").toISOString()).toBe("2026-10-31T18:30:00.000Z");
    expect(startOfLocalDay("2026-03-08", "America/New_York").toISOString()).toBe("2026-03-08T05:00:00.000Z");
    expect(startOfLocalDay("2026-03-09", "America/New_York").toISOString()).toBe("2026-03-09T04:00:00.000Z");
  });
});

// ---------------------------------------------------------------------------
// The numbers
// ---------------------------------------------------------------------------

const BATCH = { startsOn: "2026-10-01", endsOn: "2026-12-29", sections: ["CSE-A", "CSE-B"] };
const member = (userId: string, section: string | null, joinedOn = "2026-10-01"): CollegeMember => ({
  userId,
  displayName: `${userId.toUpperCase()} K.`,
  section,
  joinedOn,
});
const done = (userId: string, localDate: string, missionId = "car-01"): CollegeMission => ({
  userId,
  localDate,
  status: "done",
  missionId,
});

describe("missedDays", () => {
  const m = member("a", null);
  it("counts full days in a row without a mission, not today", () => {
    expect(missedDays(m, new Set(["2026-10-10"]), BATCH, "2026-10-14")).toBe(3);
    expect(missedDays(m, new Set(["2026-10-10", "2026-10-14"]), BATCH, "2026-10-14")).toBe(0);
    expect(missedDays(m, new Set(["2026-10-13"]), BATCH, "2026-10-14")).toBe(0);
  });
  it("counts from when the student joined, or the season began", () => {
    expect(missedDays(m, undefined, BATCH, "2026-10-01")).toBe(0);
    expect(missedDays(m, undefined, BATCH, "2026-10-05")).toBe(4);
    expect(missedDays(member("b", null, "2026-10-04"), undefined, BATCH, "2026-10-05")).toBe(1);
  });
});

describe("computeOverview", () => {
  const today = "2026-10-14";
  const members = [member("a", "CSE-A"), member("b", "CSE-A"), member("c", "CSE-B"), member("d", "CSE-B")];
  const missions = [
    // a: active every day this week, including a mock interview
    ...[8, 9, 10, 11, 12, 13, 14].map((d) => done("a", `2026-10-${String(d).padStart(2, "0")}`)),
    done("a", "2026-10-12", "car-18"),
    // b: last active on the 10th: missed 11, 12, 13
    done("b", "2026-10-10"),
    done("b", "2026-10-03"),
    // c: active last week only
    done("c", "2026-10-05"),
    // d: never; and a skipped row that doesn't count
    { userId: "d", localDate: "2026-10-13", status: "skipped", missionId: "car-02" },
  ];
  const base = { batch: BATCH, members, missions, today, range: "7" as const, section: null, nudgedToday: new Set(["b"]) };

  it("counts this week against last week", () => {
    const o = computeOverview(base);
    expect(o.memberCount).toBe(4);
    expect(o.position).toMatchObject({ started: true, week: 2, totalWeeks: 13 });
    expect(o.activeThisWeek).toEqual({ count: 2, prev: 2 });
    // 8 missions this week (7 + mock) plus b's 1, over 4 students
    expect(o.missionsPerStudent.value).toBe(2.3);
    expect(o.mockInterviews).toBe(1);
  });

  it("lists students who missed 3 or more days, most missed first", () => {
    const o = computeOverview(base);
    expect(o.nudgeList.map((r) => [r.userId, r.missedDays, r.nudgedToday])).toEqual([
      ["d", 13, false],
      ["c", 8, false],
      ["b", 3, true],
    ]);
    expect(o.needNudge.count).toBe(3);
  });

  it("gives one share per day, and the chosen range", () => {
    const week = computeOverview(base).daily;
    expect(week).toHaveLength(7);
    expect(week.at(-1)).toEqual({ date: "2026-10-14", active: 1, share: 25 });
    expect(week.find((d) => d.date === "2026-10-10")).toEqual({ date: "2026-10-10", active: 2, share: 50 });
    expect(computeOverview({ ...base, range: "season" }).daily).toHaveLength(14);
  });

  it("filters by section, and fills the sections table", () => {
    const o = computeOverview({ ...base, section: "CSE-B" });
    expect(o.memberCount).toBe(2);
    expect(o.sections.map((s) => s.name)).toEqual(["CSE-B"]);
    const all = computeOverview(base).sections;
    expect(all).toEqual([
      { name: "CSE-A", students: 2, active: 2, activeShare: 100, missionsPerStudent: 4.5, needNudge: 1 },
      { name: "CSE-B", students: 2, active: 0, activeShare: 0, missionsPerStudent: 0, needNudge: 2 },
    ]);
  });

  it("shows nothing before the season starts", () => {
    const o = computeOverview({ ...base, today: "2026-09-20" });
    expect(o.position.started).toBe(false);
    expect(o.daily).toEqual([]);
    expect(o.nudgeList).toEqual([]);
    expect(o.activeThisWeek.count).toBe(0);
  });

  it("builds the weekly report: trend and the most consistent students", () => {
    const r = computeWeeklyReport({ batch: BATCH, members, missions, today });
    expect(r.weekFrom).toBe("2026-10-08");
    expect(r.trend.map((t) => t.activeShare)).toEqual([50, 50]);
    expect(r.top.map((s) => [s.displayName, s.activeDaysThisWeek])).toEqual([
      ["A K.", 7],
      ["B K.", 1],
    ]);
  });
});

describe("sample data", () => {
  it("is the same every time, with 264 students in three sections", () => {
    const batch = { id: "x", startsOn: "2026-10-01", sections: [] };
    const one = sampleBatchData(batch, "2026-10-24");
    expect(one.members).toHaveLength(264);
    expect(new Set(one.members.map((m) => m.section))).toEqual(new Set(["CSE-A", "CSE-B", "CSE-C"]));
    expect(sampleBatchData(batch, "2026-10-24")).toEqual(one);
    const o = computeOverview({ batch: { ...batch, endsOn: "2026-12-29" }, ...one, today: "2026-10-24", range: "14", section: null, nudgedToday: new Set() });
    expect(o.activeThisWeek.count).toBeGreaterThan(150);
    expect(o.nudgeList.length).toBeGreaterThan(5);
  });
});

// ---------------------------------------------------------------------------
// The service: rights, consent, access, reminders
// ---------------------------------------------------------------------------

const FOUNDER = "f0000000-0000-4000-8000-000000000001";
const TPO_A = "a0000000-0000-4000-8000-000000000001";
const TPO_B = "b0000000-0000-4000-8000-000000000001";
const STUDENT = "50000000-0000-4000-8000-000000000001";
const OTHER = "50000000-0000-4000-8000-000000000002";
const NOW = new Date("2026-10-14T06:30:00Z"); // noon in India
const at = (days: number) => new Date(NOW.getTime() + days * 86_400_000);

const answers: Answers = {
  firstName: "Aarav",
  ageBracket: "21-24",
  city: "hyderabad",
  situation: "student",
  goal: "first_job",
  pillarOrder: ["career", "mind", "body", "money"],
  dailyMinutes: 45,
  budget: "free",
  gym: false,
  laptop: true,
  enemy: "no_plan",
  intensity: "ambitious",
};

let store: MemoryStore;
const deps = (now = NOW): Deps => ({ store, now });

async function setUp() {
  store = new MemoryStore();
  store.founders.add(FOUNDER);
  const orgA = await createOrg(deps(), FOUNDER, { name: "College A", city: "Pune" });
  const orgB = await createOrg(deps(), FOUNDER, { name: "College B", city: "" });
  if (!orgA.ok || !orgB.ok) throw new Error("orgs");
  const batchA = await createBatch(deps(), FOUNDER, {
    orgId: orgA.data.id,
    name: "CSE 2027",
    startsOn: "2026-10-01",
    endsOn: "2026-12-29",
    sections: "CSE-A, CSE-B, CSE-A",
    grantsPass: true,
  });
  const batchB = await createBatch(deps(), FOUNDER, {
    orgId: orgB.data.id,
    name: "ECE 2027",
    startsOn: "2026-10-01",
    endsOn: "2026-10-30",
    sections: "",
    grantsPass: false,
  });
  if (!batchA.ok || !batchB.ok) throw new Error("batches");
  for (const [tpo, org] of [[TPO_A, orgA.data.id], [TPO_B, orgB.data.id]] as const) {
    const invite = await createTpoInvite(deps(), FOUNDER, { orgId: org, label: "TPO" });
    if (!invite.ok) throw new Error("invite");
    expect((await acceptInvite(deps(), tpo, invite.data.token)).ok).toBe(true);
  }
  for (const id of [STUDENT, OTHER]) {
    expect((await startSeason(deps(at(-10)), id, answers, { timeZone: "Asia/Kolkata" })).ok).toBe(true);
  }
  return { a: batchA.data, b: batchB.data };
}

let batches: Awaited<ReturnType<typeof setUp>>;
beforeEach(async () => {
  batches = await setUp();
});

describe("founder tools", () => {
  it("are founder-only", async () => {
    expect((await createOrg(deps(), TPO_A, { name: "Mine", city: "" })).ok).toBe(false);
    expect((await createSampleBatch(deps(), STUDENT)).ok).toBe(false);
    const invite = await createTpoInvite(deps(), TPO_A, { orgId: batches.a.orgId, label: "" });
    expect(invite.ok || invite.error).toBe("not_allowed");
  });

  it("dedupe sections and give every batch its own join code", () => {
    expect(batches.a.sections).toEqual(["CSE-A", "CSE-B"]);
    expect(batches.a.joinCode).toMatch(/^[A-Z0-9]{8}$/);
    expect(batches.a.joinCode).not.toBe(batches.b.joinCode);
  });

  it("reject a season longer than 120 days or ending before it starts", async () => {
    const base = { orgId: batches.a.orgId, name: "Long", sections: "", grantsPass: false };
    expect((await createBatch(deps(), FOUNDER, { ...base, startsOn: "2026-10-01", endsOn: "2027-03-01" })).ok).toBe(false);
    expect((await createBatch(deps(), FOUNDER, { ...base, startsOn: "2026-10-01", endsOn: "2026-09-01" })).ok).toBe(false);
  });
});

describe("TPO invites", () => {
  it("work once, and expire after 14 days", async () => {
    const invite = await createTpoInvite(deps(), FOUNDER, { orgId: batches.a.orgId, label: "" });
    if (!invite.ok) throw new Error();
    expect(store.orgInvites.some((i) => i.tokenHash === invite.data.token)).toBe(false); // only the hash is kept
    expect((await acceptInvite(deps(), OTHER, invite.data.token)).ok).toBe(true);
    expect((await acceptInvite(deps(), STUDENT, invite.data.token)).ok).toBe(false);
    const late = await createTpoInvite(deps(), FOUNDER, { orgId: batches.a.orgId, label: "" });
    if (!late.ok) throw new Error();
    expect((await acceptInvite(deps(at(15)), STUDENT, late.data.token)).ok).toBe(false);
  });
});

describe("a TPO", () => {
  it("sees only their own college's batches", async () => {
    expect((await adminBatches(deps(), TPO_A)).map((b) => b.name)).toEqual(["CSE 2027"]);
    expect((await loadOverview(deps(), TPO_A, batches.a.id, "14", null)).ok).toBe(true);
    for (const load of [loadOverview, loadStudents, loadReport] as const) {
      const r = await (load as (d: Deps, u: string, b: string, ...rest: unknown[]) => Promise<{ ok: boolean }>)(deps(), TPO_A, batches.b.id, "14", null);
      expect(r.ok).toBe(false);
    }
    expect((await loadOverview(deps(), STUDENT, batches.a.id, "14", null)).ok).toBe(false);
  });
});

describe("joining a batch", () => {
  const join = (userId: string, extra: Record<string, unknown> = {}) =>
    joinBatch(deps(), userId, { code: batches.a.joinCode.toLowerCase(), section: "CSE-B", initial: "k", consent: true, ...extra });

  it("needs consent and a section from the list", async () => {
    expect((await join(STUDENT, { consent: false })).ok).toBe(false);
    expect((await join(STUDENT, { section: "CSE-Z" })).ok).toBe(false);
    expect((await join(STUDENT, { section: null })).ok).toBe(false);
    expect((await join(STUDENT, { initial: "KR" })).ok).toBe(false);
    expect(await store.getMembership(STUDENT)).toBeNull();
  });

  it("shares only a first name, initial and section, and appears in College HQ", async () => {
    expect((await join(STUDENT)).ok).toBe(true);
    expect(await store.getMembership(STUDENT)).toMatchObject({ displayName: "Aarav K.", section: "CSE-B" });
    const o = await loadOverview(deps(), TPO_A, batches.a.id, "14", null);
    expect(o.ok && o.data.overview.memberCount).toBe(1);
    // Joining again is fine; joining another college isn't.
    expect((await join(STUDENT)).ok).toBe(true);
    const other = await joinBatch(deps(), STUDENT, { code: batches.b.joinCode, section: null, initial: "", consent: true });
    expect(other.ok || other.error).toBe("already_member");
  });

  it("gives Season Pass access for the season when the batch is paid, and ends it on leaving", async () => {
    const after = at(20); // the free week is long over
    expect(hasFullAccess(after, store.profiles.get(STUDENT)!.trialEndsAt, await store.entitlements(STUDENT))).toBe(false);
    await join(STUDENT);
    const grants = await store.entitlements(STUDENT);
    expect(grants).toMatchObject([{ kind: "batch", source: `batch:${batches.a.id}` }]);
    expect(grants[0].endsAt.toISOString()).toBe("2026-12-29T18:30:00.000Z"); // midnight after Dec 29, India time
    expect(hasSeasonPass(after, grants)).toBe(true);
    expect(hasFullAccess(after, store.profiles.get(STUDENT)!.trialEndsAt, grants)).toBe(true);

    expect((await leaveBatch(deps(at(1)), STUDENT)).ok).toBe(true);
    expect(hasFullAccess(after, store.profiles.get(STUDENT)!.trialEndsAt, await store.entitlements(STUDENT))).toBe(false);
    const o = await loadOverview(deps(at(1)), TPO_A, batches.a.id, "14", null);
    expect(o.ok && o.data.overview.memberCount).toBe(0);
    // The account stays.
    expect(store.profiles.has(STUDENT)).toBe(true);
  });

  it("refuses sample batches and seasons that ended", async () => {
    const sample = await createSampleBatch(deps(), FOUNDER);
    if (!sample.ok) throw new Error();
    const s = await joinBatch(deps(), STUDENT, { code: sample.data.joinCode, section: "CSE-A", initial: "", consent: true });
    expect(s.ok || s.error).toBe("batch_closed");
    const ended = await joinBatch(deps(at(30)), STUDENT, { code: batches.b.joinCode, section: null, initial: "", consent: true });
    expect(ended.ok || ended.error).toBe("batch_closed");
    const preview = await previewJoin(deps(), STUDENT, "NOPE1234");
    expect(preview.ok).toBe(false);
  });
});

describe("reminders", () => {
  beforeEach(async () => {
    // Joined five days ago, so missed days count from then.
    await joinBatch(deps(at(-5)), STUDENT, { code: batches.a.joinCode, section: "CSE-A", initial: "", consent: true });
    await joinBatch(deps(), OTHER, { code: batches.a.joinCode, section: "CSE-B", initial: "", consent: true });
  });

  it("go only to students who missed 3+ days, once a day, from their own college", async () => {
    // OTHER is active today: no reminder needed.
    const t = await ensureToday(deps(), OTHER);
    if (!t.ok) throw new Error();
    await completeMission(deps(), OTHER, t.data.missions[0].id);
    const notNeeded = await sendNudge(deps(), TPO_A, batches.a.id, OTHER);
    expect(notNeeded.ok || notNeeded.error).toBe("not_allowed");

    // STUDENT hasn't done a mission since joining on Oct 9: 5 days missed.
    expect((await sendNudge(deps(), TPO_B, batches.a.id, STUDENT)).ok).toBe(false);
    const sent = await sendNudge(deps(), TPO_A, batches.a.id, STUDENT);
    expect(sent.ok && sent.data.sent).toBe(true);
    const again = await sendNudge(deps(), TPO_A, batches.a.id, STUDENT);
    expect(again.ok && again.data.sent).toBe(false);

    const nudge = await studentNudge(deps(), STUDENT);
    expect(nudge).toMatchObject({ orgName: "College A" });
    await dismissNudge(deps(), STUDENT, nudge!.id);
    expect(await studentNudge(deps(), STUDENT)).toBeNull();
  });

  it("disappear when the student leaves the batch", async () => {
    await sendNudge(deps(), TPO_A, batches.a.id, STUDENT);
    await leaveBatch(deps(), STUDENT);
    expect(await studentNudge(deps(), STUDENT)).toBeNull();
  });

  it("are off for sample batches", async () => {
    const sample = await createSampleBatch(deps(), FOUNDER);
    if (!sample.ok) throw new Error();
    const r = await sendNudge(deps(), FOUNDER, sample.data.id, STUDENT);
    expect(r.ok).toBe(false);
    const o = await loadOverview(deps(), FOUNDER, sample.data.id, "season", "CSE-A");
    expect(o.ok && o.data.overview.memberCount).toBe(88);
    expect(localDate(NOW, "Asia/Kolkata")).toBe(addDays(sample.data.startsOn, 24));
  });
});

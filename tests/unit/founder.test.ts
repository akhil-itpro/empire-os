import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { computeFounderMetrics, LAUNCH_ITEMS, type FounderSnapshot } from "@/lib/server/founder";

const toDate = (d: Date) => d.toISOString().slice(0, 10);
const at = (date: string) => new Date(`${date}T10:00:00Z`);

const snapshot: FounderSnapshot = {
  signups: [
    { userId: "a", signupDate: "2026-10-01" },
    { userId: "b", signupDate: "2026-10-01" },
    { userId: "c", signupDate: "2026-10-09" },
  ],
  events: [
    ...["x1", "x2", "x3", "x4"].map((anonId) => ({ name: "landing_view", userId: null, anonId, props: {}, at: at("2026-10-01") })),
    ...["x1", "x2"].map((anonId) => ({ name: "quiz_start", userId: null, anonId, props: {}, at: at("2026-10-01") })),
    { name: "quiz_start", userId: null, anonId: "x1", props: {}, at: at("2026-10-01") },
    { name: "paywall_view", userId: "a", anonId: null, props: { source: "locked_week" }, at: at("2026-10-08") },
    { name: "paywall_view", userId: "b", anonId: null, props: { source: "locked_week" }, at: at("2026-10-08") },
    { name: "landing_view", userId: null, anonId: "old", props: {}, at: at("2026-09-01") },
    { name: "season_start", userId: "c", anonId: null, props: { season: 2 }, at: at("2026-10-09") },
  ],
  missions: [
    { userId: "a", localDate: "2026-10-02", pillar: "career", missionId: "car-01", status: "done", skipReason: null },
    { userId: "a", localDate: "2026-10-08", pillar: "body", missionId: "bod-01", status: "done", skipReason: null },
    { userId: "b", localDate: "2026-10-02", pillar: "mind", missionId: "min-01", status: "skipped", skipReason: "too_hard" },
    { userId: "b", localDate: "2026-10-03", pillar: "mind", missionId: "min-01", status: "skipped", skipReason: "no_time" },
  ],
  reservations: { total: 3, founderPrice: 2 },
  referralSignups: 1,
};

describe("Founder HQ metrics", () => {
  const m = computeFounderMetrics(snapshot, "2026-10-01", "2026-10-10", toDate);

  it("counts sign-ups per day in the range", () => {
    expect(m.signupsPerDay).toHaveLength(10);
    expect(m.signupsPerDay[0]).toEqual({ date: "2026-10-01", count: 2 });
  });

  it("counts distinct people per funnel step, with drop-off from the step before", () => {
    expect(m.funnel[0]).toEqual({ label: "Landing", count: 4, dropOff: null });
    expect(m.funnel[1]).toEqual({ label: "Quiz started", count: 2, dropOff: 50 });
    expect(m.funnel.at(-1)).toMatchObject({ label: "Came back next day", count: 1 });
  });

  it("measures Day-1 and Day-7 return only for students old enough", () => {
    expect(m.returns[0]).toEqual({ day: 1, cohort: 3, returned: 1, rate: 33 });
    expect(m.returns[1]).toEqual({ day: 7, cohort: 2, returned: 1, rate: 50 });
    expect(m.returns[2]).toEqual({ day: 30, cohort: 0, returned: 0, rate: null });
  });

  it("lists most-skipped missions with reasons and paywall views by source", () => {
    expect(m.mostSkipped).toEqual([{ missionId: "min-01", skips: 2, reasons: { too_hard: 1, no_time: 1 } }]);
    expect(m.paywallBySource).toEqual([{ source: "locked_week", views: 2 }]);
    expect(m.missionsByPillar).toEqual({ career: 1, body: 1, mind: 0, money: 0 });
  });

  it("counts students who started their next season", () => {
    expect(m.nextSeasons).toBe(1);
  });

  it("keeps the launch checklist in step with its migration", () => {
    const sql = readFileSync("supabase/migrations/20261024120000_launch_checklist.sql", "utf8");
    expect(LAUNCH_ITEMS).toHaveLength(18);
    for (const item of LAUNCH_ITEMS) expect(sql).toContain(`'${item.id}'`);
  });
});

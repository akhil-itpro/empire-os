import { describe, expect, it } from "vitest";
import { addDays } from "@/lib/game/dates";
import { earnedMedals, MEDALS, newMedals, type MedalInput, type MedalMission } from "@/lib/game/medals";
import type { Pillar } from "@/lib/pillars";

const START = "2026-10-01";
let nextId = 1;

/** One mission row; done ones finish at 18:00 India time unless `at` says otherwise. */
function row(day: number, patch: Partial<MedalMission> = {}): MedalMission {
  const localDate = addDays(START, day);
  const status = patch.status ?? "done";
  return {
    id: String(nextId++),
    missionId: `m-${nextId}`,
    localDate,
    pillar: "career",
    minutes: 10,
    status,
    completedAt: status === "done" ? new Date(`${localDate}T12:30:00Z`) : null,
    pack: null,
    ...patch,
  };
}

/** A full day: three done missions in three pillars. */
function fullDay(day: number, pillars: Pillar[] = ["career", "body", "mind"]) {
  return pillars.map((pillar) => row(day, { pillar }));
}

function medals(missions: MedalMission[], extra: Partial<MedalInput> = {}) {
  return earnedMedals({
    missions,
    timeZone: "Asia/Kolkata",
    seasonStart: START,
    reviews: 0,
    bosses: 0,
    packSizes: { placement_prep: 10 },
    ...extra,
  });
}

describe("medals", () => {
  it("has twelve medals, each with a name and how to earn it", () => {
    expect(MEDALS).toHaveLength(12);
    expect(new Set(MEDALS.map((m) => m.id)).size).toBe(12);
    for (const m of MEDALS) expect(m.how).toMatch(/\.$/);
  });

  it("gives nothing before the first finished mission", () => {
    expect(medals([]).size).toBe(0);
    expect(medals([row(0, { status: "assigned" }), row(0, { status: "skipped" })]).size).toBe(0);
  });

  it("dates First mission to the first day a mission was done", () => {
    const earned = medals([row(0, { status: "skipped" }), row(2), row(3)]);
    expect(earned.get("first_mission")).toBe("2026-10-03");
  });

  it("gives Full day only when every live mission of a day is done; swapped ones don't count", () => {
    expect(medals([row(0), row(0), row(0, { status: "assigned" })]).has("full_day")).toBe(false);
    expect(medals([row(0), row(0), row(0, { status: "skipped" })]).has("full_day")).toBe(false);
    expect(medals([row(0), row(0), row(0, { status: "swapped" })]).get("full_day")).toBe("2026-10-01");
  });

  it("counts Early start between 5 and 8 in the morning, in the student's own time zone", () => {
    // 01:00 UTC is 06:30 in India.
    const early = row(0, { completedAt: new Date("2026-10-01T01:00:00Z") });
    expect(medals([early]).get("early_start")).toBe("2026-10-01");
    expect(medals([early], { timeZone: "Europe/London" }).has("early_start")).toBe(false);
    // 22:00 UTC is 03:30 the next morning in India: too late at night, not an early start.
    expect(medals([row(1, { completedAt: new Date("2026-10-01T22:00:00Z") })]).has("early_start")).toBe(false);
  });

  it("gives Comeback for a mission after a missed day, not for back-to-back days", () => {
    expect(medals([row(0), row(1), row(2)]).has("comeback")).toBe(false);
    expect(medals([row(0), row(2)]).get("comeback")).toBe("2026-10-03");
    // An open day with nothing done is still a missed day.
    expect(medals([row(0), row(1, { status: "assigned" }), row(2)]).get("comeback")).toBe("2026-10-03");
  });

  it("gives All four for every pillar within one season week, not across two", () => {
    const split = [...fullDay(5, ["career", "body"]), ...fullDay(7, ["mind", "money"])];
    expect(medals(split).has("all_four")).toBe(false);
    const oneWeek = [...fullDay(1, ["career", "body"]), ...fullDay(4, ["mind", "money"])];
    expect(medals(oneWeek).get("all_four")).toBe("2026-10-05");
  });

  it("gives Clean sweep for 7 complete days in a row", () => {
    const six = [0, 1, 2, 3, 4, 5].flatMap((d) => fullDay(d));
    expect(medals(six).has("clean_sweep")).toBe(false);
    expect(medals([...six, ...fullDay(6)]).get("clean_sweep")).toBe("2026-10-07");
    // A gap restarts the run.
    const gap = [0, 1, 2, 4, 5, 6, 7].flatMap((d) => fullDay(d));
    expect(medals(gap).has("clean_sweep")).toBe(false);
  });

  it("gives Ten hours at 600 minutes, Fifty missions at 50 and Thirty days at 30 active days", () => {
    const missions = Array.from({ length: 30 }, (_, d) => [row(d, { minutes: 10 }), row(d, { minutes: 10 })]).flat();
    const earned = medals(missions);
    expect(earned.get("ten_hours")).toBe(addDays(START, 29));
    expect(earned.get("fifty")).toBe(addDays(START, 24));
    expect(earned.get("thirty_days")).toBe(addDays(START, 29));
    expect(medals(missions.slice(0, 49)).has("fifty")).toBe(false);
  });

  it("gives Pack finished when all of a pack's missions are done", () => {
    const pack = Array.from({ length: 10 }, (_, i) => row(i, { pack: "placement_prep", missionId: `pp-${i}` }));
    expect(medals(pack.slice(0, 9)).has("pack")).toBe(false);
    expect(medals(pack).get("pack")).toBe(addDays(START, 9));
  });

  it("gives War Room and Boss beaten from their counts, without a date", () => {
    const earned = medals([], { reviews: 1, bosses: 2 });
    expect(earned.get("war_room")).toBeNull();
    expect(earned.get("boss")).toBeNull();
  });

  it("lists newly earned medals in a fixed order", () => {
    const first = row(0);
    const second = row(0, { status: "assigned" });
    const before = medals([first, second]);
    const after = medals([first, { ...second, status: "done", completedAt: new Date("2026-10-01T01:00:00Z") }], {
      reviews: 1,
    });
    expect(newMedals(before, after)).toEqual(["full_day", "early_start", "war_room"]);
  });
});

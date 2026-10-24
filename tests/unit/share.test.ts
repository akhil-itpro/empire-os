import { beforeEach, describe, expect, it } from "vitest";
import type { Answers } from "@/lib/plan-engine/answers";
import { completeMission, ensureToday, startSeason, type Deps } from "@/lib/server/season-service";
import { displayName, setShareName, shareCard, shareOptions } from "@/lib/server/share-service";
import { MemoryStore } from "@/lib/server/store-memory";

const ALICE = "11111111-1111-4111-8111-111111111111";
const START = new Date("2026-11-01T04:30:00Z");
const at = (days: number) => new Date(START.getTime() + days * 86_400_000);

const answers: Answers = {
  firstName: "asha",
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
const deps = (now = START): Deps => ({ store, now });

/** Completes one mission on each of `days` days in a row from the start. */
async function activeFor(days: number) {
  for (let d = 0; d < days; d++) {
    const t = await ensureToday(deps(at(d)), ALICE);
    if (!t.ok) throw new Error(t.message);
    await completeMission(deps(at(d)), ALICE, t.data.missions[0].id);
  }
}

beforeEach(async () => {
  store = new MemoryStore();
  await startSeason(deps(), ALICE, answers, { timeZone: "Asia/Kolkata" });
});

describe("share cards", () => {
  it("offers only the cards a student has earned", async () => {
    expect((await shareOptions(deps(), ALICE)).map((o) => o.kind)).toEqual(["archetype"]);
    await activeFor(7);
    const kinds = (await shareOptions(deps(at(6)), ALICE)).map((o) => o.kind);
    expect(kinds).toContain("streak-7");
    expect(kinds).not.toContain("streak-30");
  });

  it("refuses a card that isn't earned, even when asked for directly", async () => {
    expect(await shareCard(deps(), ALICE, "streak-30")).toMatchObject({ ok: false, error: "not_found" });
    expect(await shareCard(deps(), ALICE, "rank")).toMatchObject({ ok: false, error: "not_found" });
    expect(await shareCard(deps(), ALICE, "season")).toMatchObject({ ok: false, error: "not_found" });
    expect(await shareCard(deps(), ALICE, "../etc")).toMatchObject({ ok: false, error: "not_found" });
    expect((await shareCard(deps(at(89)), ALICE, "season")).ok).toBe(true);
  });

  it("shows initials by default, the first name only when chosen, and nothing private", async () => {
    const card = await shareCard(deps(), ALICE, "archetype");
    if (!card.ok) throw new Error(card.message);
    expect(card.data).toMatchObject({ title: "I'm The Grinder.", name: "A.", ticks: 1 });
    expect(card.data.line).toBe("I win by stacking small reps, every single day. Season 1, day 1.");
    expect(JSON.stringify(card.data)).not.toMatch(/hyderabad|asha/i);
    await setShareName(deps(), ALICE, "first_name");
    const named = await shareCard(deps(), ALICE, "archetype");
    expect(named.ok && named.data.name).toBe("asha");
    expect(await setShareName(deps(), ALICE, "email")).toMatchObject({ ok: false, error: "invalid_input" });
  });

  it("makes a streak card from the real streak", async () => {
    await activeFor(7);
    const card = await shareCard(deps(at(6)), ALICE, "streak-7");
    expect(card.ok && card.data).toMatchObject({ title: "7 days in a row.", ticks: 7 });
  });

  it("turns a first name into one capital initial", () => {
    expect(displayName("rahul", "initials")).toBe("R.");
    expect(displayName("Ánanya", "initials")).toBe("Á.");
    expect(displayName("Rahul", "first_name")).toBe("Rahul");
  });
});

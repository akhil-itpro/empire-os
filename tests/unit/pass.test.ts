import { beforeEach, describe, expect, it } from "vitest";
import { passOffer, paywallSource, perDayInr } from "@/lib/game/pass";
import type { Answers } from "@/lib/plan-engine/answers";
import { loadPass, reservePass } from "@/lib/server/pass-service";
import { startSeason, type Deps } from "@/lib/server/season-service";
import { MemoryStore } from "@/lib/server/store-memory";

const ALICE = "11111111-1111-4111-8111-111111111111";
const START = new Date("2026-11-01T04:30:00Z");
const at = (days: number) => new Date(START.getTime() + days * 86_400_000);

const answers: Answers = {
  firstName: "Asha",
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

beforeEach(async () => {
  store = new MemoryStore();
  await startSeason(deps(), ALICE, answers, { timeZone: "Asia/Kolkata" });
});

describe("prices", () => {
  it("shows the founder price for the first 500, then the full price", () => {
    expect(passOffer(0)).toMatchObject({ priceInr: 299, founderPrice: true, perDay: "3.30" });
    expect(passOffer(499)).toMatchObject({ priceInr: 299, founderPrice: true, founderTaken: 499 });
    expect(passOffer(500)).toMatchObject({ priceInr: 499, founderPrice: false, perDay: "5.50" });
    expect(passOffer(800).founderTaken).toBe(500);
  });

  it("works out the daily cost honestly over 90 days", () => {
    expect(perDayInr(499)).toBe("5.50");
    expect(perDayInr(299)).toBe("3.30");
  });

  it("only accepts known paywall sources", () => {
    expect(paywallSource("path_week")).toBe("path_week");
    expect(paywallSource("<script>")).toBe("direct");
  });
});

describe("reserve mode", () => {
  it("saves a reservation at the server's price and logs the click", async () => {
    const r = await reservePass(deps(at(8)), ALICE, "trial_end");
    expect(r).toEqual({ ok: true, data: { priceInr: 299, founderPrice: true, created: true } });
    expect(store.reservations).toHaveLength(1);
    expect(store.events.find((e) => e.name === "reserve_click")?.props).toEqual({ source: "trial_end", price: 299, created: true });
  });

  it("keeps the first reservation and price on a second tap", async () => {
    await reservePass(deps(at(8)), ALICE, "me");
    for (let i = 0; i < 500; i++) store.reservations.push({ userId: `x${i}`, priceInr: 299, founderPrice: true, createdAt: START });
    const again = await reservePass(deps(at(9)), ALICE, "me");
    expect(again).toEqual({ ok: true, data: { priceInr: 299, founderPrice: true, created: false } });
    expect(store.reservations.filter((r) => r.userId === ALICE)).toHaveLength(1);
  });

  it("charges the full price once 500 founder places are taken", async () => {
    for (let i = 0; i < 500; i++) store.reservations.push({ userId: `x${i}`, priceInr: 299, founderPrice: true, createdAt: START });
    expect(await reservePass(deps(at(8)), ALICE, "me")).toMatchObject({ ok: true, data: { priceInr: 499, founderPrice: false } });
  });

  it("doesn't take a reservation from a pass holder", async () => {
    store.grants.push({ userId: ALICE, kind: "season_pass", startsAt: START, endsAt: at(90), source: "test" });
    expect(await reservePass(deps(at(8)), ALICE, "me")).toMatchObject({ ok: false, error: "already_has_pass" });
  });

  it("loads the offer with the real founder count and the student's access", async () => {
    store.reservations.push({ userId: "x", priceInr: 299, founderPrice: true, createdAt: START });
    const during = await loadPass(deps(at(3)), ALICE);
    expect(during.ok && during.data).toMatchObject({
      firstName: "Asha",
      archetypeName: "The Grinder",
      paymentsLive: false,
      offer: { priceInr: 299, founderTaken: 1 },
      accessUntil: "2026-11-08",
      passUntil: null,
      reservation: null,
    });
    const after = await loadPass(deps(at(8)), ALICE);
    expect(after.ok && after.data.accessUntil).toBeNull();
  });
});

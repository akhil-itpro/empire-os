import { beforeEach, describe, expect, it } from "vitest";
import type { Answers } from "@/lib/plan-engine/answers";
import { loadReferrals, normalizeEmail } from "@/lib/server/referral-service";
import { completeMission, ensureToday, startSeason, type Deps } from "@/lib/server/season-service";
import { MemoryStore } from "@/lib/server/store-memory";

const INVITER = "11111111-1111-4111-8111-111111111111";
const FRIEND = "22222222-2222-4222-8222-222222222222";
const START = new Date("2026-11-01T04:30:00Z");
const at = (days: number) => new Date(START.getTime() + days * 86_400_000);
const DAY = 86_400_000;

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
const friendId = (n: number) => `33333333-3333-4333-8333-${String(n).padStart(12, "0")}`;

async function join(userId: string, code?: string) {
  const r = await startSeason(deps(), userId, answers, { timeZone: "Asia/Kolkata", referralCode: code });
  expect(r.ok).toBe(true);
}

/** Completes one mission on each given day; returns the last result. */
async function activeOn(userId: string, days: number[]) {
  let last;
  for (const d of days) {
    const t = await ensureToday(deps(at(d)), userId);
    if (!t.ok) throw new Error(t.message);
    last = await completeMission(deps(at(d)), userId, t.data.missions[0].id);
  }
  return last!;
}

const bonuses = (userId: string) => store.grants.filter((g) => g.userId === userId && g.kind === "referral_bonus");

beforeEach(async () => {
  store = new MemoryStore();
  await join(INVITER);
});

describe("referrals", () => {
  it("links a new student to the inviter and logs the sign-up", async () => {
    await join(FRIEND, store.profiles.get(INVITER)!.referralCode.toLowerCase());
    expect(store.referrals).toMatchObject([{ referrerId: INVITER, referredId: FRIEND, status: "signed_up" }]);
    expect(store.events.some((e) => e.name === "referral_signup" && e.userId === FRIEND)).toBe(true);
  });

  it("rewards both with 7 days on the friend's third active day, once", async () => {
    await join(FRIEND, store.profiles.get(INVITER)!.referralCode);
    expect((await activeOn(FRIEND, [0, 2])).ok).toBe(true);
    expect(bonuses(FRIEND)).toHaveLength(0);
    const third = await activeOn(FRIEND, [4]);
    expect(third.ok && third.data.referralReward).toBe(true);

    // The friend is still in their free week, so the 7 days start when it ends.
    const [friendBonus] = bonuses(FRIEND);
    expect(friendBonus.startsAt).toEqual(store.profiles.get(FRIEND)!.trialEndsAt);
    expect(friendBonus.endsAt.getTime() - friendBonus.startsAt.getTime()).toBe(7 * DAY);
    expect(bonuses(INVITER)).toHaveLength(1);
    expect(store.referrals[0].status).toBe("rewarded");
    expect(store.events.filter((e) => e.name === "referral_reward")).toHaveLength(2);

    const fourth = await activeOn(FRIEND, [5]);
    expect(fourth.ok && fourth.data.referralReward).toBe(false);
    expect(bonuses(FRIEND)).toHaveLength(1);
    expect(bonuses(INVITER)).toHaveLength(1);
  });

  it("keeps a rewarded student on full access after the free week", async () => {
    await join(FRIEND, store.profiles.get(INVITER)!.referralCode);
    await activeOn(FRIEND, [0, 1, 2]);
    const day10 = await ensureToday(deps(at(10)), FRIEND);
    expect(day10.ok && day10.data.missions).toHaveLength(3);
    const day15 = await ensureToday(deps(at(15)), FRIEND);
    expect(day15.ok && day15.data.fullAccess).toBe(false);
  });

  it("blocks a self-referral through an email alias", async () => {
    store.emails.set(INVITER, "Asha.Rao@gmail.com");
    store.emails.set(FRIEND, "asharao+second@googlemail.com");
    await join(FRIEND, store.profiles.get(INVITER)!.referralCode);
    expect(store.referrals[0].status).toBe("blocked");
    await activeOn(FRIEND, [0, 1, 2]);
    expect(bonuses(FRIEND)).toHaveLength(0);
    expect(bonuses(INVITER)).toHaveLength(0);
    expect((await loadReferrals(deps(), INVITER)).joined).toBe(0);
  });

  it("never links an account that already exists", async () => {
    await join(FRIEND);
    await join(FRIEND, store.profiles.get(INVITER)!.referralCode);
    expect(store.referrals).toHaveLength(0);
  });

  it("caps the inviter at 5 rewards, while friends still get theirs", async () => {
    const code = store.profiles.get(INVITER)!.referralCode;
    for (let n = 1; n <= 6; n++) {
      await join(friendId(n), code);
      await activeOn(friendId(n), [0, 1, 2]);
    }
    expect(bonuses(INVITER)).toHaveLength(5);
    for (let n = 1; n <= 6; n++) expect(bonuses(friendId(n)), `friend ${n}`).toHaveLength(1);
    expect(store.referrals.filter((r) => r.status === "rewarded")).toHaveLength(5);
    expect(store.referrals.filter((r) => r.status === "qualified")).toHaveLength(1);
    expect(await loadReferrals(deps(), INVITER)).toEqual({ joined: 6, rewards: 5, maxRewards: 5 });
    // Rewards stack back to back: five weeks after the inviter's free week.
    const ends = bonuses(INVITER).map((b) => b.endsAt.getTime());
    expect(Math.max(...ends)).toBe(store.profiles.get(INVITER)!.trialEndsAt.getTime() + 35 * DAY);
  });

  it("still rewards the friend if the inviter deleted their account", async () => {
    await join(FRIEND, store.profiles.get(INVITER)!.referralCode);
    // Like the database cascade, deleting the inviter would remove the referral, so keep
    // the row here to check the friend side alone.
    store.profiles.delete(INVITER);
    await activeOn(FRIEND, [0, 1, 2]);
    expect(bonuses(FRIEND)).toHaveLength(1);
  });

  it("normalises emails so aliases match", () => {
    expect(normalizeEmail(" A.B+tag@Gmail.com ")).toBe("ab@gmail.com");
    expect(normalizeEmail("a.b+tag@outlook.com")).toBe("a.b@outlook.com");
  });
});

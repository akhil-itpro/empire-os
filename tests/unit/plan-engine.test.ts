import { describe, expect, it } from "vitest";
import { addDays, seasonPosition } from "@/lib/game/dates";
import { PILLARS } from "@/lib/pillars";
import { answersSchema, GOALS, type Answers } from "@/lib/plan-engine/answers";
import { ARCHETYPE_INFO, archetypeFor } from "@/lib/plan-engine/archetype";
import { LIBRARY } from "@/lib/plan-engine/library";
import { MISSIONS, type Mission } from "@/lib/plan-engine/missions";
import { PACK_MISSIONS, PACKS } from "@/lib/plan-engine/packs";
import { previewPlan } from "@/lib/plan-engine/preview";
import {
  effectiveMinutes,
  selectDailyMissions,
  slotPillars,
  targetDifficulty,
  type DayContext,
  type WeekAdjustments,
} from "@/lib/plan-engine/select";

const puneStudent: Answers = {
  firstName: "Rahul",
  ageBracket: "21-24",
  city: "pune",
  situation: "student",
  goal: "first_job",
  pillarOrder: ["career", "mind", "body", "money"],
  dailyMinutes: 30,
  budget: "free",
  gym: false,
  laptop: false,
  enemy: "phone",
  intensity: "steady",
};

const bengaluruPro: Answers = {
  firstName: "Priya",
  ageBracket: "25-28",
  city: "bengaluru",
  situation: "working_tech",
  goal: "earn_more",
  pillarOrder: ["body", "career", "money", "mind"],
  dailyMinutes: 90,
  budget: "flexible",
  gym: true,
  laptop: true,
  enemy: "low_energy",
  intensity: "beast",
};

const START = "2026-11-01";

/** Runs a whole season for one student, feeding each day's missions back as history. */
function simulateSeason(answers: Answers, days = 90, adjustments?: WeekAdjustments) {
  const history: { missionId: string; date: string }[] = [];
  const result: { date: string; missions: Mission[] }[] = [];
  for (let i = 0; i < days; i++) {
    const date = addDays(START, i);
    const pos = seasonPosition(START, date);
    const ctx: DayContext = {
      seed: answers.firstName,
      date,
      seasonDay: pos.day,
      week: pos.week,
      act: pos.act,
      archetype: archetypeFor(answers.goal),
      settings: answers,
      history,
      adjustments,
    };
    const missions = selectDailyMissions(MISSIONS, ctx).map((s) => s.mission);
    missions.forEach((m) => history.push({ missionId: m.id, date }));
    result.push({ date, missions });
  }
  return result;
}

describe("mission library", () => {
  it("has 120 missions, 30 per pillar, with unique ids", () => {
    expect(MISSIONS).toHaveLength(120);
    for (const p of PILLARS) expect(MISSIONS.filter((m) => m.pillar === p)).toHaveLength(30);
    expect(new Set(MISSIONS.map((m) => m.id)).size).toBe(120);
  });

  it("is at least 60% free and doable at home with only a phone", () => {
    const easy = MISSIONS.filter((m) => m.cost === "free" && m.needs === "none");
    expect(easy.length / MISSIONS.length).toBeGreaterThanOrEqual(0.6);
  });

  it("has 10 missions per act in every pillar, and 5-minute ones in each", () => {
    for (const p of PILLARS) {
      for (const act of [1, 2, 3] as const) {
        const group = MISSIONS.filter((m) => m.pillar === p && m.act === act);
        expect(group, `${p} act ${act}`).toHaveLength(10);
        expect(group.filter((m) => m.minutes === 5 && m.cost === "free" && m.needs === "none").length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("keeps titles short enough for two lines on a ticket, and how-tos to two lines", () => {
    for (const m of LIBRARY) {
      expect(m.title.length, m.id).toBeLessThanOrEqual(64);
      expect(m.howTo.length, m.id).toBeLessThanOrEqual(130);
    }
  });

  it("never gives medical, supplement, crash-diet or investment advice", () => {
    const banned = /supplement|fasting|crash|diet pill|keto|stock|share market|crypto|mutual fund|invest in|guaranteed|cure/i;
    for (const m of LIBRARY) {
      // "No supplements needed." is a safety line, not advice to take them.
      const text = `${m.title} ${m.howTo}`.replace("No supplements needed.", "");
      expect(text, m.id).not.toMatch(banned);
    }
  });
});

describe("archetypes", () => {
  it("maps every main goal to its archetype", () => {
    const map = Object.fromEntries(GOALS.map((g) => [g.id, ARCHETYPE_INFO[archetypeFor(g.id)].name]));
    expect(map).toEqual({
      first_job: "The Grinder",
      earn_more: "The Climber",
      side_income: "The Founder",
      fitness: "The Warrior",
      discipline: "The Phoenix",
      money: "The Strategist",
    });
  });

  it("gives every archetype two or three milestones in each of the three acts", () => {
    for (const info of Object.values(ARCHETYPE_INFO)) {
      expect(info.milestones).toHaveLength(3);
      for (const act of info.milestones) expect(act.length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("daily selection", () => {
  it("puts the top pillar in slot 1, the second in slot 2, and rotates the other two in slot 3", () => {
    const order = ["career", "mind", "body", "money"] as const;
    expect(slotPillars([...order], 1)).toEqual(["career", "mind", "body"]);
    expect(slotPillars([...order], 2)).toEqual(["career", "mind", "money"]);
    expect(slotPillars([...order], 3)).toEqual(["career", "mind", "body"]);
  });

  it("gives three different missions in the right pillars every day of the season", () => {
    for (const answers of [puneStudent, bengaluruPro]) {
      for (const [i, day] of simulateSeason(answers).entries()) {
        expect(day.missions, day.date).toHaveLength(3);
        expect(new Set(day.missions.map((m) => m.id)).size).toBe(3);
        expect(day.missions.map((m) => m.pillar)).toEqual(slotPillars(answers.pillarOrder, i + 1));
      }
    }
  });

  it("fits the daily minutes and always includes a 5 to 10 minute quick win", () => {
    for (const answers of [puneStudent, bengaluruPro, { ...puneStudent, dailyMinutes: 15 as const }]) {
      for (const day of simulateSeason(answers)) {
        const total = day.missions.reduce((s, m) => s + m.minutes, 0);
        expect(total, day.date).toBeLessThanOrEqual(answers.dailyMinutes);
        expect(day.missions.some((m) => m.minutes <= 10)).toBe(true);
      }
    }
  });

  it("starts Day 1 with a 5-minute mission in slot 1", () => {
    for (const answers of [puneStudent, bengaluruPro]) {
      expect(simulateSeason(answers, 1)[0].missions[0].minutes).toBe(5);
    }
  });

  it("respects budget, gym and laptop", () => {
    for (const day of simulateSeason(puneStudent)) {
      for (const m of day.missions) {
        expect(m.cost).toBe("free");
        expect(m.needs).not.toBe("gym");
        expect(m.needs).not.toBe("laptop");
      }
    }
  });

  it("doesn't repeat a mission within 5 days", () => {
    for (const answers of [puneStudent, bengaluruPro, { ...puneStudent, dailyMinutes: 15 as const }]) {
      const days = simulateSeason(answers);
      days.forEach((day, i) => {
        const before = days.slice(Math.max(0, i - 5), i).flatMap((d) => d.missions.map((m) => m.id));
        for (const m of day.missions) expect(before, `${day.date} ${m.id}`).not.toContain(m.id);
      });
    }
  });

  it("matches missions to the current act most of the time", () => {
    const days = simulateSeason(bengaluruPro);
    const missions = days.flatMap((d, i) => d.missions.map((m) => ({ m, act: seasonPosition(START, addDays(START, i)).act })));
    const matching = missions.filter(({ m, act }) => m.act === act).length;
    expect(matching / missions.length).toBeGreaterThan(0.6);
  });

  it("prefers missions tagged with the student's archetype", () => {
    const tagged = (answers: Answers, archetype: string) =>
      simulateSeason(answers, 28)
        .flatMap((d) => d.missions)
        .filter((m) => m.pillar === "money" && m.archetypes.includes(archetype as never)).length;
    const founder = { ...puneStudent, goal: "side_income" as const, pillarOrder: ["money", "career", "mind", "body"] as Answers["pillarOrder"] };
    const strategist = { ...founder, goal: "money" as const };
    expect(tagged(founder, "founder")).toBeGreaterThan(tagged(strategist, "founder"));
    expect(tagged(strategist, "strategist")).toBeGreaterThan(tagged(founder, "strategist"));
  });

  it("is deterministic: the same inputs give the same missions", () => {
    const a = simulateSeason(bengaluruPro, 10).map((d) => d.missions.map((m) => m.id));
    const b = simulateSeason(bengaluruPro, 10).map((d) => d.missions.map((m) => m.id));
    expect(a).toEqual(b);
  });

  it("raises difficulty with intensity and week", () => {
    expect(targetDifficulty("steady", 1)).toBe(1);
    expect(targetDifficulty("steady", 7)).toBe(2);
    expect(targetDifficulty("ambitious", 10)).toBe(3);
    expect(targetDifficulty("beast", 1)).toBe(2);
    expect(targetDifficulty("beast", 5)).toBe(3);
    expect(targetDifficulty("beast", 5, -1)).toBe(2);
    expect(targetDifficulty("steady", 1, -1)).toBe(1);
  });

  it("gives a free student one mission in the pillar they picked", () => {
    const ctx: DayContext = {
      seed: "x",
      date: START,
      seasonDay: 9,
      week: 2,
      act: 1,
      archetype: "grinder",
      settings: puneStudent,
      history: [],
      singlePillar: "money",
    };
    const picked = selectDailyMissions(MISSIONS, ctx);
    expect(picked).toHaveLength(1);
    expect(picked[0].mission.pillar).toBe("money");
  });

  it("never picks a mission excluded today, so a swap gives something new", () => {
    const base: DayContext = {
      seed: "x",
      date: START,
      seasonDay: 3,
      week: 1,
      act: 1,
      archetype: "grinder",
      settings: puneStudent,
      history: [],
    };
    const first = selectDailyMissions(MISSIONS, base);
    const swapped = selectDailyMissions(MISSIONS, {
      ...base,
      singlePillar: first[0].pillar,
      excludeIds: first.map((s) => s.mission.id),
    });
    expect(swapped[0].mission.id).not.toBe(first[0].mission.id);
    expect(swapped[0].mission.pillar).toBe(first[0].pillar);
  });
});

describe("Pune student and Bengaluru IT professional", () => {
  it("get visibly different missions", () => {
    const pune = simulateSeason(puneStudent, 7).flatMap((d) => d.missions);
    const blr = simulateSeason(bengaluruPro, 7).flatMap((d) => d.missions);
    const puneIds = new Set(pune.map((m) => m.id));
    const shared = blr.filter((m) => puneIds.has(m.id)).length;
    // Most of the first week is different.
    expect(shared / blr.length).toBeLessThan(0.3);
    // The professional has 90 minutes and a gym; the student has 30 minutes, phone only.
    const avg = (ms: Mission[]) => ms.reduce((s, m) => s + m.minutes, 0) / ms.length;
    expect(avg(blr)).toBeGreaterThan(avg(pune) * 1.8);
    expect(pune.every((m) => m.cost === "free" && m.needs !== "gym" && m.needs !== "laptop")).toBe(true);
    // Their Day 1 slot 1 is their own top pillar.
    expect(pune[0].pillar).toBe("career");
    expect(blr[0].pillar).toBe("body");
  });

  it("get different archetypes, milestones and reasons", () => {
    const a = previewPlan(puneStudent);
    const b = previewPlan(bengaluruPro);
    expect(a.archetype.name).toBe("The Grinder");
    expect(b.archetype.name).toBe("The Climber");
    expect(a.milestones).not.toEqual(b.milestones);
    expect(a.whyThisPlan).not.toEqual(b.whyThisPlan);
  });
});

describe("War Room adjustments", () => {
  it("drops a time tier", () => {
    expect(effectiveMinutes(90, -1)).toBe(60);
    expect(effectiveMinutes(15, -1)).toBe(15);
    for (const day of simulateSeason(bengaluruPro, 14, { timeTierShift: -1 })) {
      expect(day.missions.reduce((s, m) => s + m.minutes, 0)).toBeLessThanOrEqual(60);
    }
  });

  it("goes free-only when money is the blocker", () => {
    for (const day of simulateSeason(bengaluruPro, 14, { freeOnly: true })) {
      expect(day.missions.every((m) => m.cost === "free")).toBe(true);
    }
  });

  it("adds sleep and energy missions for an energy blocker", () => {
    const tagged = (adj?: WeekAdjustments) =>
      simulateSeason(puneStudent, 14, adj).flatMap((d) => d.missions).filter((m) => m.tags.includes("energy")).length;
    expect(tagged({ focusTag: "energy" })).toBeGreaterThan(tagged());
  });
});

describe("previewPlan", () => {
  it("returns the archetype, top two pillars, three sample missions and three acts of milestones", () => {
    const p = previewPlan(puneStudent);
    expect(p.archetype.identity).toBe("You win by stacking small reps, every single day.");
    expect(p.topPillars).toEqual(["career", "mind"]);
    expect(p.sampleMissions).toHaveLength(3);
    expect(p.milestones).toHaveLength(3);
  });

  it("quotes the student's real answers, with true numbers", () => {
    const p = previewPlan(puneStudent);
    expect(p.summary).toBe("College student, 30 minutes a day, no gym.");
    expect(p.whyThisPlan).toHaveLength(3);
    expect(p.whyThisPlan[0]).toMatch(/^You have 30 minutes a day, so your Day 1 missions take /);
    const total = p.sampleMissions.reduce((s, m) => s + m.minutes, 0);
    expect(total).toBeLessThanOrEqual(30);
    expect(p.whyThisPlan[1]).toBe("Phone only, so nothing needs a laptop.");
    expect(p.whyThisPlan[2]).toBe("Free resources only, because you asked for that.");
  });
});

describe("answers schema", () => {
  it("accepts valid answers", () => {
    expect(answersSchema.safeParse(puneStudent).success).toBe(true);
    expect(answersSchema.safeParse({ ...puneStudent, firstName: "Anne-Marie" }).success).toBe(true);
    expect(answersSchema.safeParse({ ...puneStudent, firstName: "राहुल" }).success).toBe(true);
  });

  it("rejects names with markup, numbers or too many characters", () => {
    for (const firstName of ["<script>", "R4hul", "", "x".repeat(41)]) {
      expect(answersSchema.safeParse({ ...puneStudent, firstName }).success, firstName).toBe(false);
    }
  });

  it("rejects options that aren't on the list", () => {
    expect(answersSchema.safeParse({ ...puneStudent, city: "london" }).success).toBe(false);
    expect(answersSchema.safeParse({ ...puneStudent, dailyMinutes: 1000 }).success).toBe(false);
    expect(answersSchema.safeParse({ ...puneStudent, pillarOrder: ["career", "career", "body", "money"] }).success).toBe(false);
    expect(answersSchema.safeParse({ ...puneStudent, pillarOrder: ["career", "body", "money"] }).success).toBe(false);
  });
});

describe("packs", () => {
  /** Runs `days` days with the given packs on, counting a pack mission done when given. */
  function runWithPacks(answers: Answers, packs: string[], days: number) {
    const history: { missionId: string; date: string }[] = [];
    const packDone: string[] = [];
    const result: Mission[][] = [];
    for (let i = 0; i < days; i++) {
      const date = addDays(START, i);
      const pos = seasonPosition(START, date);
      const missions = selectDailyMissions(LIBRARY, {
        seed: answers.firstName,
        date,
        seasonDay: pos.day,
        week: pos.week,
        act: pos.act,
        archetype: archetypeFor(answers.goal),
        settings: answers,
        history,
        packs,
        packDone,
      }).map((s) => s.mission);
      for (const m of missions) {
        history.push({ missionId: m.id, date });
        if (m.pack) packDone.push(m.id);
      }
      result.push(missions);
    }
    return { result, packDone };
  }

  it("has four packs of 10 missions, one per pillar, free and phone-only", () => {
    expect(PACKS.map((p) => p.pillar)).toEqual([...PILLARS]);
    for (const pack of PACKS) {
      const missions = PACK_MISSIONS.filter((m) => m.pack === pack.id);
      expect(missions, pack.id).toHaveLength(10);
      for (const m of missions) {
        expect(m.pillar, m.id).toBe(pack.pillar);
        expect(m.cost, m.id).toBe("free");
        expect(m.needs, m.id).toBe("none");
      }
    }
    expect(new Set(LIBRARY.map((m) => m.id)).size).toBe(160);
  });

  it("never gives pack missions to a student who hasn't turned the pack on", () => {
    const { result } = runWithPacks(puneStudent, [], 30);
    expect(result.flat().filter((m) => m.pack !== null)).toEqual([]);
    const onlyHome = runWithPacks(puneStudent, ["home_muscle"], 30).result.flat();
    expect(onlyHome.filter((m) => m.pack !== null && m.pack !== "home_muscle")).toEqual([]);
  });

  it("prefers a turned-on pack's missions whenever that pillar comes up", () => {
    // Career is Rahul's top pillar, so it comes up every day.
    const { result } = runWithPacks(puneStudent, ["placement_prep"], 7);
    for (const day of result) expect(day.find((m) => m.pillar === "career")?.pack).toBe("placement_prep");
  });

  it("never repeats a pack mission once it's done, and runs through the pack", () => {
    const { packDone } = runWithPacks(bengaluruPro, ["home_muscle", "speak_leader"], 60);
    expect(new Set(packDone).size).toBe(packDone.length);
    expect(packDone.filter((id) => id.startsWith("hm-"))).toHaveLength(10);
  });
});

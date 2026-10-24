import { describe, expect, it } from "vitest";
import type { Answers } from "@/lib/plan-engine/answers";
import { QUESTIONS, QUESTION_COUNT } from "@/lib/quiz/questions";
import { buildingSteps, seasonReflection, timeReflection } from "@/lib/quiz/reflections";

const answers: Answers = {
  firstName: "Rahul",
  ageBracket: "21-24",
  city: "pune",
  situation: "student",
  goal: "first_job",
  pillarOrder: ["career", "mind", "body", "money"],
  dailyMinutes: 45,
  budget: "free",
  gym: false,
  laptop: false,
  enemy: "phone",
  intensity: "steady",
};

describe("quiz", () => {
  it("has the eleven questions in the spec's order", () => {
    expect(QUESTION_COUNT).toBe(11);
    expect(QUESTIONS.map((q) => q.id)).toEqual([
      "firstName",
      "city",
      "situation",
      "goal",
      "pillarOrder",
      "dailyMinutes",
      "budget",
      "gym",
      "laptop",
      "enemy",
      "intensity",
    ]);
  });

  it("uses true arithmetic: 45 minutes a day is 67.5 hours by Day 90", () => {
    expect(timeReflection("Rahul", 45, "free").title).toBe("Rahul, 45 minutes a day is 67.5 hours by Day 90.");
    expect(timeReflection("Rahul", 30, "flexible").title).toBe("Rahul, 30 minutes a day is 45 hours by Day 90.");
    expect(timeReflection("Rahul", 15, "free").title).toBe("Rahul, 15 minutes a day is 22.5 hours by Day 90.");
    expect(timeReflection("Rahul", 90, "free").title).toBe("Rahul, 90 minutes a day is at least 135 hours by Day 90.");
  });

  it("says 90 days is 13 weeks and 270 missions", () => {
    const r = seasonReflection("Rahul");
    expect(r.title).toBe("Rahul, 90 days is 13 weeks.");
    expect(r.body).toContain("270");
    expect(3 * 90).toBe(270);
    expect(Math.ceil(90 / 7)).toBe(13);
  });

  it("builds the checklist from the student's real answers", () => {
    expect(buildingSteps(answers)).toEqual([
      "Fitting three missions into 45 minutes a day",
      "Free resources only",
      "Home workouts, no gym needed",
      "Phone-friendly missions only",
      "Putting Career first, then Mind",
      "Cutting screen time first",
      "Shaping Act I for The Grinder",
    ]);
  });
});

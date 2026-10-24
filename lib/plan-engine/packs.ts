// Season Pass packs (docs/PRODUCT.md section 6): four packs of 10 missions, one per
// pillar. A student with full access turns a pack on; its missions are then preferred
// whenever that pillar comes up, and a pack mission that's done never comes back.
// Every pack mission is free and needs only a phone, so every student can finish one.
import type { Pillar } from "@/lib/pillars";
import type { Mission } from "./missions";

export const PACK_IDS = ["placement_prep", "home_muscle", "speak_leader", "savings_sprint"] as const;
export type PackId = (typeof PACK_IDS)[number];

export type Pack = { id: PackId; name: string; pillar: Pillar; description: string };

/** In pillar order: Career, Body, Mind, Money. */
export const PACKS: Pack[] = [
  {
    id: "placement_prep",
    name: "Placement Prep",
    pillar: "career",
    description: "Aptitude, technical and HR practice for campus and off-campus drives.",
  },
  {
    id: "home_muscle",
    name: "Home Muscle",
    pillar: "body",
    description: "No-equipment strength at home that builds week by week.",
  },
  {
    id: "speak_leader",
    name: "Speak Like a Leader",
    pillar: "mind",
    description: "Calm, clear speaking: fewer filler words, steadier nerves, sharper points.",
  },
  {
    id: "savings_sprint",
    name: "₹10K Savings Sprint",
    pillar: "money",
    description: "Find your money leaks and fill a savings pocket toward a target you set.",
  },
];

export const PACKS_BY_ID = new Map(PACKS.map((p) => [p.id, p]));

export function isPackId(value: unknown): value is PackId {
  return PACK_IDS.includes(value as PackId);
}

type Row = Omit<Mission, "pack" | "tags" | "cost" | "needs" | "pillar">;

const ROWS: Record<PackId, Row[]> = {
  placement_prep: [
    { id: "pp-01", act: 1, minutes: 5, difficulty: 1, archetypes: ["grinder", "climber"], title: "Write your 30-second \"Tell me about yourself\"", howTo: "Who you are, one project or strength, and the role you want. Say it aloud twice." },
    { id: "pp-02", act: 1, minutes: 10, difficulty: 1, archetypes: ["grinder"], title: "Check the eligibility rules of three target companies", howTo: "Note the marks cut-off, backlog rules and branches allowed. Mark the ones you already meet." },
    { id: "pp-03", act: 1, minutes: 20, difficulty: 2, archetypes: ["grinder"], title: "Do a timed set of 10 quant questions", howTo: "Percentages, ratios or time and work, 90 seconds each. Redo every wrong one without the timer." },
    { id: "pp-04", act: 1, minutes: 10, difficulty: 1, archetypes: ["grinder", "climber"], title: "List five technical questions for your field", howTo: "Ask a senior or look up past interview questions. Write a two-line answer to the first one." },
    { id: "pp-05", act: 2, minutes: 20, difficulty: 2, archetypes: ["grinder"], title: "Practise a group discussion opening", howTo: "Pick a current topic, write a 30-second opening with one fact, and say it aloud once." },
    { id: "pp-06", act: 2, minutes: 10, difficulty: 2, archetypes: ["grinder", "climber"], title: "Walk through your resume line by line, aloud", howTo: "For every line, say what you did and what you learned. Cut any line you can't explain." },
    { id: "pp-07", act: 2, minutes: 20, difficulty: 2, archetypes: ["grinder"], title: "Solve 10 logical reasoning questions", howTo: "Seating, blood relations or series. Time yourself, then note the type that slowed you most." },
    { id: "pp-08", act: 3, minutes: 30, difficulty: 3, archetypes: ["grinder", "climber"], title: "Run a full mock: aptitude, technical and HR", howTo: "Ten minutes each, with a friend or alone with a timer. Write down the weakest part." },
    { id: "pp-09", act: 3, minutes: 10, difficulty: 2, archetypes: ["grinder", "climber"], title: "Prepare three questions to ask the interviewer", howTo: "About the role, the team and what a good first year looks like." },
    { id: "pp-10", act: 3, minutes: 5, difficulty: 1, archetypes: [], title: "Put together your interview kit", howTo: "Resume copies, ID, a pen, your documents folder and a clean outfit, kept ready in one place." },
  ],
  home_muscle: [
    { id: "hm-01", act: 1, minutes: 10, difficulty: 1, archetypes: ["warrior"], title: "Learn the bodyweight squat with good form", howTo: "Feet shoulder-width, sit back, chest up. Three slow sets of 8. Stop if anything hurts." },
    { id: "hm-02", act: 1, minutes: 10, difficulty: 1, archetypes: ["warrior"], title: "Do wall or knee push-ups: 3 sets of 8", howTo: "Pick the version where the last two reps feel hard but clean. Rest a minute between sets." },
    { id: "hm-03", act: 1, minutes: 5, difficulty: 1, archetypes: [], title: "Hold a plank: 3 rounds of 20 seconds", howTo: "Elbows under shoulders, body in one line. Drop to your knees if your back sags." },
    { id: "hm-04", act: 1, minutes: 20, difficulty: 2, archetypes: ["warrior"], title: "Do a 15-minute full-body circuit at home", howTo: "Squats, push-ups, glute bridges and plank: 40 seconds on, 20 off, three rounds." },
    { id: "hm-05", act: 2, minutes: 10, difficulty: 2, archetypes: ["warrior"], title: "Do floor back raises: 3 sets of 10", howTo: "Lie face down, lift your chest and arms a little, hold two seconds, lower slowly." },
    { id: "hm-06", act: 2, minutes: 20, difficulty: 2, archetypes: ["warrior"], title: "Do 3 rounds of lunges, push-ups and bridges", howTo: "10 lunges each leg, 8 push-ups and 12 glute bridges per round. Rest 90 seconds between rounds." },
    { id: "hm-07", act: 2, minutes: 5, difficulty: 1, archetypes: [], title: "Stretch your hips and hamstrings for 5 minutes", howTo: "Hold each stretch for 30 seconds and breathe slowly. A gentle pull, never pain." },
    { id: "hm-08", act: 3, minutes: 30, difficulty: 3, archetypes: ["warrior"], title: "Do a 25-minute home strength session", howTo: "Warm up for 5 minutes, then 4 rounds of squats, push-ups, back raises and plank. Cool down after." },
    { id: "hm-09", act: 3, minutes: 10, difficulty: 2, archetypes: ["warrior"], title: "Test your best set of clean push-ups", howTo: "One set, good form only, then write the number down. Compare it with your first set in this pack." },
    { id: "hm-10", act: 3, minutes: 20, difficulty: 3, archetypes: ["warrior"], title: "Do slow-tempo squats and push-ups", howTo: "Three seconds down, one second up. Three sets of each, as many clean reps as you can." },
  ],
  speak_leader: [
    { id: "sl-01", act: 1, minutes: 5, difficulty: 1, archetypes: [], title: "Record yourself speaking for one minute", howTo: "Any topic. Replay it and count your filler words, like \"um\" and \"basically\". Just notice." },
    { id: "sl-02", act: 1, minutes: 5, difficulty: 1, archetypes: [], title: "Calm your voice with three slow breaths", howTo: "In for four counts, out for six, three times. Then say one sentence slowly." },
    { id: "sl-03", act: 1, minutes: 10, difficulty: 1, archetypes: ["founder", "climber"], title: "Retell a story you know in two minutes", howTo: "Beginning, problem, ending. Pause between parts instead of saying \"and then\"." },
    { id: "sl-04", act: 1, minutes: 10, difficulty: 2, archetypes: ["grinder", "climber"], title: "Make one point in three sentences", howTo: "Your point, one reason, one example. Practise on a topic you care about." },
    { id: "sl-05", act: 2, minutes: 5, difficulty: 1, archetypes: [], title: "Speak up once in a class, meeting or group", howTo: "One question or one idea, said clearly. Short is fine; the point is to start." },
    { id: "sl-06", act: 2, minutes: 10, difficulty: 2, archetypes: ["founder", "climber"], title: "Practise giving respectful feedback", howTo: "Write what worked, one thing to change and why. Read it aloud and remove anything harsh." },
    { id: "sl-07", act: 2, minutes: 20, difficulty: 2, archetypes: ["founder", "climber"], title: "Prepare and record a 3-minute talk", howTo: "Pick a topic you know, write three points on a card, and record it in one take." },
    { id: "sl-08", act: 2, minutes: 5, difficulty: 1, archetypes: [], title: "Listen fully before you answer", howTo: "In your next conversation, look at the speaker and let them finish before you reply." },
    { id: "sl-09", act: 3, minutes: 20, difficulty: 3, archetypes: [], title: "Explain a hard idea to someone younger", howTo: "A sibling, cousin or junior. Use one everyday example, then ask them to explain it back." },
    { id: "sl-10", act: 3, minutes: 10, difficulty: 2, archetypes: [], title: "Record your one-minute talk again and compare", howTo: "Same rules as your first recording. Count filler words and note one thing that improved." },
  ],
  savings_sprint: [
    { id: "ss-01", act: 1, minutes: 10, difficulty: 1, archetypes: ["strategist"], title: "Set your sprint target and savings pocket", howTo: "Pick an amount that's real for you, up to ₹10,000 by Day 90. Use a separate pocket or envelope." },
    { id: "ss-02", act: 1, minutes: 10, difficulty: 1, archetypes: ["strategist"], title: "List every subscription and recurring payment", howTo: "Apps, streaming, data packs, memberships. Mark the ones you haven't used in a month." },
    { id: "ss-03", act: 1, minutes: 5, difficulty: 1, archetypes: [], title: "Cancel or pause one subscription you don't use", howTo: "Only one today. Write down how much it saves each month." },
    { id: "ss-04", act: 1, minutes: 20, difficulty: 2, archetypes: ["strategist"], title: "Plan this week's food spend", howTo: "Count how often you'll eat out or order in. Pick two of those to cook or carry from home." },
    { id: "ss-05", act: 2, minutes: 5, difficulty: 1, archetypes: [], title: "Move this week's sprint savings into your pocket", howTo: "Any amount you saved by skipping or comparing. Moving it is what makes it real." },
    { id: "ss-06", act: 2, minutes: 20, difficulty: 2, archetypes: ["founder", "strategist"], title: "Find three things you own but don't use", howTo: "Books, gadgets, clothes. Check what similar ones sell for second-hand and pick one to sell." },
    { id: "ss-07", act: 2, minutes: 10, difficulty: 2, archetypes: ["strategist"], title: "Run a no-spend day", howTo: "Spend only on essentials today: travel, planned meals, bills. Note one urge you skipped." },
    { id: "ss-08", act: 2, minutes: 10, difficulty: 2, archetypes: [], title: "Compare prices before one planned purchase", howTo: "Check two shops or apps, or wait 48 hours. Move the difference into your pocket." },
    { id: "ss-09", act: 3, minutes: 20, difficulty: 3, archetypes: ["strategist"], title: "Check your sprint progress against your target", howTo: "Add up what's in your pocket, compare it with your target and pick one change for next week." },
    { id: "ss-10", act: 3, minutes: 5, difficulty: 1, archetypes: [], title: "Write the one money habit you'll keep", howTo: "One line, like \"Cook four dinners a week\". Put it where you'll see it every day." },
  ],
};

export const PACK_MISSIONS: Mission[] = PACKS.flatMap((pack) =>
  ROWS[pack.id].map((m) => ({ ...m, pillar: pack.pillar, cost: "free", needs: "none", tags: [], pack: pack.id })),
);

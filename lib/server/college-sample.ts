// Sample data for demo batches (`is_sample`), so the founder can show College HQ
// to a TPO before any real students join. Generated in memory, the same every
// time for a batch, and always labelled "Sample data" on screen. Nothing here is
// saved, and no real student is ever mixed in.
import { addDays, type LocalDate } from "@/lib/game/dates";
import { LIBRARY } from "@/lib/plan-engine/library";
import type { CollegeMember, CollegeMission } from "./college-metrics";
import { MOCK_INTERVIEW_MISSIONS } from "./college-metrics";

const FIRST_NAMES = [
  "Aarav", "Aditi", "Akash", "Ananya", "Arjun", "Bhavya", "Chaitanya", "Deepika", "Dev", "Divya",
  "Farhan", "Gayatri", "Harsha", "Ishaan", "Jahnavi", "Karthik", "Kavya", "Lakshmi", "Manish", "Meera",
  "Nikhil", "Nisha", "Omkar", "Pooja", "Pranav", "Priya", "Rahul", "Riya", "Rohan", "Sahana",
  "Sai", "Sameer", "Sneha", "Srinivas", "Tanvi", "Tejas", "Uday", "Varun", "Vidya", "Yash",
  "Zoya", "Imran", "Ayesha", "Joseph", "Anjali", "Kiran", "Naveen", "Swathi", "Vikram", "Keerthi",
];
const INITIALS = "ABCDGKMNPRSTV";
const DEFAULT_SECTIONS: [string, number][] = [["CSE-A", 88], ["CSE-B", 90], ["CSE-C", 86]];

/** A small seeded random number generator (mulberry32), so the sample is stable. */
function rng(seedText: string) {
  let seed = 0;
  for (const ch of seedText) seed = (Math.imul(seed, 31) + ch.charCodeAt(0)) | 0;
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function sampleBatchData(
  batch: { id: string; startsOn: LocalDate; sections: string[] },
  asOf: LocalDate,
): { members: CollegeMember[]; missions: CollegeMission[] } {
  const random = rng(batch.id);
  const sections: [string, number][] = batch.sections.length
    ? batch.sections.map((s) => [s, Math.round(264 / batch.sections.length)])
    : DEFAULT_SECTIONS;
  const career = LIBRARY.filter((m) => m.pillar === "career" && !MOCK_INTERVIEW_MISSIONS.has(m.id)).map((m) => m.id);
  const others = LIBRARY.filter((m) => m.pillar !== "career").map((m) => m.id);
  const mocks = [...MOCK_INTERVIEW_MISSIONS];
  const pick = (list: string[]) => list[Math.floor(random() * list.length)];

  const members: CollegeMember[] = [];
  const missions: CollegeMission[] = [];
  let n = 0;
  for (const [section, size] of sections) {
    for (let i = 0; i < size; i++) {
      const userId = `sample-${String(++n).padStart(4, "0")}`;
      const name = `${FIRST_NAMES[(n * 7) % FIRST_NAMES.length]} ${INITIALS[(n * 5) % INITIALS.length]}.`;
      members.push({ userId, displayName: name, section, joinedOn: batch.startsOn });
      // Most students are fairly steady; some fade, and about one in ten stopped recently.
      const steadiness = 0.45 + random() * 0.5;
      const stoppedDaysAgo = random() < 0.1 ? 3 + Math.floor(random() * 5) : null;
      for (let d = batch.startsOn; d <= asOf; d = addDays(d, 1)) {
        if (stoppedDaysAgo !== null && d > addDays(asOf, -stoppedDaysAgo)) break;
        const weekend = [0, 6].includes(new Date(`${d}T00:00:00Z`).getUTCDay());
        if (random() > steadiness * (weekend ? 0.75 : 1)) continue;
        const count = 1 + Math.floor(random() * 3);
        for (let k = 0; k < count; k++) {
          const missionId = k === 0 && random() < 0.04 ? pick(mocks) : k === 0 ? pick(career) : pick(others);
          missions.push({ userId, localDate: d, status: "done", missionId });
        }
      }
    }
  }
  return { members, missions };
}

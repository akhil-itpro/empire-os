// Writes the mission library seed as a new migration.
// Usage: npm run gen:missions -- <name>   (name defaults to "seed_mission_library")
// Run it whenever lib/plan-engine/missions.ts changes; never edit an old migration.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { MISSIONS } from "../lib/plan-engine/missions.ts";
import { missionSeedSql } from "../lib/plan-engine/seed-sql.ts";

const dir = "supabase/migrations";
const name = process.argv[2] ?? "seed_mission_library";
const sql = missionSeedSql(MISSIONS);

const seeds = readdirSync(dir).filter((f) => f.includes("mission_library") && f.endsWith(".sql")).sort();
const latest = seeds.at(-1);
if (latest && readFileSync(join(dir, latest), "utf8") === sql) {
  console.log(`No change: ${latest} already matches the library.`);
  process.exit(0);
}

const stamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
const file = join(dir, `${stamp}_${name}.sql`);
writeFileSync(file, sql);
console.log(`Wrote ${file} (${MISSIONS.length} missions).`);

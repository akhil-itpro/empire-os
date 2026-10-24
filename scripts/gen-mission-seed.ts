// Writes the mission library seed (base missions and packs) as a new migration.
// Usage: npm run gen:missions -- <name>   (name defaults to "seed_mission_library")
// Run it whenever lib/plan-engine/missions.ts or packs.ts changes; never edit an old migration.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { MISSIONS } from "../lib/plan-engine/missions.ts";
import { PACK_MISSIONS, PACKS } from "../lib/plan-engine/packs.ts";
import { missionSeedSql } from "../lib/plan-engine/seed-sql.ts";

const dir = "supabase/migrations";
const name = process.argv[2] ?? "seed_mission_library";
// The same order as LIBRARY in lib/plan-engine/library.ts (imported directly: Node needs the .ts paths).
const LIBRARY = [...MISSIONS, ...PACK_MISSIONS];
const sql = missionSeedSql(LIBRARY, PACKS);

const seeds = readdirSync(dir).filter((f) => f.includes("mission_library") && f.endsWith(".sql")).sort();
const latest = seeds.at(-1);
if (latest && readFileSync(join(dir, latest), "utf8") === sql) {
  console.log(`No change: ${latest} already matches the library.`);
  process.exit(0);
}

const stamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
const file = join(dir, `${stamp}_${name}.sql`);
writeFileSync(file, sql);
console.log(`Wrote ${file} (${LIBRARY.length} missions in ${PACKS.length} packs and the base library).`);

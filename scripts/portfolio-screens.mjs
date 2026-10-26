// Reuse the existing local browser journeys, then curate six portfolio images.
// Never points at a hosted service. Stop manual demos before running: the
// Playwright server uses port 3100 and the ignored .next-test build directory.
import { copyFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const captureDir = path.join(root, "test-results", "portfolio");
const outputDir = path.join(root, "docs", "images");
const result = spawnSync(process.execPath, [
  path.join(root, "node_modules", "@playwright", "test", "cli.js"),
  "test", "tests/e2e/funnel.spec.ts", "tests/e2e/screens.spec.ts", "--workers=1",
], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, SHOTS_DIR: path.relative(root, captureDir) },
});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

mkdirSync(outputDir, { recursive: true });
const gallery = {
  "01-landing.png": "landing.png",
  "07-reveal.png": "archetype.png",
  "hq-2-one-done.png": "student-hq.png",
  "path-viewport.png": "season-path.png",
  "war-room-viewport.png": "war-room.png",
  "college-overview-laptop.png": "college-hq.png",
};
for (const [source, destination] of Object.entries(gallery)) {
  copyFileSync(path.join(captureDir, source), path.join(outputDir, destination));
  console.log(`Saved docs/images/${destination}`);
}
console.log("Review all six images before committing. Data is synthetic; dates and totals vary.");

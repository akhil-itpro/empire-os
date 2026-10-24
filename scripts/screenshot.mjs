// Takes screenshots of a page on the running dev server, one phone screen per image.
// Usage: node scripts/screenshot.mjs styleguide [width=390] [outDir=test-results/screens]
// (Write the route without its leading slash: Git Bash turns "/styleguide" into a file path.)
// Needs `npm run dev` running. Prints any browser console errors.
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";

const route = `/${(process.argv[2] ?? "").replace(/^\/+/, "")}`;
const width = Number(process.argv[3] ?? 390);
const outDir = process.argv[4] ?? "test-results/screens";
const height = width < 600 ? 844 : 900;
const name = route === "/" ? "home" : route.replace(/^\//, "").replace(/[^\w-]+/g, "_");

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width, height },
  deviceScaleFactor: 1.5,
  isMobile: width < 600,
  hasTouch: width < 600,
});
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(String(e)));

await page.goto(`http://localhost:3000${route}`, { waitUntil: "networkidle" });
await page.waitForTimeout(400);
const total = await page.evaluate(() => document.documentElement.scrollHeight);
const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);

let i = 0;
for (let y = 0; y < total; y += height) {
  const file = join(outDir, `${name}-${width}-${i}.png`);
  await page.screenshot({
    path: file,
    fullPage: true,
    clip: { x: 0, y, width, height: Math.min(height, total - y) },
  });
  console.log(file);
  i++;
}
if (scrollWidth > width) console.log(`Warning: page scrolls sideways (${scrollWidth}px wide).`);
console.log(errors.length ? `Console errors:\n${errors.join("\n")}` : "No console errors.");
await browser.close();

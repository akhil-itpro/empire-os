// Draws the app icons (the brass medallion with three chevrons) as PNGs.
// Usage: node scripts/gen-icons.mjs   (writes public/icons/* and app/icon.png, app/apple-icon.png)
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

function ticks(count, lit, r1, r2) {
  let litD = "";
  let dimD = "";
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 - Math.PI / 2;
    const seg = `M${(180 + r1 * Math.cos(a)).toFixed(1)} ${(180 + r1 * Math.sin(a)).toFixed(1)}L${(180 + r2 * Math.cos(a)).toFixed(1)} ${(180 + r2 * Math.sin(a)).toFixed(1)}`;
    if (i < lit) litD += seg;
    else dimD += seg;
  }
  return { litD, dimD };
}

/** scale: share of the canvas the medallion fills (maskable icons keep a safe zone). */
function svg(size, scale) {
  const { litD, dimD } = ticks(90, 90, 150, 172);
  const m = size * scale;
  const offset = (size - m) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#0C1310"/>
  <g transform="translate(${offset} ${offset}) scale(${m / 360})">
    <circle cx="180" cy="180" r="178" fill="#101915" stroke="#2A3A31" stroke-width="2"/>
    <path d="${dimD}" stroke="#2A3A31" stroke-width="7" stroke-linecap="round" fill="none"/>
    <path d="${litD}" stroke="#C9A24B" stroke-width="7" stroke-linecap="round" fill="none"/>
    <circle cx="180" cy="180" r="136" fill="#141E19" stroke="#8C6A2A" stroke-width="4"/>
    <path d="M115 160l65-45 65 45M115 205l65-45 65 45M115 250l65-45 65 45" fill="none" stroke="#C9A24B" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;
}

const outputs = [
  { file: "public/icons/icon-192.png", size: 192, scale: 0.92 },
  { file: "public/icons/icon-512.png", size: 512, scale: 0.92 },
  // Maskable icons are cropped to a circle or squircle: keep the mark inside the middle 80%.
  { file: "public/icons/maskable-512.png", size: 512, scale: 0.72 },
  { file: "app/apple-icon.png", size: 180, scale: 0.86 },
  { file: "app/icon.png", size: 64, scale: 0.96 },
];

mkdirSync("public/icons", { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
for (const o of outputs) {
  await page.setViewportSize({ width: o.size, height: o.size });
  await page.setContent(`<html><body style="margin:0">${svg(o.size, o.scale)}</body></html>`);
  await page.locator("svg").screenshot({ path: o.file });
  console.log(`Wrote ${o.file}`);
}
await browser.close();

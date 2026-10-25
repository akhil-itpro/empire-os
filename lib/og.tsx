// Share previews (1200 x 630) for links pasted into WhatsApp, LinkedIn and search.
// Built with next/og from the brand fonts in assets/fonts; no photos.
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

const C = { field: "#0C1310", rule: "#2A3A31", bone: "#ECE5D3", moss: "#9AA597", brass: "#C9A24B" };
const PILLARS = [
  { label: "Career", color: "#3987E5" },
  { label: "Body", color: "#D95926" },
  { label: "Mind", color: "#9085E9" },
  { label: "Money", color: "#199E70" },
];

const font = (file: string) => readFile(join(process.cwd(), "assets/fonts", file));

async function fonts() {
  const [display, stencil, regular, semibold] = await Promise.all([
    font("BigShoulders-ExtraBold.ttf"),
    font("BigShouldersStencil-Black.ttf"),
    font("SchibstedGrotesk-Regular.ttf"),
    font("SchibstedGrotesk-SemiBold.ttf"),
  ]);
  return [
    { name: "Big Shoulders", data: display, weight: 800 as const, style: "normal" as const },
    { name: "Big Shoulders Stencil", data: stencil, weight: 900 as const, style: "normal" as const },
    { name: "Schibsted Grotesk", data: regular, weight: 400 as const, style: "normal" as const },
    { name: "Schibsted Grotesk", data: semibold, weight: 600 as const, style: "normal" as const },
  ];
}

/** Wordmark, an eyebrow line, one big title, a short line, and the four pillars. */
export async function ogImage({ eyebrow, title, line }: { eyebrow: string; title: string; line: string }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: C.field,
          padding: "56px 72px",
          fontFamily: "Schibsted Grotesk",
          color: C.bone,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, fontSize: 40, letterSpacing: 1.6 }}>
          <span style={{ fontFamily: "Big Shoulders Stencil", fontWeight: 900, color: C.brass }}>EMPIRE</span>
          <span style={{ fontFamily: "Big Shoulders", fontWeight: 800 }}>OS</span>
        </div>
        <div style={{ marginTop: 44, fontSize: 28, fontWeight: 600, color: C.moss }}>{eyebrow}</div>
        <div
          style={{
            marginTop: 10,
            fontFamily: "Big Shoulders",
            fontWeight: 800,
            fontSize: title.length > 48 ? 74 : 92,
            lineHeight: 0.98,
            maxWidth: 1000,
          }}
        >
          {title}
        </div>
        <div style={{ marginTop: 22, fontSize: 28, color: C.moss, maxWidth: 940, lineHeight: 1.35 }}>{line}</div>
        <div style={{ marginTop: "auto", display: "flex", gap: 32, borderTop: `2px solid ${C.rule}`, paddingTop: 22 }}>
          {PILLARS.map((p) => (
            <div key={p.label} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 24, fontWeight: 600 }}>
              <div style={{ width: 14, height: 14, borderRadius: 7, background: p.color }} />
              {p.label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await fonts() },
  );
}

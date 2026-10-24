import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { EMBLEM_MARKS } from "@/components/ui/Emblem";
import { tickPaths } from "@/components/ui/Medallion";
import { depsFor } from "@/lib/server/deps";
import { getSessionUserId } from "@/lib/server/session";
import { shareCard, type ShareCard } from "@/lib/server/share-service";

// A 1080 x 1920 story card (Share.dc.html at 3x). Content stays out of the top and
// bottom 13%, where story apps put their own buttons. Only for the signed-in student.

const C = {
  field: "#0C1310",
  ledger: "#141E19",
  ledgerDark: "#101915",
  rule: "#2A3A31",
  bone: "#ECE5D3",
  moss: "#9AA597",
  brass: "#C9A24B",
  brassDeep: "#8C6A2A",
};

const font = (file: string) => readFile(join(process.cwd(), "assets/fonts", file));
const fonts = Promise.all([
  font("BigShoulders-ExtraBold.ttf"),
  font("BigShouldersStencil-Black.ttf"),
  font("SchibstedGrotesk-Regular.ttf"),
  font("SchibstedGrotesk-SemiBold.ttf"),
  font("SchibstedGrotesk-Bold.ttf"),
]).then(([display, stencil, regular, semibold, bold]) => [
  { name: "Big Shoulders", data: display, weight: 800 as const, style: "normal" as const },
  { name: "Big Shoulders Stencil", data: stencil, weight: 900 as const, style: "normal" as const },
  { name: "Schibsted Grotesk", data: regular, weight: 400 as const, style: "normal" as const },
  { name: "Schibsted Grotesk", data: semibold, weight: 600 as const, style: "normal" as const },
  { name: "Schibsted Grotesk", data: bold, weight: 700 as const, style: "normal" as const },
]);

export async function GET(request: NextRequest, ctx: RouteContext<"/api/share/[kind]">) {
  const userId = await getSessionUserId();
  if (!userId) return new Response("Sign in first.", { status: 401 });
  const { kind } = await ctx.params;
  const result = await shareCard(await depsFor(userId), userId, kind);
  if (!result.ok) return new Response(result.message, { status: 404 });
  const host = request.nextUrl.host.replace(/^www\./, "");
  return new ImageResponse(<Card card={result.data} link={`${host}/r/${result.data.referralCode}`} />, {
    width: 1080,
    height: 1920,
    fonts: await fonts,
    headers: { "cache-control": "private, no-store" },
  });
}

function Card({ card, link }: { card: ShareCard; link: string }) {
  const { litD, dimD } = tickPaths(90, card.ticks, 156, 172);
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "252px 84px",
        background: C.field,
        color: C.bone,
        fontFamily: "Schibsted Grotesk",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 15, fontSize: 60, letterSpacing: 3 }}>
        <span style={{ fontFamily: "Big Shoulders Stencil", fontWeight: 900, color: C.brass }}>EMPIRE</span>
        <span style={{ fontFamily: "Big Shoulders", fontWeight: 800, color: C.bone }}>OS</span>
      </div>

      <svg viewBox="0 0 360 360" width={390} height={390} style={{ marginTop: 48 }}>
        <circle cx="180" cy="180" r="178" fill={C.ledgerDark} stroke={C.rule} strokeWidth="2" />
        <path d={dimD} stroke={C.rule} strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d={litD} stroke={C.brass} strokeWidth="5" strokeLinecap="round" fill="none" />
        <circle cx="180" cy="180" r="144" fill={C.ledger} stroke={C.brassDeep} strokeWidth="2.5" />
        <g transform="translate(80 80) scale(2.5)">
          <path
            d={EMBLEM_MARKS[card.archetype]}
            fill="none"
            stroke={C.brass}
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>

      <div
        style={{
          marginTop: 54,
          fontFamily: "Big Shoulders",
          fontWeight: 800,
          fontSize: 174,
          lineHeight: 0.92,
          textAlign: "center",
        }}
      >
        {card.title}
      </div>
      <div style={{ marginTop: 30, fontSize: 45, lineHeight: 1.4, textAlign: "center" }}>{card.line}</div>

      <div style={{ marginTop: 42, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 24 }}>
        {card.chips.map((chip) => (
          <div
            key={chip}
            style={{
              height: 96,
              padding: "0 36px",
              borderRadius: 48,
              border: `3px solid ${C.rule}`,
              background: C.ledger,
              display: "flex",
              alignItems: "center",
              fontSize: 39,
              fontWeight: 600,
            }}
          >
            {chip}
          </div>
        ))}
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ marginTop: 48, fontSize: 42, color: C.moss }}>{`${card.name} on EMPIRE OS. Start yours:`}</div>
      <div style={{ marginTop: 12, fontSize: 48, fontWeight: 700, color: C.brass, textAlign: "center" }}>{link}</div>
    </div>
  );
}

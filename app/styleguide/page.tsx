import { Flame } from "lucide-react";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { BottomNav } from "@/components/ui/BottomNav";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { PillarIcon, RankIcon } from "@/components/ui/icons";
import { Medallion } from "@/components/ui/Medallion";
import { Meter } from "@/components/ui/Meter";
import { OptionTile } from "@/components/ui/OptionTile";
import { ProgressTicks } from "@/components/ui/ProgressTicks";
import { Stamp } from "@/components/ui/Stamp";
import { StatTile } from "@/components/ui/StatTile";
import { Ticket } from "@/components/ui/Ticket";
import { Wordmark } from "@/components/ui/Wordmark";
import { PILLAR_CLASSES, PILLARS } from "@/lib/pillars";
import {
  HighlightTicketDemo,
  OptionTileDemo,
  PillarOrderDemo,
  SheetDemo,
  TicketDemo,
} from "./Demos";

export const metadata: Metadata = {
  title: "Style guide",
  robots: { index: false, follow: false },
};

const COLOURS = [
  { name: "Field", token: "bg-field", hex: "#0C1310", use: "page" },
  { name: "Ledger", token: "bg-ledger", hex: "#141E19", use: "cards, tickets" },
  { name: "Raised", token: "bg-raised", hex: "#1B2721", use: "selected, hover" },
  { name: "Rule", token: "bg-rule", hex: "#2A3A31", use: "lines, unlit ticks" },
  { name: "Bone", token: "bg-bone", hex: "#ECE5D3", use: "text" },
  { name: "Moss", token: "bg-moss", hex: "#9AA597", use: "quiet text" },
  { name: "Brass", token: "bg-brass", hex: "#C9A24B", use: "action, XP" },
  { name: "Brass light", token: "bg-brass-light", hex: "#E8C873", use: "hover" },
  { name: "Brass deep", token: "bg-brass-deep", hex: "#8C6A2A", use: "outlines" },
  { name: "Stamp", token: "bg-stamp", hex: "#D24A3C", use: "done stamp only" },
  { name: "Career", token: "bg-career", hex: "#3987E5", use: "pillar 1" },
  { name: "Body", token: "bg-body", hex: "#D95926", use: "pillar 2" },
  { name: "Mind", token: "bg-mind", hex: "#9085E9", use: "pillar 3" },
  { name: "Money", token: "bg-money", hex: "#199E70", use: "pillar 4" },
  { name: "Good", token: "bg-good", hex: "#0CA30C", use: "status only" },
];

const STATES = ["default", "hover", "focus", "disabled"] as const;

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="border-t border-rule pt-6">
      <h2 className="font-display text-[26px] leading-none font-extrabold">{title}</h2>
      {note ? <p className="mt-2 text-sm text-moss">{note}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function StateLabel({ children }: { children: ReactNode }) {
  return <div className="mb-1.5 text-xs font-medium text-moss">{children}</div>;
}

export default function StyleguidePage() {
  return (
    <main className="mx-auto w-full max-w-[1040px] px-5 pt-6 pb-16">
      <Wordmark size={26} />
      <h1 className="mt-6 font-display text-[40px] leading-none font-extrabold">Campaign kit</h1>
      <p className="mt-2 max-w-[560px] text-[15px] text-moss">
        Forest-ink field, brass, bone and a rubber stamp. Every screen is built from these parts.
        Internal reference page; sample content only.
      </p>

      <div className="mt-8 grid gap-10 md:grid-cols-2 md:gap-x-12">
        <Section title="Colour">
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5">
            {COLOURS.map((c) => (
              <li key={c.name} className="flex items-center gap-2.5">
                <span className={`size-[30px] flex-none rounded-lg border border-bone/20 ${c.token}`} />
                <span className="text-[13px] leading-tight">
                  <b className="font-semibold">{c.name}</b>
                  <br />
                  <span className="text-moss">
                    {c.hex} {c.use}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Type">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1 border-b border-rule pb-3">
              <span className="font-stencil text-[54px] leading-none font-black whitespace-nowrap text-brass">Day 12</span>
              <span className="text-[13px] text-moss">Stencil 900: day counter, wordmark, stamp.</span>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1 border-b border-rule pb-3">
              <span className="font-display text-[40px] leading-none font-extrabold whitespace-nowrap">
                The Grinder
              </span>
              <span className="text-[13px] text-moss">Display 800: headings.</span>
            </div>
            <div>
              <p className="text-base">
                Three missions a day, sized to your time and budget. <b className="font-bold">₹299</b> and{" "}
                <b className="font-bold">1,240 XP</b> use the same face.
              </p>
              <p className="mt-1 text-[13px] text-moss">Schibsted Grotesk 400 to 700: body, buttons, numbers.</p>
            </div>
          </div>
        </Section>

        <Section title="Buttons" note="Primary, secondary and quiet, in each state.">
          <div className="flex flex-col gap-5">
            {(["primary", "secondary", "quiet"] as const).map((variant) => (
              <div key={variant} className="grid grid-cols-2 gap-3">
                {STATES.map((state) => (
                  <div key={state}>
                    <StateLabel>
                      {variant[0].toUpperCase() + variant.slice(1)}, {state}
                    </StateLabel>
                    <Button
                      variant={variant}
                      disabled={state === "disabled"}
                      data-demo={state === "hover" || state === "focus" ? state : undefined}
                      tabIndex={-1}
                    >
                      {variant === "primary" ? "Start Season 1" : variant === "secondary" ? "Share" : "Maybe later"}
                    </Button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Section>

        <Section title="Tickets" note="Tap the check to stamp a mission done. Tap a ticket to open its sheet.">
          <StateLabel>Interactive</StateLabel>
          <TicketDemo />
          <div className="mt-5 flex flex-col gap-2.5">
            <StateLabel>Highlighted: do this one now</StateLabel>
            <HighlightTicketDemo />
            <StateLabel>Done, final</StateLabel>
            <Ticket pillar="body" title="10-minute Surya Namaskar set" minutes={10} xp={30} done />
          </div>
        </Section>

        <Section title="Stamp, medallion, chips">
          <div className="flex flex-wrap items-center gap-6">
            <Stamp />
            <Stamp size="sm" />
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-6">
            <Medallion total={100} lit={74} size={156}>
              <span className="text-[50px] leading-none font-bold">74</span>
              <span className="mt-1 text-xs font-medium text-moss">Empire score</span>
            </Medallion>
            <Medallion total={90} lit={12} size={156} detail="fine">
              <span className="font-display text-base font-bold">Season 1</span>
              <span className="font-stencil text-[56px] leading-none font-black text-brass">12</span>
              <span className="text-xs text-moss">of 90 days</span>
            </Medallion>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Chip
              icon={<Flame size={18} strokeWidth={1.9} className="text-brass" aria-hidden="true" />}
              srLabel="day streak"
              emphasis
            >
              9
            </Chip>
            <Chip icon={<RankIcon size={20} className="text-brass" />} className="pl-2" srLabel="rank">
              Operator
            </Chip>
          </div>
        </Section>

        <Section title="Option tiles" note="Single choice auto-advances in the quiz. Pillar order shows the tap order.">
          <OptionTileDemo />
          <div className="mt-5">
            <StateLabel>Pillar order, tap in order</StateLabel>
            <PillarOrderDemo />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {(["hover", "focus", "disabled"] as const).map((state) => (
              <div key={state}>
                <StateLabel>Tile, {state}</StateLabel>
                <OptionTile
                  compact
                  title="45 minutes"
                  selected={false}
                  disabled={state === "disabled"}
                  data-demo={state === "disabled" ? undefined : state}
                  tabIndex={-1}
                />
              </div>
            ))}
          </div>
        </Section>

        <Section title="Progress, stats, meters">
          <div className="flex items-center gap-3">
            <ProgressTicks done={4} total={11} label="Quiz progress" />
            <span className="text-sm font-medium whitespace-nowrap text-moss">4 of 11</span>
          </div>
          <div className="mt-6 grid gap-3.5 sm:grid-cols-2">
            <StatTile label="Active this week" value="218" unit="of 264" delta={{ direction: "up", text: "Up 12 vs last week", good: true }} />
            <StatTile label="Need a nudge" value="23" unit="missed 3+ days" delta={{ direction: "down", text: "Down 5 vs last week", good: true }} />
            <StatTile label="Missions per student" value="14.2" unit="of 21 this week" delta={{ direction: "down", text: "Down 0.4 vs last week", good: false }} />
            <StatTile label="Mock interviews done" value="61" unit="this season" />
          </div>
          <div className="mt-6 flex flex-col gap-[11px]">
            <div className="text-xs font-medium text-moss">Missions done, last 7 days</div>
            {PILLARS.map((p, i) => {
              const v = [82, 60, 75, 58][i];
              return <Meter key={p} tone={p} value={v} valueText={`${v}%`} />;
            })}
          </div>
          <div className="mt-6">
            <div className="flex items-baseline justify-between">
              <span className="text-[15px] font-bold">1,195 XP</span>
              <span className="text-[13px] text-moss">305 XP to Strategist</span>
            </div>
            <Meter tone="brass" value={72} className="mt-2" />
          </div>
          <ul className="mt-6 flex flex-col gap-4">
            {PILLARS.map((p) => (
              <li key={p} className="flex items-center gap-2.5 text-base font-semibold">
                <PillarIcon pillar={p} size={22} className={PILLAR_CLASSES[p].stroke} />
                {p[0].toUpperCase() + p.slice(1)}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Sheet and navigation">
          <SheetDemo />
          <div className="mt-6 overflow-hidden rounded-xl border border-rule">
            <BottomNav position="static" activeHref="/hq" />
          </div>
        </Section>
      </div>
    </main>
  );
}

import type { Archetype } from "@/lib/plan-engine/missions";
import { ARCHETYPE_INFO } from "@/lib/plan-engine/archetype";

// One mark per archetype, drawn in brass inside the coin frame from Reveal.dc.html.
const MARKS: Record<Archetype, string> = {
  // Three stacked chevrons: small reps, stacked.
  grinder: "M24 34l16-11 16 11M24 44l16-11 16 11M24 54l16-11 16 11",
  // Rising steps.
  climber: "M22 56h12V46h12V36h12V24M50 24h8v8",
  // A sprout: small ideas, tested and grown.
  founder: "M40 58V38M40 44c-9 0-14-6-14-14 9 0 14 6 14 14zM40 40c0-9 6-14 14-14 0 9-6 14-14 14z",
  // A shield with a chevron.
  warrior: "M40 20l16 6v12c0 11-7 18-16 22-9-4-16-11-16-22V26zM32 38l8 6 8-6",
  // A flame rising.
  phoenix: "M40 59c-8-3-13-9-13-17 0-6 4-11 7-15 1 5 3 8 6 9-1-7 2-13 7-17 0 8 7 13 7 22 0 9-6 15-14 18z",
  // A compass needle.
  strategist: "M40 21v6M40 53v6M21 40h6M53 40h6M40 30l6 10-6 10-6-10z",
};

export function Emblem({ archetype, size = 78 }: { archetype: Archetype; size?: number }) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} role="img" aria-label={`${ARCHETYPE_INFO[archetype].name} emblem`} className="flex-none">
      <circle cx="40" cy="40" r="37" strokeWidth="2" className="fill-ledger stroke-brass" />
      <circle cx="40" cy="40" r="31" fill="none" strokeWidth="1" strokeDasharray="2 4" className="stroke-brass-deep" />
      <path d={MARKS[archetype]} fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="stroke-brass" />
    </svg>
  );
}

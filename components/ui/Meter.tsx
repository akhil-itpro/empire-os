import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { PILLAR_CLASSES, PILLAR_LABEL, type Pillar } from "@/lib/pillars";

type MeterProps = {
  /** 0 to 100. */
  value: number;
  /** A pillar colour, or brass for XP. */
  tone: Pillar | "brass";
  /** Shown above the bar. Pillar meters default to the pillar name with its dot. */
  label?: ReactNode;
  /** Shown on the right of the label row, e.g. "82%". */
  valueText?: ReactNode;
  className?: string;
};

const BRASS = { fill: "bg-brass", track: "bg-brass/22" };

// A 6px bar: track is the colour at 22% opacity, fill is the full colour.
// The bar itself is hidden from screen readers; the label row carries the value.
export function Meter({ value, tone, label, valueText, className }: MeterProps) {
  const colours = tone === "brass" ? BRASS : PILLAR_CLASSES[tone];
  const pct = Math.max(0, Math.min(100, value));
  const heading =
    label ??
    (tone !== "brass" ? (
      <span className="flex items-center gap-1.5 font-semibold text-bone">
        <span
          className={cn("size-2 rounded-full", PILLAR_CLASSES[tone].dot)}
        />
        {PILLAR_LABEL[tone]}
      </span>
    ) : null);

  return (
    <div className={className}>
      {heading || valueText ? (
        <div className="flex items-center justify-between text-[13px]">
          {heading}
          {valueText ? (
            <span className="text-bone tabular-nums">{valueText}</span>
          ) : null}
        </div>
      ) : null}
      <div
        aria-hidden="true"
        className={cn("h-1.5 rounded-full", heading || valueText ? "mt-1.5" : "", colours.track)}
      >
        <div
          className={cn("h-1.5 rounded-full transition-[width] duration-500", colours.fill)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

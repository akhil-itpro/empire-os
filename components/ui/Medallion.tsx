import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

// One straight tick per step around the ring, starting at 12 o'clock.
// Returns two SVG paths: the first `lit` ticks, and the rest.
export function tickPaths(
  count: number,
  lit: number,
  r1: number,
  r2: number,
  c = 180,
) {
  let litD = "";
  let dimD = "";
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 - Math.PI / 2;
    const seg =
      `M${(c + r1 * Math.cos(a)).toFixed(1)} ${(c + r1 * Math.sin(a)).toFixed(1)}` +
      `L${(c + r2 * Math.cos(a)).toFixed(1)} ${(c + r2 * Math.sin(a)).toFixed(1)}`;
    if (i < lit) litD += seg;
    else dimD += seg;
  }
  return { litD, dimD };
}

type MedallionProps = {
  /** Ticks around the ring: 90 for season days, 100 for the score. */
  total: number;
  lit: number;
  size: number;
  /** "bold" is the HQ score medallion; "fine" the large landing medallion. */
  detail?: "bold" | "fine";
  children?: ReactNode;
  className?: string;
};

// A milled brass ring of ticks around a ledger disc, content centred.
export function Medallion({
  total,
  lit,
  size,
  detail = "bold",
  children,
  className,
}: MedallionProps) {
  const fine = detail === "fine";
  const { litD, dimD } = tickPaths(
    total,
    Math.max(0, Math.min(total, Math.round(lit))),
    fine ? 158 : 156,
    172,
  );

  return (
    <div
      className={cn("relative flex-none", className)}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 360 360"
        width={size}
        height={size}
        aria-hidden="true"
        className="absolute inset-0"
      >
        <circle
          cx="180"
          cy="180"
          r="178"
          strokeWidth={fine ? 1 : 2}
          className="fill-(--ledger-dark) stroke-rule"
        />
        <path
          d={dimD}
          strokeWidth={fine ? 3 : 5}
          strokeLinecap="round"
          fill="none"
          className="stroke-rule"
        />
        <path
          d={litD}
          strokeWidth={fine ? 3 : 5}
          strokeLinecap="round"
          fill="none"
          className="stroke-brass"
        />
        <circle
          cx="180"
          cy="180"
          r={fine ? 148 : 144}
          strokeWidth={fine ? 1.5 : 2.5}
          className="fill-ledger stroke-brass-deep"
        />
        {fine ? (
          <circle
            cx="180"
            cy="180"
            r="136"
            fill="none"
            strokeWidth="1"
            strokeDasharray="2 5"
            className="stroke-rule"
          />
        ) : null}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}

import { ArrowDown, ArrowUp } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Delta = {
  direction: "up" | "down";
  /** The words, always shown with the arrow: "Up 12 vs last week". */
  text: string;
  /** Good news is green; anything else stays moss. Colour never carries meaning alone. */
  good: boolean;
};

type StatTileProps = {
  label: string;
  value: ReactNode;
  /** Small text after the value, e.g. "of 264". */
  unit?: ReactNode;
  delta?: Delta;
  /** A plain line under the value when there's no delta, e.g. where the number comes from. */
  note?: ReactNode;
  className?: string;
};

export function StatTile({ label, value, unit, delta, note, className }: StatTileProps) {
  const Arrow = delta?.direction === "down" ? ArrowDown : ArrowUp;
  return (
    <div
      className={cn(
        "rounded-[14px] border border-rule/70 bg-ledger px-[18px] py-4",
        className,
      )}
    >
      <div className="text-[13px] font-medium text-moss">{label}</div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-[34px] leading-none font-semibold text-bone">
          {value}
        </span>
        {unit ? <span className="text-sm text-moss">{unit}</span> : null}
      </div>
      {delta ? (
        <div
          className={cn(
            "mt-2 flex items-center gap-1 text-[13px] font-semibold",
            delta.good ? "text-good" : "text-moss",
          )}
        >
          <Arrow size={14} strokeWidth={2.5} aria-hidden="true" />
          <span>{delta.text}</span>
        </div>
      ) : note ? (
        <div className="mt-2 text-[13px] text-moss">{note}</div>
      ) : null}
    </div>
  );
}

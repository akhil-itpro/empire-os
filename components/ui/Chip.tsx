import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type ChipProps = {
  icon?: ReactNode;
  children: ReactNode;
  /** Words for screen readers after the visible value, e.g. "day streak". */
  srLabel?: string;
  /** A bold 15px value, for numbers like the streak count. */
  emphasis?: boolean;
  className?: string;
};

// 36px tall, radius 18px, 1px rule border, ledger background, icon plus value.
export function Chip({ icon, children, srLabel, emphasis = false, className }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full border border-rule bg-ledger px-3 text-bone",
        emphasis ? "text-[15px] font-bold" : "text-sm font-semibold",
        className,
      )}
    >
      {icon}
      <span>
        {children}
        {srLabel ? <span className="sr-only"> {srLabel}</span> : null}
      </span>
    </span>
  );
}

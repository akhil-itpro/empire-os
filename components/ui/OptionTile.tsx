import { Check } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type OptionTileProps = Omit<ComponentProps<"button">, "title"> & {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  selected: boolean;
  /** Replaces the check in the badge, e.g. "1" when the order matters. */
  badge?: ReactNode;
  /** Shorter tile for answers without a description (city, minutes). */
  compact?: boolean;
};

// Quiz answer: ledger, 1.5px rule border, radius 14px, min 124px tall.
// Selected: raised background, 2px brass border, 22px brass check badge.
export function OptionTile({
  title,
  description,
  icon,
  selected,
  badge,
  compact = false,
  className,
  type = "button",
  ...props
}: OptionTileProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(
        "relative flex flex-col gap-1.5 rounded-[14px] text-left text-bone transition-colors duration-150 disabled:opacity-50",
        compact ? "min-h-16 justify-center px-4 py-3" : "min-h-[124px] p-3.5",
        selected
          ? "border-2 border-brass bg-raised"
          : "border-[1.5px] border-rule bg-ledger hov:bg-raised",
        className,
      )}
      {...props}
    >
      {icon ? (
        <span className={cn("mb-1.5", selected ? "text-brass" : "text-moss")}>
          {icon}
        </span>
      ) : null}
      <span
        className={cn(
          "text-base leading-[1.25] font-bold",
          selected && compact && "pr-7",
        )}
      >
        {title}
      </span>
      {description ? (
        <span
          className={cn(
            "text-[13px] leading-[1.35]",
            selected ? "text-bone/80" : "text-moss",
          )}
        >
          {description}
        </span>
      ) : null}
      {selected ? (
        <span
          className={cn(
            "absolute right-3 flex size-[22px] items-center justify-center rounded-full bg-brass text-xs font-bold text-field",
            compact ? "top-1/2 -translate-y-1/2" : "top-3",
          )}
        >
          {badge ?? <Check size={14} strokeWidth={3} aria-hidden="true" />}
        </span>
      ) : null}
    </button>
  );
}

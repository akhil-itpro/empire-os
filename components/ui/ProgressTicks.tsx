import { cn } from "@/lib/cn";

type ProgressTicksProps = {
  done: number;
  total?: number;
  label?: string;
  className?: string;
};

// The quiz progress: one 4px segment per question, brass done, rule to do.
export function ProgressTicks({
  done,
  total = 11,
  label = "Progress",
  className,
}: ProgressTicksProps) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
      aria-valuetext={`${done} of ${total}`}
      className={cn("flex flex-1 gap-1", className)}
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-1 flex-1 rounded-sm transition-colors duration-150",
            i < done ? "bg-brass" : "bg-rule",
          )}
        />
      ))}
    </div>
  );
}

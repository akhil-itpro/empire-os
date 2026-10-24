import { cn } from "@/lib/cn";

// "EMPIRE" in brass stencil, "OS" in bone display. The only all-caps text besides the stamp.
export function Wordmark({ size = 26, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn("inline-flex items-baseline gap-1.5 leading-none tracking-[0.04em]", className)}
      style={{ fontSize: size }}
    >
      <span className="font-stencil font-black text-brass">EMPIRE</span>{" "}
      <span className="font-display font-bold text-bone">OS</span>
    </span>
  );
}

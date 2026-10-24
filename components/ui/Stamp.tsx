"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";

type StampProps = {
  /** Slam onto the page (scale 1.4 to 1 in 180ms). Off shows the end state. */
  slam?: boolean;
  size?: "md" | "sm";
  className?: string;
};

// The rubber stamp, for finished work only. Stencil 900, stamp red, rotated -10°.
export function Stamp({ slam = false, size = "md", className }: StampProps) {
  const reduceMotion = useReducedMotion();
  const animate = slam && !reduceMotion;

  return (
    <motion.span
      aria-hidden="true"
      initial={animate ? { scale: 1.4, opacity: 0, rotate: -10 } : false}
      animate={{ scale: 1, opacity: 0.92, rotate: -10 }}
      transition={{ duration: 0.18, ease: [0.2, 0.8, 0.3, 1.2] }}
      className={cn(
        "pointer-events-none inline-block rounded-md border-stamp font-stencil font-black leading-[1.1] tracking-[0.06em] text-stamp select-none",
        "outline-solid outline-stamp/55",
        size === "md"
          ? "border-[3px] px-3 py-0.5 text-[28px] outline-[1.5px] -outline-offset-7"
          : "border-[2.5px] px-2 text-xl outline-1 -outline-offset-5",
        className,
      )}
    >
      DONE
    </motion.span>
  );
}

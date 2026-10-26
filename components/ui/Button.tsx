import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "quiet";

// docs/DESIGN.md: primary is full-width brass, 56px, radius 12px; secondary is
// a 1.5px brass-deep outline, 52px; quiet is a plain text button ("Maybe later").
const VARIANTS: Record<Variant, string> = {
  primary: "bg-brass font-bold text-field hov:bg-brass-light disabled:bg-brass/40",
  secondary:
    "border-[1.5px] border-brass-deep font-semibold text-bone hov:border-brass hov:bg-raised disabled:border-rule disabled:text-moss",
  quiet: "font-semibold text-bone hov:bg-raised disabled:text-moss",
};

const HEIGHTS: Record<Variant, string> = {
  primary: "h-14 text-[17px]",
  secondary: "h-13 text-base",
  quiet: "h-12 text-base",
};

// cn() only joins class names, so a size passed in className can't override these.
// Use the options instead: "small" is a 44px action beside a field or in a row of
// tools, and "inline" sizes the button to its label instead of the full width.
type Options = { variant?: Variant; small?: boolean; inline?: boolean };

const BASE =
  "flex items-center justify-center gap-2 rounded-xl text-center transition-colors duration-150 disabled:cursor-not-allowed";

export function buttonClasses({ variant = "primary", small = false, inline = false }: Options = {}, className?: string) {
  return cn(
    BASE,
    VARIANTS[variant],
    small ? "h-11 text-sm" : HEIGHTS[variant],
    inline ? "w-auto flex-none px-6" : "w-full px-5",
    className,
  );
}

type ButtonProps = ComponentProps<"button"> & Options;

export function Button({ variant, small, inline, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses({ variant, small, inline }, className)} {...props} />;
}

type ButtonLinkProps = ComponentProps<typeof Link> & Options;

export function ButtonLink({ variant, small, inline, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses({ variant, small, inline }, className)} {...props} />;
}

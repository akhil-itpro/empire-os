import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "quiet";

// docs/DESIGN.md: primary is full-width brass, 56px, radius 12px; secondary is
// a 1.5px brass-deep outline, 52px; quiet is a plain text button ("Maybe later").
const VARIANTS: Record<Variant, string> = {
  primary:
    "h-14 bg-brass text-[17px] font-bold text-field hov:bg-brass-light disabled:bg-brass/40",
  secondary:
    "h-13 border-[1.5px] border-brass-deep text-base font-semibold text-bone hov:border-brass hov:bg-raised disabled:border-rule disabled:text-moss",
  quiet:
    "h-12 text-base font-semibold text-bone hov:bg-raised disabled:text-moss",
};

const BASE =
  "flex w-full items-center justify-center gap-2 rounded-xl px-5 text-center transition-colors duration-150 disabled:cursor-not-allowed";

export function buttonClasses(variant: Variant = "primary", className?: string) {
  return cn(BASE, VARIANTS[variant], className);
}

type ButtonProps = ComponentProps<"button"> & { variant?: Variant };

export function Button({
  variant = "primary",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses(variant, className)}
      {...props}
    />
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: Variant };

export function ButtonLink({
  variant = "primary",
  className,
  ...props
}: ButtonLinkProps) {
  return <Link className={buttonClasses(variant, className)} {...props} />;
}

"use client";

import { ChartNoAxesColumn, House, Map as MapIcon, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/hq", label: "HQ", Icon: House },
  { href: "/path", label: "Path", Icon: MapIcon },
  { href: "/stats", label: "Stats", Icon: ChartNoAxesColumn },
  { href: "/me", label: "Me", Icon: User },
] as const;

type BottomNavProps = {
  /** Overrides the current path (the style guide shows HQ as active). */
  activeHref?: string;
  /** "static" places it in the page flow instead of fixing it to the screen. */
  position?: "fixed" | "static";
};

// HQ, Path, Stats, Me. 76px, ledger-dark, active tab brass with a 3px bar on top.
export function BottomNav({ activeHref, position = "fixed" }: BottomNavProps) {
  const pathname = usePathname();
  const current = activeHref ?? pathname;

  return (
    <nav
      aria-label="Main"
      className={cn(
        "z-30 border-t border-rule bg-(--ledger-dark) pb-[env(safe-area-inset-bottom)]",
        position === "fixed" && "fixed inset-x-0 bottom-0",
      )}
    >
      <ul className="mx-auto flex h-[76px] max-w-[480px]">
        {TABS.map(({ href, label, Icon }) => {
          const active = current === href || current.startsWith(`${href}/`);
          return (
            <li key={href} className="flex flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-1 flex-col items-center justify-center gap-1 text-xs transition-colors duration-150",
                  active
                    ? "font-bold text-brass"
                    : "font-semibold text-moss hov:text-bone",
                )}
              >
                {active ? (
                  <span className="absolute -top-px h-[3px] w-7 rounded-sm bg-brass" />
                ) : null}
                <Icon size={24} strokeWidth={1.8} aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

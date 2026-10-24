"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useHydrated } from "@/lib/use-hydrated";

const KEY = "empire.trialBanner.dismissed";

function dismissedBefore() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

/** The one day-6 banner: true (shown only in the last 24 hours of full access) and dismissible. */
export function TrialBanner() {
  const hydrated = useHydrated();
  const [closed, setClosed] = useState(false);
  if (!hydrated || closed || dismissedBefore()) return null;

  const dismiss = () => {
    setClosed(true);
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      // It stays closed until the page reloads.
    }
  };

  return (
    <aside
      aria-label="Free week ending"
      className="mx-5 mt-5 flex items-start gap-2 rounded-xl border border-brass-deep bg-ledger py-1 pr-1 pl-4"
    >
      <div className="min-w-0 flex-1 py-2">
        <p className="text-sm text-bone">Your full access ends tomorrow. Keep three missions a day with Season Pass.</p>
        <Link
          href="/pass?from=trial_banner"
          className="-my-1 inline-flex min-h-11 items-center text-sm font-semibold text-brass hov:text-brass-light"
        >
          See Season Pass
        </Link>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="flex size-11 flex-none items-center justify-center rounded-full text-moss hov:bg-raised hov:text-bone"
      >
        <X size={18} strokeWidth={2} aria-hidden="true" />
      </button>
    </aside>
  );
}

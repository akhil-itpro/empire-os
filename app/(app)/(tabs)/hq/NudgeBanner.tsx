"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { dismissNudge } from "@/app/actions/college";

/** A reminder from the student's college: kind, short, dismissible, shown until dismissed. */
export function NudgeBanner({ id, orgName }: { id: string; orgName: string }) {
  const [closed, setClosed] = useState(false);
  if (closed) return null;

  const dismiss = () => {
    setClosed(true);
    void dismissNudge(id);
  };

  return (
    <aside
      aria-label={`Reminder from ${orgName}`}
      className="mx-5 mt-5 flex items-start gap-2 rounded-xl border border-brass-deep bg-ledger py-1 pr-1 pl-4"
    >
      <p className="min-w-0 flex-1 py-2.5 text-sm text-bone">
        {orgName} training and placement cell sent you a reminder. One mission today is enough to get back in.
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss the reminder"
        className="flex size-11 flex-none items-center justify-center rounded-lg text-moss hov:bg-raised hov:text-bone"
      >
        <X size={20} strokeWidth={2} aria-hidden="true" />
      </button>
    </aside>
  );
}

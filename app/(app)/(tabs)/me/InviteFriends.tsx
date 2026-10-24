"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { track } from "@/lib/analytics/track";
import type { ReferralSummary } from "@/lib/server/referral-service";
import { useHydrated } from "@/lib/use-hydrated";

/** The student's invite link, the reward rule in plain words, and what they've earned so far. */
export function InviteFriends({ code, summary }: { code: string; summary: ReferralSummary }) {
  const hydrated = useHydrated();
  const [note, setNote] = useState<string | null>(null);
  const link = hydrated ? `${window.location.origin}/r/${code}` : `/r/${code}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      track("share_click", { kind: "invite", method: "copy" });
      setNote("Copied. Paste it anywhere to share.");
    } catch {
      setNote("Couldn't copy here. Press and hold the link to copy it.");
    }
  };

  const share = async () => {
    if (!navigator.share) return copy();
    try {
      await navigator.share({
        title: "EMPIRE OS",
        text: "Three missions a day for your career, body, mind and money. Start your season:",
        url: link,
      });
      track("share_click", { kind: "invite", method: "share" });
    } catch {
      // The share sheet was closed.
    }
  };

  const friends = summary.joined === 1 ? "1 friend has joined" : `${summary.joined} friends have joined`;

  return (
    <section className="mt-8" aria-labelledby="invite">
      <h2 id="invite" className="font-display text-[26px] leading-none font-extrabold">
        Invite friends
      </h2>
      <p className="mt-1.5 text-[13px] text-moss">
        When a friend you invite completes missions on 3 different days, you both get 7 days of full access. Up to{" "}
        {summary.maxRewards} rewards.
      </p>
      <p className="mt-3 rounded-xl border border-rule bg-ledger px-4 py-3 text-[15px] font-semibold break-all">{link}</p>
      <div className="mt-2.5 flex gap-2.5">
        <Button variant="secondary" onClick={share}>
          Share link
        </Button>
        <Button variant="secondary" onClick={copy}>
          Copy link
        </Button>
      </div>
      <p className="mt-2.5 text-sm text-moss">
        {friends}. {summary.rewards} of {summary.maxRewards} rewards earned.
      </p>
      <p className="mt-1 min-h-5 text-sm text-bone" role="status" aria-live="polite">
        {note}
      </p>
    </section>
  );
}

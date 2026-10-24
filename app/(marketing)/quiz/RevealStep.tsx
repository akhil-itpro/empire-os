"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Emblem } from "@/components/ui/Emblem";
import { track } from "@/lib/analytics/track";
import { cn } from "@/lib/cn";
import { ACT_NAMES } from "@/lib/game/dates";
import type { PlanPreview } from "@/lib/plan-engine/preview";

const ACT_WEEKS = { 1: "Act I, weeks 1 to 4", 2: "Act II, weeks 5 to 8", 3: "Act III, weeks 9 to 13" } as const;

// The archetype reveal (design/screens/Reveal.dc.html).
export function RevealStep({
  firstName,
  preview,
  onStart,
}: {
  firstName: string;
  preview: PlanPreview;
  onStart: () => void;
}) {
  const [shareNote, setShareNote] = useState<string | null>(null);
  const { archetype } = preview;

  const share = async () => {
    track("share_click", { kind: "archetype_text", archetype: archetype.id });
    const url = window.location.origin;
    const text = `I'm ${archetype.name} on EMPIRE OS. ${archetype.identity} What's your archetype?`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "EMPIRE OS", text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${url}`);
      setShareNote("Copied. Paste it anywhere to share.");
    } catch {
      // The student closed the share sheet; nothing to do.
    }
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-5 pt-7 pb-5">
      <p className="text-[15px] text-moss">{firstName}, your archetype is</p>
      <div className="mt-1.5 flex items-center justify-between gap-3">
        <h1 className="font-display text-[60px] leading-[0.95] font-extrabold min-[400px]:text-[66px]">{archetype.name}</h1>
        <Emblem archetype={archetype.id} />
      </div>
      <p className="mt-3.5 text-base text-bone">
        {preview.summary} {archetype.identity}
      </p>

      <h2 className="mt-[30px] font-display text-[26px] leading-[1.1] font-extrabold">Your Season 1</h2>
      <ol className="mt-3.5 flex flex-col">
        {([1, 2, 3] as const).map((act, i) => (
          <li key={act} className="flex gap-3.5">
            <div className="flex w-4 flex-none flex-col items-center" aria-hidden="true">
              <span
                className={cn(
                  "mt-1 rounded-full",
                  act === 1 ? "size-3.5 bg-brass" : "size-2.5 border-2 border-rule",
                )}
              />
              {i < 2 ? <span className="mt-1 w-0.5 flex-1 bg-rule" /> : null}
            </div>
            <div className={i < 2 ? "pb-4" : ""}>
              <div className={cn("font-display text-[21px] leading-[1.1] font-bold", act === 1 ? "text-brass" : "text-bone")}>
                {ACT_NAMES[act]}
              </div>
              <div className="mt-0.5 text-[13px] text-moss">
                {ACT_WEEKS[act]}
                {act === 1 ? ", starts today" : ""}
              </div>
              <p className="mt-1 text-sm leading-[1.45] text-bone">{preview.milestones[act - 1].join(". ")}.</p>
            </div>
          </li>
        ))}
      </ol>

      <h2 className="mt-[26px] font-display text-[26px] leading-[1.1] font-extrabold">Why this plan</h2>
      <ul className="mt-3 flex flex-col gap-2.5">
        {preview.whyThisPlan.map((line) => (
          <li key={line} className="flex items-start gap-2.5 text-sm leading-[1.45]">
            <Check size={18} strokeWidth={2.5} className="mt-px flex-none text-brass" aria-hidden="true" />
            <span>{line}</span>
          </li>
        ))}
      </ul>

      <div className="min-h-8 flex-1" />
      <Button onClick={onStart}>Start Season 1</Button>
      <Button variant="secondary" className="mt-2.5" onClick={share}>
        Share my archetype
      </Button>
      <p className="mt-2 min-h-5 text-center text-sm text-moss" aria-live="polite">
        {shareNote}
      </p>
    </main>
  );
}

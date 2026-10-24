"use client";

import { Check, Clock } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { PILLAR_CLASSES, PILLAR_LABEL, type Pillar } from "@/lib/pillars";
import { Stamp } from "./Stamp";

type TicketProps = {
  pillar: Pillar;
  title: string;
  minutes: number;
  xp: number;
  done: boolean;
  /** Called by the round check button. Without it the button is not shown. */
  onComplete?: () => void;
  /** Called by the filled check on a done ticket. Without it done is final. */
  onUndo?: () => void;
  /** Opens the detail sheet when the main area is tapped. */
  onOpen?: () => void;
  /** Brass outline for "Do this one now". */
  highlight?: boolean;
  /** While the server saves: the button shows the done state but can't be pressed again. */
  pending?: boolean;
  className?: string;
};

function vibrate() {
  if (
    typeof navigator !== "undefined" &&
    "vibrate" in navigator &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    navigator.vibrate(15);
  }
}

// A mission ticket stub: main area, 2px dashed perforation with two notches, and
// a 92px stub with the XP and the check button (docs/DESIGN.md, HQ.dc.html).
export function Ticket({
  pillar,
  title,
  minutes,
  xp,
  done,
  onComplete,
  onUndo,
  onOpen,
  highlight = false,
  pending = false,
  className,
}: TicketProps) {
  // The stamp slams only when a ticket becomes done while on screen.
  const [doneOnMount] = useState(done);

  const main = (
    <>
      <span className="flex items-center gap-1.5 text-xs font-semibold text-moss">
        <span
          className={cn("size-2 rounded-full", PILLAR_CLASSES[pillar].dot)}
        />
        {PILLAR_LABEL[pillar]}
      </span>
      <span
        className={cn(
          "mt-1.5 line-clamp-2 text-base leading-[1.3] font-semibold",
          done ? "text-moss" : "text-bone",
        )}
      >
        {title}
      </span>
      <span className="mt-auto flex items-center gap-1.5 pt-1 text-[13px] text-moss">
        <Clock size={14} strokeWidth={2} aria-hidden="true" />
        {minutes} min
      </span>
      {onOpen ? (
        <span className="sr-only">{done ? ". Done" : ""}. Open details</span>
      ) : null}
    </>
  );

  const mainClasses =
    "flex min-w-0 flex-1 flex-col rounded-l-xl pt-[13px] pr-3 pb-3 pl-4 text-left";

  return (
    <div
      className={cn(
        "relative flex min-h-[104px] rounded-xl bg-ledger [--notch:var(--color-field)]",
        highlight && "outline-[1.5px] outline-offset-2 outline-brass outline-solid",
        className,
      )}
    >
      {onOpen ? (
        <button
          type="button"
          onClick={onOpen}
          className={cn(mainClasses, "hov:bg-raised transition-colors")}
        >
          {main}
        </button>
      ) : (
        <div className={mainClasses}>{main}</div>
      )}

      {done ? (
        <Stamp
          slam={!doneOnMount}
          className="absolute top-[34px] right-[100px]"
        />
      ) : null}

      <div className="relative flex w-[92px] flex-none flex-col items-center justify-center gap-2 border-l-2 border-dashed border-rule">
        <span className="absolute -top-2 -left-[9px] size-4 rounded-full bg-(--notch)" />
        <span className="absolute -bottom-2 -left-[9px] size-4 rounded-full bg-(--notch)" />
        <span className="flex items-baseline gap-[3px]">
          <span className="text-xl font-bold text-brass">+{xp}</span>
          <span className="text-xs font-semibold text-moss">XP</span>
        </span>
        {done ? (
          onUndo ? (
            <button
              type="button"
              onClick={onUndo}
              disabled={pending}
              aria-label={`Undo, mark not done: ${title}`}
              className="flex size-11 items-center justify-center rounded-full border-[1.5px] border-brass bg-brass text-field hov:bg-brass-light"
            >
              <Check size={20} strokeWidth={2.5} aria-hidden="true" />
            </button>
          ) : (
            <span className="flex size-11 items-center justify-center rounded-full border-[1.5px] border-brass bg-brass text-field">
              <Check size={20} strokeWidth={2.5} aria-hidden="true" />
              <span className="sr-only">Done</span>
            </span>
          )
        ) : onComplete ? (
          <button
            type="button"
            onClick={() => {
              vibrate();
              onComplete();
            }}
            disabled={pending}
            aria-label={`Mark done: ${title}`}
            className="flex size-11 items-center justify-center rounded-full border-[1.5px] border-brass-deep text-brass transition-colors duration-150 hov:border-brass hov:bg-raised disabled:opacity-60"
          >
            <Check size={20} strokeWidth={2.5} aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

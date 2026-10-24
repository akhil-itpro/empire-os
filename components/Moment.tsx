"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { RankIcon } from "@/components/ui/icons";
import { Medallion } from "@/components/ui/Medallion";
import { track } from "@/lib/analytics/track";

export type MomentKind =
  | { kind: "rank"; rank: string }
  | { kind: "streak"; days: number };

const STREAK_LINES: Record<number, string> = {
  3: "Three days in a row. The habit is starting.",
  7: "A full week in a row. That's how seasons are won.",
  14: "Two weeks in a row. This is who you are now.",
  30: "Thirty days in a row. Most people never get here.",
  60: "Sixty days in a row. Discipline, not luck.",
  90: "Ninety days. The whole season, every day.",
};

type MomentProps = {
  moment: MomentKind;
  onClose: () => void;
  /** Opens the image share card for this moment; without it, Share shares a line of text. */
  onShareCard?: () => void;
  referralCode?: string;
};

/** A full-screen moment for a rank-up or a streak milestone, with a Share button. */
export function Moment({ moment, onClose, onShareCard, referralCode }: MomentProps) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  const title = moment.kind === "rank" ? `You're now ${/^[AEIOU]/.test(moment.rank) ? "an" : "a"} ${moment.rank}.` : `${moment.days}-day streak.`;
  const line =
    moment.kind === "rank"
      ? "Rank comes from showing up. Keep stacking days."
      : (STREAK_LINES[moment.days] ?? "Keep going.");

  const share = async () => {
    if (onShareCard) {
      ref.current?.close();
      onShareCard();
      return;
    }
    track("share_click", { kind: moment.kind === "rank" ? "rank_text" : "streak_text" });
    const url = `${window.location.origin}${referralCode ? `/r/${referralCode}` : ""}`;
    const text =
      moment.kind === "rank"
        ? `I just reached ${moment.rank} on EMPIRE OS.`
        : `${moment.days} days in a row on EMPIRE OS.`;
    try {
      if (navigator.share) await navigator.share({ title: "EMPIRE OS", text, url });
      else await navigator.clipboard.writeText(`${text} ${url}`);
    } catch {
      // Share sheet closed.
    }
  };

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none border-0 bg-field p-0 text-bone backdrop:bg-field"
    >
      <div className="mx-auto flex h-full max-w-[480px] flex-col items-center px-5 pt-16 pb-[calc(20px+env(safe-area-inset-bottom))] text-center">
        <motion.div
          initial={reduceMotion ? false : { rotateY: 0, scale: 0.8 }}
          animate={{ rotateY: reduceMotion ? 0 : 360, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.2, 0.8, 0.3, 1] }}
          style={{ transformPerspective: 800 }}
        >
          {moment.kind === "rank" ? (
            <Medallion total={100} lit={100} size={200}>
              <RankIcon size={64} className="text-brass" />
            </Medallion>
          ) : (
            <Medallion total={90} lit={Math.min(90, moment.days)} size={200}>
              <span className="font-stencil text-[72px] leading-none font-black text-brass">{moment.days}</span>
              <span className="mt-1 text-[13px] text-moss">days in a row</span>
            </Medallion>
          )}
        </motion.div>
        <h1 id={titleId} className="mt-10 font-display text-[50px] leading-[0.95] font-extrabold">
          {title}
        </h1>
        <p className="mt-4 max-w-[320px] text-base text-moss">{line}</p>
        <div className="flex-1" />
        <div className="flex w-full flex-col gap-2.5">
          <Button onClick={() => ref.current?.close()}>Keep going</Button>
          <Button variant="secondary" onClick={share}>
            Share
          </Button>
        </div>
      </div>
    </dialog>
  );
}

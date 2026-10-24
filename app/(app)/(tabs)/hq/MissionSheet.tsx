"use client";

import { Clock } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { cn } from "@/lib/cn";
import type { SkipReason } from "@/lib/game/rules";
import { PILLAR_CLASSES, PILLAR_LABEL } from "@/lib/pillars";
import { BODY_HEALTH_NOTE } from "@/lib/plan-engine/missions";
import type { TicketData } from "@/lib/server/hq";

const REASONS: { id: SkipReason; label: string }[] = [
  { id: "no_time", label: "No time" },
  { id: "not_relevant", label: "Not relevant" },
  { id: "too_hard", label: "Too hard" },
];

type Props = {
  mission: TicketData | null;
  swapsLeft: number;
  busy: boolean;
  onClose: () => void;
  onComplete: (m: TicketData) => void;
  onUndo: (m: TicketData) => void;
  onSwap: (m: TicketData) => void;
  onSkip: (m: TicketData, reason: SkipReason) => void;
};

// The ticket detail sheet: how-to, Mark done, Swap (once a day) and Skip with a reason.
export function MissionSheet({ mission, swapsLeft, busy, onClose, onComplete, onUndo, onSwap, onSkip }: Props) {
  const [skipping, setSkipping] = useState(false);
  const close = () => {
    setSkipping(false);
    onClose();
  };

  return (
    <Sheet open={mission !== null} onClose={close} title={mission?.title ?? ""}>
      {mission ? (
        <>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-moss">
            <span className="flex items-center gap-1.5 font-semibold">
              <span className={cn("size-2 rounded-full", PILLAR_CLASSES[mission.pillar].dot)} />
              {PILLAR_LABEL[mission.pillar]}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={14} strokeWidth={2} aria-hidden="true" />
              {mission.minutes} min
            </span>
            <span className="font-semibold text-brass">+{mission.xp} XP</span>
            {mission.packName ? <span>From the {mission.packName} pack</span> : null}
          </div>
          <p className="mt-4 text-base text-bone">{mission.howTo}</p>
          {mission.pillar === "body" ? <p className="mt-3 text-[13px] text-moss">{BODY_HEALTH_NOTE}</p> : null}

          <div className="mt-6 flex flex-col gap-2">
            {mission.status === "done" ? (
              <>
                <p className="text-[15px] font-semibold text-bone">Done. Nice work.</p>
                <Button variant="quiet" disabled={busy} onClick={() => onUndo(mission)}>
                  Undo, mark not done
                </Button>
              </>
            ) : mission.status === "skipped" ? (
              <p className="text-[15px] text-moss">Skipped for today. A new set of missions comes tomorrow.</p>
            ) : skipping ? (
              <>
                <p className="text-[15px] text-moss">Why skip it? It helps tune next week.</p>
                {REASONS.map((r) => (
                  <Button key={r.id} variant="secondary" disabled={busy} onClick={() => onSkip(mission, r.id)}>
                    {r.label}
                  </Button>
                ))}
                <Button variant="quiet" onClick={() => setSkipping(false)}>
                  Keep it
                </Button>
              </>
            ) : (
              <>
                <Button disabled={busy} onClick={() => onComplete(mission)}>
                  Mark done
                </Button>
                <Button variant="secondary" disabled={busy || swapsLeft <= 0} onClick={() => onSwap(mission)}>
                  {swapsLeft > 0 ? "Swap for another mission" : "Swap used today"}
                </Button>
                <Button variant="quiet" disabled={busy} onClick={() => setSkipping(true)}>
                  Skip
                </Button>
              </>
            )}
          </div>
        </>
      ) : null}
    </Sheet>
  );
}

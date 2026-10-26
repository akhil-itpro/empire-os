"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { completeBoss } from "@/app/actions/war-room";
import { cn } from "@/lib/cn";
import { PILLAR_CLASSES, PILLAR_LABEL } from "@/lib/pillars";
import type { BossData } from "@/lib/server/war-room-service";

export type BossResult = { xpGained: number; rankUp: string | null; firstBoss: boolean };

/** HQ: the weekly review when it's due, and this week's boss mission after a strong week. */
export function WarRoomCards({
  dueWeek,
  boss,
  onBossDone,
}: {
  dueWeek: number | null;
  boss: BossData | null;
  /** HQ shows the rising XP, a rank-up moment and the medal, as for a mission. */
  onBossDone?: (result: BossResult) => void;
}) {
  const [done, setDone] = useState(boss?.done ?? false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const finish = () =>
    startTransition(async () => {
      const r = await completeBoss();
      if (r.ok) {
        setDone(true);
        setMessage(r.data.xpGained ? `Boss beaten. +${r.data.xpGained} XP.` : null);
        onBossDone?.(r.data);
      } else setMessage(r.message);
    });

  if (!dueWeek && !boss) return null;
  return (
    <div className="mx-5 mt-5 flex flex-col gap-2.5">
      {dueWeek ? (
        <Link
          href="/war-room"
          className="block rounded-xl border-[1.5px] border-brass-deep bg-ledger px-4 py-3.5 hov:border-brass hov:bg-raised"
        >
          <span className="block font-display text-[22px] leading-none font-extrabold">War Room: week {dueWeek}</span>
          <span className="mt-1.5 block text-sm text-moss">60 seconds to review your week. Next week&apos;s plan adapts to it.</span>
        </Link>
      ) : null}
      {boss ? (
        <section aria-label="Boss mission" className="rounded-xl border border-rule bg-ledger px-4 py-3.5">
          <div className="flex items-center gap-2 text-xs text-moss">
            <span className={cn("size-2 rounded-full", PILLAR_CLASSES[boss.pillar].dot)} aria-hidden="true" />
            {PILLAR_LABEL[boss.pillar]}, boss mission this week, {boss.minutes} min
          </div>
          <p className="mt-1.5 text-base font-semibold">{boss.title}</p>
          <p className="mt-1 text-sm text-moss">{boss.howTo}</p>
          {done ? (
            <p className="mt-3 flex h-11 items-center gap-2 text-sm font-bold">
              <Check size={18} strokeWidth={2.5} className="text-brass" aria-hidden="true" />
              Done this week. +{boss.xp} XP.
            </p>
          ) : (
            <button
              type="button"
              onClick={finish}
              disabled={pending}
              className="mt-3 h-11 rounded-[10px] bg-brass px-4 text-[15px] font-bold text-field hov:bg-brass-light disabled:bg-brass/40"
            >
              Mark done, +{boss.xp} XP
            </button>
          )}
          {message ? (
            <p role="status" className="mt-2 text-sm text-bone">
              {message}
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

"use client";

import { Check, Lock } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { setPack } from "@/app/actions/growth";
import { track } from "@/lib/analytics/track";
import { cn } from "@/lib/cn";
import { PACKS_BY_ID } from "@/lib/plan-engine/packs";
import { PILLAR_CLASSES, PILLAR_LABEL } from "@/lib/pillars";
import type { PackState } from "@/lib/server/season-service";

const SMALL_BUTTON =
  "flex h-11 flex-none items-center gap-1.5 rounded-xl px-4 text-sm font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:text-moss";

/** The four Season Pass packs: turn one on with full access, or see what it unlocks. */
export function PackList({ packs, fullAccess }: { packs: PackState[]; fullAccess: boolean }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const toggle = (state: PackState) =>
    startTransition(async () => {
      const pack = PACKS_BY_ID.get(state.id)!;
      const r = await setPack(state.id, !state.on);
      if (!r.ok) setMessage(r.message);
      else if (state.on) setMessage(`${pack.name} is off. Your plan goes back to the main library from tomorrow.`);
      else setMessage(`${pack.name} is on. Its missions join your plan from tomorrow whenever ${PILLAR_LABEL[pack.pillar]} comes up.`);
    });

  return (
    <section className="mt-9" aria-labelledby="packs">
      <h2 id="packs" className="font-display text-[26px] leading-none font-extrabold">
        Mission packs
      </h2>
      <p className="mt-1.5 text-[13px] text-moss">
        {fullAccess
          ? "Ten missions each. Turn one on and its missions join your plan whenever that pillar comes up."
          : "Ten missions each, part of Season Pass."}
      </p>
      <ul className="mt-2">
        {packs.map((state) => {
          const pack = PACKS_BY_ID.get(state.id)!;
          return (
            <li key={state.id} className="border-b border-rule py-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-moss">
                <span className={cn("size-2 rounded-full", PILLAR_CLASSES[pack.pillar].dot)} />
                {PILLAR_LABEL[pack.pillar]}
              </div>
              <h3 className="mt-1 text-base font-semibold">{pack.name}</h3>
              <p className="mt-0.5 text-[13px] text-moss">{pack.description}</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-[13px] text-moss">
                  {state.on && fullAccess ? (
                    <>
                      <Check size={15} strokeWidth={2.5} className="text-brass" aria-hidden="true" />
                      In your plan, {state.done} of 10 done
                    </>
                  ) : state.done > 0 ? (
                    `${state.done} of 10 done`
                  ) : null}
                </span>
                {fullAccess ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => toggle(state)}
                    className={cn(
                      SMALL_BUTTON,
                      state.on
                        ? "text-bone hov:bg-raised"
                        : "border-[1.5px] border-brass-deep text-bone hov:border-brass hov:bg-raised",
                    )}
                  >
                    {state.on ? "Remove" : "Add to my plan"}
                    <span className="sr-only">: {pack.name}</span>
                  </button>
                ) : (
                  <Link
                    href="/pass?from=pack"
                    onClick={() => track("pack_locked_tap", { pack: state.id })}
                    className={cn(SMALL_BUTTON, "border-[1.5px] border-brass-deep text-bone hov:border-brass hov:bg-raised")}
                  >
                    <Lock size={15} strokeWidth={2} aria-hidden="true" />
                    Unlock
                    <span className="sr-only">: {pack.name}, with Season Pass</span>
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 min-h-5 text-sm text-bone" role="status" aria-live="polite">
        {message}
      </p>
    </section>
  );
}

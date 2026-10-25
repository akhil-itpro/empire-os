import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { PILLAR_CLASSES, PILLAR_LABEL } from "@/lib/pillars";
import { cn } from "@/lib/cn";
import { depsFor } from "@/lib/server/deps";
import { getSessionUserId } from "@/lib/server/session";
import { loadWarRoom } from "@/lib/server/war-room-service";
import { ProposalChoice } from "./ProposalChoice";
import { ReviewForm } from "./ReviewForm";

export const metadata: Metadata = { title: "War Room", robots: { index: false } };

export default function WarRoomPage() {
  return (
    <Suspense fallback={<main className="min-h-dvh px-5 pt-6" aria-busy="true" />}>
      <WarRoomContent />
    </Suspense>
  );
}

async function WarRoomContent() {
  await connection();
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");
  const result = await loadWarRoom(await depsFor(userId), userId);
  if (!result.ok) redirect("/quiz");
  const w = result.data;

  if (w.week === null) {
    return (
      <main className="px-5 pt-5">
        <h1 className="font-display text-[40px] leading-none font-extrabold">War Room</h1>
        <p className="mt-3 text-[15px] text-moss">
          Every 7 days you get 60 seconds to review your week, and next week&apos;s plan adapts to it. Your first War Room
          opens on day {w.firstReviewDay}.
        </p>
        <ButtonLink href="/hq" variant="secondary" className="mt-6">
          Back to HQ
        </ButtonLink>
      </main>
    );
  }

  const review = w.review;
  if (!review) {
    return (
      <main className="px-5 pt-5">
        <p className="text-[13px] font-medium text-moss">Week {w.week} review, about 60 seconds</p>
        <h1 className="mt-1 font-display text-[40px] leading-none font-extrabold">War Room</h1>
        {w.stats ? (
          <p className="mt-2 text-[15px] text-moss">
            This week you finished {w.stats.done} of {w.stats.assigned} missions.
          </p>
        ) : null}
        <ReviewForm
          suggestedFocus={w.suggestedFocus}
          pillarOrder={w.pillarOrder}
          current={w.current}
        />
      </main>
    );
  }

  const o = review.outcome;
  return (
    <main className="px-5 pt-5">
      <p className="text-[13px] font-medium text-moss">
        Week {review.week} review. You finished {o.done} of {o.assigned} missions.
      </p>
      <h1 className="mt-1 font-display text-[40px] leading-none font-extrabold">
        {o.lowWeek ? "Reset, don't quit." : "What changed and why"}
      </h1>
      {o.lowWeek ? (
        <p className="mt-2 text-[15px] text-moss">
          A low week is information, not a verdict. Next week is lighter so you can stack wins again.
        </p>
      ) : null}
      {!o.applied ? (
        <p className="mt-3 text-[15px] text-bone">
          Free keeps one mission a day, so this is what would change with Season Pass.
        </p>
      ) : null}

      <ul className="mt-5 flex flex-col border-t border-rule">
        {o.reasons.map((reason) => (
          <li key={reason} className="flex gap-3 border-b border-rule py-3.5 text-[15px] leading-normal">
            <span className="mt-2 size-1.5 flex-none rounded-full bg-brass" aria-hidden="true" />
            <span>{reason}</span>
          </li>
        ))}
      </ul>
      {o.applied ? (
        <p className="mt-3 text-[13px] text-moss">
          Focus pillar:{" "}
          <span className="text-bone">
            <span
              className={cn("mr-1.5 inline-block size-2 rounded-full align-middle", PILLAR_CLASSES[review.focusPillar].dot)}
              aria-hidden="true"
            />
            {PILLAR_LABEL[review.focusPillar]}
          </span>
          {". Your history, XP and rank never change."}
        </p>
      ) : (
        <ButtonLink href="/pass?from=war_room" className="mt-5">
          Unlock with Season Pass
        </ButtonLink>
      )}

      {w.proposal ? (
        <section className="mt-8" aria-labelledby="proposal">
          <h2 id="proposal" className="font-display text-[26px] leading-none font-extrabold">
            {w.proposal.status === "open" ? "Apply new plan?" : w.proposal.status === "applied" ? "New plan applied" : "Plan kept"}
          </h2>
          <p className="mt-1.5 text-[13px] text-moss">
            You changed your {w.proposal.goalChanged && w.proposal.cityChanged ? "goal and city" : w.proposal.goalChanged ? "goal" : "city"}.
            {w.proposal.status === "applied"
              ? " It starts tomorrow. Past days, XP and rank stay as they are."
              : w.proposal.status === "kept"
                ? " Your plan stays as it was."
                : " A new plan starts tomorrow for the weeks left. Past days, XP and rank stay as they are."}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {(["before", "after"] as const).map((k) => (
              <div key={k} className={cn("rounded-xl border bg-ledger px-3.5 py-3", k === "after" ? "border-brass-deep" : "border-rule")}>
                <p className="text-xs font-semibold text-moss">{k === "before" ? "Now" : "New plan"}</p>
                <p className="mt-1 font-display text-xl leading-tight font-extrabold">{w.proposal![k].archetype}</p>
                <ul className="mt-2 flex flex-col gap-1.5 text-[13px] text-moss">
                  {w.proposal![k].missions.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {w.proposal.status === "open" ? <ProposalChoice /> : null}
        </section>
      ) : null}

      <Link href="/hq" className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-brass hov:text-brass-light">
        Back to HQ
      </Link>
    </main>
  );
}

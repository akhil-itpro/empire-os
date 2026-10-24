import { Check, Lock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { cn } from "@/lib/cn";
import { ACT_NAMES } from "@/lib/game/dates";
import { depsFor } from "@/lib/server/deps";
import { loadPacks } from "@/lib/server/season-service";
import { loadPath, type WeekNode } from "@/lib/server/season-history";
import { getSessionUserId } from "@/lib/server/session";
import { PackList } from "./PackList";

export const metadata: Metadata = { title: "Path", robots: { index: false } };

const nf = new Intl.NumberFormat("en-IN");
const ACT_LABEL = { 1: "Act I", 2: "Act II", 3: "Act III" } as const;

export default function PathPage() {
  return (
    <Suspense fallback={<main className="min-h-dvh px-5 pt-6" aria-busy="true" />}>
      <PathContent />
    </Suspense>
  );
}

async function PathContent() {
  await connection();
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");
  const deps = await depsFor(userId);
  const [result, packs] = await Promise.all([loadPath(deps, userId), loadPacks(deps, userId)]);
  if (!result.ok || !packs.ok) redirect("/quiz");
  const { weeks, currentWeek, archetypeName, fullAccess } = result.data;

  return (
    <main className="px-5 pt-5">
      <p className="text-[13px] font-medium text-moss">{archetypeName}</p>
      <h1 className="mt-1 font-display text-[40px] leading-none font-extrabold">Your campaign</h1>
      <p className="mt-2 text-[15px] text-moss">
        Week {currentWeek} of 13. Each week has a focus; your missions follow it.
      </p>

      {([1, 2, 3] as const).map((act) => (
        <section key={act} className="mt-7" aria-labelledby={`act-${act}`}>
          <h2 id={`act-${act}`} className="flex items-baseline gap-2">
            <span className="font-display text-[26px] leading-none font-extrabold">{ACT_NAMES[act]}</span>
            <span className="text-[13px] text-moss">{ACT_LABEL[act]}</span>
          </h2>
          <ol className="mt-3">
            {weeks
              .filter((w) => w.act === act)
              .map((w, i, list) => (
                <WeekRow key={w.week} node={w} last={i === list.length - 1} />
              ))}
          </ol>
        </section>
      ))}

      {!fullAccess ? (
        <p className="mt-6 rounded-xl border border-rule bg-ledger px-4 pt-3 pb-1 text-sm text-moss">
          Weeks 2 to 13 are part of Season Pass. Free keeps one mission a day.{" "}
          <Link
            href="/pass?from=path_week"
            className="inline-flex min-h-11 items-center font-semibold text-brass hov:text-brass-light"
          >
            See Season Pass
          </Link>
        </p>
      ) : null}

      <PackList packs={packs.data.packs} fullAccess={packs.data.fullAccess} />
    </main>
  );
}

function WeekRow({ node, last }: { node: WeekNode; last: boolean }) {
  const { status } = node;
  // A locked week is a link to Season Pass; every other week is plain.
  return (
    <li aria-current={status === "current" ? "step" : undefined}>
      {status === "locked" ? (
        <Link href="/pass?from=path_week" className="flex gap-3.5 rounded-lg hov:bg-ledger">
          <WeekContent node={node} last={last} />
        </Link>
      ) : (
        <div className="flex gap-3.5">
          <WeekContent node={node} last={last} />
        </div>
      )}
    </li>
  );
}

function WeekContent({ node, last }: { node: WeekNode; last: boolean }) {
  const { week, theme, status, xp } = node;
  return (
    <>
      <div className="flex w-8 flex-none flex-col items-center" aria-hidden="true">
        <span
          className={cn(
            "mt-1 flex size-8 items-center justify-center rounded-full",
            status === "done" && "bg-brass text-field",
            status === "current" && "border-2 border-brass text-brass motion-safe:animate-[pulse-ring_2s_ease-out_infinite]",
            status === "future" && "border-2 border-rule text-moss",
            status === "locked" && "border-2 border-rule text-moss",
          )}
        >
          {status === "done" ? (
            <Check size={16} strokeWidth={3} />
          ) : status === "locked" ? (
            <Lock size={14} strokeWidth={2} />
          ) : (
            <span className="text-xs font-bold">{week}</span>
          )}
        </span>
        {!last ? <span className={cn("my-1 w-0.5 flex-1", status === "done" ? "bg-brass-deep" : "bg-rule")} /> : null}
      </div>
      <div className={cn("min-w-0 flex-1", last ? "pb-1" : "pb-4")}>
        <div className="flex items-baseline justify-between gap-3">
          <span className={cn("text-base font-semibold", status === "current" ? "text-brass" : "text-bone")}>
            Week {week}: {theme}
          </span>
          {status === "done" || status === "current" ? (
            <span className="text-[13px] whitespace-nowrap text-moss">{nf.format(xp)} XP</span>
          ) : null}
        </div>
        <div className="mt-0.5 text-[13px] text-moss">
          {status === "done"
            ? "Finished"
            : status === "current"
              ? "This week"
              : status === "locked"
                ? "Locked on Free"
                : "Coming up"}
        </div>
      </div>
    </>
  );
}

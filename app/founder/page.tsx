import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { ColumnChart } from "@/components/charts/ColumnChart";
import { Meter } from "@/components/ui/Meter";
import { StatTile } from "@/components/ui/StatTile";
import { Wordmark } from "@/components/ui/Wordmark";
import { cn } from "@/lib/cn";
import { addDays, localDate } from "@/lib/game/dates";
import { PILLARS } from "@/lib/pillars";
import { MISSIONS_BY_ID } from "@/lib/plan-engine/missions";
import { storeForRequest } from "@/lib/server/deps";
import { computeFounderMetrics } from "@/lib/server/founder";
import { getSessionUserId } from "@/lib/server/session";
import { Checklist } from "./Checklist";

export const metadata: Metadata = { title: "Founder HQ", robots: { index: false, follow: false } };

const RANGES = [7, 30, 90] as const;
const nf = new Intl.NumberFormat("en-IN");
const dayLabel = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
const REASON: Record<string, string> = { no_time: "No time", not_relevant: "Not relevant", too_hard: "Too hard" };

export default function FounderPage({ searchParams }: PageProps<"/founder">) {
  return (
    <Suspense fallback={<main className="min-h-dvh" aria-busy="true" />}>
      <FounderContent searchParams={searchParams} />
    </Suspense>
  );
}

function Card({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-[14px] border border-rule/70 bg-ledger p-4", className)} aria-label={title}>
      <h2 className="font-display text-[22px] leading-none font-extrabold">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

async function FounderContent({ searchParams }: { searchParams: PageProps<"/founder">["searchParams"] }) {
  await connection();
  const userId = await getSessionUserId();
  const store = storeForRequest();
  // A normal user sees nothing here: the page doesn't exist for them.
  if (!userId || !(await store.isFounder(userId))) notFound();

  const wanted = Number((await searchParams).range);
  const range = (RANGES as readonly number[]).includes(wanted) ? wanted : 30;
  const to = localDate(new Date(), "Asia/Kolkata");
  const from = addDays(to, -(range - 1));
  const toLocal = (d: Date) => localDate(d, "Asia/Kolkata");
  const [snapshot, checklist] = await Promise.all([store.founderSnapshot(from), store.listChecklist()]);
  const m = computeFounderMetrics(snapshot, from, to, toLocal);
  const totalSignups = m.signupsPerDay.reduce((s, d) => s + d.count, 0);
  const doneByPillar = Math.max(1, ...PILLARS.map((p) => m.missionsByPillar[p]));

  return (
    <main className="mx-auto w-full max-w-[1040px] px-5 pt-4 pb-16">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <Wordmark size={22} />
          <h1 className="font-display text-[26px] leading-none font-extrabold">Founder HQ</h1>
        </div>
        <nav aria-label="Date range" className="flex gap-2">
          {RANGES.map((r) => (
            <Link
              key={r}
              href={`/founder?range=${r}`}
              aria-current={r === range ? "page" : undefined}
              className={cn(
                "flex h-11 items-center rounded-full border px-4 text-sm font-semibold",
                r === range ? "border-brass text-brass" : "border-rule text-bone hov:bg-raised",
              )}
            >
              Last {r} days
            </Link>
          ))}
        </nav>
      </header>
      <p className="mt-2 text-sm text-moss">Read-only. Dates in India time. Only the founder role can open this page.</p>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Sign-ups" value={nf.format(totalSignups)} unit={`last ${range} days`} />
        <StatTile label="Reservations" value={nf.format(m.reservations.total)} unit={`${nf.format(m.reservations.founderPrice)} at founder price`} />
        <StatTile label="Share cards made" value={nf.format(m.shareCards)} />
        <StatTile label="Referral sign-ups" value={nf.format(m.referralSignups)} />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card title="Sign-ups per day">
          <ColumnChart
            unit="sign-ups"
            summary={`Sign-ups each day for the last ${range} days, ${totalSignups} in total.`}
            data={m.signupsPerDay.map((d) => ({ key: d.date, label: dayLabel.format(new Date(`${d.date}T00:00:00Z`)), value: d.count }))}
          />
        </Card>

        <Card title="Funnel">
          <table className="w-full text-sm">
            <thead className="text-moss">
              <tr>
                <th scope="col" className="py-1.5 text-left font-semibold">Step</th>
                <th scope="col" className="py-1.5 text-right font-semibold">People</th>
                <th scope="col" className="py-1.5 text-right font-semibold">Drop-off</th>
              </tr>
            </thead>
            <tbody>
              {m.funnel.map((f) => (
                <tr key={f.label} className="border-t border-rule">
                  <td className="py-1.5">{f.label}</td>
                  <td className="py-1.5 text-right tabular-nums">{nf.format(f.count)}</td>
                  <td className="py-1.5 text-right text-moss tabular-nums">{f.dropOff === null ? "–" : `${f.dropOff}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="Return">
          <div className="grid grid-cols-3 gap-2">
            {m.returns.map((r) => (
              <div key={r.day}>
                <div className="text-[13px] font-medium text-moss">Day {r.day}</div>
                <div className="mt-1 text-[28px] leading-none font-semibold">{r.rate === null ? "–" : `${r.rate}%`}</div>
                <div className="mt-1 text-xs text-moss">
                  {r.returned} of {r.cohort}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-moss">Share of students who did a mission N days after signing up, among those who signed up at least N days ago.</p>
        </Card>

        <Card title="Missions done by pillar">
          <ul className="flex flex-col gap-[11px]">
            {PILLARS.map((p) => (
              <li key={p}>
                <Meter tone={p} value={(m.missionsByPillar[p] / doneByPillar) * 100} valueText={nf.format(m.missionsByPillar[p])} />
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Most-skipped missions">
          {m.mostSkipped.length === 0 ? (
            <p className="text-sm text-moss">No skips in this range.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {m.mostSkipped.map((s) => (
                <li key={s.missionId}>
                  <span className="font-semibold">{MISSIONS_BY_ID.get(s.missionId)?.title ?? s.missionId}</span>
                  <span className="text-moss">
                    {" "}
                    {s.skips} {s.skips === 1 ? "skip" : "skips"}:{" "}
                    {Object.entries(s.reasons)
                      .map(([r, n]) => `${REASON[r] ?? r} ${n}`)
                      .join(", ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Paywall views by source">
          {m.paywallBySource.length === 0 ? (
            <p className="text-sm text-moss">No paywall views in this range.</p>
          ) : (
            <ul className="flex flex-col gap-1.5 text-sm">
              {m.paywallBySource.map((p) => (
                <li key={p.source} className="flex justify-between">
                  <span>{p.source}</span>
                  <span className="tabular-nums">{nf.format(p.views)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Colleges and batches">
          <p className="text-sm text-moss">Placeholder: these numbers arrive with College HQ (Phase 7).</p>
        </Card>

        <Card title="Launch checklist" className="md:col-span-2">
          <Checklist items={checklist} />
        </Card>
      </div>
    </main>
  );
}

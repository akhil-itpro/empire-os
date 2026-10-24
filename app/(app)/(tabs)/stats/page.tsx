import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ColumnChart } from "@/components/charts/ColumnChart";
import { Meter } from "@/components/ui/Meter";
import { StatTile } from "@/components/ui/StatTile";
import { PILLARS, type Pillar } from "@/lib/pillars";
import { depsFor } from "@/lib/server/deps";
import { getSessionUserId } from "@/lib/server/session";
import { formatMinutes, loadStats } from "@/lib/server/stats";

export const metadata: Metadata = { title: "Stats", robots: { index: false } };

const nf = new Intl.NumberFormat("en-IN");
const dayLabel = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });

export default function StatsPage() {
  return (
    <Suspense fallback={<main className="min-h-dvh px-5 pt-6" aria-busy="true" />}>
      <StatsContent />
    </Suspense>
  );
}

function PillarMeters({ title, values }: { title: string; values: Record<Pillar, number | null> }) {
  return (
    <div>
      <h3 className="text-xs font-medium text-moss">{title}</h3>
      <ul className="mt-2.5 flex flex-col gap-[11px]">
        {PILLARS.map((p) => (
          <li key={p}>
            <Meter tone={p} value={values[p] ?? 0} valueText={values[p] === null ? "–" : `${values[p]}%`} />
          </li>
        ))}
      </ul>
    </div>
  );
}

async function StatsContent() {
  await connection();
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");
  const result = await loadStats(await depsFor(userId), userId);
  if (!result.ok) redirect("/quiz");
  const s = result.data;
  const chart = s.xpByDay.map((d) => ({
    key: d.date,
    label: dayLabel.format(new Date(`${d.date}T00:00:00Z`)),
    value: d.xp,
  }));

  return (
    <main className="px-5 pt-5">
      <h1 className="font-display text-[40px] leading-none font-extrabold">Stats</h1>
      <p className="mt-3 text-base text-bone">
        {s.minutesInvested > 0
          ? `You've invested ${formatMinutes(s.minutesInvested)} in yourself this season.`
          : "Your first finished mission starts the count."}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <StatTile label="Missions done" value={nf.format(s.missionsDone)} unit="this season" />
        <StatTile label="Total XP" value={nf.format(s.totalXp)} />
        <StatTile label="Current streak" value={s.currentStreak} unit={s.currentStreak === 1 ? "day" : "days"} />
        <StatTile label="Best streak" value={s.bestStreak} unit={s.bestStreak === 1 ? "day" : "days"} />
      </div>

      <section className="mt-8" aria-labelledby="xp-by-day">
        <h2 id="xp-by-day" className="font-display text-[26px] leading-none font-extrabold">
          XP by day
        </h2>
        <p className="mt-1.5 text-[13px] text-moss">The last {chart.length === 1 ? "day" : `${chart.length} days`}.</p>
        <div className="mt-3">
          <ColumnChart
            data={chart}
            unit="XP"
            summary={`XP earned each day over the last ${chart.length} days. Highest: ${nf.format(Math.max(0, ...chart.map((c) => c.value)))} XP.`}
          />
        </div>
      </section>

      <section className="mt-8" aria-labelledby="by-pillar">
        <h2 id="by-pillar" className="font-display text-[26px] leading-none font-extrabold">
          Missions done by pillar
        </h2>
        <div className="mt-4 grid gap-6">
          <PillarMeters title="Last 7 days" values={s.week} />
          <PillarMeters title="This season" values={s.season} />
        </div>
      </section>
    </main>
  );
}

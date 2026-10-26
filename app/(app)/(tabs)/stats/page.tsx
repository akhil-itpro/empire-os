import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ColumnChart } from "@/components/charts/ColumnChart";
import { MedalBadge } from "@/components/ui/MedalBadge";
import { Meter } from "@/components/ui/Meter";
import { StatTile } from "@/components/ui/StatTile";
import { cn } from "@/lib/cn";
import { PILLARS, type Pillar } from "@/lib/pillars";
import { depsFor } from "@/lib/server/deps";
import { loadMedals } from "@/lib/server/medal-service";
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
  const deps = await depsFor(userId);
  const [result, medalResult] = await Promise.all([loadStats(deps, userId), loadMedals(deps, userId)]);
  if (!result.ok || !medalResult.ok) redirect("/quiz");
  const s = result.data;
  const medals = medalResult.data;
  const earnedCount = medals.filter((m) => m.earned).length;
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

      <section id="medals" className="mt-8 scroll-mt-4" aria-labelledby="medals-title">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="medals-title" className="font-display text-[26px] leading-none font-extrabold">
            Medals
          </h2>
          <span className="text-[13px] text-moss">
            {earnedCount} of {medals.length} earned
          </span>
        </div>
        <p className="mt-1.5 text-[13px] text-moss">Earned from what you actually do. They stay when a new season starts.</p>
        <ul className="mt-4 grid grid-cols-3 gap-x-3 gap-y-5">
          {medals.map((m) => (
            <li key={m.id} className="flex min-w-0 flex-col">
              <MedalBadge id={m.id} earned={m.earned} size={64} />
              <span className={cn("mt-2 text-sm leading-tight font-semibold", m.earned ? "text-bone" : "text-moss")}>
                {m.name}
              </span>
              <span className="mt-1 text-xs leading-snug text-moss">
                {m.earned ? (m.earnedOn ? `Earned ${dayLabel.format(new Date(`${m.earnedOn}T00:00:00Z`))}` : "Earned") : m.how}
              </span>
            </li>
          ))}
        </ul>
      </section>

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

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { StatTile } from "@/components/ui/StatTile";
import { MAX_WEEKLY_MISSIONS, NUDGE_AFTER_DAYS } from "@/lib/server/college-metrics";
import { loadOverview } from "@/lib/server/college-service";
import { depsFor } from "@/lib/server/deps";
import { getSessionUserId } from "@/lib/server/session";
import { CollegeShell, panel, panelTitle, PrivacyNote, SampleChip } from "../CollegeShell";
import { DailyChart } from "./DailyChart";
import { Filters } from "./Filters";
import { NudgeButton } from "./NudgeButton";
import { dayMonth, longDate, seasonLine } from "./format";

export const metadata: Metadata = { title: "College HQ", robots: { index: false, follow: false } };

export default function OverviewPage(props: PageProps<"/college/[batchId]">) {
  return (
    <Suspense fallback={<main className="min-h-dvh bg-field" aria-busy="true" />}>
      <OverviewContent {...props} />
    </Suspense>
  );
}

/** "Up 12 vs last week": good news in green, always with an arrow and words. */
function delta(now: number, prev: number | null, upIsGood: boolean, decimals = 0) {
  if (prev === null) return undefined;
  const diff = Math.round((now - prev) * 10 ** decimals) / 10 ** decimals;
  if (diff === 0) return undefined;
  const up = diff > 0;
  return {
    direction: up ? ("up" as const) : ("down" as const),
    text: `${up ? "Up" : "Down"} ${Math.abs(diff).toFixed(decimals)} vs last week`,
    good: up === upIsGood,
  };
}

async function OverviewContent({ params, searchParams }: PageProps<"/college/[batchId]">) {
  await connection();
  const userId = await getSessionUserId();
  if (!userId) redirect("/college");
  const { batchId } = await params;
  const q = await searchParams;
  const result = await loadOverview(await depsFor(userId), userId, batchId, q.range, q.section);
  if (!result.ok) notFound();
  const { batch, org, overview: o, range, section, totalMembers } = result.data;

  return (
    <CollegeShell batchId={batch.id} orgName={org.name} active="overview">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-[40px] leading-none font-extrabold">{batch.name}</h1>
            {batch.isSample ? <SampleChip /> : null}
          </div>
          <p className="mt-1.5 text-[15px] text-moss">{seasonLine(batch, o.position, totalMembers)}</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link
            href={`/college/${batch.id}/invite`}
            className="flex h-11 items-center gap-2 rounded-[10px] border-[1.5px] border-brass-deep px-4 text-[15px] font-semibold text-bone hov:border-brass hov:bg-raised"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="9" cy="8" r="4" />
              <path d="M2 21c1-3.5 3.5-5 7-5s6 1.5 7 5M19 8v6M16 11h6" />
            </svg>
            Invite students
          </Link>
          <Link
            href={`/college/${batch.id}/report`}
            className="flex h-11 items-center gap-2 rounded-[10px] bg-brass px-4 text-[15px] font-bold text-field hov:bg-brass-light"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
            </svg>
            Download weekly report
          </Link>
        </div>
      </div>

      <Filters batchId={batch.id} range={range} section={section} sections={batch.sections} />

      {totalMembers === 0 ? (
        <section className={panel} aria-labelledby="empty">
          <h2 id="empty" className={panelTitle}>
            No students yet
          </h2>
          <p className="mt-2 text-sm text-moss">
            Students join from Me in the app with your batch code{" "}
            <strong className="font-semibold tracking-wide text-bone">{batch.joinCode}</strong>, or with the link and
            poster on the{" "}
            <Link href={`/college/${batch.id}/invite`} className="font-semibold text-brass hov:text-brass-light">
              invite page
            </Link>
            . They appear here once they agree to share their progress.
          </p>
        </section>
      ) : null}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5">
        <StatTile
          label="Active this week"
          value={o.activeThisWeek.count}
          unit={`of ${o.memberCount}`}
          delta={delta(o.activeThisWeek.count, o.activeThisWeek.prev, true)}
        />
        <StatTile
          label="Missions per student"
          value={o.missionsPerStudent.value.toFixed(1)}
          unit={`of ${MAX_WEEKLY_MISSIONS} this week`}
          delta={delta(o.missionsPerStudent.value, o.missionsPerStudent.prev, true, 1)}
        />
        <StatTile
          label="Need a nudge"
          value={o.needNudge.count}
          unit={`missed ${NUDGE_AFTER_DAYS}+ days`}
          delta={delta(o.needNudge.count, o.needNudge.prev, false)}
        />
        <StatTile
          label="Mock interviews done"
          value={o.mockInterviews}
          unit="this season"
          note="Counted when a student finishes a mock-interview mission"
        />
      </div>

      <div className="flex flex-wrap gap-3.5">
        <section className={`${panel} min-w-0 flex-[2_1_520px] pb-4`} aria-label="Students active each day">
          <DailyChart
            title="Students active each day"
            total={o.memberCount}
            points={o.daily.map((d) => ({ ...d, label: dayMonth(d.date) }))}
          />
        </section>

        <section className={`${panel} flex min-w-0 flex-[1_1_300px] flex-col`} aria-labelledby="nudge">
          <h2 id="nudge" className={panelTitle}>
            Need a nudge
          </h2>
          <p className="mt-1 text-[13px] text-moss">Missed {NUDGE_AFTER_DAYS} or more days in a row</p>
          {o.nudgeList.length === 0 ? (
            <p className="mt-3 text-sm text-moss">
              {o.position.started ? `Nobody has missed ${NUDGE_AFTER_DAYS} days in a row.` : "The list starts when the season does."}
            </p>
          ) : (
            <ul className="mt-3 flex flex-col">
              {o.nudgeList.slice(0, 4).map((s) => (
                <li key={s.userId} className="flex items-center justify-between gap-2.5 border-b border-rule/50 py-2 last:border-b-0">
                  <div className="min-w-0">
                    <div className="text-[15px] font-semibold">{s.displayName}</div>
                    <div className="text-[13px] text-moss">
                      {s.section ? `${s.section}, ` : ""}missed {s.missedDays} days
                    </div>
                  </div>
                  <NudgeButton batchId={batch.id} studentId={s.userId} sentToday={s.nudgedToday} />
                </li>
              ))}
            </ul>
          )}
          {o.nudgeList.length > 4 ? (
            <Link
              href={`/college/${batch.id}/students`}
              className="mt-auto flex min-h-11 items-end text-sm font-semibold text-brass hov:text-brass-light"
            >
              See all {o.nudgeList.length} students
            </Link>
          ) : null}
        </section>
      </div>

      <section className={panel} aria-labelledby="sections">
        <h2 id="sections" className={panelTitle}>
          Sections this week
        </h2>
        <div tabIndex={0} className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="text-left text-moss">
              <tr>
                <th scope="col" className="border-b border-rule px-3 py-2.5 font-semibold">Section</th>
                <th scope="col" className="border-b border-rule px-3 py-2.5 text-right font-semibold">Students</th>
                <th scope="col" className="border-b border-rule px-3 py-2.5 text-right font-semibold">Active this week</th>
                <th scope="col" className="border-b border-rule px-3 py-2.5 text-right font-semibold">Missions per student</th>
                <th scope="col" className="border-b border-rule px-3 py-2.5 text-right font-semibold">Need a nudge</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {o.sections.map((s) => (
                <tr key={s.name} className="border-b border-rule/50 last:border-b-0">
                  <td className="px-3 py-2.5 font-semibold normal-nums">{s.name}</td>
                  <td className="px-3 py-2.5 text-right">{s.students}</td>
                  <td className="px-3 py-2.5 text-right">
                    {s.active} ({s.activeShare}%)
                  </td>
                  <td className="px-3 py-2.5 text-right">{s.missionsPerStudent.toFixed(1)}</td>
                  <td className="px-3 py-2.5 text-right">{s.needNudge}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {o.position.finished ? (
          <p className="mt-3 text-[13px] text-moss">The season ended on {longDate(batch.endsOn)}. These are its last seven days.</p>
        ) : null}
      </section>

      <PrivacyNote />
    </CollegeShell>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { MAX_WEEKLY_MISSIONS, NUDGE_AFTER_DAYS } from "@/lib/server/college-metrics";
import { loadReport } from "@/lib/server/college-service";
import { depsFor } from "@/lib/server/deps";
import { getSessionUserId } from "@/lib/server/session";
import { CollegeShell } from "../../CollegeShell";
import { PrintButton } from "../../PrintButton";
import { dayMonth, longDate } from "../format";

export const metadata: Metadata = { title: "Weekly report", robots: { index: false, follow: false } };

export default function ReportPage(props: PageProps<"/college/[batchId]/report">) {
  return (
    <Suspense fallback={<main className="min-h-dvh bg-field" aria-busy="true" />}>
      <ReportContent {...props} />
    </Suspense>
  );
}

const th = "border-b border-field/30 px-2 py-2 text-left font-semibold";
const td = "border-b border-field/15 px-2 py-1.5";

function Figure({ label, value, unit }: { label: string; value: ReactNode; unit?: string }) {
  return (
    <div className="border-t-2 border-field pt-2">
      <div className="text-[13px] font-medium text-field/75">{label}</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="text-[30px] leading-none font-semibold">{value}</span>
        {unit ? <span className="text-sm text-field/75">{unit}</span> : null}
      </div>
    </div>
  );
}

async function ReportContent({ params }: PageProps<"/college/[batchId]/report">) {
  await connection();
  const userId = await getSessionUserId();
  if (!userId) redirect("/college");
  const { batchId } = await params;
  const result = await loadReport(await depsFor(userId), userId, batchId);
  if (!result.ok) notFound();
  const { batch, org, today, report } = result.data;
  const o = report.overview;
  const share = o.memberCount ? Math.round((o.activeThisWeek.count / o.memberCount) * 100) : 0;

  return (
    <CollegeShell batchId={batch.id} orgName={org.name} active="reports">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="font-display text-[40px] leading-none font-extrabold">Weekly report</h1>
          <p className="mt-1.5 text-[15px] text-moss">
            For your principal. Press the button, then choose &quot;Save as PDF&quot; in the print window.
          </p>
        </div>
        <PrintButton label="Save as PDF" />
      </div>

      {/* The report is a sheet of bone paper with ink text, on screen and in print. */}
      <article className="rounded-[14px] bg-bone px-6 py-7 text-field sm:px-10 print:rounded-none print:p-0" aria-label="Weekly report">
        <p className="text-[13px] font-semibold text-field/75">EMPIRE OS College HQ</p>
        <h2 className="mt-1 font-display text-[34px] leading-none font-extrabold">
          {batch.name}: {o.position.started ? `week ${o.position.week} of ${o.position.totalWeeks}` : "before the season"}
        </h2>
        <p className="mt-2 text-sm text-field/75">
          {org.name} training and placement cell.{" "}
          {o.position.started ? `${longDate(report.weekFrom)} to ${longDate(report.weekTo)}.` : `The season starts on ${longDate(batch.startsOn)}.`}
          {batch.isSample ? " Sample data for a demo, not real students." : ""}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4">
          <Figure label="Students joined" value={o.memberCount} />
          <Figure label="Active this week" value={o.activeThisWeek.count} unit={`${share}%`} />
          <Figure label="Missions per student" value={o.missionsPerStudent.value.toFixed(1)} unit={`of ${MAX_WEEKLY_MISSIONS}`} />
          <Figure label={`Missed ${NUDGE_AFTER_DAYS}+ days in a row`} value={o.needNudge.count} />
        </div>

        <h3 className="mt-8 font-display text-[22px] leading-none font-extrabold">Trend</h3>
        {report.trend.length === 0 ? (
          <p className="mt-2 text-sm text-field/75">The trend starts after the first week.</p>
        ) : (
          <table className="mt-2 w-full text-sm">
            <thead>
              <tr>
                <th scope="col" className={th}>Week</th>
                <th scope="col" className={th}>Students active</th>
                <th scope="col" className={`${th} text-right`}>Missions per student</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {report.trend.map((t) => (
                <tr key={t.from}>
                  <td className={td}>
                    {dayMonth(t.from)} to {dayMonth(t.to)}
                  </td>
                  <td className={td}>
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-28 flex-none rounded-sm bg-field/15" aria-hidden="true">
                        <span className="block h-2 rounded-sm bg-field" style={{ width: `${t.activeShare}%` }} />
                      </span>
                      {t.activeShare}%
                    </span>
                  </td>
                  <td className={`${td} text-right`}>{t.missionsPerStudent.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <h3 className="mt-8 font-display text-[22px] leading-none font-extrabold">Most consistent this week</h3>
        {report.top.length === 0 ? (
          <p className="mt-2 text-sm text-field/75">No missions finished this week yet.</p>
        ) : (
          <table className="mt-2 w-full text-sm">
            <thead>
              <tr>
                <th scope="col" className={th}>Student</th>
                <th scope="col" className={th}>Section</th>
                <th scope="col" className={`${th} text-right`}>Active days</th>
                <th scope="col" className={`${th} text-right`}>Missions</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {report.top.map((s) => (
                <tr key={s.userId}>
                  <td className={`${td} font-semibold normal-nums`}>{s.displayName}</td>
                  <td className={td}>{s.section ?? "–"}</td>
                  <td className={`${td} text-right`}>{s.activeDaysThisWeek} of 7</td>
                  <td className={`${td} text-right`}>{s.missionsThisWeek}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <h3 className="mt-8 font-display text-[22px] leading-none font-extrabold">Sections</h3>
        <table className="mt-2 w-full text-sm">
          <thead>
            <tr>
              <th scope="col" className={th}>Section</th>
              <th scope="col" className={`${th} text-right`}>Students</th>
              <th scope="col" className={`${th} text-right`}>Active this week</th>
              <th scope="col" className={`${th} text-right`}>Missions per student</th>
              <th scope="col" className={`${th} text-right`}>Missed {NUDGE_AFTER_DAYS}+ days</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {o.sections.map((s) => (
              <tr key={s.name}>
                <td className={`${td} font-semibold normal-nums`}>{s.name}</td>
                <td className={`${td} text-right`}>{s.students}</td>
                <td className={`${td} text-right`}>
                  {s.active} ({s.activeShare}%)
                </td>
                <td className={`${td} text-right`}>{s.missionsPerStudent.toFixed(1)}</td>
                <td className={`${td} text-right`}>{s.needNudge}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="mt-8 text-xs leading-normal text-field/75">
          Only students who chose to share their progress appear here, by first name and initial. Journals and personal
          answers are never shown. &quot;Active&quot; means at least one mission finished that day. Made on {longDate(today)}.
        </p>
      </article>

      <Link href={`/college/${batch.id}`} className="flex min-h-11 items-center text-sm font-semibold text-brass hov:text-brass-light print:hidden">
        Back to the overview
      </Link>
    </CollegeShell>
  );
}

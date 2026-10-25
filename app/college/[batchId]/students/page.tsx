import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { NUDGE_AFTER_DAYS } from "@/lib/server/college-metrics";
import { loadStudents } from "@/lib/server/college-service";
import { depsFor } from "@/lib/server/deps";
import { getSessionUserId } from "@/lib/server/session";
import { CollegeShell, panel, PrivacyNote, SampleChip } from "../../CollegeShell";
import { NudgeButton } from "../NudgeButton";
import { dayMonth } from "../format";

export const metadata: Metadata = { title: "Students", robots: { index: false, follow: false } };

export default function StudentsPage(props: PageProps<"/college/[batchId]/students">) {
  return (
    <Suspense fallback={<main className="min-h-dvh bg-field" aria-busy="true" />}>
      <StudentsContent {...props} />
    </Suspense>
  );
}

async function StudentsContent({ params }: PageProps<"/college/[batchId]/students">) {
  await connection();
  const userId = await getSessionUserId();
  if (!userId) redirect("/college");
  const { batchId } = await params;
  const result = await loadStudents(await depsFor(userId), userId, batchId);
  if (!result.ok) notFound();
  const { batch, org, students } = result.data;
  const needing = students.filter((s) => s.missedDays >= NUDGE_AFTER_DAYS).length;

  return (
    <CollegeShell batchId={batch.id} orgName={org.name} active="students">
      <div>
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="font-display text-[40px] leading-none font-extrabold">Students</h1>
          {batch.isSample ? <SampleChip /> : null}
        </div>
        <p className="mt-1.5 text-[15px] text-moss">
          {batch.name}: {students.length} joined, {needing} missed {NUDGE_AFTER_DAYS} or more days in a row. Most missed first.
        </p>
      </div>

      <section className={panel} aria-label="Every student in the batch">
        {students.length === 0 ? (
          <p className="text-sm text-moss">No students have joined yet.</p>
        ) : (
          <div tabIndex={0} className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="text-left text-moss">
                <tr>
                  <th scope="col" className="border-b border-rule px-3 py-2.5 font-semibold">Student</th>
                  <th scope="col" className="border-b border-rule px-3 py-2.5 font-semibold">Section</th>
                  <th scope="col" className="border-b border-rule px-3 py-2.5 font-semibold">Last active</th>
                  <th scope="col" className="border-b border-rule px-3 py-2.5 text-right font-semibold">Active days this week</th>
                  <th scope="col" className="border-b border-rule px-3 py-2.5 text-right font-semibold">Missions this week</th>
                  <th scope="col" className="border-b border-rule px-3 py-2.5 text-right font-semibold">Days missed in a row</th>
                  <th scope="col" className="border-b border-rule px-3 py-2.5"><span className="sr-only">Reminder</span></th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {students.slice(0, 500).map((s) => (
                  <tr key={s.userId} className="border-b border-rule/50 last:border-b-0">
                    <td className="px-3 py-2 font-semibold normal-nums">{s.displayName}</td>
                    <td className="px-3 py-2 normal-nums">{s.section ?? "–"}</td>
                    <td className="px-3 py-2">{s.lastActive ? dayMonth(s.lastActive) : "Not yet"}</td>
                    <td className="px-3 py-2 text-right">{s.activeDaysThisWeek} of 7</td>
                    <td className="px-3 py-2 text-right">{s.missionsThisWeek}</td>
                    <td className="px-3 py-2 text-right">{s.missedDays}</td>
                    <td className="px-3 py-1.5 text-right">
                      {s.missedDays >= NUDGE_AFTER_DAYS ? (
                        <NudgeButton batchId={batch.id} studentId={s.userId} sentToday={s.nudgedToday} />
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {students.length > 500 ? <p className="mt-3 text-[13px] text-moss">Showing the first 500 students.</p> : null}
          </div>
        )}
      </section>
      <p className="text-[13px] text-moss">
        A reminder shows once in the student&apos;s app, the next time they open it. One a day per student. EMPIRE OS
        doesn&apos;t send emails, texts or WhatsApp messages.
      </p>
      <PrivacyNote />
    </CollegeShell>
  );
}

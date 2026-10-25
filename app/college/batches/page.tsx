import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { adminBatches } from "@/lib/server/college-service";
import { depsFor } from "@/lib/server/deps";
import { getSessionUserId } from "@/lib/server/session";
import { dayMonth, longDate } from "../[batchId]/format";
import { CollegeShell, panel, SampleChip } from "../CollegeShell";

export const metadata: Metadata = { title: "Batches", robots: { index: false, follow: false } };

export default function BatchesPage() {
  return (
    <Suspense fallback={<main className="min-h-dvh bg-field" aria-busy="true" />}>
      <BatchesContent />
    </Suspense>
  );
}

async function BatchesContent() {
  await connection();
  const userId = await getSessionUserId();
  if (!userId) redirect("/college");
  const batches = await adminBatches(await depsFor(userId), userId);
  if (batches.length === 0) redirect("/college");
  const first = batches[0];

  return (
    <CollegeShell batchId={first.id} orgName={first.orgName} active="batches">
      <div>
        <h1 className="font-display text-[40px] leading-none font-extrabold">Batches</h1>
        <p className="mt-1.5 text-[15px] text-moss">
          Each batch has its own season dates and join code. New batches are set up by the EMPIRE OS team.
        </p>
      </div>
      <ul className="flex flex-col gap-3.5">
        {batches.map((b) => (
          <li key={b.id} className={`${panel} flex flex-wrap items-center justify-between gap-3`}>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="font-display text-2xl leading-[1.1] font-extrabold">{b.name}</h2>
                {b.isSample ? <SampleChip /> : null}
              </div>
              <p className="mt-1 text-sm text-moss">
                {b.orgName}. {dayMonth(b.startsOn)} to {longDate(b.endsOn)}. Join code{" "}
                <span className="font-semibold tracking-wide text-bone">{b.joinCode}</span>
                {b.grantsPass ? ". Students get Season Pass access for the season." : "."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <Link
                href={`/college/${b.id}/invite`}
                className="flex h-11 items-center rounded-[10px] border-[1.5px] border-brass-deep px-4 text-sm font-semibold text-bone hov:border-brass hov:bg-raised"
              >
                Invite students
              </Link>
              <Link
                href={`/college/${b.id}`}
                className="flex h-11 items-center rounded-[10px] bg-brass px-4 text-sm font-bold text-field hov:bg-brass-light"
              >
                Open overview
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </CollegeShell>
  );
}

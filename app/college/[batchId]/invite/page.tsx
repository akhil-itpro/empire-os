import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { loadBatchAdmin } from "@/lib/server/college-service";
import { depsFor } from "@/lib/server/deps";
import { siteOrigin } from "@/lib/server/origin";
import { getSessionUserId } from "@/lib/server/session";
import { CollegeShell, panel, panelTitle, SampleChip } from "../../CollegeShell";
import { CopyButton } from "../../CopyButton";

export const metadata: Metadata = { title: "Invite students", robots: { index: false, follow: false } };

export default function InviteStudentsPage(props: PageProps<"/college/[batchId]/invite">) {
  return (
    <Suspense fallback={<main className="min-h-dvh bg-field" aria-busy="true" />}>
      <InviteContent {...props} />
    </Suspense>
  );
}

async function InviteContent({ params }: PageProps<"/college/[batchId]/invite">) {
  await connection();
  const userId = await getSessionUserId();
  if (!userId) redirect("/college");
  const { batchId } = await params;
  const result = await loadBatchAdmin(await depsFor(userId), userId, batchId);
  if (!result.ok) notFound();
  const { batch, org } = result.data;
  const link = `${await siteOrigin()}/join/${batch.joinCode}`;

  return (
    <CollegeShell batchId={batch.id} orgName={org.name} active="batches">
      <div>
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="font-display text-[40px] leading-none font-extrabold">Invite students</h1>
          {batch.isSample ? <SampleChip /> : null}
        </div>
        <p className="mt-1.5 text-[15px] text-moss">
          {batch.name}. Share the code, the link or the poster. Each student chooses to join.
        </p>
        {batch.isSample ? (
          <p className="mt-2 text-sm text-bone">This is a sample batch for demos, so its code can&apos;t be used to join.</p>
        ) : null}
      </div>

      <div className="grid gap-3.5 md:grid-cols-2">
        <section className={panel} aria-labelledby="code">
          <h2 id="code" className={panelTitle}>
            Batch code
          </h2>
          <p className="mt-3 font-display text-[50px] leading-none font-extrabold tracking-[0.06em] text-brass">
            {batch.joinCode}
          </p>
          <p className="mt-3 text-sm text-moss">Students open Me in EMPIRE OS, go to College season, and enter this code.</p>
          <div className="mt-3">
            <CopyButton value={batch.joinCode} label="Copy code" />
          </div>
        </section>

        <section className={panel} aria-labelledby="link">
          <h2 id="link" className={panelTitle}>
            Join link
          </h2>
          <p className="mt-3 rounded-[10px] border border-rule bg-field px-3 py-2.5 text-[15px] font-semibold break-all">
            {link}
          </p>
          <p className="mt-3 text-sm text-moss">
            For your WhatsApp group or email. New students take the 2-minute quiz first, then join.
          </p>
          <div className="mt-3">
            <CopyButton value={link} label="Copy link" />
          </div>
        </section>
      </div>

      <section className={panel} aria-labelledby="poster">
        <h2 id="poster" className={panelTitle}>
          Poster
        </h2>
        <p className="mt-2 text-sm text-moss">An A4 poster with the code, the link and a QR code, for notice boards.</p>
        <Link
          href={`/college/${batch.id}/poster`}
          className="mt-3 inline-flex h-11 items-center rounded-[10px] bg-brass px-4 text-[15px] font-bold text-field hov:bg-brass-light"
        >
          Open the poster
        </Link>
      </section>

      <p className="text-[13px] text-moss">
        Before joining, every student sees exactly what is shared with you: their mission progress, not their journal or
        quiz answers. They can leave any time, and their account stays.
      </p>
    </CollegeShell>
  );
}

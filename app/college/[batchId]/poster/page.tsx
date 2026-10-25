import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { QrCode } from "@/components/QrCode";
import { loadBatchAdmin } from "@/lib/server/college-service";
import { depsFor } from "@/lib/server/deps";
import { siteOrigin } from "@/lib/server/origin";
import { getSessionUserId } from "@/lib/server/session";
import { PrintButton } from "../../PrintButton";

export const metadata: Metadata = { title: "Poster", robots: { index: false, follow: false } };

export default function PosterPage(props: PageProps<"/college/[batchId]/poster">) {
  return (
    <Suspense fallback={<main className="min-h-dvh bg-field" aria-busy="true" />}>
      <PosterContent {...props} />
    </Suspense>
  );
}

async function PosterContent({ params }: PageProps<"/college/[batchId]/poster">) {
  await connection();
  const userId = await getSessionUserId();
  if (!userId) redirect("/college");
  const { batchId } = await params;
  const result = await loadBatchAdmin(await depsFor(userId), userId, batchId);
  if (!result.ok) notFound();
  const { batch, org } = result.data;
  const link = `${await siteOrigin()}/join/${batch.joinCode}`;

  return (
    <main className="min-h-dvh bg-field px-5 py-6 print:bg-white print:p-0">
      <div className="mx-auto mb-5 flex max-w-[794px] flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`/college/${batch.id}/invite`}
          className="flex min-h-11 items-center text-sm font-semibold text-brass hov:text-brass-light"
        >
          Back to Invite students
        </Link>
        <PrintButton label="Print or save as PDF" />
      </div>
      {/* An A4 sheet: bone paper and ink text, so it prints cleanly. */}
      <article className="mx-auto flex aspect-[210/297] max-w-[794px] flex-col bg-bone px-[7%] py-[8%] text-field print:aspect-auto print:h-[268mm] print:max-w-none">
        <p className="text-lg font-semibold text-field/75">{org.name} training and placement cell</p>
        <h1 className="mt-4 font-display text-[clamp(40px,8vw,72px)] leading-[0.95] font-extrabold">
          Your next 90 days, as a season.
        </h1>
        <p className="mt-5 max-w-[30ch] text-[clamp(16px,2.6vw,22px)] leading-snug">
          Three short missions a day for your career, body, mind and money, planned around your timetable, budget and free
          time.
        </p>
        <div className="mt-auto flex flex-wrap items-end justify-between gap-6 pt-6">
          <div className="min-w-0">
            <p className="text-base font-semibold text-field/75">Join the {batch.name} season</p>
            <p className="mt-2 font-display text-[clamp(44px,9vw,80px)] leading-none font-extrabold tracking-[0.06em]">
              {batch.joinCode}
            </p>
            <p className="mt-3 text-base font-semibold break-all">{link}</p>
          </div>
          <QrCode value={link} size={200} label={`QR code for ${link}`} />
        </div>
        <p className="mt-8 border-t border-field/25 pt-4 text-sm leading-normal text-field/75">
          Free to start. Your mission progress (not your journal or quiz answers) is shared with the {org.name} training and
          placement cell. Leave any time; your account stays. Missions are general habits, not medical, financial or legal
          advice.
        </p>
      </article>
    </main>
  );
}

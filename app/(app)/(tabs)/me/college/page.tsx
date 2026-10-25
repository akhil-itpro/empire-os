import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { previewJoin } from "@/lib/server/college-service";
import { depsFor } from "@/lib/server/deps";
import { getSessionUserId } from "@/lib/server/session";
import { JoinForm } from "./JoinForm";

export const metadata: Metadata = { title: "Join a college batch", robots: { index: false } };

const longDate = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", timeZone: "UTC" });
const fmt = (d: string) => longDate.format(new Date(`${d}T00:00:00Z`));

export default function JoinCollegePage({ searchParams }: PageProps<"/me/college">) {
  return (
    <Suspense fallback={<main className="min-h-dvh px-5 pt-6" aria-busy="true" />}>
      <JoinContent searchParams={searchParams} />
    </Suspense>
  );
}

function Back() {
  return (
    <Link href="/me" className="inline-flex min-h-11 items-center text-sm font-semibold text-brass hov:text-brass-light">
      Back to Me
    </Link>
  );
}

async function JoinContent({ searchParams }: { searchParams: PageProps<"/me/college">["searchParams"] }) {
  await connection();
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");
  const { code } = await searchParams;
  const result = await previewJoin(await depsFor(userId), userId, code);
  if (!result.ok && result.error === "not_started") redirect("/quiz");

  if (!result.ok) {
    return (
      <main className="px-5 pt-3">
        <Back />
        <h1 className="mt-4 font-display text-[40px] leading-none font-extrabold">Join a college batch</h1>
        <p className="mt-3 text-[15px] text-bone">{result.message}</p>
      </main>
    );
  }

  const p = result.data;
  const blocked =
    p.blocked?.reason === "member_here"
      ? "You're already in this batch."
      : p.blocked?.reason === "member_elsewhere"
        ? `You're in a batch at ${p.blocked.currentOrg}. Leave it in Me first, then come back to this code.`
        : p.blocked?.reason === "sample"
          ? "This is a sample batch for demos. Ask your college for its real code."
          : p.blocked?.reason === "ended"
            ? `This batch's season ended on ${fmt(p.endsOn)}.`
            : null;

  return (
    <main className="px-5 pt-3">
      <Back />
      <p className="mt-4 text-[13px] font-medium text-moss">{p.orgName}</p>
      <h1 className="mt-1 font-display text-[40px] leading-none font-extrabold">Join the {p.batchName} season</h1>
      <p className="mt-2 text-[15px] text-moss">
        Season {fmt(p.startsOn)} to {fmt(p.endsOn)}.
        {p.grantsPass ? " Your college covers Season Pass for these dates: three missions a day and the full campaign." : ""}
      </p>

      <section className="mt-6 rounded-xl border border-brass-deep bg-ledger px-4 py-4" aria-labelledby="shared">
        <h2 id="shared" className="text-base font-bold">
          What your college will see
        </h2>
        <p className="mt-2 text-[15px] leading-normal">
          Your mission progress (not your journal or quiz answers) will be shared with {p.orgName} training and placement
          cell. You can leave any time; your account stays.
        </p>
        <ul className="mt-3 flex flex-col gap-1.5 text-sm text-moss">
          <li>Shared: the days you finished missions, how many, mock interviews done, your section, and your first name with an initial.</li>
          <li>Never shared: your journal, quiz answers, email, city, archetype or anything else in your profile.</li>
          <li>Your college may send you a reminder in the app if you miss 3 days in a row.</li>
        </ul>
      </section>

      {blocked ? (
        <p className="mt-6 text-[15px] text-bone">{blocked}</p>
      ) : (
        <JoinForm code={p.code} sections={p.sections} firstName={p.firstName} />
      )}
    </main>
  );
}

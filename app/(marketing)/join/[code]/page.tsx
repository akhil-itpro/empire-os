import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { Wordmark } from "@/components/ui/Wordmark";
import { publicBatchInvite } from "@/lib/server/college-service";
import { storeForRequest } from "@/lib/server/deps";
import { getSessionUserId } from "@/lib/server/session";
import { RememberBatchCode } from "./RememberBatchCode";

export const metadata: Metadata = { title: "Join your college season", robots: { index: false } };

// A college's join link. Signed-in students go straight to the consent screen;
// everyone else sees the college's name, and the code waits in this browser until sign-up.
export default function JoinLinkPage({ params }: PageProps<"/join/[code]">) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-5 pt-3.5 pb-5">
      <Link href="/" className="self-start py-2">
        <Wordmark size={24} />
        <span className="sr-only"> home page</span>
      </Link>
      <Suspense>
        <JoinLinkContent params={params} />
      </Suspense>
    </main>
  );
}

async function JoinLinkContent({ params }: { params: PageProps<"/join/[code]">["params"] }) {
  await connection();
  const { code } = await params;
  const store = storeForRequest();
  const invite = await publicBatchInvite(store, decodeURIComponent(code), new Date());
  const userId = await getSessionUserId();
  if (invite && userId && (await store.getProfile(userId))) redirect(`/me/college?code=${invite.code}`);

  if (!invite || !invite.open) {
    return (
      <>
        <h1 className="mt-10 font-display text-[40px] leading-none font-extrabold">This link doesn&apos;t open a batch.</h1>
        <p className="mt-3 text-[15px] text-moss">
          {invite ? "This batch isn't taking new students." : "Check the link with your training and placement cell."} You
          can still start your own season.
        </p>
        <div className="mt-8">
          <ButtonLink href="/quiz">Find your archetype</ButtonLink>
        </div>
      </>
    );
  }

  return (
    <>
      <RememberBatchCode code={invite.code} />
      <p className="mt-10 text-[13px] font-medium text-moss">{invite.orgName} training and placement cell</p>
      <h1 className="mt-1 font-display text-[40px] leading-none font-extrabold">Join the {invite.batchName} season.</h1>
      <p className="mt-3 text-[15px] text-moss">
        Three missions a day for your career, body, mind and money, planned around your timetable, budget and free time.
      </p>
      <ol className="mt-6 flex flex-col gap-2 text-[15px]">
        <li>1. Take the free 2-minute quiz and get your plan.</li>
        <li>2. Save your plan with your email or Google.</li>
        <li>3. In Me, see exactly what is shared with your college, then join.</li>
      </ol>
      <div className="flex-1" />
      <div className="mt-8 flex flex-col gap-2.5">
        <ButtonLink href="/quiz">Find your archetype</ButtonLink>
        <ButtonLink href="/login" variant="secondary">
          I already have an account
        </ButtonLink>
      </div>
    </>
  );
}

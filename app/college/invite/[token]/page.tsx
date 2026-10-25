import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { getSessionUserId } from "@/lib/server/session";
import { CollegeShell } from "../../CollegeShell";
import { CollegeSignIn } from "../../CollegeSignIn";
import { AcceptInvite } from "./AcceptInvite";

export const metadata: Metadata = { title: "College HQ invite", robots: { index: false, follow: false } };

export default function InvitePage({ params }: PageProps<"/college/invite/[token]">) {
  return (
    <Suspense fallback={<main className="min-h-dvh bg-field" aria-busy="true" />}>
      <InviteContent params={params} />
    </Suspense>
  );
}

async function InviteContent({ params }: { params: PageProps<"/college/invite/[token]">["params"] }) {
  await connection();
  const { token } = await params;
  const userId = await getSessionUserId();
  return (
    <CollegeShell batchId={null} orgName={null} active={null}>
      <div className="max-w-[440px]">
        <h1 className="font-display text-[40px] leading-none font-extrabold">Your College HQ invite</h1>
        <p className="mt-3 text-[15px] text-moss">
          This one-time link makes your account an admin of your college in College HQ. You&apos;ll see the progress of
          students who join your batch and agree to share it, never their journals or personal answers.
        </p>
        <div className="mt-6">
          {userId ? <AcceptInvite token={token} /> : <CollegeSignIn next={`/college/invite/${encodeURIComponent(token)}`} />}
        </div>
      </div>
    </CollegeShell>
  );
}

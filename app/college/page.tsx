import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";
import { adminBatches } from "@/lib/server/college-service";
import { depsFor } from "@/lib/server/deps";
import { getSessionUserId } from "@/lib/server/session";
import { CollegeShell } from "./CollegeShell";
import { CollegeSignIn } from "./CollegeSignIn";

export const metadata: Metadata = { title: "College HQ", robots: { index: false, follow: false } };

export default function CollegeHome() {
  return (
    <Suspense fallback={<main className="min-h-dvh bg-field" aria-busy="true" />}>
      <CollegeHomeContent />
    </Suspense>
  );
}

async function CollegeHomeContent() {
  await connection();
  const userId = await getSessionUserId();
  if (!userId) {
    return (
      <CollegeShell batchId={null} orgName={null} active={null}>
        <div className="max-w-[440px]">
          <h1 className="font-display text-[40px] leading-none font-extrabold">College HQ</h1>
          <p className="mt-3 text-[15px] text-moss">
            For training and placement cells. Sign in with the email address your invite was sent to.
          </p>
          <div className="mt-6">
            <CollegeSignIn next="/college" />
          </div>
        </div>
      </CollegeShell>
    );
  }

  const batches = await adminBatches(await depsFor(userId), userId);
  if (batches.length > 0) redirect(`/college/${batches[0].id}`);

  return (
    <CollegeShell batchId={null} orgName={null} active={null}>
      <div className="max-w-[480px]">
        <h1 className="font-display text-[40px] leading-none font-extrabold">College HQ</h1>
        <p className="mt-3 text-[15px] text-moss">
          This account doesn&apos;t have College HQ access yet. If your college uses EMPIRE OS, open the invite link the
          EMPIRE OS team sent you while signed in with this account.
        </p>
        <form action={signOut} className="mt-6 max-w-[240px]">
          <Button type="submit" variant="secondary">
            Sign out
          </Button>
        </form>
      </div>
    </CollegeShell>
  );
}

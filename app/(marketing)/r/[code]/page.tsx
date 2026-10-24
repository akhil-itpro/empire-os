import type { Metadata } from "next";
import { Suspense } from "react";
import { SaveReferral } from "./SaveReferral";

export const metadata: Metadata = { title: "You're invited", robots: { index: false } };

// An invite link: remembers the code in this browser until sign-up, then opens the landing page.
export default function ReferralPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col justify-center px-5">
      <Suspense>
        <SaveReferral />
      </Suspense>
    </main>
  );
}

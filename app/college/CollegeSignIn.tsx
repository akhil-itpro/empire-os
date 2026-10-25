"use client";

import { useRouter } from "next/navigation";
import { SignInOptions } from "@/components/auth/SignInOptions";

/** Sign-in for College HQ; Google returns to `next`, an email code refreshes this page. */
export function CollegeSignIn({ next }: { next: string }) {
  const router = useRouter();
  return <SignInOptions next={next} onSignedIn={() => router.refresh()} />;
}

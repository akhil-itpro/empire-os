"use client";

import { useRouter } from "next/navigation";
import { SignInOptions } from "@/components/auth/SignInOptions";

export function LoginForm() {
  const router = useRouter();
  return <SignInOptions next="/hq" onSignedIn={() => router.push("/hq")} />;
}

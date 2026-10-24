"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { track } from "@/lib/analytics/track";
import { saveReferral } from "@/lib/quiz/storage";

const CODE = /^[A-Z0-9]{6,10}$/;

export function SaveReferral() {
  const router = useRouter();
  const params = useParams<{ code: string }>();

  useEffect(() => {
    const code = decodeURIComponent(params.code ?? "").trim().toUpperCase();
    const valid = CODE.test(code);
    // The server checks the code again at sign-up; this only remembers it.
    if (valid) saveReferral(code);
    track("referral_visit", { valid });
    router.replace("/");
  }, [params.code, router]);

  return (
    <p className="text-center text-base text-moss" role="status">
      Opening EMPIRE OS…{" "}
      <Link href="/" className="font-semibold text-brass hov:text-brass-light">
        Go now
      </Link>
    </p>
  );
}

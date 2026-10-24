"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { startSeason } from "@/app/actions/season";
import { ButtonLink } from "@/components/ui/Button";
import { clearDraft, clearReferral, loadDraft, loadReferral } from "@/lib/quiz/storage";

// Right after sign-in: save the quiz answers, start Season 1, open HQ.
export function StartSeason() {
  const router = useRouter();
  const ran = useRef(false);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const draft = loadDraft();
    const answers = draft ? { ...draft.answers, ageBracket: draft.ageBracket } : null;
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    void (async () => {
      const result = await startSeason(answers, timeZone, loadReferral());
      if (result.ok) {
        clearDraft();
        clearReferral();
        router.replace(result.data.created ? "/hq?first=1" : "/hq");
        return;
      }
      if (result.error === "signed_out") router.replace("/login");
      else if (result.error === "invalid_input") router.replace("/quiz");
      else setProblem(result.message);
    })();
  }, [router]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col justify-center px-5">
      {problem ? (
        <>
          <h1 className="font-display text-[40px] leading-none font-extrabold">That didn&apos;t work.</h1>
          <p className="mt-3 text-base text-moss">{problem}</p>
          <ButtonLink href="/quiz" variant="secondary" className="mt-8">
            Back to the quiz
          </ButtonLink>
        </>
      ) : (
        <p className="text-center text-base text-moss" role="status">
          Saving your plan…
        </p>
      )}
    </main>
  );
}

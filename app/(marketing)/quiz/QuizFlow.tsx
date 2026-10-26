"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SignInOptions } from "@/components/auth/SignInOptions";
import { track } from "@/lib/analytics/track";
import { answersSchema, type Answers } from "@/lib/plan-engine/answers";
import { previewPlan } from "@/lib/plan-engine/preview";
import { QUESTIONS } from "@/lib/quiz/questions";
import { buildingSteps, seasonReflection, timeReflection } from "@/lib/quiz/reflections";
import { clearDraft, loadDraft, saveDraft } from "@/lib/quiz/storage";
import { useHydrated } from "@/lib/use-hydrated";
import { AgeStep, BuildingStep, ReflectionStep, Under18Step } from "./IntroSteps";
import { OathStep } from "./OathStep";
import { QuestionStep } from "./QuestionStep";
import { RevealStep } from "./RevealStep";
import { StepShell, StepTitle } from "./StepShell";

// The flow, in order: 18+ check, questions 1-4, a reflection, 5-7, a reflection,
// 8-11, building, reveal, oath, sign-up. Each step has a URL (?s=q3) so the
// phone's back button works.
const FLOW = [
  "age",
  "q1",
  "q2",
  "q3",
  "q4",
  "r1",
  "q5",
  "q6",
  "q7",
  "r2",
  "q8",
  "q9",
  "q10",
  "q11",
  "build",
  "reveal",
  "oath",
  "signup",
] as const;
type Step = (typeof FLOW)[number] | "u18";

type Draft = { ageBracket?: Answers["ageBracket"]; answers: Partial<Answers> };

function isComplete(answers: Partial<Answers>): answers is Answers {
  return answersSchema.safeParse(answers).success;
}

/** The furthest step a draft allows, so ?s=reveal can't skip unanswered questions. */
function allowedStep(wanted: Step, draft: Draft): Step {
  if (wanted === "u18") return "u18";
  if (!draft.ageBracket) return "age";
  for (let i = 0; i < QUESTIONS.length; i++) {
    const q = QUESTIONS[i];
    const value = draft.answers[q.id];
    const answered = q.id === "pillarOrder" ? Array.isArray(value) && value.length === 4 : value !== undefined && value !== "";
    if (!answered && FLOW.indexOf(wanted as (typeof FLOW)[number]) > FLOW.indexOf(`q${i + 1}` as (typeof FLOW)[number])) {
      return `q${i + 1}` as Step;
    }
  }
  return wanted;
}

export function QuizFlow() {
  const router = useRouter();
  const params = useSearchParams();
  // The saved draft lives in this browser, so read it only once the page is live
  // (the server render and the first browser render must match).
  const hydrated = useHydrated();
  const stored = useMemo<Draft | null>(() => {
    if (!hydrated) return null;
    const saved = loadDraft();
    return { ageBracket: saved?.ageBracket, answers: saved?.answers ?? {} };
  }, [hydrated]);
  const [edited, setDraft] = useState<Draft | null>(null);
  const draft = edited ?? stored;

  const raw = (params.get("s") ?? "age") as Step;
  const requested: Step = raw === "u18" || (FLOW as readonly string[]).includes(raw) ? raw : "age";
  const step = draft ? allowedStep(requested, draft) : null;

  const go = useCallback((next: Step, replace = false) => {
    const url = `/quiz?s=${next}`;
    // A double tap or a late auto-advance never adds the same step twice.
    if (window.location.pathname + window.location.search === url) return;
    if (replace) window.history.replaceState(null, "", url);
    else window.history.pushState(null, "", url);
    window.scrollTo(0, 0);
  }, []);

  // Keep the URL honest if it pointed past an unanswered question.
  useEffect(() => {
    if (step && step !== requested) go(step, true);
  }, [step, requested, go]);

  const update = useCallback((patch: Partial<Draft>) => {
    setDraft((d) => {
      const next = { ...(d ?? stored ?? { answers: {} }), ...patch };
      saveDraft({ ageBracket: next.ageBracket, answers: next.answers, step: "" });
      return next;
    });
  }, [stored]);

  const answers = useMemo(() => draft?.answers ?? {}, [draft]);
  const full = useMemo(() => {
    const candidate = { ...answers, ageBracket: draft?.ageBracket };
    return isComplete(candidate) ? candidate : null;
  }, [answers, draft]);
  const preview = useMemo(() => (full ? previewPlan(full) : null), [full]);

  const next = useCallback(() => {
    if (!step || step === "u18") return;
    const i = FLOW.indexOf(step);
    const following = FLOW[i + 1];
    if (step.startsWith("q")) track("quiz_step", { step: Number(step.slice(1)) });
    if (following === "build") track("quiz_complete");
    if (following) go(following);
  }, [step, go]);

  const back = useCallback(() => {
    if (step === "age" || !step) router.push("/");
    else window.history.back();
  }, [step, router]);

  if (!draft || !step) return <main className="min-h-dvh" />;

  if (step === "u18") return <Under18Step />;

  if (step === "age") {
    return (
      <AgeStep
        value={draft.ageBracket}
        onBack={back}
        onPick={(age) => {
          if (age === "under18") {
            // Stores nothing: clear any saved answers and leave no record.
            clearDraft();
            setDraft({ answers: {} });
            go("u18", true);
            return;
          }
          if (!draft.ageBracket) track("quiz_start");
          update({ ageBracket: age });
          setTimeout(() => go("q1"), 280);
        }}
      />
    );
  }

  if (step.startsWith("q")) {
    const n = Number(step.slice(1));
    return (
      <QuestionStep
        key={step}
        question={QUESTIONS[n - 1]}
        number={n}
        answers={answers}
        onAnswer={(patch) => update({ answers: { ...answers, ...patch } })}
        onNext={next}
        onBack={back}
      />
    );
  }

  const name = answers.firstName ?? "Friend";

  if (step === "r1") {
    const r = seasonReflection(name);
    return <ReflectionStep {...r} dial={{ lit: 0, big: "90", small: "days, 13 weeks" }} onNext={next} onBack={back} />;
  }

  if (step === "r2") {
    const minutes = answers.dailyMinutes ?? 30;
    const r = timeReflection(name, minutes, answers.budget ?? "free");
    const hours = (minutes * 90) / 60;
    return (
      <ReflectionStep
        {...r}
        dial={{ lit: Math.round((minutes / 90) * 90), big: Number.isInteger(hours) ? String(hours) : hours.toFixed(1), small: "hours by Day 90" }}
        onNext={next}
        onBack={back}
      />
    );
  }

  if (!full || !preview) {
    // Shouldn't happen (allowedStep guards it), but never show a broken reveal.
    return (
      <StepShell onBack={back}>
        <StepTitle help="Some answers are missing.">Let&apos;s finish the quiz first.</StepTitle>
      </StepShell>
    );
  }

  // Building replaces itself in the history, so Back from the reveal goes to the
  // last question instead of re-running the checklist and bouncing forward again.
  if (step === "build") return <BuildingStep steps={buildingSteps(full)} onDone={() => go("reveal", true)} />;

  if (step === "reveal") {
    return <RevealOnce firstName={name} preview={preview} onStart={next} />;
  }

  if (step === "oath") {
    return (
      <OathStep
        onBack={back}
        onDone={() => {
          track("oath_done");
          next();
        }}
      />
    );
  }

  return (
    <StepShell onBack={back}>
      <StepTitle help="Your plan is ready. Sign in to save it and get today's missions.">
        Save your plan to start Day 1.
      </StepTitle>
      <div className="mt-6">
        <SignInOptions next="/start" onSignedIn={() => router.push("/start")} />
      </div>
      <div className="flex-1" />
      <p className="mt-6 text-center text-xs leading-normal text-moss">
        By continuing you agree to the{" "}
        <Link href="/terms" className="font-semibold text-brass hov:text-brass-light">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="font-semibold text-brass hov:text-brass-light">
          Privacy Policy
        </Link>
        .
      </p>
    </StepShell>
  );
}

function RevealOnce(props: Parameters<typeof RevealStep>[0]) {
  useEffect(() => {
    track("reveal_view", { archetype: props.preview.archetype.id });
    // Once per visit to the reveal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <RevealStep {...props} />;
}

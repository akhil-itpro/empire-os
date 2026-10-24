import type { Metadata } from "next";
import { Suspense } from "react";
import { QuizFlow } from "./QuizFlow";

export const metadata: Metadata = {
  title: "Find your archetype",
  description: "A free 2-minute quiz that builds your 90-day season around your time, budget and goals.",
};

export default function QuizPage() {
  return (
    <Suspense fallback={<main className="min-h-dvh" />}>
      <QuizFlow />
    </Suspense>
  );
}

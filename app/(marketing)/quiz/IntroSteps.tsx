"use client";

import { Check } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Medallion } from "@/components/ui/Medallion";
import { OptionTile } from "@/components/ui/OptionTile";
import { AGE_BRACKETS, type Answers } from "@/lib/plan-engine/answers";
import { StepShell, StepTitle } from "./StepShell";

export function AgeStep({
  value,
  onPick,
  onBack,
}: {
  value?: Answers["ageBracket"];
  onPick: (age: Answers["ageBracket"] | "under18") => void;
  onBack: () => void;
}) {
  return (
    <StepShell onBack={onBack}>
      <StepTitle help="EMPIRE OS is for adults. Pick your age bracket to start.">First, how old are you?</StepTitle>
      <div className="mt-6 grid grid-cols-2 gap-3" role="group" aria-label="Age bracket">
        {AGE_BRACKETS.map((a) => (
          <OptionTile key={a.id} compact title={a.label} selected={value === a.id} onClick={() => onPick(a.id)} />
        ))}
        <OptionTile compact title="Under 18" selected={false} onClick={() => onPick("under18")} />
      </div>
    </StepShell>
  );
}

export function Under18Step() {
  return (
    <StepShell>
      <StepTitle help="Nothing you entered has been saved.">EMPIRE OS is for adults. Come back when you&apos;re 18.</StepTitle>
      <div className="flex-1" />
      <ButtonLink href="/" variant="secondary">
        Back to the home page
      </ButtonLink>
    </StepShell>
  );
}

export function ReflectionStep({
  title,
  body,
  dial,
  onNext,
  onBack,
}: {
  title: string;
  body: string;
  dial: { lit: number; big: string; small: string };
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <StepShell onBack={onBack} footer={<Button onClick={onNext}>Continue</Button>}>
      <div className="mt-8 flex justify-center" aria-hidden="true">
        <Medallion total={90} lit={dial.lit} size={188}>
          <span className="text-[44px] leading-none font-bold">{dial.big}</span>
          <span className="mt-1 text-[13px] font-medium text-moss">{dial.small}</span>
        </Medallion>
      </div>
      <h1 className="mt-8 font-display text-[40px] leading-none font-extrabold">{title}</h1>
      <p className="mt-3 text-base text-moss">{body}</p>
    </StepShell>
  );
}

const STEP_MS = 700;

export function BuildingStep({ steps, onDone }: { steps: string[]; onDone: () => void }) {
  const reduceMotion = useReducedMotion();
  const [ticked, setTicked] = useState(0);
  const shown = reduceMotion ? steps.length : ticked;

  useEffect(() => {
    if (reduceMotion) return;
    if (ticked >= steps.length) {
      const t = setTimeout(onDone, 900);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setTicked((n) => n + 1), ticked === 0 ? 400 : STEP_MS);
    return () => clearTimeout(t);
  }, [ticked, steps.length, onDone, reduceMotion]);

  return (
    <StepShell footer={reduceMotion ? <Button onClick={onDone}>See your archetype</Button> : undefined}>
      <StepTitle>Building your season</StepTitle>
      <ul className="mt-8 flex flex-col gap-4" aria-live="polite">
        {steps.map((s, i) => {
          const done = i < shown;
          return (
            <li key={s} className="flex items-center gap-3 text-base">
              <span
                className={`flex size-7 flex-none items-center justify-center rounded-full border-[1.5px] transition-colors duration-150 ${
                  done ? "border-brass bg-brass text-field" : "border-rule text-transparent"
                }`}
              >
                <Check size={16} strokeWidth={3} aria-hidden="true" />
              </span>
              <motion.span
                initial={false}
                animate={{ opacity: done ? 1 : 0.45 }}
                className={done ? "text-bone" : "text-moss"}
              >
                {s}
                {done ? <span className="sr-only">, done</span> : null}
              </motion.span>
            </li>
          );
        })}
      </ul>
    </StepShell>
  );
}

"use client";

import { Briefcase, Dumbbell, Moon, Store, TrendingUp, Wallet, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { OptionTile } from "@/components/ui/OptionTile";
import { cn } from "@/lib/cn";
import { PILLAR_LABEL, PILLARS, type Pillar } from "@/lib/pillars";
import { answersSchema, type Answers } from "@/lib/plan-engine/answers";
import type { Question } from "@/lib/quiz/questions";
import { StepShell, StepTitle } from "./StepShell";

const ICONS: Record<string, LucideIcon> = {
  briefcase: Briefcase,
  "trending-up": TrendingUp,
  store: Store,
  dumbbell: Dumbbell,
  moon: Moon,
  wallet: Wallet,
};

// How long a picked tile stays on screen before moving on.
const AUTO_ADVANCE_MS = 280;

type Props<Q extends Question = Question> = {
  question: Q;
  number: number;
  answers: Partial<Answers>;
  onAnswer: (patch: Partial<Answers>) => void;
  onNext: () => void;
  onBack: () => void;
};

type ChoiceQ = Extract<Question, { kind: "choice" }>;

export function QuestionStep(props: Props) {
  const { question } = props;
  if (question.kind === "text") return <NameQuestion {...props} />;
  if (question.kind === "order") return <OrderQuestion {...props} />;
  return <ChoiceQuestion {...props} question={question} />;
}

function ChoiceQuestion({ question, number, answers, onAnswer, onNext, onBack }: Props<ChoiceQ>) {
  const current = answers[question.id];
  const answered = current !== undefined;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const pick = (value: string | number | boolean) => {
    onAnswer({ [question.id]: value } as Partial<Answers>);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(onNext, AUTO_ADVANCE_MS);
  };

  return (
    <StepShell
      onBack={onBack}
      questionNumber={number}
      footer={
        <Button
          onClick={() => {
            if (timer.current) clearTimeout(timer.current);
            onNext();
          }}
          disabled={!answered}
        >
          Continue
        </Button>
      }
    >
      <StepTitle help={question.help}>{question.title}</StepTitle>
      <div className="mt-6 grid grid-cols-2 gap-3" role="group" aria-label={question.title}>
        {question.options.map((o) => {
          const Icon = o.icon ? ICONS[o.icon] : null;
          return (
            <OptionTile
              key={String(o.value)}
              compact={question.layout === "compact"}
              title={o.label}
              description={question.layout === "tiles" || o.description ? o.description : undefined}
              icon={Icon ? <Icon size={26} strokeWidth={1.75} aria-hidden="true" /> : undefined}
              selected={current === o.value}
              onClick={() => pick(o.value)}
              className={cn(question.options.length % 2 === 1 && o === question.options.at(-1) && "col-span-2")}
            />
          );
        })}
      </div>
    </StepShell>
  );
}

function NameQuestion({ question, number, answers, onAnswer, onNext, onBack }: Props) {
  const [value, setValue] = useState(answers.firstName ?? "");
  const [touched, setTouched] = useState(false);
  const check = answersSchema.shape.firstName.safeParse(value);
  const error = touched && !check.success ? check.error.issues[0]?.message : null;

  const submit = () => {
    setTouched(true);
    if (!check.success) return;
    onAnswer({ firstName: check.data });
    onNext();
  };

  return (
    <StepShell
      onBack={onBack}
      questionNumber={number}
      footer={
        <Button type="submit" form="name-form" disabled={value.trim().length === 0}>
          Continue
        </Button>
      }
    >
      <StepTitle help={question.help}>{question.title}</StepTitle>
      <form
        id="name-form"
        className="mt-6"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label htmlFor="first-name" className="text-[13px] font-medium text-moss">
          First name
        </label>
        <input
          id="first-name"
          name="firstName"
          autoComplete="given-name"
          autoCapitalize="words"
          enterKeyHint="next"
          maxLength={40}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => setTouched(true)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "first-name-error" : undefined}
          className="mt-1.5 h-14 w-full rounded-[14px] border-[1.5px] border-rule bg-ledger px-4 text-lg text-bone placeholder:text-moss focus:border-brass focus:outline-none"
        />
        {error ? (
          <p id="first-name-error" className="mt-2 text-sm text-bone">
            {error}
          </p>
        ) : null}
      </form>
    </StepShell>
  );
}

function OrderQuestion({ question, number, answers, onAnswer, onNext, onBack }: Props) {
  const order = (answers.pillarOrder ?? []) as Pillar[];
  const toggle = (p: Pillar) => {
    const next = order.includes(p) ? order.filter((x) => x !== p) : [...order, p];
    onAnswer({ pillarOrder: next });
  };

  return (
    <StepShell
      onBack={onBack}
      questionNumber={number}
      footer={
        <>
          <Button onClick={onNext} disabled={order.length !== 4}>
            Continue
          </Button>
          {order.length > 0 ? (
            <Button variant="quiet" className="mt-2" onClick={() => onAnswer({ pillarOrder: [] })}>
              Start the order again
            </Button>
          ) : null}
        </>
      }
    >
      <StepTitle help={question.help}>{question.title}</StepTitle>
      <div className="mt-6 grid grid-cols-2 gap-3" role="group" aria-label="Pillars in order">
        {PILLARS.map((p) => {
          const index = order.indexOf(p);
          return (
            <OptionTile
              key={p}
              compact
              title={PILLAR_LABEL[p]}
              description={index >= 0 ? `Number ${index + 1}` : undefined}
              selected={index >= 0}
              badge={index >= 0 ? index + 1 : undefined}
              onClick={() => toggle(p)}
            />
          );
        })}
      </div>
      <p className="mt-4 text-sm text-moss" aria-live="polite">
        {order.length === 4
          ? `Your order: ${order.map((p) => PILLAR_LABEL[p]).join(", ")}.`
          : order.length === 0
            ? "Tap your most important pillar first."
            : `${4 - order.length} to go.`}
      </p>
    </StepShell>
  );
}

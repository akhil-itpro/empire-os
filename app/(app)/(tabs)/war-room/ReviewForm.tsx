"use client";

import { useState, useTransition, type ReactNode } from "react";
import { submitReview } from "@/app/actions/war-room";
import { Button } from "@/components/ui/Button";
import { OptionTile } from "@/components/ui/OptionTile";
import { cn } from "@/lib/cn";
import { PILLAR_CLASSES, PILLAR_LABEL, type Pillar } from "@/lib/pillars";
import { BUDGETS, CITIES, DAILY_MINUTES, GOALS, labelOf } from "@/lib/plan-engine/answers";
import { BLOCKERS, CHANGES, FELT, type Blocker, type Change, type Felt } from "@/lib/plan-engine/war-room";

function Question({ id, title, hint, children }: { id: string; title: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset className="mt-7" aria-describedby={hint ? `${id}-hint` : undefined}>
      <legend className="font-display text-[22px] leading-none font-extrabold">{title}</legend>
      {hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-[13px] text-moss">
          {hint}
        </p>
      ) : null}
      <div className="mt-3">{children}</div>
    </fieldset>
  );
}

/** The 60-second weekly review: four questions, with a follow-up for anything that changed. */
export function ReviewForm({
  suggestedFocus,
  pillarOrder,
  current,
}: {
  suggestedFocus: Pillar;
  pillarOrder: Pillar[];
  current: { dailyMinutes: number; budget: string; city: string; goal: string };
}) {
  const [felt, setFelt] = useState<Felt | null>(null);
  const [blocker, setBlocker] = useState<Blocker | null>(null);
  const [changes, setChanges] = useState<Change[]>([]);
  const [focus, setFocus] = useState<Pillar>(suggestedFocus);
  const [dailyMinutes, setDailyMinutes] = useState<number | null>(null);
  const [budget, setBudget] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [goal, setGoal] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const toggle = (c: Change) => setChanges((list) => (list.includes(c) ? list.filter((x) => x !== c) : [...list, c]));

  const submit = () => {
    const missing =
      !felt || !blocker
        ? "Answer how the week felt and your biggest blocker."
        : (changes.includes("schedule") && !dailyMinutes) ||
            (changes.includes("budget") && !budget) ||
            (changes.includes("city") && !city) ||
            (changes.includes("goal") && !goal)
          ? "Pick the new value for each thing that changed."
          : null;
    if (missing) {
      setMessage(missing);
      return;
    }
    setMessage(null);
    startTransition(async () => {
      const r = await submitReview({
        felt,
        blocker,
        changes,
        focusPillar: focus,
        ...(changes.includes("schedule") ? { dailyMinutes } : {}),
        ...(changes.includes("budget") ? { budget } : {}),
        ...(changes.includes("city") ? { city } : {}),
        ...(changes.includes("goal") ? { goal } : {}),
      });
      if (!r.ok) setMessage(r.message);
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="pb-4"
    >
      <Question id="felt" title="This week felt">
        <div className="grid grid-cols-3 gap-2.5">
          {FELT.map((o) => (
            <OptionTile key={o.id} compact title={o.label} selected={felt === o.id} onClick={() => setFelt(o.id)} />
          ))}
        </div>
      </Question>

      <Question id="blocker" title="Biggest blocker">
        <div className="grid grid-cols-2 gap-2.5">
          {BLOCKERS.map((o) => (
            <OptionTile key={o.id} compact title={o.label} selected={blocker === o.id} onClick={() => setBlocker(o.id)} />
          ))}
        </div>
      </Question>

      <Question id="changes" title="Anything changed?" hint="Pick any that apply, or none.">
        <div className="grid grid-cols-2 gap-2.5">
          {CHANGES.map((o) => (
            <OptionTile key={o.id} compact title={o.label} selected={changes.includes(o.id)} onClick={() => toggle(o.id)} />
          ))}
        </div>
        {changes.includes("schedule") ? (
          <Question id="minutes" title="Free time a day now" hint={`Now: ${current.dailyMinutes} minutes.`}>
            <div className="grid grid-cols-3 gap-2.5">
              {DAILY_MINUTES.map((o) => (
                <OptionTile key={o.id} compact title={o.label} selected={dailyMinutes === o.id} onClick={() => setDailyMinutes(o.id)} />
              ))}
            </div>
          </Question>
        ) : null}
        {changes.includes("budget") ? (
          <Question id="budget" title="Monthly spend on yourself now" hint={`Now: ${labelOf(BUDGETS, current.budget as never)}.`}>
            <div className="grid grid-cols-2 gap-2.5">
              {BUDGETS.map((o) => (
                <OptionTile key={o.id} compact title={o.label} selected={budget === o.id} onClick={() => setBudget(o.id)} />
              ))}
            </div>
          </Question>
        ) : null}
        {changes.includes("city") ? (
          <Question id="city" title="Your city now" hint={`Now: ${labelOf(CITIES, current.city as never)}.`}>
            <div className="grid grid-cols-2 gap-2.5">
              {CITIES.map((o) => (
                <OptionTile key={o.id} compact title={o.label} selected={city === o.id} onClick={() => setCity(o.id)} />
              ))}
            </div>
          </Question>
        ) : null}
        {changes.includes("goal") ? (
          <Question id="goal" title="Your main goal now" hint={`Now: ${labelOf(GOALS, current.goal as never)}.`}>
            <div className="grid grid-cols-2 gap-2.5">
              {GOALS.map((o) => (
                <OptionTile key={o.id} compact title={o.label} selected={goal === o.id} onClick={() => setGoal(o.id)} />
              ))}
            </div>
          </Question>
        ) : null}
      </Question>

      <Question id="focus" title="Next week's focus" hint="Pre-selected: your weakest pillar this week.">
        <div className="grid grid-cols-2 gap-2.5">
          {pillarOrder.map((p) => (
            <OptionTile
              key={p}
              compact
              title={PILLAR_LABEL[p]}
              selected={focus === p}
              onClick={() => setFocus(p)}
              icon={<span className={cn("block size-2.5 rounded-full", PILLAR_CLASSES[p].dot)} />}
            />
          ))}
        </div>
      </Question>

      {message ? (
        <p role="alert" className="mt-5 text-sm text-bone">
          {message}
        </p>
      ) : null}
      <Button type="submit" className="mt-6" disabled={pending}>
        {pending ? "Setting next week" : "Set next week"}
      </Button>
    </form>
  );
}

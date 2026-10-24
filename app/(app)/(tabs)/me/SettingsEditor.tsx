"use client";

import { useState, useTransition, type ReactNode } from "react";
import { updateSettings } from "@/app/actions/me";
import { Button } from "@/components/ui/Button";
import { OptionTile } from "@/components/ui/OptionTile";
import { PILLAR_LABEL, PILLARS, type Pillar } from "@/lib/pillars";
import { BUDGETS, CITIES, DAILY_MINUTES, GOALS, labelOf } from "@/lib/plan-engine/answers";
import type { EditableSettings } from "@/lib/server/me-service";

const SELECT =
  "mt-1.5 h-12 w-full appearance-none rounded-xl border-[1.5px] border-rule bg-ledger px-4 text-base text-bone focus:border-brass focus:outline-none";

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="text-[13px] font-medium text-moss">
        {label}
      </label>
      {children}
    </div>
  );
}

export function SettingsEditor({ current }: { current: EditableSettings }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(current);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const set = (patch: Partial<EditableSettings>) => setForm((f) => ({ ...f, ...patch }));

  if (!editing) {
    return (
      <div className="mt-3">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[15px]">
          <dt className="text-moss">Goal</dt>
          <dd>{labelOf(GOALS, current.goal)}</dd>
          <dt className="text-moss">Pillars</dt>
          <dd>{current.pillarOrder.map((p) => PILLAR_LABEL[p]).join(", ")}</dd>
          <dt className="text-moss">Daily time</dt>
          <dd>{labelOf(DAILY_MINUTES, current.dailyMinutes)}</dd>
          <dt className="text-moss">Budget</dt>
          <dd>{labelOf(BUDGETS, current.budget)}</dd>
          <dt className="text-moss">City</dt>
          <dd>{labelOf(CITIES, current.city)}</dd>
          <dt className="text-moss">Gym</dt>
          <dd>{current.gym ? "Yes" : "Home only"}</dd>
          <dt className="text-moss">Laptop</dt>
          <dd>{current.laptop ? "Yes" : "Phone only"}</dd>
        </dl>
        <Button variant="secondary" className="mt-4" onClick={() => setEditing(true)}>
          Edit my plan
        </Button>
        <p className="mt-2 min-h-5 text-sm text-bone" role="status" aria-live="polite">
          {message}
        </p>
      </div>
    );
  }

  const togglePillar = (p: Pillar) =>
    set({ pillarOrder: form.pillarOrder.includes(p) ? form.pillarOrder.filter((x) => x !== p) : [...form.pillarOrder, p] });

  return (
    <form
      className="mt-4 flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const r = await updateSettings(form);
          if (r.ok) {
            setEditing(false);
            setMessage("Saved. Your updated plan starts tomorrow.");
          } else {
            setMessage(r.message);
          }
        });
      }}
    >
      <Field id="goal" label="Main goal">
        <select id="goal" className={SELECT} value={form.goal} onChange={(e) => set({ goal: e.target.value as EditableSettings["goal"] })}>
          {GOALS.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
            </option>
          ))}
        </select>
      </Field>

      <fieldset>
        <legend className="text-[13px] font-medium text-moss">Pillar order (tap from most to least important)</legend>
        <div className="mt-1.5 grid grid-cols-2 gap-3">
          {PILLARS.map((p) => {
            const i = form.pillarOrder.indexOf(p);
            return (
              <OptionTile
                key={p}
                compact
                title={PILLAR_LABEL[p]}
                description={i >= 0 ? `Number ${i + 1}` : undefined}
                selected={i >= 0}
                badge={i >= 0 ? i + 1 : undefined}
                onClick={() => togglePillar(p)}
              />
            );
          })}
        </div>
      </fieldset>

      <Field id="minutes" label="Free time a day">
        <select id="minutes" className={SELECT} value={form.dailyMinutes} onChange={(e) => set({ dailyMinutes: Number(e.target.value) as EditableSettings["dailyMinutes"] })}>
          {DAILY_MINUTES.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </Field>

      <Field id="budget" label="Monthly spend on yourself">
        <select id="budget" className={SELECT} value={form.budget} onChange={(e) => set({ budget: e.target.value as EditableSettings["budget"] })}>
          {BUDGETS.map((b) => (
            <option key={b.id} value={b.id}>
              {b.label}
            </option>
          ))}
        </select>
      </Field>

      <Field id="city" label="City">
        <select id="city" className={SELECT} value={form.city} onChange={(e) => set({ city: e.target.value as EditableSettings["city"] })}>
          {CITIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field id="gym" label="Gym">
          <select id="gym" className={SELECT} value={String(form.gym)} onChange={(e) => set({ gym: e.target.value === "true" })}>
            <option value="true">Yes</option>
            <option value="false">Home only</option>
          </select>
        </Field>
        <Field id="laptop" label="Laptop">
          <select id="laptop" className={SELECT} value={String(form.laptop)} onChange={(e) => set({ laptop: e.target.value === "true" })}>
            <option value="true">Yes</option>
            <option value="false">Phone only</option>
          </select>
        </Field>
      </div>

      <Button type="submit" disabled={pending || form.pillarOrder.length !== 4}>
        Save changes for tomorrow
      </Button>
      <Button
        variant="quiet"
        onClick={() => {
          setForm(current);
          setEditing(false);
        }}
      >
        Cancel
      </Button>
      <p className="min-h-5 text-sm text-bone" role="status" aria-live="polite">
        {message}
      </p>
    </form>
  );
}

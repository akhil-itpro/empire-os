"use client";

import { Check } from "lucide-react";
import { useOptimistic, useTransition } from "react";
import { setChecklistItem } from "@/app/actions/founder";
import { cn } from "@/lib/cn";
import type { ChecklistItem } from "@/lib/server/founder";

export function Checklist({ items }: { items: ChecklistItem[] }) {
  const [, startTransition] = useTransition();
  const [shown, setShown] = useOptimistic(items, (state, change: { id: string; done: boolean }) =>
    state.map((i) => (i.id === change.id ? { ...i, done: change.done } : i)),
  );
  const sections = [...new Set(shown.map((i) => i.section))];

  return (
    <div className="flex flex-col gap-5">
      {sections.map((section) => (
        <div key={section}>
          <h3 className="text-sm font-bold">{section}</h3>
          <ul className="mt-2 flex flex-col">
            {shown
              .filter((i) => i.section === section)
              .map((item) => (
                <li key={item.id}>
                  <label className="flex min-h-11 cursor-pointer items-center gap-3 py-1.5 text-[15px]">
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={(e) => {
                        const done = e.target.checked;
                        startTransition(async () => {
                          setShown({ id: item.id, done });
                          await setChecklistItem(item.id, done);
                        });
                      }}
                      className="peer sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex size-6 flex-none items-center justify-center rounded-md border-[1.5px] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brass",
                        item.done ? "border-brass bg-brass text-field" : "border-rule",
                      )}
                    >
                      {item.done ? <Check size={15} strokeWidth={3} /> : null}
                    </span>
                    <span className={item.done ? "text-moss line-through" : "text-bone"}>{item.label}</span>
                  </label>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

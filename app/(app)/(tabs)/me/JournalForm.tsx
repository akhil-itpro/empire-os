"use client";

import { useState, useTransition } from "react";
import { saveJournal } from "@/app/actions/me";
import { Button } from "@/components/ui/Button";

export function JournalForm({ initial }: { initial: string }) {
  const [text, setText] = useState(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="mt-3"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const r = await saveJournal(text);
          setMessage(r.ok ? "Saved." : r.message);
        });
      }}
    >
      <label htmlFor="journal-line" className="sr-only">
        One line for today
      </label>
      <input
        id="journal-line"
        value={text}
        maxLength={280}
        onChange={(e) => setText(e.target.value)}
        placeholder="What went well today?"
        className="h-12 w-full rounded-xl border-[1.5px] border-rule bg-ledger px-4 text-base text-bone placeholder:text-moss focus:border-brass focus:outline-none"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-xs text-moss tabular-nums">{text.length}/280</span>
        <div className="w-28">
          <Button type="submit" variant="secondary" className="h-11 text-sm" disabled={pending || text.trim().length === 0}>
            Save
          </Button>
        </div>
      </div>
      <p className="min-h-5 text-sm text-bone" role="status" aria-live="polite">
        {message}
      </p>
    </form>
  );
}

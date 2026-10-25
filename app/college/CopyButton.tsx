"use client";

import { useState } from "react";

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [note, setNote] = useState<string | null>(null);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setNote("Copied.");
    } catch {
      setNote("Couldn't copy here. Select the text to copy it.");
    }
  };
  return (
    <span className="inline-flex items-center gap-3">
      <button
        type="button"
        onClick={copy}
        className="h-11 rounded-[10px] border-[1.5px] border-brass-deep px-4 text-sm font-semibold text-bone hov:border-brass hov:bg-raised"
      >
        {label}
      </button>
      <span role="status" className="text-sm text-moss">
        {note}
      </span>
    </span>
  );
}

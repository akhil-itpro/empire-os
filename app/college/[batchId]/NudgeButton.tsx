"use client";

import { useState } from "react";
import { sendNudge } from "@/app/actions/college";

/** Sends one in-app reminder; once sent today, it stays sent. */
export function NudgeButton({ batchId, studentId, sentToday }: { batchId: string; studentId: string; sentToday: boolean }) {
  const [state, setState] = useState<"idle" | "busy" | "sent">(sentToday ? "sent" : "idle");
  const [message, setMessage] = useState<string | null>(null);

  const send = async () => {
    setState("busy");
    setMessage(null);
    const result = await sendNudge(batchId, studentId);
    if (result.ok) {
      setState("sent");
      return;
    }
    setState("idle");
    setMessage(result.message);
  };

  return (
    <div className="flex flex-none flex-col items-end">
      <button
        type="button"
        onClick={send}
        disabled={state !== "idle"}
        className="h-11 rounded-[10px] border border-brass-deep px-3 text-[13px] font-semibold text-bone hov:bg-raised disabled:cursor-default disabled:border-rule disabled:text-moss"
      >
        {state === "sent" ? "Reminder sent today" : state === "busy" ? "Sending" : "Send reminder"}
      </button>
      {message ? (
        <p role="alert" className="mt-1 max-w-[200px] text-right text-xs text-moss">
          {message}
        </p>
      ) : null}
    </div>
  );
}

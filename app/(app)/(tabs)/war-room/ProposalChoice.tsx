"use client";

import { useState, useTransition } from "react";
import { decideProposal } from "@/app/actions/war-room";
import { Button } from "@/components/ui/Button";

export function ProposalChoice() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const choose = (apply: boolean) =>
    startTransition(async () => {
      const r = await decideProposal(apply);
      if (!r.ok) setMessage(r.message);
    });
  return (
    <div className="mt-4 flex flex-col gap-2.5">
      <Button onClick={() => choose(true)} disabled={pending}>
        Apply new plan
      </Button>
      <Button variant="quiet" onClick={() => choose(false)} disabled={pending}>
        Keep my current plan
      </Button>
      {message ? (
        <p role="alert" className="text-sm text-bone">
          {message}
        </p>
      ) : null}
    </div>
  );
}

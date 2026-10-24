"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setTimeTravel } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";

/** Founder only: move your own clock forward to test tomorrow. Students never see this. */
export function FounderTools({ days }: { days: number }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const travel = (n: number) =>
    startTransition(async () => {
      const r = await setTimeTravel(n);
      if (!r.ok) {
        setMessage(r.message);
        return;
      }
      setMessage(n === 0 ? "Back to today." : `Your clock is now ${n} ${n === 1 ? "day" : "days"} ahead.`);
      router.refresh();
    });

  return (
    <section className="mt-8 rounded-xl border border-dashed border-brass-deep px-4 py-4" aria-labelledby="founder-tools">
      <h2 id="founder-tools" className="text-sm font-bold">
        Founder tools
      </h2>
      <p className="mt-1 text-sm text-moss">
        Time travel moves only your own clock, to test the next day. It is {days === 0 ? "off" : `${days} ${days === 1 ? "day" : "days"} ahead`}.
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Button variant="secondary" className="h-11 text-sm" disabled={pending} onClick={() => travel(days + 1)}>
          +1 day
        </Button>
        <Button variant="secondary" className="h-11 text-sm" disabled={pending} onClick={() => travel(days + 7)}>
          +7 days
        </Button>
        <Button variant="quiet" className="h-11 text-sm" disabled={pending || days === 0} onClick={() => travel(0)}>
          Today
        </Button>
      </div>
      <p className="mt-2 min-h-5 text-sm text-bone" role="status" aria-live="polite">
        {message}
      </p>
    </section>
  );
}

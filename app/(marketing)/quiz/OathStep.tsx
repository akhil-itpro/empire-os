"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { StepShell } from "./StepShell";

const HOLD_MS = 2000;
const RING = 2 * Math.PI * 88;

// "I'll show up for 90 days." Press and hold for 2 seconds while a brass ring fills.
// With reduced motion, a single tap takes the oath instead.
export function OathStep({ onDone, onBack }: { onDone: () => void; onBack: () => void }) {
  const reduceMotion = useReducedMotion();
  const [progress, setProgress] = useState(0);
  const start = useRef<number | null>(null);
  const frame = useRef<number | null>(null);
  const finished = useRef(false);

  const stop = () => {
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = null;
    start.current = null;
    if (!finished.current) setProgress(0);
  };

  const tick = (now: number) => {
    if (start.current === null) start.current = now;
    const p = Math.min(1, (now - start.current) / HOLD_MS);
    setProgress(p);
    if (p >= 1) {
      finished.current = true;
      if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(30);
      setTimeout(onDone, 250);
      return;
    }
    frame.current = requestAnimationFrame(tick);
  };

  const begin = () => {
    if (finished.current || frame.current) return;
    frame.current = requestAnimationFrame(tick);
  };

  useEffect(() => () => {
    if (frame.current) cancelAnimationFrame(frame.current);
  }, []);

  return (
    <StepShell onBack={onBack}>
      <p className="mt-7 text-[15px] text-moss">The oath</p>
      <h1 className="mt-2 font-display text-[44px] leading-[0.98] font-extrabold">
        I&apos;ll show up for 90 days. Not perfectly. Consistently.
      </h1>
      <div className="flex flex-1 flex-col items-center justify-center py-8">
        {reduceMotion ? (
          <Button onClick={onDone} className="max-w-[300px]">
            Take the oath
          </Button>
        ) : (
          <>
            <button
              type="button"
              aria-label="Press and hold for 2 seconds to take the oath"
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                begin();
              }}
              onPointerUp={stop}
              onPointerCancel={stop}
              onKeyDown={(e) => {
                if ((e.key === " " || e.key === "Enter") && !e.repeat) {
                  e.preventDefault();
                  begin();
                }
              }}
              onKeyUp={(e) => {
                if (e.key === " " || e.key === "Enter") stop();
              }}
              onContextMenu={(e) => e.preventDefault()}
              className="relative flex size-[200px] touch-none items-center justify-center rounded-full select-none [-webkit-touch-callout:none]"
            >
              <svg viewBox="0 0 200 200" className="absolute inset-0 -rotate-90" aria-hidden="true">
                <circle cx="100" cy="100" r="88" fill="none" strokeWidth="8" className="stroke-rule" />
                <circle
                  cx="100"
                  cy="100"
                  r="88"
                  fill="none"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={RING}
                  strokeDashoffset={RING * (1 - progress)}
                  className="stroke-brass"
                />
                <circle cx="100" cy="100" r="72" strokeWidth="1.5" className="fill-ledger stroke-brass-deep" />
              </svg>
              <span className="relative text-center text-base font-semibold text-bone">
                {progress >= 1 ? "Sworn." : "Press and hold"}
              </span>
            </button>
            <p className="mt-5 text-sm text-moss" aria-live="polite">
              {progress > 0 && progress < 1 ? "Keep holding…" : "Hold for 2 seconds."}
            </p>
          </>
        )}
      </div>
    </StepShell>
  );
}

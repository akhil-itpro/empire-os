"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { track } from "@/lib/analytics/track";

const KEY = "empire.installTipSeen";

function alreadyInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** A one-time tip, after the first completed day, on adding EMPIRE OS to the home screen. */
export function InstallTip({ show }: { show: boolean }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!show) return;
    let seen = true;
    try {
      seen = localStorage.getItem(KEY) === "1";
    } catch {
      // Without storage, don't nag.
    }
    if (seen || alreadyInstalled()) return;
    const t = setTimeout(() => {
      setOpen(true);
      track("install_tip_view");
      try {
        localStorage.setItem(KEY, "1");
      } catch {
        // Ignore.
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [show]);

  return (
    <Sheet open={open} onClose={() => setOpen(false)} title="Put EMPIRE OS on your home screen">
      <p className="text-[15px] text-moss">It opens like an app, straight to today&apos;s missions.</p>
      <h3 className="mt-5 text-sm font-bold text-bone">Android, in Chrome</h3>
      <ol className="mt-1.5 list-decimal space-y-1 pl-5 text-[15px] text-bone">
        <li>Tap the three dots at the top right.</li>
        <li>Tap &ldquo;Add to Home screen&rdquo;, then &ldquo;Install&rdquo;.</li>
      </ol>
      <h3 className="mt-4 text-sm font-bold text-bone">iPhone, in Safari</h3>
      <ol className="mt-1.5 list-decimal space-y-1 pl-5 text-[15px] text-bone">
        <li>Tap the Share button at the bottom.</li>
        <li>Tap &ldquo;Add to Home Screen&rdquo;, then &ldquo;Add&rdquo;.</li>
      </ol>
      <Button variant="secondary" className="mt-6" onClick={() => setOpen(false)}>
        Got it
      </Button>
    </Sheet>
  );
}

"use client";

import { Share2 } from "lucide-react";
import { useState } from "react";
import { ShareSheet } from "@/components/ShareSheet";
import type { ShareOption } from "@/lib/server/share-service";
import type { ShareName } from "@/lib/server/store";

type Props = { options: ShareOption[]; firstName: string; shareName: ShareName; referralCode: string };

/** The share cards this student has earned, each opening the share sheet. */
export function ShareCards({ options, firstName, shareName, referralCode }: Props) {
  const [open, setOpen] = useState<ShareOption | null>(null);
  return (
    <section className="mt-8" aria-labelledby="share-cards">
      <h2 id="share-cards" className="font-display text-[26px] leading-none font-extrabold">
        Share cards
      </h2>
      <p className="mt-1.5 text-[13px] text-moss">Story-sized images of what you&apos;ve earned. Each carries your invite link.</p>
      <ul className="mt-2">
        {options.map((o) => (
          <li key={o.kind} className="border-b border-rule">
            <button
              type="button"
              onClick={() => setOpen(o)}
              className="flex min-h-12 w-full items-center justify-between gap-3 text-left text-[15px] font-semibold text-bone hov:text-brass-light"
            >
              <span>
                {o.label}
                <span className="sr-only"> card</span>
              </span>
              <Share2 size={18} strokeWidth={2} className="flex-none text-brass" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      <ShareSheet
        kind={open?.kind ?? null}
        title={open?.label ?? ""}
        firstName={firstName}
        shareName={shareName}
        referralCode={referralCode}
        onClose={() => setOpen(null)}
      />
    </section>
  );
}

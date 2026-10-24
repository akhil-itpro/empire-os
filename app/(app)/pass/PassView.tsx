"use client";

import { Check, X } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { reservePass } from "@/app/actions/growth";
import { TrackOnMount } from "@/components/TrackOnMount";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Emblem } from "@/components/ui/Emblem";
import type { PaywallSource } from "@/lib/game/pass";
import type { PassData } from "@/lib/server/pass-service";

const nf = new Intl.NumberFormat("en-IN");
const longDate = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", timeZone: "UTC" });
const fmt = (d: string) => longDate.format(new Date(`${d}T00:00:00Z`));

// Only what is built today. Add "A weekly War Room that adapts your plan" when
// Phase 8 ships, and the Day-90 certificate if it is ever built.
const UNLOCKS = [
  "Three missions a day across all four pillars",
  "The full 13-week campaign map",
  "Four mission packs, like Placement Prep and Home Muscle",
  "One streak shield every week",
];

const BACK: Record<PaywallSource, { href: string; label: string }> = {
  trial_end: { href: "/hq", label: "Back to HQ" },
  trial_banner: { href: "/hq", label: "Back to HQ" },
  free_hq: { href: "/hq", label: "Back to HQ" },
  path_week: { href: "/path", label: "Back to Path" },
  pack: { href: "/path", label: "Back to Path" },
  me: { href: "/me", label: "Back to Me" },
  direct: { href: "/hq", label: "Back to HQ" },
};

export function PassView({ data, source }: { data: PassData; source: PaywallSource }) {
  const [pending, startTransition] = useTransition();
  const [reserved, setReserved] = useState(data.reservation);
  const [problem, setProblem] = useState<string | null>(null);
  const back = BACK[source];
  const { offer } = data;

  const reserve = () =>
    startTransition(async () => {
      setProblem(null);
      const r = await reservePass(source);
      if (r.ok) setReserved({ priceInr: r.data.priceInr, founderPrice: r.data.founderPrice });
      else setProblem(r.message);
    });

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-5 pt-2 pb-[calc(20px+env(safe-area-inset-bottom))]">
      <div className="flex h-[52px] items-center justify-between">
        <span className="text-[13px] font-medium text-moss">Day {data.day} of your season</span>
        <Link
          href={back.href}
          aria-label="Close"
          className="-mr-2.5 flex size-11 items-center justify-center rounded-full text-bone hov:bg-raised"
        >
          <X size={22} strokeWidth={2} aria-hidden="true" />
        </Link>
      </div>

      {data.passUntil ? (
        <>
          <h1 className="mt-3 font-display text-[42px] leading-[0.98] font-extrabold">You have Season Pass.</h1>
          <p className="mt-2.5 text-[15px] text-moss">
            Active until {fmt(data.passUntil)}. Three missions a day and the full campaign.
          </p>
          <div className="flex-1" />
          <ButtonLink href={back.href} className="mt-8">
            {back.label}
          </ButtonLink>
        </>
      ) : (
        <>
          <TrackOnMount name="paywall_view" props={{ source }} />
          <h1 className="mt-3 font-display text-[42px] leading-[0.98] font-extrabold">Keep all three missions.</h1>
          <p className="mt-2.5 text-[15px] text-moss">
            {data.accessUntil
              ? `Everything is unlocked until ${fmt(data.accessUntil)}. After that, Free stays free with one mission a day. Season Pass unlocks the whole season.`
              : "Your free week is over. Free stays free with one mission a day. Season Pass unlocks the whole season."}
          </p>

          <section
            aria-labelledby="pass-name"
            className="relative mt-[22px] rounded-2xl border-[1.5px] border-brass-deep bg-ledger"
          >
            <div className="px-[18px] pt-[18px] pb-4">
              <div className="flex items-center justify-between gap-2.5">
                <h2 id="pass-name" className="font-display text-[32px] leading-none font-extrabold">
                  Season Pass
                </h2>
                <span className="flex h-7 items-center rounded-full border border-brass-deep px-2.5 text-xs font-semibold text-brass">
                  Season {data.seasonNumber}
                </span>
              </div>
              <div className="mt-2.5 flex items-center gap-2 text-sm text-moss">
                <Emblem archetype={data.archetype} size={26} />
                <span>
                  Built for {data.archetypeName}, {data.firstName}
                </span>
              </div>
              <ul className="mt-4 flex flex-col gap-[9px]">
                {UNLOCKS.map((u) => (
                  <li key={u} className="flex items-start gap-2.5 text-sm leading-snug">
                    <Check size={17} strokeWidth={2.5} className="mt-px flex-none text-brass" aria-hidden="true" />
                    <span>{u}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative border-t-2 border-dashed border-rule px-[18px] py-4">
              <span aria-hidden="true" className="absolute -top-[9px] -left-2.5 size-4 rounded-full bg-field" />
              <span aria-hidden="true" className="absolute -top-[9px] -right-2.5 size-4 rounded-full bg-field" />
              <div className="flex items-center gap-3.5">
                <span className="text-[46px] leading-none font-bold">₹{nf.format(offer.priceInr)}</span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold">One-time, for 90 days</span>
                  <span className="text-[13px] text-moss">About ₹{offer.perDay} a day</span>
                </div>
              </div>
              {offer.founderPrice ? (
                <p className="mt-2.5 text-[13px] text-moss">
                  Founder price for the first {nf.format(offer.founderPlaces)} members, then ₹
                  {nf.format(offer.regularPriceInr)}. {nf.format(offer.founderTaken)} of{" "}
                  {nf.format(offer.founderPlaces)} reserved so far.
                </p>
              ) : null}
            </div>
          </section>

          <div className="flex-1" />

          {reserved ? (
            <>
              <p role="status" className="mt-5 rounded-xl border-[1.5px] border-brass px-4 py-3.5 text-[15px] font-semibold">
                Reserved at ₹{nf.format(reserved.priceInr)}. No payment taken. We&apos;ll tell you in the app when
                Season Pass opens.
              </p>
              <ButtonLink href={back.href} variant="secondary" className="mt-3">
                {back.label}
              </ButtonLink>
            </>
          ) : (
            <>
              <Button className="mt-5" onClick={reserve} disabled={pending}>
                {offer.founderPrice ? "Reserve founder price" : "Reserve Season Pass"}
              </Button>
              <ButtonLink href={back.href} variant="quiet" className="mt-2">
                Maybe later
              </ButtonLink>
              <p role="status" className="min-h-0 text-center text-sm text-bone empty:hidden">
                {problem}
              </p>
            </>
          )}

          <p className="mt-2.5 text-center text-xs text-moss">
            No payment is taken now. When Season Pass opens it&apos;s a one-time payment by UPI or card, with no
            auto-renewal. See the{" "}
            <Link href="/terms" className="font-semibold text-brass hov:text-brass-light">
              Terms
            </Link>
            .
          </p>
        </>
      )}
    </main>
  );
}

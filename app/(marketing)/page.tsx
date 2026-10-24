import type { Metadata } from "next";
import Link from "next/link";
import { TrackOnMount } from "@/components/TrackOnMount";
import { ButtonLink } from "@/components/ui/Button";
import { PillarIcon } from "@/components/ui/icons";
import { Medallion } from "@/components/ui/Medallion";
import { Wordmark } from "@/components/ui/Wordmark";
import { PILLAR_CLASSES, PILLAR_LABEL, PILLARS } from "@/lib/pillars";

export const metadata: Metadata = {
  title: "EMPIRE OS: make the next 90 days your best season",
  description:
    "Three missions a day for your career, body, mind and money, planned around your timetable, budget and free time.",
};

// The landing page (design/screens/Main.dc.html).
export default function LandingPage() {
  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-[480px] flex-col overflow-hidden px-5 pb-5">
      <TrackOnMount name="landing_view" />
      <header className="relative z-10 flex items-center justify-between pt-3.5">
        <Wordmark size={26} />
        <Link href="/login" className="px-1 py-3 text-[15px] font-medium text-bone hov:text-brass-light">
          Log in
        </Link>
      </header>

      <div className="relative h-[372px] flex-none" aria-hidden="true">
        <Medallion total={90} lit={12} size={340} detail="fine" className="absolute top-3 left-[134px]">
          <span className="font-display text-[21px] leading-none font-bold text-bone">Season 1</span>
          <span className="mt-2 font-stencil text-[128px] leading-[0.9] font-black text-brass">90</span>
          <span className="mt-1 text-[15px] text-moss">days</span>
        </Medallion>
        <ul className="absolute top-[78px] left-0 flex w-[124px] flex-col gap-5">
          {PILLARS.map((p) => (
            <li key={p} className="flex items-center gap-2.5 text-base font-semibold text-bone">
              <PillarIcon pillar={p} size={22} className={PILLAR_CLASSES[p].stroke} />
              {PILLAR_LABEL[p]}
            </li>
          ))}
        </ul>
      </div>

      <section className="relative z-10 flex flex-col">
        <h1 className="font-display text-[50px] leading-[0.96] font-extrabold tracking-[0.005em]">
          Make the next 90 days your best season.
        </h1>
        <p className="mt-4 max-w-[330px] text-base text-moss">
          Three missions a day for your career, body, mind and money, planned around your timetable, budget and free
          time.
        </p>
        <ButtonLink href="/quiz" className="mt-[26px]">
          Find your archetype
        </ButtonLink>
        <p className="mt-3 text-center text-sm text-moss">Free 2-minute quiz. No card needed.</p>
      </section>

      <div className="min-h-8 flex-1" />
      <footer className="relative z-10 flex items-center justify-between gap-3 border-t border-rule pt-3.5">
        <span className="text-sm text-moss">Run a training and placement cell?</span>
        <Link href="/colleges" className="py-2.5 text-sm font-semibold text-brass hov:text-brass-light">
          See College HQ
        </Link>
      </footer>
    </main>
  );
}

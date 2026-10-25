import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { TrackOnMount } from "@/components/TrackOnMount";
import { Wordmark } from "@/components/ui/Wordmark";
import { DemoForm } from "./DemoForm";

export const metadata: Metadata = {
  title: "College HQ for training and placement cells",
  description:
    "Your students get three short daily missions for placement prep, fitness, focus and money habits. You see who is active, who needs a nudge, and a weekly report for your principal.",
  alternates: { canonical: "/colleges" },
};

const h2 = "font-display text-[32px] leading-[1.02] font-extrabold sm:text-[40px]";

const GETS = [
  {
    title: "Who shows up each day",
    body: "The share of your batch that finished at least one mission, day by day, with a table view.",
  },
  {
    title: "Who needs a nudge",
    body: "Students who missed 3 or more days in a row, with a one-tap reminder inside their app.",
  },
  {
    title: "Sections side by side",
    body: "Active students and missions per student for each section, every week.",
  },
  {
    title: "A weekly report",
    body: "One printable page for your principal: summary, trend, the most consistent students and sections. Save it as a PDF.",
  },
];

const STEPS = [
  {
    title: "We set up your batch",
    body: "Season dates, sections and a join code. You get a link to share and an A4 poster with a QR code.",
  },
  {
    title: "Students join with consent",
    body: "Before joining, each student sees exactly what you'll see. They can leave any time, and their account stays.",
  },
  {
    title: "You watch consistency",
    body: "College HQ works on a laptop and a phone. Nudge students who go quiet; download the weekly report on Monday.",
  },
];

// The page for T&P cells (START-HERE.md section 6): one button, real screens, honest pricing.
export default function CollegesPage() {
  return (
    <main className="mx-auto w-full max-w-[1040px] px-5 pb-10">
      <TrackOnMount name="colleges_view" />
      <header className="flex items-center justify-between pt-3.5">
        <Link href="/" className="py-2">
          <Wordmark size={26} />
          <span className="sr-only"> home page</span>
        </Link>
        <Link href="/college" className="px-1 py-3 text-[15px] font-medium text-bone hov:text-brass-light">
          College HQ login
        </Link>
      </header>

      <section className="mt-10 grid items-center gap-8 lg:grid-cols-[1fr_1.15fr]">
        <div>
          <p className="text-sm font-semibold text-moss">College HQ, for training and placement cells</p>
          <h1 className="mt-2 font-display text-[44px] leading-[0.96] font-extrabold sm:text-[58px]">
            See who&apos;s preparing every day, not just on drive day.
          </h1>
          <p className="mt-4 max-w-[46ch] text-base text-moss sm:text-[17px]">
            Your students get three short daily missions for placement prep, fitness, focus and money habits, planned
            around their timetable. You see who is active, who has gone quiet, and a weekly report for your principal.
          </p>
          <a
            href="#demo"
            className="mt-6 flex h-14 w-full items-center justify-center rounded-xl bg-brass px-6 text-[17px] font-bold text-field hov:bg-brass-light sm:w-auto sm:max-w-[340px]"
          >
            Book a 20-minute demo
          </a>
        </div>
        {/* On phones the first screen is the headline and one button; the screen comes further down. */}
        <figure className="hidden lg:block">
          <Image
            src="/colleges/college-hq-laptop.png"
            alt="College HQ overview with sample data: students active this week, missions per student, students who need a nudge, mock interviews, a daily activity chart and the nudge list."
            width={1280}
            height={800}
            quality={60}
            sizes="560px"
            className="h-auto w-full rounded-[14px] border border-rule"
          />
          <figcaption className="mt-2 text-[13px] text-moss">College HQ with a sample batch. Names and numbers are made up.</figcaption>
        </figure>
      </section>

      <section className="mt-16" aria-labelledby="problem">
        <h2 id="problem" className={h2}>
          Placement prep goes quiet between drives.
        </h2>
        <ul className="mt-5 grid gap-4 sm:grid-cols-3">
          {[
            "Students prepare in bursts: hard before a drive, then nothing for weeks.",
            "You often find out who fell behind at the mock test, when there's little time left to help.",
            "Reminders in big WhatsApp groups get muted, and you can't tell who acted on them.",
          ].map((t) => (
            <li key={t} className="border-t-2 border-brass-deep pt-3 text-[15px] leading-normal text-bone">
              {t}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16 grid items-start gap-8 lg:grid-cols-[1.2fr_1fr]" aria-labelledby="gets">
        <div>
          <h2 id="gets" className={h2}>
            What your cell sees
          </h2>
          <ul className="mt-5 flex flex-col">
            {GETS.map((g) => (
              <li key={g.title} className="border-b border-rule py-4 first:pt-0">
                <h3 className="text-[17px] font-bold">{g.title}</h3>
                <p className="mt-1 text-[15px] text-moss">{g.body}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-4">
          <figure className="lg:hidden">
            <Image
              src="/colleges/college-hq-laptop.png"
              alt="College HQ overview with sample data: students active this week, missions per student, students who need a nudge, mock interviews, a daily activity chart and the nudge list."
              width={1280}
              height={800}
              quality={60}
              sizes="100vw"
              className="h-auto w-full rounded-[14px] border border-rule"
            />
            <figcaption className="mt-2 text-[13px] text-moss">College HQ with a sample batch. Names and numbers are made up.</figcaption>
          </figure>
          <Image
            src="/colleges/college-hq-nudge.png"
            alt="The need-a-nudge list with sample students who missed several days, each with a Send reminder button."
            width={350}
            height={388}
            quality={60}
            sizes="(min-width: 1024px) 420px, 100vw"
            className="h-auto w-full max-w-[420px] rounded-[14px]"
          />
        </div>
      </section>

      <section className="mt-16" aria-labelledby="how">
        <h2 id="how" className={h2}>
          How it works
        </h2>
        <ol className="mt-5 grid gap-6 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <span className="font-stencil text-[40px] leading-none font-black text-brass">{i + 1}</span>
              <h3 className="mt-2 text-[17px] font-bold">{s.title}</h3>
              <p className="mt-1 text-[15px] text-moss">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-16 grid gap-8 lg:grid-cols-2" aria-labelledby="privacy">
        <div>
          <h2 id="privacy" className={h2}>
            Students stay in control
          </h2>
          <p className="mt-4 text-[15px] text-moss">
            Joining shows each student this, word for word: &ldquo;Your mission progress (not your journal or quiz answers)
            will be shared with [College] training and placement cell. You can leave any time; your account stays.&rdquo;
          </p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <h3 className="text-[15px] font-bold">You see</h3>
              <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5 text-sm text-moss marker:text-brass">
                <li>The days each student finished missions, and how many</li>
                <li>Mock interviews done</li>
                <li>Section, first name and an initial</li>
              </ul>
            </div>
            <div>
              <h3 className="text-[15px] font-bold">You never see</h3>
              <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5 text-sm text-moss marker:text-brass">
                <li>Journals or quiz answers</li>
                <li>Email, phone or city</li>
                <li>Anything from before the batch season, or after a student leaves</li>
              </ul>
            </div>
          </div>
        </div>
        <Image
          src="/colleges/college-hq-report.png"
          alt="The printable weekly report with sample data: summary figures, a four-week trend, the most consistent students and sections."
          width={616}
          height={1233}
          quality={60}
          sizes="(min-width: 1024px) 500px, 100vw"
          className="h-auto max-h-[560px] w-full rounded-[14px] object-cover object-top"
        />
      </section>

      <section className="mt-16" aria-labelledby="pricing">
        <h2 id="pricing" className={h2}>
          Start with a paid pilot
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[14px] border-[1.5px] border-brass-deep bg-ledger px-5 py-5">
            <h3 className="text-[17px] font-bold">Paid pilot</h3>
            <p className="mt-2 flex items-baseline gap-2">
              <span className="text-[40px] leading-none font-semibold">₹15,000</span>
              <span className="text-sm text-moss">one batch, 30 days</span>
            </p>
            <p className="mt-3 text-sm text-moss">Credited in full to a Placement Season if you continue.</p>
          </div>
          <div className="rounded-[14px] border border-rule bg-ledger px-5 py-5">
            <h3 className="text-[17px] font-bold">Placement Season</h3>
            <p className="mt-2 flex items-baseline gap-2">
              <span className="text-[40px] leading-none font-semibold">₹400</span>
              <span className="text-sm text-moss">per student, 90 days</span>
            </p>
            <p className="mt-3 text-sm text-moss">
              Minimum 100 students. Every student who joins with your code gets Season Pass for the season.
            </p>
          </div>
        </div>
        <p className="mt-3 text-[13px] text-moss">
          Plus GST where it applies. No auto-renewal: a new season is a new order. Missions are general habits, not
          medical, financial or legal advice, and we don&apos;t promise placement results.
        </p>
      </section>

      <section id="demo" className="mt-16 scroll-mt-6" aria-labelledby="demo-title">
        <h2 id="demo-title" className={h2}>
          Book a 20-minute demo
        </h2>
        <p className="mt-3 max-w-[56ch] text-[15px] text-moss">
          We&apos;ll walk you through College HQ with a sample batch and answer your questions. We reply by email to fix a
          time.
        </p>
        <div className="mt-6">
          <DemoForm />
        </div>
      </section>

      <footer className="mt-16 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-4">
        <p className="text-sm text-moss">
          Are you a student?{" "}
          <Link href="/" className="font-semibold text-brass hov:text-brass-light">
            Find your archetype
          </Link>
        </p>
        <nav aria-label="Legal" className="flex gap-5 text-[13px] text-moss">
          <Link href="/guides" className="py-2.5 hov:text-bone">
            Guides
          </Link>
          <Link href="/privacy" className="py-2.5 hov:text-bone">
            Privacy
          </Link>
          <Link href="/terms" className="py-2.5 hov:text-bone">
            Terms
          </Link>
        </nav>
      </footer>
    </main>
  );
}

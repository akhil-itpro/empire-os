import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";
import { depsFor, storeForRequest, TIME_TRAVEL_COOKIE } from "@/lib/server/deps";
import { loadMe } from "@/lib/server/me-service";
import { getSessionUserId } from "@/lib/server/session";
import { TEST_MODE } from "@/lib/server/test-mode";
import { FounderTools } from "./FounderTools";
import { JournalForm } from "./JournalForm";
import { SettingsEditor } from "./SettingsEditor";

export const metadata: Metadata = { title: "Me", robots: { index: false } };

const longDate = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", timeZone: "UTC" });
const fmt = (d: string) => longDate.format(new Date(`${d}T00:00:00Z`));

export default function MePage() {
  return (
    <Suspense fallback={<main className="min-h-dvh px-5 pt-6" aria-busy="true" />}>
      <MeContent />
    </Suspense>
  );
}

async function MeContent() {
  await connection();
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");
  // Founder tools show only for the founder role (or in local test mode), checked on the server.
  const founder = TEST_MODE || (await storeForRequest().isFounder(userId));
  const result = await loadMe(await depsFor(userId), userId, founder);
  if (!result.ok) redirect("/quiz");
  const me = result.data;
  const travel = founder ? Number((await cookies()).get(TIME_TRAVEL_COOKIE)?.value ?? 0) || 0 : 0;

  return (
    <main className="px-5 pt-5">
      <p className="text-[13px] font-medium text-moss">
        Season {me.seasonNumber}, day {me.day}
      </p>
      <h1 className="mt-1 font-display text-[40px] leading-none font-extrabold">{me.firstName}</h1>
      <p className="mt-1.5 text-[15px] text-moss">{me.archetypeName}</p>

      <section className="mt-6 rounded-xl border border-rule bg-ledger px-4 py-3.5" aria-labelledby="access">
        <h2 id="access" className="text-sm font-bold">
          {me.access.kind === "pass" ? "Season Pass" : me.access.kind === "trial" ? "Free week" : "Free plan"}
        </h2>
        <p className="mt-1 text-sm text-moss">
          {me.access.kind === "pass"
            ? `Active until ${fmt(me.access.until)}. Three missions a day and the full campaign.`
            : me.access.kind === "trial"
              ? `Everything is unlocked until ${fmt(me.access.until)}. After that, Free keeps one mission a day.`
              : "One mission a day, in the pillar you pick. XP and ranks keep working."}
        </p>
      </section>

      <section className="mt-8" aria-labelledby="journal">
        <h2 id="journal" className="font-display text-[26px] leading-none font-extrabold">
          One line for today
        </h2>
        <p className="mt-1.5 text-[13px] text-moss">Private. Never shared with anyone, including colleges.</p>
        <JournalForm initial={me.journalToday} />
        {me.journalRecent.length > 0 ? (
          <ul className="mt-4 flex flex-col gap-2">
            {me.journalRecent.map((j) => (
              <li key={j.localDate} className="text-sm">
                <span className="text-moss">{fmt(j.localDate)}: </span>
                {j.body}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="mt-8" aria-labelledby="plan">
        <h2 id="plan" className="font-display text-[26px] leading-none font-extrabold">
          Your plan
        </h2>
        <p className="mt-1.5 text-[13px] text-moss">Changes start tomorrow. Past days, XP and rank stay as they are.</p>
        {me.pending ? (
          <p className="mt-3 rounded-xl border border-brass-deep bg-ledger px-4 py-3 text-sm">
            Your updated plan starts on {fmt(me.pending.from)}.
          </p>
        ) : null}
        <SettingsEditor current={me.pending?.settings ?? me.settings} />
      </section>

      <section className="mt-8" aria-labelledby="privacy">
        <h2 id="privacy" className="font-display text-[26px] leading-none font-extrabold">
          Privacy and data
        </h2>
        <ul className="mt-3 flex flex-col">
          {[
            { href: "/me/data", label: "Download or delete my data" },
            { href: "/privacy", label: "Privacy Policy" },
            { href: "/terms", label: "Terms" },
          ].map((l) => (
            <li key={l.href} className="border-b border-rule">
              <Link href={l.href} className="flex min-h-12 items-center text-[15px] font-semibold text-bone hov:text-brass-light">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {me.isFounder ? <FounderTools days={travel} /> : null}

      <form action={signOut} className="mt-8 mb-4">
        <Button type="submit" variant="secondary">
          Sign out
        </Button>
      </form>
    </main>
  );
}

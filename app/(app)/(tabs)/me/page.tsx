import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";
import { depsFor, storeForRequest, TIME_TRAVEL_COOKIE } from "@/lib/server/deps";
import { loadMembership } from "@/lib/server/college-service";
import { loadMe } from "@/lib/server/me-service";
import { getSessionUserId } from "@/lib/server/session";
import { loadReferrals } from "@/lib/server/referral-service";
import { shareOptions } from "@/lib/server/share-service";
import { TEST_MODE } from "@/lib/server/test-mode";
import { CollegeSeason } from "./CollegeSeason";
import { FounderTools } from "./FounderTools";
import { InviteFriends } from "./InviteFriends";
import { JournalForm } from "./JournalForm";
import { SettingsEditor } from "./SettingsEditor";
import { ShareCards } from "./ShareCards";

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
  const deps = await depsFor(userId);
  const [result, cards, referrals, membership] = await Promise.all([
    loadMe(deps, userId, founder),
    shareOptions(deps, userId),
    loadReferrals(deps, userId),
    loadMembership(deps, userId),
  ]);
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
          {me.access.kind === "pass"
            ? "Season Pass"
            : me.access.kind === "batch"
              ? "Season Pass from your college"
              : me.access.kind === "trial"
              ? "Free week"
              : me.access.kind === "bonus"
                ? "Full access from an invite"
                : "Free plan"}
        </h2>
        <p className="mt-1 text-sm text-moss">
          {me.access.kind === "pass" || me.access.kind === "batch"
            ? `Active until ${fmt(me.access.until)}. Three missions a day and the full campaign.`
            : me.access.kind === "trial" || me.access.kind === "bonus"
              ? `Everything is unlocked until ${fmt(me.access.until)}. After that, Free keeps one mission a day.`
              : "One mission a day, in the pillar you pick. XP and ranks keep working."}
        </p>
        {me.reservedAt !== null && me.access.kind !== "pass" && me.access.kind !== "batch" ? (
          <p className="mt-2 text-sm text-bone">
            You reserved Season Pass at ₹{me.reservedAt}. No payment taken. We&apos;ll tell you in the app when it opens.
          </p>
        ) : null}
        {me.access.kind !== "pass" && me.access.kind !== "batch" ? (
          <Link
            href="/pass?from=me"
            className="-mb-1.5 inline-flex min-h-11 items-center text-sm font-semibold text-brass hov:text-brass-light"
          >
            See Season Pass
          </Link>
        ) : null}
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

      <InviteFriends code={me.referralCode} summary={referrals} />

      <ShareCards options={cards} firstName={me.firstName} shareName={me.shareName} referralCode={me.referralCode} />

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
        <Link
          href="/war-room"
          className="mt-3 flex min-h-12 items-center justify-between rounded-xl border border-rule bg-ledger px-4 text-[15px] font-semibold hov:bg-raised"
        >
          War Room: review your week
          <span className="text-sm font-normal text-moss">Every 7 days</span>
        </Link>
      </section>

      <CollegeSeason membership={membership} />

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

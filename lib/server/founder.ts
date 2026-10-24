// Founder HQ metrics (docs/PRODUCT.md section 10), computed from raw rows so the
// rules are plain and testable. Read-only; only shown to the founder role.
import { addDays, daysBetween, type LocalDate } from "@/lib/game/dates";
import { PILLARS, type Pillar } from "@/lib/pillars";

export type FounderSnapshot = {
  /** Profiles created from 31 days before the range start (for return cohorts). */
  signups: { userId: string; signupDate: LocalDate }[];
  events: { name: string; userId: string | null; anonId: string | null; props: Record<string, unknown>; at: Date }[];
  missions: { userId: string; localDate: LocalDate; pillar: Pillar; missionId: string; status: string; skipReason: string | null }[];
  reservations: { total: number; founderPrice: number };
  referralSignups: number;
};

export type ChecklistItem = { id: string; section: string; label: string; done: boolean };

const FUNNEL = [
  { name: "landing_view", label: "Landing" },
  { name: "quiz_start", label: "Quiz started" },
  { name: "quiz_complete", label: "Quiz finished" },
  { name: "reveal_view", label: "Archetype revealed" },
  { name: "oath_done", label: "Oath taken" },
  { name: "signup_done", label: "Signed up" },
  { name: "first_mission_done", label: "First mission done" },
] as const;

export type FounderMetrics = {
  signupsPerDay: { date: LocalDate; count: number }[];
  funnel: { label: string; count: number; dropOff: number | null }[];
  returns: { day: 1 | 7 | 30; cohort: number; returned: number; rate: number | null }[];
  missionsByPillar: Record<Pillar, number>;
  mostSkipped: { missionId: string; skips: number; reasons: Record<string, number> }[];
  paywallBySource: { source: string; views: number }[];
  shareCards: number;
  reservations: { total: number; founderPrice: number };
  referralSignups: number;
};

export function computeFounderMetrics(s: FounderSnapshot, from: LocalDate, to: LocalDate, toDate: (d: Date) => LocalDate): FounderMetrics {
  const inRange = (d: LocalDate) => d >= from && d <= to;
  const events = s.events.filter((e) => inRange(toDate(e.at)));

  const signupsPerDay: FounderMetrics["signupsPerDay"] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) {
    signupsPerDay.push({ date: d, count: s.signups.filter((u) => u.signupDate === d).length });
  }

  const actors = (name: string) =>
    new Set(events.filter((e) => e.name === name).map((e) => e.userId ?? e.anonId ?? "")).size;

  // "Came back next day": signed up in range and did a mission the day after.
  const doneDays = new Map<string, Set<LocalDate>>();
  for (const m of s.missions) {
    if (m.status !== "done") continue;
    if (!doneDays.has(m.userId)) doneDays.set(m.userId, new Set());
    doneDays.get(m.userId)!.add(m.localDate);
  }
  const cameBack = s.signups.filter(
    (u) => inRange(u.signupDate) && doneDays.get(u.userId)?.has(addDays(u.signupDate, 1)),
  ).length;

  const counts = [...FUNNEL.map((f) => ({ label: f.label, count: actors(f.name) })), { label: "Came back next day", count: cameBack }];
  const funnel = counts.map((c, i) => ({
    ...c,
    dropOff: i === 0 || counts[i - 1].count === 0 ? null : Math.round((1 - c.count / counts[i - 1].count) * 100),
  }));

  // Day-N return: of those who signed up early enough, how many did a mission on day N after sign-up.
  const returns = ([1, 7, 30] as const).map((day) => {
    const cohort = s.signups.filter((u) => inRange(u.signupDate) && daysBetween(u.signupDate, to) >= day);
    const returned = cohort.filter((u) => doneDays.get(u.userId)?.has(addDays(u.signupDate, day))).length;
    return { day, cohort: cohort.length, returned, rate: cohort.length ? Math.round((returned / cohort.length) * 100) : null };
  });

  const ranged = s.missions.filter((m) => inRange(m.localDate));
  const missionsByPillar = Object.fromEntries(
    PILLARS.map((p) => [p, ranged.filter((m) => m.pillar === p && m.status === "done").length]),
  ) as Record<Pillar, number>;

  const skips = new Map<string, Record<string, number>>();
  for (const m of ranged.filter((m) => m.status === "skipped")) {
    const reasons = skips.get(m.missionId) ?? {};
    const reason = m.skipReason ?? "unknown";
    reasons[reason] = (reasons[reason] ?? 0) + 1;
    skips.set(m.missionId, reasons);
  }
  const mostSkipped = [...skips.entries()]
    .map(([missionId, reasons]) => ({ missionId, reasons, skips: Object.values(reasons).reduce((a, b) => a + b, 0) }))
    .sort((a, b) => b.skips - a.skips)
    .slice(0, 5);

  const paywall = new Map<string, number>();
  for (const e of events.filter((e) => e.name === "paywall_view")) {
    const source = typeof e.props.source === "string" ? e.props.source : "unknown";
    paywall.set(source, (paywall.get(source) ?? 0) + 1);
  }

  return {
    signupsPerDay,
    funnel,
    returns,
    missionsByPillar,
    mostSkipped,
    paywallBySource: [...paywall.entries()].map(([source, views]) => ({ source, views })).sort((a, b) => b.views - a.views),
    shareCards: events.filter((e) => e.name === "share_card_created").length,
    reservations: s.reservations,
    referralSignups: s.referralSignups,
  };
}

/** The launch checklist items, matching supabase/migrations/20261024120000_launch_checklist.sql. */
export const LAUNCH_ITEMS: Omit<ChecklistItem, "done">[] = [
  {
    id: "friends-landing-phones",
    section: "Before inviting friends",
    label: "Landing to HQ works on Android Chrome and iPhone Safari"
  },
  {
    id: "friends-progress-survives",
    section: "Before inviting friends",
    label: "Progress survives refresh, sign-out and sign-in"
  },
  {
    id: "friends-missions-differ",
    section: "Before inviting friends",
    label: "Missions differ for different answers"
  },
  {
    id: "friends-security-check",
    section: "Before inviting friends",
    label: "/security-check passes and is recorded"
  },
  {
    id: "friends-policies-linked",
    section: "Before inviting friends",
    label: "Privacy Policy and Terms drafts published and linked"
  },
  {
    id: "friends-export-delete",
    section: "Before inviting friends",
    label: "Data export and account delete work"
  },
  {
    id: "college-contact-filled",
    section: "Before the first college pilot",
    label: "Real name or business name, contact email and grievance contact filled in"
  },
  {
    id: "college-consent-reviewed",
    section: "Before the first college pilot",
    label: "Consent screen for joining a college batch reviewed"
  },
  {
    id: "college-agreement",
    section: "Before the first college pilot",
    label: "Two-page college agreement drafted"
  },
  {
    id: "college-gst",
    section: "Before the first college pilot",
    label: "GST question answered by a CA"
  },
  {
    id: "college-trademark",
    section: "Before the first college pilot",
    label: "Trademark search for \"EMPIRE OS\" done"
  },
  {
    id: "money-lawyer",
    section: "Before taking money",
    label: "A lawyer reviewed Privacy Policy, Terms and refund policy"
  },
  {
    id: "money-kyc",
    section: "Before taking money",
    label: "Razorpay KYC approved"
  },
  {
    id: "money-refund",
    section: "Before taking money",
    label: "Refund policy decided and published"
  },
  {
    id: "money-day7",
    section: "Before taking money",
    label: "Day-7 return at 15% or more for the last two weekly cohorts"
  },
  {
    id: "money-dark-patterns",
    section: "Before taking money",
    label: "Paywall, banners and quiz checked against the 13 dark patterns"
  },
  {
    id: "money-payment-tests",
    section: "Before taking money",
    label: "Payment test-mode cases all pass"
  },
  {
    id: "money-pro-plans",
    section: "Before taking money",
    label: "Vercel Pro and Supabase Pro"
  }
];

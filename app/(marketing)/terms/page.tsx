import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms",
  description: "The terms for using EMPIRE OS, the free plan and Season Pass.",
};

// Written from what the app really does. Draft, pending legal review.
export default function TermsPage() {
  return (
    <LegalPage title="Terms" updated="24 October 2026">
      <section>
        <h2>The basics</h2>
        <p className="mt-3">
          These terms are between you and [OPERATOR NAME], [ADDRESS] (&ldquo;we&rdquo;). By using EMPIRE OS you agree to
          them. Our <Link href="/privacy">Privacy Policy</Link> explains how we handle your data.
        </p>
      </section>

      <section>
        <h2>Who can use it</h2>
        <p className="mt-3">You must be 18 or older. Keep your sign-in email secure; you are responsible for activity on your account.</p>
      </section>

      <section>
        <h2>What EMPIRE OS is, and isn&apos;t</h2>
        <p className="mt-3">
          EMPIRE OS suggests small daily habits for your career, body, mind and money. Missions are general habits.
          They are not medical, financial, investment or legal advice, and we don&apos;t promise any result, such as a
          job, an income or a fitness level. Check with a doctor before exercise if you have a health condition.
          XP, ranks and streaks measure activity in the app only.
        </p>
      </section>

      <section>
        <h2>Free plan and Season Pass</h2>
        <ul className="mt-3">
          <li>Your first 7 days include everything.</li>
          <li>After that, Free stays free with one mission a day in the pillar you pick. XP and ranks keep working.</li>
          <li>Season Pass gives three missions a day and the full season for 90 days, for ₹499 as a one-time payment. The first 500 buyers pay ₹299.</li>
          <li>There is no auto-renewal and no hidden charge. A new season is a new purchase. The full price is shown before you pay.</li>
          <li>Until payments open, reserving the founder price takes no money. If you reserved it, ₹299 is held for you when they open.</li>
          <li>Payments go through Razorpay by UPI or card. We never see your card or UPI details. Season Pass starts when the payment is confirmed.</li>
          <li id="refunds" className="scroll-mt-6">Refunds: [REFUND POLICY].</li>
        </ul>
      </section>

      <section>
        <h2>College batches</h2>
        <p className="mt-3">
          If you join your college&apos;s batch, your mission progress (not your journal or quiz answers) is shared with
          its training and placement cell, as shown on the consent screen. You can leave at any time and keep your
          account.
        </p>
      </section>

      <section>
        <h2>Fair use</h2>
        <ul className="mt-3">
          <li>Don&apos;t try to break, overload or get around the app&apos;s security or limits.</li>
          <li>Don&apos;t copy the app&apos;s content in bulk or use automated tools to collect it.</li>
          <li>Referral rewards are for real invitations: self-referrals and repeat sign-ups don&apos;t count, and rewards are capped.</li>
        </ul>
        <p className="mt-3">We may pause or close accounts that break these rules.</p>
      </section>

      <section>
        <h2>Ending</h2>
        <p className="mt-3">
          You can delete your account at any time from Me. We may change or stop the service; if we stop it, we will
          give you reasonable notice in the app.
        </p>
      </section>

      <section>
        <h2>Liability and law</h2>
        <p className="mt-3">
          [LIMITATION OF LIABILITY, TO BE WRITTEN BY A LAWYER.] These terms are governed by the laws of India, and the
          courts at [CITY] have jurisdiction.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p className="mt-3">Questions: [CONTACT EMAIL]. Grievances: [GRIEVANCE CONTACT].</p>
      </section>
    </LegalPage>
  );
}

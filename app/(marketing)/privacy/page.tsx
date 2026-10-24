import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What EMPIRE OS collects, why, who sees it, and how to download or delete it.",
};

// Written from what the app really does (docs/PRODUCT.md section 11). Draft, pending legal review.
export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="24 October 2026">
      <section>
        <h2>Who we are</h2>
        <p className="mt-3">
          EMPIRE OS is run by [OPERATOR NAME], [ADDRESS]. Write to [CONTACT EMAIL] with any question about your data.
          Our grievance contact is [GRIEVANCE CONTACT].
        </p>
      </section>

      <section>
        <h2>What we collect</h2>
        <ul className="mt-3">
          <li>Your first name and email address (the email is how you sign in).</li>
          <li>Your age bracket and that you confirmed you are 18 or older.</li>
          <li>Your quiz answers: city (from a list), what you do right now, main goal, the order of the four pillars, daily free time, monthly spend level, whether you have a gym and a laptop, your biggest obstacle, and how hard you want to be pushed.</li>
          <li>Your mission activity: which missions you were given, finished, skipped (with the reason you picked) or swapped, and when. XP, streaks and rank are worked out from this.</li>
          <li>An optional one-line private journal, if you write one.</li>
          <li>Your time zone, so a &ldquo;day&rdquo; matches your clock.</li>
          <li>If you join a college batch: that you joined and that you agreed to share progress.</li>
          <li>If you reserve a Season Pass: the price shown when you reserved. No payment is taken.</li>
          <li>If you were invited with a referral link: who invited you.</li>
          <li>Simple usage events, such as &ldquo;finished the quiz&rdquo; or &ldquo;opened the paywall&rdquo;, stored in our own database with a random ID kept in your browser. They never contain your answers or journal.</li>
        </ul>
      </section>

      <section>
        <h2>What we never collect</h2>
        <p className="mt-3">
          Exact income, bank or card details, government IDs, health conditions, photos, contacts, precise location,
          religion, caste, political views or sexuality. When payments open, Razorpay handles card and UPI details; we
          never see them.
        </p>
      </section>

      <section>
        <h2>Why we use it</h2>
        <ul className="mt-3">
          <li>To build and adjust your daily missions and season plan.</li>
          <li>To sign you in and keep your progress safe.</li>
          <li>To understand which parts of the app help people keep going, using our own event records.</li>
          <li>If you join a college batch: to show your mission progress to that college&apos;s training and placement cell. They never see your journal or quiz answers, and you can leave at any time.</li>
        </ul>
      </section>

      <section>
        <h2>No ads and no trackers</h2>
        <p className="mt-3">
          We don&apos;t sell your data. We don&apos;t use advertising pixels, session recording or third-party trackers.
          Cookies are used only to keep you signed in. Your browser also stores your quiz answers until you sign up,
          a random analytics ID, and which one-time tips you have seen.
        </p>
      </section>

      <section>
        <h2>Who processes it for us</h2>
        <ul className="mt-3">
          <li>Supabase: our database and sign-in service, including the emails with your sign-in code.</li>
          <li>Vercel: hosts the website.</li>
          <li>Google: only if you choose &ldquo;Continue with Google&rdquo; to sign in.</li>
          <li>Razorpay: will handle payments once Season Pass goes on sale.</li>
        </ul>
        <p className="mt-3">[CONFIRM DATA LOCATIONS AND ANY CROSS-BORDER TRANSFER WITH THE CHOSEN REGIONS.]</p>
      </section>

      <section>
        <h2>How long we keep it</h2>
        <p className="mt-3">
          We keep your data while your account is active. When you delete your account, we delete your profile,
          missions, journal and every other record linked to you, and your sign-in. Usage events are kept only without
          any link to you.
        </p>
      </section>

      <section>
        <h2>Your choices and rights</h2>
        <ul className="mt-3">
          <li>Download all your data as a file: Me, then &ldquo;Download or delete my data&rdquo;.</li>
          <li>Correct your plan details: Me, then &ldquo;Edit my plan&rdquo;.</li>
          <li>Delete your account and data: Me, then &ldquo;Download or delete my data&rdquo;.</li>
          <li>Stop sharing progress with a college: leave the batch from Me.</li>
          <li>Ask us anything or raise a grievance: [CONTACT EMAIL] or [GRIEVANCE CONTACT]. We aim to reply within [RESPONSE TIME].</li>
        </ul>
        <p className="mt-3">
          These rights follow India&apos;s Digital Personal Data Protection Act, 2023. [LAWYER TO CONFIRM WORDING UNDER THE DPDP RULES.]
        </p>
      </section>

      <section>
        <h2>Adults only</h2>
        <p className="mt-3">
          EMPIRE OS is for people aged 18 and over. If someone picks &ldquo;Under 18&rdquo; in the quiz, we store nothing
          they entered.
        </p>
      </section>

      <section>
        <h2>Security</h2>
        <p className="mt-3">
          Data travels encrypted. Each person can read only their own records, enforced in the database itself, and
          changes to XP, streaks, passes and roles happen only on our servers. No system is perfect; if we learn of a
          breach that affects you, we will tell you and the authorities as the law requires.
        </p>
      </section>

      <section>
        <h2>Changes</h2>
        <p className="mt-3">If this policy changes in a way that matters, we will tell you in the app before it applies.</p>
      </section>
    </LegalPage>
  );
}

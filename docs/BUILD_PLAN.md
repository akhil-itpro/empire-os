# EMPIRE OS build plan

Work top to bottom. One phase per `/next-phase`. Tick a box only after it was verified for real. Each phase names what to read first.

Target: phases 0 to 5 in about 6 weeks at 25 to 30 hours a week; phases 6 and 7 by week 9.

---

## Phase 0: Setup and first deploy

Read: `CLAUDE.md`. Run `/kickoff` for this phase.

- [x] Next.js app scaffolded in this folder (TypeScript strict, App Router, Tailwind, ESLint), kit files kept
- [x] Scripts exist and pass: `dev`, `build`, `lint`, `typecheck`, `test`, `test:e2e`, `test:rls` (the last three may be placeholders that print "not set up yet")
- [x] Private GitHub repository with the first commit pushed
- [ ] Supabase dev project created (Mumbai region); `.env.local` filled by the founder; `.env.example` lists names only
- [ ] Supabase MCP server connected and authenticated
- [ ] Vercel project imported from GitHub, env vars added, live URL shows the EMPIRE OS wordmark

Done when: the live Vercel link opens on the founder's phone.

## Phase 1: Design system and style guide

Read: `docs/DESIGN.md`, `design/screens/System.dc.html`.

- [x] Tokens in `app/globals.css` exactly as listed; fonts loaded with `next/font`
- [x] Components in `components/ui/`: Button (primary, secondary, quiet), Ticket, Stamp, Medallion, Chip, OptionTile, ProgressTicks, StatTile, Meter, BottomNav, Sheet
- [x] `/styleguide` page showing every component and state (default, hover, focus, disabled, done)
- [x] Playwright screenshot of `/styleguide` at 390px reviewed against `System.dc.html`; differences fixed

Done when: `/design-review styleguide` finds nothing from the blacklist.

## Phase 2: Database, security, mission library and plan engine

Read: `docs/PRODUCT.md` sections 5, 6 and 11.

- [ ] Migration with all student tables from section 11, RLS on each, owner-only reads, no direct writes to protected tables
- [ ] `mission_library` seeded with 120 missions (30 per pillar, at least 60% free and phone-only); content reviewed for safety and tone
- [x] `lib/game/`: XP, ranks, streaks, shields, Empire score, with unit tests
- [x] `lib/plan-engine/`: archetype mapping, daily selection, `previewPlan`, with unit tests covering every rule in section 6
- [x] Unit test: a Pune student with 30 minutes, free-only budget and no gym gets visibly different missions from a Bengaluru IT professional with 90 minutes, a flexible budget and gym access
- [ ] Server actions: `startSeason(answers)`, `completeMission(id)`, `skipMission(id, reason)`, `swapMission(id)`; each checks ownership and limits
- [ ] `scripts/rls-check.ts` (`npm run test:rls`) creates two test users in the dev project and proves neither can read or write the other's rows

Done when: `npm test` and `npm run test:rls` pass.

## Phase 3: The hook (landing to first mission)

Read: `docs/PRODUCT.md` section 3, `Main`, `Quiz` and `Reveal` screens.

- [x] Landing page matching `Main.dc.html`
- [x] 18+ check; "Under 18" stores nothing
- [x] Eleven quiz questions with progress ticks, back, auto-advance; answers in local state
- [x] Two reflection screens with true arithmetic
- [x] "Building your season" checklist using real answers
- [x] Archetype reveal from `previewPlan`, matching `Reveal.dc.html`
- [x] Oath press-and-hold with reduced-motion fallback
- [ ] Sign-up with email one-time code and Google; `startSeason` saves answers; HQ opens with mission 1 highlighted
- [ ] Events logged: `landing_view`, `quiz_start`, `quiz_step`, `quiz_complete`, `reveal_view`, `oath_done`, `signup_done`, `first_mission_done`
- [ ] Playwright test runs the whole funnel on a 390px viewport

Done when: landing to HQ takes under 3 minutes on the founder's phone, and two different answer sets give different archetypes, milestones and missions.

## Phase 4: The daily loop

Read: `docs/PRODUCT.md` sections 4 and 5, `HQ.dc.html`.

- [ ] HQ matching `HQ.dc.html`, with the mission-complete moment (stamp, XP count-up, vibration)
- [ ] Ticket detail sheet with Swap (once a day) and Skip with a reason
- [ ] Day-complete bonus and tomorrow teaser
- [ ] Path campaign map, Stats, Me (editing applies from tomorrow)
- [ ] Rank-up and streak milestone moments
- [ ] Web app manifest, icons, one-time install tip
- [ ] Founder-only "time travel" switch to simulate the next day (never visible to students)
- [ ] Playwright: complete three missions, refresh, progress stays; next day gives fresh missions without duplicates; a missed day resets the streak with the gentle message

Done when: the founder uses it for three days in a row without a bug.

## Phase 5: Trust layer and Founder HQ (before any real users)

Read: `docs/PRODUCT.md` sections 10 and 11, `docs/LAUNCH_CHECKLIST.md`.

- [ ] `/privacy` and `/terms` drafts written from what the app really does, marked "Draft, pending legal review", with placeholders [OPERATOR NAME], [CONTACT EMAIL], [GRIEVANCE CONTACT], [ADDRESS], [REFUND POLICY]
- [ ] Links in the landing footer, sign-up screen and Me
- [ ] Download my data (JSON) and Delete my account (type DELETE), both showing the true result
- [ ] `/security-check` run; every failure fixed; results recorded in `docs/LAUNCH_CHECKLIST.md`
- [ ] Founder HQ at `/founder` (roles table, server-written): funnel, Day-1/7/30 return, pillars, skips, paywall views, reservations, shares, referrals, launch checklist
- [ ] A normal user sees nothing at `/founder`

Done when: the founder can invite 10 friends without risking their data.

## Phase 6: Money and growth (reserve mode)

Read: `docs/PRODUCT.md` sections 2 and 7, `Pass.dc.html`, `Share.dc.html`.

- [ ] Reverse trial and Free limits enforced on the server
- [ ] Day-6 banner, paywall from every entry point, at most once a day uninvited
- [ ] Reserve mode with honest copy; reservations saved
- [ ] Four packs, locked for Free
- [ ] Four share card types as 1080 × 1920 PNGs via `next/og`, shared through the share sheet with a download fallback
- [ ] Referral links and rewards with limits and abuse checks
- [ ] Events: `paywall_view` (with source), `reserve_click`, `pack_locked_tap`, `share_card_created`, `share_click`, `referral_visit`, `referral_signup`, `referral_reward`

Done when: a test student drops to Free after day 7 (time travel), can't bypass limits by calling the server directly, and can share all four cards from a phone.

## Phase 7: College HQ

Read: `docs/PRODUCT.md` section 9, `College.dc.html`.

- [ ] Tables `orgs`, `org_admins`, `batches`, `batch_members` with RLS by organisation
- [ ] Join a batch with a code from Me or a link, with the consent screen; leaving works
- [ ] Students in a paid batch get Season Pass access for the batch's season dates
- [ ] College HQ overview matching `College.dc.html`: stat tiles, daily chart with table view and tooltips, need-a-nudge list, sections table, filters
- [ ] In-app reminder to a student who needs a nudge
- [ ] Weekly report page, printable and downloadable as PDF
- [ ] Founder can create an organisation, a batch and a TPO invite from Founder HQ
- [ ] RLS test: TPO of college A can't see college B; students who left are not visible

Done when: the founder can demo College HQ to a TPO on a laptop and a phone with a seeded sample batch.

## Phase 8: The War Room

Read: `docs/PRODUCT.md` section 8.

- [ ] Weekly review every 7 days and from Me
- [ ] Adaptation rules in the plan-engine config, with unit tests for each rule
- [ ] "What changed and why" screen with real numbers; low-week copy
- [ ] City or goal change regenerates future weeks only after confirmation; history, XP and rank unchanged
- [ ] Free students see the preview and one upgrade button

Done when: two test students with different completion patterns get visibly different next weeks.

## Phase 9: Website and search

Read: `docs/DESIGN.md` and "The website that converts" in the founder playbook (summarised in `START-HERE.md`).

- [ ] `/colleges` page: problem, College HQ screens, pilot offer, "Book a 20-minute demo" form saved to the database
- [ ] Titles, descriptions, share images, sitemap, robots
- [ ] PageSpeed Insights mobile score 90+ on `/` and `/colleges`; fixes made
- [ ] Two short guides students search for (for example a 90-day placement preparation plan)

Done when: the live site shares nicely on WhatsApp and scores 90+ on mobile.

## Phase 10: Live payments (only after Razorpay KYC and the Day-7 gate)

Read: `docs/PRODUCT.md` section 2. Gate: Day-7 return at 15% or more and real reservations.

- [ ] Founder adds Razorpay key id, key secret and webhook secret to Vercel and `.env.local`
- [ ] Server creates the Razorpay order with the price computed from the live founder count
- [ ] Checkout opens with the order id; server verifies the payment signature and that the payment is captured and the order paid before granting the pass
- [ ] Webhooks `payment.captured`, `payment.failed`, `order.paid` verified with the webhook secret; granting is idempotent
- [ ] Callback URL flow so checkout works inside Instagram's in-app browser
- [ ] Before paying: exact amount, "one-time, no auto-renewal", links to Terms and refund policy
- [ ] Reservation holders told in the app; receipt in Me
- [ ] Test mode: success, failure, closed checkout, repeated webhook, Instagram browser

Done when: only a server-verified payment unlocks the pass, and replays never grant twice.

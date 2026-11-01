# Handoff: read this first

Whoever works on EMPIRE OS next (Claude or Codex) starts here. It is rewritten at the end of every session by `/handoff`. History is in `docs/SESSION_LOG.md` and `git log`.

## Last updated

2026-11-01, by Codex (GPT-6). The founder approved polishing the GitHub repository presentation. The README is shorter, the College HQ preview is visible, and the main app screenshot is a clean phone viewport. Application workflows remain locally built, with live verification pending.

## Current phase and step

All ten phases are built. What's left is going live, which needs the founder's accounts. Status by phase (boxes in `docs/BUILD_PLAN.md`, unchanged today):

- Phase 0: 3 of 6. Supabase, its MCP server and Vercel wait on the founder.
- Phase 1: done, tagged `phase-1-done`.
- Phases 2 to 6: built and verified in local test mode. Open boxes need the real Supabase project (apply migrations, `npm run test:rls`, real sign-up and events).
- Phase 7 (College HQ): 6 of 8. Open: apply the migration on Supabase and run `npm run test:rls`.
- Phase 8 (War Room): 5 of 5, verified in local test mode; recheck on Supabase.
- Phase 9 (website): 3 of 4. Open: PageSpeed Insights on the live link (local Lighthouse 12 mobile: `/` 96, `/colleges` 94, guide 96; not rerun today).
- Phase 10 (payments): 5 of 8. Built behind a switch, tested against a stand-in Razorpay. Open: founder's keys, Razorpay test-mode run, Instagram in-app browser check. The gate still applies: Razorpay KYC, Day-7 return at 15% or more, and real reservations before turning payments on.
- No phase from 2 on is tagged yet: tags wait for each phase's "Done when" on the real Supabase project.

## What this session did

- Confirmed the clean `main` checkout matched the live GitHub branch, read the rulebook and handoff, then obtained the founder's approval before editing.
- Reworked `README.md`: gallery near the top, visible College HQ, four product differentiators, compact implementation/architecture/setup sections, and clear local-versus-live status. Preserved campaign-kit branding, ownership and license facts. No application route, service, migration or launch checkbox changed.
- Refreshed all six portfolio captures and visually reviewed them. `student-hq.png` now uses a 390 × 844 viewport after one mission, once the real medal notification has appeared and disappeared. The full-page design-review image remains available under ignored `test-results/portfolio`.
- Updated `docs/TESTING.md` and `docs/images/README.md` with current evidence and capture provenance. The README's old 195/57 counts are replaced by dated, accurate results. Browser integration was unavailable in this session; authenticated GitHub CLI access worked, and GitHub's Markdown renderer accepted the README.
- **Checks run 1 November:** lint, typecheck, **214 unit/database/service tests across 14 files**, `docs:check`, and all **12** existing portfolio journeys passed. After tightening the notification wait, the single HQ journey passed again. GitHub Markdown rendering and `git diff --check` passed. The full 58-scenario functional regression and production build were last recorded by Claude on 26 October; they were not rerun for this documentation/capture-only change. Hosted services, RLS, real devices and Lighthouse remain unverified this session.
- Presentation checkpoint: **`cd0d005`**, `[codex] Polish the repository overview and refresh app previews`, committed and pushed directly to `main` at `akhil-itpro/empire-os`. This handoff and the session-log entry have a separate `[codex]` checkpoint; no branch or pull request needs merging.

The previous implementation remains Claude's 26 October work: livelier HQ and twelve medals, Season 2 with retained XP/rank/medals and no second free week, Founder HQ sign-ups based on profile creation, boss feedback, export errors surfaced to the user, and Day 1 missions matching the reveal. Details and original checkpoints are in `docs/SESSION_LOG.md`.

## Next step

Founder review of the repository on a phone: sign in to GitHub, open https://github.com/akhil-itpro/empire-os, scroll through the README's three app screens and College HQ, then expand "See the season map and landing page". Tap images to inspect them. The repo is private; this is a portfolio review, not a live app link.

Then continue the existing phone review in local test mode (`docs/DEMO.md`): Day 1 (missions, +XP, medals, Day complete ticket), Stats medals, Me (code field, Download my data), and Season 2: Me, Founder tools, "+7 days" thirteen times, then HQ shows "Season 1 complete" and "Start Season 2".

When the founder has Supabase: apply all **nine** migrations in `supabase/migrations/`, regenerate types (compare with `lib/supabase/types.ts`), run `npm run test:rls`, then recheck Phases 2 to 10 on the real database, including the medal counts, `startNewSeason`, the Founder HQ sign-up query and a full data export. Decide financial-record retention with the founder's CA/lawyer before payments. Then Vercel deploy, PageSpeed on the live link, share a card and `/colleges` on WhatsApp, and tag phases whose "Done when" passes. Boundaries are in `docs/OPERATIONS.md` and `docs/SECURITY.md`.

## Waiting on the founder

- [ ] Revoke the Groq API key pasted into the chat on 2026-10-25 (Groq console, API Keys). It was not used or saved anywhere.
- [ ] Kickoff step 5: create the Supabase project `empire-os-dev` in South Asia (Mumbai), fill the three values into `.env.local`, and tell Claude the Project ID (not secret). Then `/mcp` to authenticate the Supabase MCP server.
- [ ] Kickoff step 6: import the repository into Vercel and add the same three variables, plus `NEXT_PUBLIC_SITE_URL` once there is a domain.
- [ ] Email codes: Supabase, Authentication, Email Templates, "Magic Link": include `{{ .Token }}`.
- [ ] Google sign-in: a Google Cloud OAuth client, added under Supabase Authentication, Providers, Google.
- [ ] After deploy: share a card from a real Android phone and iPhone; paste `/colleges` into WhatsApp to check the preview.
- [ ] Payments, only after Razorpay KYC and the Day-7 gate: add `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` (test-mode keys first) to `.env.local` and Vercel, set the webhook URL to `https://<site>/api/payments/webhook` with events `payment.captured`, `payment.failed`, `order.paid`, then `PAYMENTS_LIVE=1`.
- [ ] Fill the placeholders in `/privacy` and `/terms`: [OPERATOR NAME], [CONTACT EMAIL], [GRIEVANCE CONTACT], [ADDRESS], [REFUND POLICY]. A lawyer review is on the launch checklist.
- [ ] With a CA/lawyer: how long to keep payment records after an account is deleted (today they are deleted with it), and the retention process for college demo requests.

## Open questions

- Offered but not chosen: a rank ladder (tap the rank chip to see all six ranks).
- The "Season N complete" share card is offered while the finished season is current; after starting the next season it is no longer offered for the old one. Fine for now; a past-seasons list would need product approval.
- College HQ choices Claude made: a student is in one batch at a time; leaving deletes the membership (the college stops seeing them, and paid-batch access ends at that moment); the college sees first name plus an optional last-name initial; reminders only for students who missed 3+ days, one a day; "Mock interviews done" counts `car-18` and `pp-08`. Does a 30-day paid pilot give Season Pass? The founder decides per batch with "Paid batch".
- War Room choices: a review covers the latest finished week and can be done until the next one opens; schedule and budget changes apply from tomorrow; the focus pillar takes the third slot every day when it isn't in the top two.
- Payments: reservation holders keep ₹299 even after 500 founder places are taken; founder places = founder-price reservations or paid founder-price passes.
- Phase 6 questions still open (pack pillars, paywall once per device, reservations counting toward 500, repeat sign-up fingerprint, Day-90 certificate).
- AI: `docs/PRODUCT.md` keeps V1 free of AI calls. Any AI feature needs the founder's decision and a product-doc change first.

## Known problems

- The Supabase versions of College HQ, War Room, demo, payment, medal counts, `startNewSeason`, the new Founder HQ sign-up query and the stricter export compile but haven't run against a real database.
- Payment records reference profiles with `ON DELETE CASCADE` (`20261025140000_payments.sql`): waiting on the retention decision above. Demo requests aren't removed by student account deletion.
- npm skips the install script of `unrs-resolver` (npm 11 install-scripts allowlist). Lint works without it.
- Claude can't read `.env.local` (deny rule). `npm run test:rls` reports "Supabase isn't set up yet" until the founder fills it in.
- A guide page as a dynamic `[slug]` route hit an internal Next.js 16 dev error, so each guide is its own static page using `components/GuideArticle.tsx`.

## Notes for the next agent

- **Repository presentation:** `npm.cmd run screens:portfolio` now runs twelve existing onboarding/capture journeys (the Season 2 debrief adds the fifth screen journey). The curated HQ source is `hq-2-one-done-viewport.png`. Keep the wait for the medal notification to become visible before waiting for it to disappear; completion count alone is optimistic. Keep `caret: "initial"`.
- **Evidence dates:** the latest full browser regression/build are Claude's 26 October records; the 1 November checks covered lint, types, 214 unit tests/14 files, docs and portfolio journeys. Do not treat the portfolio capture run as all functional scenarios or a live service check.
- **Button sizing:** `cn()` (`lib/cn.ts`) only joins classes. Never pass a width, height or text size to `Button` in `className`; use `small` / `inline`. `tailwind-merge` was rejected: it drops `leading-*` when a later `text-[..]` size appears.
- **Seasons:** `profile.seasonNumber`/`seasonStart` are the current season. Stats and Path read from `seasonStart`; medals and XP read every season. Founder metrics must never use `season_start` as a sign-up date.
- **Medals:** rules in `lib/game/medals.ts`; server glue in `lib/server/medal-service.ts`. New medals for a mission are found by recomputing with that row still open.
- **Screenshots in tests:** always pass `caret: "initial"` to `page.screenshot`, or a shot during hydration triggers a test-only hydration warning.
- **Hidden previous screen:** Next.js keeps the last tab's DOM hidden. Scope text checks with `getByRole("main")` or use distinct wording (HQ says "Week 1 of 13: ...").
- **Animation keys** in `HqView` come from a module counter (`nextKey`), because the React compiler lint rejects `Date.now()` in render-scope helpers.
- **Documentation:** start at `docs/README.md`; `npm.cmd run docs:check` checks links/images; `npm.cmd run screens:portfolio` refreshes the six portfolio images (review before committing).
- **Local demo is memory, not PGlite:** PGlite only exercises SQL migrations in `tests/unit/db.test.ts`; browser local mode uses `MemoryStore`, lost on restart. `/api/test-login` creates a new pretend founder and replaces the current test identity.
- **Local test mode.** `EMPIRE_TEST_MODE=1` swaps Supabase for `lib/server/store-memory.ts` and a pretend sign-in. Playwright runs its own server on port 3100 (`.next-test`). Cookie `empire_test_payments=1` turns on the stand-in Razorpay. Don't run Playwright during a manual demo on `.next-test`.
- **Server logic** lives in `lib/server/*-service.ts` behind `SeasonStore` (`lib/server/store.ts`); actions are thin wrappers in `app/actions/`. Deps (`lib/server/deps.ts`): `{ store, now, payments }`.
- **Next.js 16:** `priority` on `next/image` is deprecated (use `fetchPriority`/`loading`); `dynamicParams` isn't allowed with Cache Components.
- **Shell quirk:** the Bash tool collapses `\\` (it turned `\s` into `s` once today) and chokes on apostrophes in long heredocs; use the file tools for such edits. On Windows use `npm.cmd`/`npx.cmd`; Playwright `--grep` with a space breaks through `npx.cmd`, so use `--grep=word`.
- **Browser tests:** wait for the server action's POST response before checking server data; every spec fails on console errors.
- GitHub remote `origin` is https://github.com/akhil-itpro/empire-os (private). Push after every commit.

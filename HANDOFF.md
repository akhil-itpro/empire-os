# Handoff: read this first

Whoever works on EMPIRE OS next (Claude or Codex) starts here. It is rewritten at the end of every session by `/handoff`. History is in `docs/SESSION_LOG.md` and `git log`.

## Last updated

2026-10-26 (afternoon), by Claude (Opus 5.5). Audit and polish session after Phase 10: bug fixes, a React patch update, a livelier HQ and twelve medals. All implementation phases remain locally built, with live verification pending.

## Current phase and step

All ten phases are built. What's left is going live, which needs the founder's accounts. Status by phase (boxes in `docs/BUILD_PLAN.md`, unchanged this session):

- Phase 0: 3 of 6. Supabase, its MCP server and Vercel wait on the founder.
- Phase 1: done, tagged `phase-1-done`.
- Phases 2 to 6: built and verified in local test mode. Open boxes need the real Supabase project (apply migrations, `npm run test:rls`, real sign-up and events).
- Phase 7 (College HQ): 6 of 8. Open: apply the migration on Supabase and run `npm run test:rls`.
- Phase 8 (War Room): 5 of 5, verified in local test mode; recheck on Supabase.
- Phase 9 (website): 3 of 4. Open: PageSpeed Insights on the live link (local Lighthouse 12 mobile: `/` 96, `/colleges` 94, guide 96; not rerun this session).
- Phase 10 (payments): 5 of 8. Built behind a switch, tested against a stand-in Razorpay. Open: founder's keys, Razorpay test-mode run, Instagram in-app browser check. The gate still applies: Razorpay KYC, Day-7 return at 15% or more, and real reservations before turning payments on.
- No phase from 2 on is tagged yet: tags wait for each phase's "Done when" on the real Supabase project.

## What this session did

The founder asked to fix bugs, update what's needed and make the app more entertaining. Reviewed Codex's two commits first (documentation plus a screenshot-helper fix; consistent with `CLAUDE.md`).

- **Bugs fixed:** (1) Back from the archetype reveal went to "Building your season", which bounced forward to the reveal again; Building now replaces itself in history (`QuizFlow.tsx`, covered in `funnel.spec.ts`). (2) The batch code field in Me, College season was squeezed to a sliver: `cn()` only joins classes, so `w-auto` lost to Button's `w-full`. Button now has `small` and `inline` options (`components/ui/Button.tsx`); the journal Save and founder-tool buttons use `small`. (3) Numbered lists showed "1 ." because Chrome draws markers with tabular digits; fixed with `marker:normal-nums` (install tip, guides).
- **Update:** React and React DOM 19.3.0 to 19.3.1 (patch). `npm audit`: 0 vulnerabilities. Major bumps (ESLint 10, TypeScript 7, @types/node 26) deliberately skipped.
- **Livelier HQ (founder approved):** "Week N of 13: theme. Act, name." under the day counter; "One mission today makes it N days in a row." when the streak is alive and nothing is done today; the XP gained rises next to the total; the plain day-complete box is now a "Day N complete" ticket with the bonus, streak and XP earned.
- **Medals (founder approved):** twelve medals worked out from real rows every time, never stored (`lib/game/medals.ts`, 12 unit tests; `lib/server/medal-service.ts`). Two new store methods: `countXp(userId, kind)` and `countWeeklyReviews(userId)` (memory and Supabase versions). `completeMission` returns `medals`; `completeBoss` returns `firstBoss`. Stats has a Medals section (`#medals`); HQ shows a tap-through note above the bottom bar plus "Medal earned" cards. Product, design, demo, testing and student docs updated.
- **Checks run on 26 Oct afternoon:** lint, typecheck, 208 unit tests (14 files), production build, `docs:check`, and all 57 functional browser scenarios plus the 4 screenshot journeys. Screens were inspected at 390px. Not rerun: hosted RLS/auth/payments, Lighthouse, real phones.
- Commits `faf954f` to `b3a1496`, then this handoff commit, all pushed to `origin/main`.

## Next step

Founder review on a phone in local test mode (steps in `docs/DEMO.md`): finish a mission (watch the +XP, the medal note), finish all three (Day 1 complete ticket), open Stats, Medals; use Me, Founder tools, +1 day to see the streak line on HQ. Then, when ready, build Season 2 (see Open questions) or go live.

When the founder has Supabase: apply all eight migrations in `supabase/migrations/` (no new migration this session), regenerate types (compare with `lib/supabase/types.ts`), run `npm run test:rls`, then recheck Phases 2 to 10 on the real database, including the two new count queries. Verify complete export/error behaviour before real users; decide financial-record retention with the founder's CA/lawyer before payments. Then Vercel deploy, PageSpeed on the live link, share a card and `/colleges` on WhatsApp, and tag phases whose "Done when" passes. Boundaries are in `docs/OPERATIONS.md` and `docs/SECURITY.md`.

## Waiting on the founder

- [ ] Revoke the Groq API key pasted into the chat on 2026-10-25 (Groq console, API Keys). It was not used or saved anywhere.
- [ ] Kickoff step 5: create the Supabase project `empire-os-dev` in South Asia (Mumbai), fill the three values into `.env.local`, and tell Claude the Project ID (not secret). Then `/mcp` to authenticate the Supabase MCP server.
- [ ] Kickoff step 6: import the repository into Vercel and add the same three variables, plus `NEXT_PUBLIC_SITE_URL` once there is a domain.
- [ ] Email codes: Supabase, Authentication, Email Templates, "Magic Link": include `{{ .Token }}`.
- [ ] Google sign-in: a Google Cloud OAuth client, added under Supabase Authentication, Providers, Google.
- [ ] After deploy: share a card from a real Android phone and iPhone; paste `/colleges` into WhatsApp to check the preview.
- [ ] Payments, only after Razorpay KYC and the Day-7 gate: add `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` (test-mode keys first) to `.env.local` and Vercel, set the webhook URL to `https://<site>/api/payments/webhook` with events `payment.captured`, `payment.failed`, `order.paid`, then `PAYMENTS_LIVE=1`.
- [ ] Fill the placeholders in `/privacy` and `/terms`: [OPERATOR NAME], [CONTACT EMAIL], [GRIEVANCE CONTACT], [ADDRESS], [REFUND POLICY]. A lawyer review is on the launch checklist.

## Open questions

- **Season 2 (not built):** after Day 90 HQ only says "Season N is complete. Well played." with a share button: a dead end. The founder chose not to build it this session but answered the rule for when it is built: keep XP, rank and medals; new 90 days from Day 1 with the same plan settings; no second free week (Free unless Season Pass). Medals already count every season (`FIRST_DAY` in `medal-service.ts`).
- Offered but not chosen this session: a rank ladder (tap the rank chip to see all six ranks).
- College HQ choices Claude made: a student is in one batch at a time; leaving deletes the membership (the college stops seeing them, and paid-batch access ends at that moment); the college sees first name plus an optional last-name initial; reminders only for students who missed 3+ days, one a day; "Mock interviews done" counts `car-18` and `pp-08`. Does a 30-day paid pilot give Season Pass? The founder decides per batch with "Paid batch".
- War Room choices: a review covers the latest finished week and can be done until the next one opens; schedule and budget changes apply from tomorrow; the focus pillar takes the third slot every day when it isn't in the top two.
- Payments: reservation holders keep ₹299 even after 500 founder places are taken; founder places = founder-price reservations or paid founder-price passes.
- Phase 6 questions still open (pack pillars, paywall once per device, reservations counting toward 500, repeat sign-up fingerprint, Day-90 certificate).
- AI: `docs/PRODUCT.md` keeps V1 free of AI calls. Any AI feature needs the founder's decision and a product-doc change first.

## Known problems

- During one screenshot run with two test browsers, the Next.js dev overlay showed "1 Issue" on Me once; the same journey alone, and the following full runs, were clean. It is dev-only (students never see the overlay) and matches the earlier note about an occasional dev hydration warning. Not reproduced, not fixed.
- The reveal's "Why this plan" uses a preview seed, so Day 1's real missions can differ from the preview by tie-breaks; the bullet matches `Reveal.dc.html` wording and was left as is.
- Boss completion doesn't show the rank-up moment if the +150 XP crosses a rank (the server returns `rankUp`; `WarRoomCards` doesn't use it). Small, not fixed.
- npm skips the install script of `unrs-resolver` (npm 11 install-scripts allowlist). Lint works without it.
- Claude can't read `.env.local` (deny rule). `npm run test:rls` reports "Supabase isn't set up yet" until the founder fills it in.
- The Supabase versions of the College HQ, War Room, demo, payment and the two new medal count methods compile but haven't run against a real database.
- A guide page as a dynamic `[slug]` route hit an internal Next.js 16 dev error, so each guide is its own static page using `components/GuideArticle.tsx`.
- Export completeness: `SupabaseSeasonStore.exportUser()` defaults several query errors/absent data to empty sections. Fix before real users.
- Payment records reference profiles with `ON DELETE CASCADE` (`20261025140000_payments.sql`). The founder and CA/lawyer decide retention before payments. Demo requests aren't removed by student account deletion; their retention process is also open.

## Notes for the next agent

- **Button sizing:** `cn()` (`lib/cn.ts`) only joins classes; it does not resolve Tailwind conflicts. Never pass a width, height or text size to `Button` in `className`; use `small` / `inline`. Adding `tailwind-merge` was rejected: it drops `leading-*` when a later `text-[..]` size appears, which would change layouts app-wide.
- **Medals:** rules and numbers in `lib/game/medals.ts` (`MEDALS`, `MEDAL_RULES`); server glue in `lib/server/medal-service.ts`. "New" medals for a mission are found by recomputing with that row still open. `MedalBadge` is a 36-tick `Medallion` (`components/ui/MedalBadge.tsx`).
- **Hidden previous screen:** Next.js keeps the last tab's DOM hidden. Text checks that could also match HQ (for example "Week 1: Set-up week") must be scoped with `getByRole("main")` or use different wording; HQ says "Week 1 of 13: ...".
- **Documentation:** start at `docs/README.md`; `npm.cmd run docs:check` checks authored links/images. `npm.cmd run screens:portfolio` refreshes the six portfolio images (not rerun this session, so `docs/images/student-hq.png` predates the new HQ lines).
- **Local demo is memory, not PGlite:** PGlite only exercises SQL migrations in `tests/unit/db.test.ts`; browser local mode uses `MemoryStore`, lost on restart. `/api/test-login` creates a new pretend founder and replaces the current test identity.
- **Local test mode.** `EMPIRE_TEST_MODE=1` swaps Supabase for `lib/server/store-memory.ts` and a pretend sign-in. Playwright runs its own server on port 3100 (`.next-test`). Cookie `empire_test_payments=1` turns on the stand-in Razorpay (test mode only). Don't run Playwright during a manual demo on `.next-test`.
- **Server logic** lives in `lib/server/*-service.ts` behind `SeasonStore` (`lib/server/store.ts`); actions are thin wrappers in `app/actions/`. Deps (`lib/server/deps.ts`): `{ store, now, payments }`.
- **Season Pass access** = `season_pass` or `batch` entitlements (`isPassLike`, `passCoversDate` in `lib/game/access.ts`). War Room adjustments are read by `weekAdjustments()` in `season-service.ts`.
- **Fonts:** Big Shoulders from `app/fonts/*.woff2`; Schibsted Grotesk from Google via `next/font`.
- **Next.js 16:** `priority` on `next/image` is deprecated (use `fetchPriority`/`loading`); `dynamicParams` isn't allowed with Cache Components.
- **Shell quirk:** the Bash tool collapses `\\` and chokes on apostrophes inside long heredocs; write such files with the file tool. On Windows use `npm.cmd`/`npx.cmd`.
- **Browser tests:** wait for the server action's POST response before checking server data; scope text checks with `getByRole("main")`; every spec fails on console errors.
- GitHub remote `origin` is https://github.com/akhil-itpro/empire-os (private). Push after every commit.

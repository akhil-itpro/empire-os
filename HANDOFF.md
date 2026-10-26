# Handoff: read this first

Whoever works on EMPIRE OS next (Claude or Codex) starts here. It is rewritten at the end of every session by `/handoff`. History is in `docs/SESSION_LOG.md` and `git log`.

## Last updated

2026-10-26, by Codex (GPT-6). Portfolio and documentation checkpoint after Phase 10; all implementation phases remain locally built, with live verification pending.

## Current phase and step

All ten phases are built. What's left is going live, which needs the founder's accounts. Status by phase (boxes in `docs/BUILD_PLAN.md`):

- Phase 0: 3 of 6. Supabase, its MCP server and Vercel wait on the founder.
- Phase 1: done, tagged `phase-1-done`.
- Phases 2 to 6: built and verified in local test mode. Open boxes need the real Supabase project (apply migrations, `npm run test:rls`, real sign-up and events).
- Phase 7 (College HQ): 6 of 8. Open: apply the migration on Supabase and run `npm run test:rls` (it now checks college isolation).
- Phase 8 (War Room): 5 of 5, verified in local test mode; recheck on Supabase.
- Phase 9 (website): 3 of 4. Open: PageSpeed Insights on the live link (local Lighthouse 12 mobile: `/` 96, `/colleges` 94, guide 96).
- Phase 10 (payments): 5 of 8. Built behind a switch and tested against a stand-in Razorpay. Open: founder's keys, Razorpay test-mode run, Instagram in-app browser check. The plan's gate still applies: Razorpay KYC, Day-7 return at 15% or more, and real reservations before turning payments on.
- No phase from 2 on is tagged yet: tags wait for each phase's "Done when" on the real Supabase project.

The founder approved a GitHub portfolio/documentation update for **EMPIRE OS in `D:\EmpireOS`**. It is saved on `main` in the existing private `akhil-itpro/empire-os` repository. No new application phase was started and no live setup/launch checkboxes were marked complete. Start the documentation at [docs/README.md](docs/README.md).

## What this session did

- Rebuilt `README.md` as a portfolio: campaign-kit SVG cover, six actual app screenshots, feature/status table, architecture diagram, account-free local setup and clear ownership/AI-assistance context. Updated the GitHub description and ten topics; the repository remains private, with no selected open-source license or public live-demo claim.
- Added a documentation hub, case study, business-value hypotheses, architecture, interfaces/API, setup, reviewer tour, testing evidence, operations, security, roadmap and student/college/founder manuals. Added contribution/private-reporting guides, GitHub issue/PR templates and a design-reference index. Original product/design/build/launch specifications remain authoritative.
- Added `npm.cmd run docs:check` (relative links, Markdown fragments and image paths without reading environment files) and `npm.cmd run screens:portfolio` (eleven existing funnel/capture journeys, six curated images). Provenance and refresh details are in `docs/images/README.md`.
- Fixed only the optional screenshot helper: wait for sample-creation success, open the current founder's membership-scoped batch list, wait for streamed headings/fonts, and add viewport captures for Path/War Room. The first combined run passed all 57 functional scenarios plus three capture journeys but failed the fourth capture by following an old batch link. The four captures passed after the correction, and the final portfolio command passed all eleven of its existing journeys.
- Checks on 26 Oct: 195 unit/database/service tests across 13 files; all 57 functional browser scenarios; corrected screenshot journeys; lint, typecheck, production build and documentation checks. Inspected the cover and all six screens, and rendered README through GitHub's Markdown API with no broken images. Hosted RLS/auth/payments, dependency audit, bundle scan, live Lighthouse and actual phone checks were not rerun. Details: `docs/TESTING.md`.
- Saved portfolio checkpoint `c069d4a` and pushed it to `origin/main`, followed by this handoff checkpoint. No application routes, services, schema, dependencies or provider accounts were changed. Source review identified launch follow-ups for export error reporting and payment/demo-request retention, recorded under Known problems and in the new security/operations guides.

## Next step

Founder review: open the GitHub README, then follow [docs/SETUP.md](docs/SETUP.md) and [docs/DEMO.md](docs/DEMO.md). For a local demo, set `EMPIRE_TEST_MODE=1`, `NEXT_PUBLIC_EMPIRE_TEST_MODE=1`, `EMPIRE_DIST_DIR=.next-test` in a fresh PowerShell terminal, then `npm.cmd run dev -- --port 3200`. For phone access use `npm.cmd run dev -- --hostname 0.0.0.0 --port 3200`, same private Wi-Fi, printed Network address, quiz/oath, then **Test sign-in (local test mode)**. Complete a mission and check Path/Stats/Me. Close the terminal after stopping to discard switches. Do not run Playwright concurrently with this demo because both use `.next-test`.

When the founder has Supabase: apply all eight migrations in `supabase/migrations/`, regenerate types (compare with the hand-written `lib/supabase/types.ts`), run `npm run test:rls`, then recheck Phases 2 to 10 on the real database and tick boxes. Verify complete export/error behavior before real users; decide financial-record retention with the founder's CA/lawyer before payments. Then Vercel deploy, PageSpeed on the live link, share a card and the `/colleges` link on WhatsApp, and tag phases whose "Done when" passes. Detailed boundaries are in `docs/OPERATIONS.md` and `docs/SECURITY.md`.

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

- College HQ choices Claude made: a student is in one batch at a time; leaving deletes the membership (the college stops seeing them, and paid-batch access ends at that moment); the college sees first name plus an optional last-name initial the student types at joining; reminders are allowed only for students who missed 3+ days, one a day; "Mock interviews done" counts finished mock-interview missions (`car-18`, `pp-08`). Does a 30-day paid pilot give students Season Pass? The founder decides per batch with the "Paid batch" box.
- War Room choices: a review covers the latest finished week and can be done until the next one opens; schedule and budget changes apply from tomorrow like Me edits; the focus pillar takes the third slot every day when it isn't in the top two.
- Payments: reservation holders keep ₹299 even after 500 founder places are taken; founder places = students with a founder-price reservation or a paid founder-price pass.
- Phase 6 questions from last session are still open (pack pillars, paywall once per device, reservations counting toward 500, repeat sign-ups fingerprint, Day-90 certificate).
- Portfolio scope is now clear and delivered: the founder asked for a Tvacha-style GitHub presentation and complete documentation for EMPIRE OS. This did not request a separate hosted personal portfolio website.
- AI: the founder offered a Groq key. `docs/PRODUCT.md` keeps V1 free of AI calls ("AI chat coach" is in "Not in V1"). Any AI feature needs the founder's decision and a product-doc change first.

## Known problems

- `npm run build` no longer warns about Big Shoulders fonts (they're local files now).
- npm skipped the install script of `unrs-resolver` (npm 11's install-scripts allowlist). Lint works without it.
- Claude can't read `.env.local` (deny rule). `npm run test:rls` reports "Supabase isn't set up yet" until the founder fills it in.
- The Supabase versions of the College HQ, War Room, demo and payment store methods compile but haven't run against a real database yet.
- A guide page under Next.js 16 as a dynamic `[slug]` route hit an internal Next.js error in dev ("instant validation ... bug in Next.js"), so each guide is its own static page using `components/GuideArticle.tsx`.
- Live export completeness needs a follow-up: `SupabaseSeasonStore.exportUser()` in `lib/server/store-supabase.ts` defaults several query errors/absent data to empty sections. A downloaded JSON file alone does not prove completeness. No runtime change was made in this documentation session.
- Payment records currently reference profiles with `ON DELETE CASCADE` (`20261025140000_payments.sql`), so account deletion removes them. The founder and CA/lawyer need to decide the retention policy before taking payments; then implementation and live deletion tests must match it. Public college-demo requests are contact-based and are not removed through student account deletion; their operator retention process is also open.
- Direct Chrome/Windows control was unavailable (native pipe unavailable). GitHub CLI/API verified publication; Playwright rendered the local application and README preview. This was not an actual-phone test. One capture run emitted a caret-style hydration warning; the subsequent corrected sequential capture runs completed without it.

## Notes for the next agent

- **Documentation:** read `docs/README.md`; `docs/TESTING.md` distinguishes current checks from the historical 25 Oct evidence. `npm.cmd run docs:check` checks the authored links/images. `npm.cmd run screens:portfolio` refreshes six synthetic-data images through the existing tests; stop manual demos first. The scripts add no dependencies. On this Windows shell use `npm.cmd`/`npx.cmd` when `.ps1` wrappers are blocked.
- **Local demo is memory, not PGlite:** PGlite only exercises SQL migrations in `tests/unit/db.test.ts`; the interactive/browser local mode uses `MemoryStore`. Restarting the dev server loses its records. `/api/test-login` creates a new pretend founder and replaces the current test identity, so use a separate private browser session for founder/college review.
- **Local test mode.** `EMPIRE_TEST_MODE=1` swaps Supabase for an in-memory store (`lib/server/store-memory.ts`) and a pretend sign-in. Playwright runs its own server on port 3100 (`.next-test`). The cookie `empire_test_payments=1` turns on a stand-in Razorpay (`lib/server/payments-fake.ts`, `/api/test-pay`), test mode only.
- **Server logic** lives in `lib/server/*-service.ts` behind `SeasonStore` (`lib/server/store.ts`): `college-service.ts` (+ pure `college-metrics.ts`, `college-sample.ts`), `war-room-service.ts`, `demo-service.ts`, `payment-service.ts` (+ `razorpay.ts`). Actions are thin wrappers in `app/actions/`.
- **Deps** (`lib/server/deps.ts`): `{ store, now, payments }`. `payments` is the Razorpay gateway when live, else null; services check it.
- **Season Pass access** = `season_pass` or `batch` entitlements (`isPassLike`, `passCoversDate` in `lib/game/access.ts`).
- **War Room adjustments** are stored in `weekly_reviews.adjustments` (`ReviewOutcome`) and read by `weekAdjustments()` in `season-service.ts` for the following week.
- **College HQ pages** are under `app/college/` (desktop layout with side menu, `CollegeShell.tsx`); the student join flow is `app/(app)/(tabs)/me/college/` and `app/(marketing)/join/[code]/`.
- **Fonts:** Big Shoulders comes from `app/fonts/*.woff2` (made from `assets/fonts` with `subset-font`; see `assets/fonts/README.md`). Schibsted Grotesk still comes from Google via `next/font`.
- **Images:** `next.config.ts` allows qualities 60 and 75 and serves AVIF first. `/colleges` screenshots are real sample-batch screens; refresh with `MARKETING_SHOTS=1 npx playwright test tests/e2e/marketing-shots.spec.ts`.
- **Next.js 16:** `priority` on `next/image` is deprecated (use `fetchPriority`/`loading`). `dynamicParams` isn't allowed with Cache Components. Link-preview bots (WhatsApp etc.) get metadata in the first response; browsers get it streamed.
- **Shell quirk:** the Bash tool collapses `\\` and chokes on apostrophes inside long heredocs; write such files with the file tool.
- **Browser tests:** wait for the server action's POST response before checking server data; scope text checks with `getByRole("main")`; every spec fails on console errors.
- GitHub remote `origin` is https://github.com/akhil-itpro/empire-os (private). Push after every commit.

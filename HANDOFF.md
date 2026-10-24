# Handoff: read this first

Whoever works on EMPIRE OS next (Claude or Codex) starts here. It is rewritten at the end of every session by `/handoff`. History is in `docs/SESSION_LOG.md` and `git log`.

## Last updated

2026-10-24, by Claude (Opus 5.5). Session paused at a clean point after Phase 6.

## Current phase and step

The founder approved building every phase back to back ("I want the complete app"), stopping only when they must act. Status by phase (boxes in `docs/BUILD_PLAN.md`):

- Phase 0: 3 of 6. Supabase, its MCP server and Vercel wait on the founder.
- Phase 1: done, tagged `phase-1-done`.
- Phase 2: 3 of 7. Written and tested locally; open boxes need the real Supabase project (apply migrations, seed, run actions for real, `npm run test:rls`).
- Phase 3: 7 of 10. Open: real sign-up, event logging check, full landing-to-HQ test on Supabase.
- Phase 4: 8 of 8, verified in local test mode; recheck on Supabase.
- Phase 5: 5 of 6 (verified in local test mode). Open: `/security-check` checks 1 to 3 on Supabase.
- Phase 6: 7 of 7, verified in local test mode. Not tagged: recheck on Supabase, and try the real share sheet on Android and iPhone after deploy.
- Phases 7 to 10: not started.

## What this session did

- Phase 6, in 6 commits from `01ec125` to `5378bef`, all pushed:
  - Four packs of 10 missions (`lib/plan-engine/packs.ts`), turned on from Path, preferred in their pillar, locked on Free.
  - Paywall `/pass` in reserve mode (prices from the server's founder count, reservations saved, no payment), opened from the day-6 banner, Free HQ, locked weeks, packs and Me, and uninvited once on the first visit after full access ends.
  - Four share cards as 1080 × 1920 PNGs (`app/api/share/[kind]/route.tsx`), with a share sheet and a save fallback, from Me, milestone moments and season end.
  - Invite links `/r/CODE` and rewards (7 days each on the friend's third active day, 5 per inviter, email-alias self-referrals blocked).
- Two migrations: `20261024163534_seed_mission_library_packs.sql` (generated) and `20261024170000_packs_and_rewards.sql`. `npm run test:rls` now also tries the Phase 6 cheats.
- Fixed the rank-up moment saying "a Operator". Made three browser tests wait for the server instead of the instant stamp; the suite then passed 5 runs in a row.
- Checks run at the end: 138 unit tests and 48 Playwright tests pass (2 screenshot tests skipped by design), lint and typecheck clean, `npm run build` passes.

## Next step

Phase 7 (College HQ): read `docs/PRODUCT.md` section 9 and `design/screens/College.dc.html`, plan, then build tables `orgs`, `org_admins`, `batches`, `batch_members` with RLS by organisation, joining with consent, batch access as Season Pass, the overview, nudges, the weekly report and founder setup. When the founder has Supabase ready, do that first: apply all five migrations, regenerate types, run `npm run test:rls`, recheck Phases 2 to 6.

## Waiting on the founder

- [ ] Kickoff step 5: create the Supabase project `empire-os-dev` in South Asia (Mumbai), fill the three values into `.env.local` (Claude created it from `.env.example`, values empty), and tell Claude the Project ID (not secret) for `.mcp.json`. Then `/mcp` to authenticate the Supabase MCP server.
- [ ] Kickoff step 6: import the repository into Vercel and add the same three environment variables.
- [ ] For email codes: in Supabase, Authentication, Email Templates, "Magic Link", include `{{ .Token }}` so the email shows a 6-digit code.
- [ ] For Google sign-in: a Google Cloud OAuth client, added under Supabase Authentication, Providers, Google.
- [ ] Confirm the five-line product summary Claude gave at kickoff step 2.
- [ ] After deploy: share a card from a real Android phone and a real iPhone.

## Open questions

- Phase 6 choices Claude made that the founder should confirm:
  - Pack pillars: Placement Prep is Career, Home Muscle is Body, Speak Like a Leader is Mind, ₹10K Savings Sprint is Money.
  - The paywall opens uninvited only once per device, on the first visit after full access ends (not daily).
  - In reserve mode, founder-price reservations count toward the first 500.
  - A friend still gets their 7 days when the inviter has used all 5 rewards.
  - "Repeat sign-ups": an account can be referred only once, at creation. Someone who deletes their account and signs up again with the same email can't be detected without keeping data after deletion; Claude didn't add that. Decide whether to keep a one-way fingerprint of rewarded emails (needs a privacy-policy line).
  - The paywall lists only built features. War Room joins the list when Phase 8 ships. The Day-90 certificate in `Pass.dc.html` isn't in any phase.
- The founder asked for "a portfolio as well". Unclear whether that means a personal portfolio website, a GitHub profile set up as a portfolio, or a feature inside EMPIRE OS. Asked twice; not answered yet.
- Git author name is "Akhil". If the founder wants their full name on commits, run `git config --global user.name "Full Name"`.

## Known problems

- `npm run build` prints two harmless warnings: "Failed to find font override values" for Big Shoulders and Big Shoulders Stencil.
- npm skipped the install script of `unrs-resolver` (npm 11's install-scripts allowlist). Lint works without it.
- Claude can't read `.env.local` (deny rule). `npm run test:rls` reports "Supabase isn't set up yet" until the founder fills it in.
- The invite link in Me shows as `/r/CODE` for a moment before the page is live, then as the full address.

## Notes for the next agent

- **Local test mode.** `EMPIRE_TEST_MODE=1` (only when NODE_ENV isn't production) swaps Supabase for an in-memory store (`lib/server/store-memory.ts`) and a pretend sign-in cookie. Playwright runs its own test-mode server on port 3100 with build folder `.next-test` (see `playwright.config.ts`), so `npm run dev` on 3000 stays real. `tests/unit/test-mode.test.ts` proves it's off in production.
- **Browser events in test mode** go to `app/api/test-event` (POST records, GET lists the signed-in test student's events); 404 outside test mode. The event list is `lib/analytics/events.ts`.
- **Server logic** lives in `lib/server/*-service.ts` behind the `SeasonStore` interface (`lib/server/store.ts`); `store-supabase.ts` is the real one. Server actions are thin wrappers in `app/actions/` (`growth.ts` for Phase 6). Every action reads the user from the session (`lib/server/session.ts`), never from the browser.
- **Access:** `fullAccessUntil` in `lib/game/access.ts` follows the trial and back-to-back grants; referral bonuses start when current access ends. Entitlement `source` is unique per user (idempotent grants; inviter rewards are `referral-reward:1` to `:5`).
- **Prices:** `lib/game/pass.ts` (`PAYMENTS_LIVE = false` until Phase 10). Paywall sources are whitelisted there.
- **Missions:** `MISSIONS` is the 120 base missions; `LIBRARY` and `LIBRARY_BY_ID` (`lib/plan-engine/library.ts`) add the 40 pack missions. After changing either file run `npm run gen:missions -- <name>` (a unit test checks the newest seed matches).
- **Share cards:** fonts are static TTFs in `assets/fonts/` (OFL), read by the route at start-up and traced into the build. Card kinds are in `lib/share/kinds.ts` (safe for browser code); don't import `lib/server/*` values into client components.
- **Time travel:** cookie `empire_time_travel` (whole days), honoured only for the founder role (or in test mode). `lib/server/deps.ts`.
- **Next.js 16 + Cache Components:** pages that read cookies or the clock render inside `<Suspense>` and call `await connection()` first (see `app/(app)/(tabs)/hq/page.tsx`). Client components that read localStorage use `useHydrated()` (`lib/use-hydrated.ts`). After adding a route, `npm run typecheck` regenerates route types.
- **Browser tests:** a stamp shows before the server saves; wait for the server action's POST response (`page.waitForResponse`) before checking server data or moving the clock. Next.js keeps the previous screen hidden for instant back, so scope text checks with `getByRole("main")`. Every spec fails on any browser console error; keep that pattern.
- **Database:** migrations in `supabase/migrations/` (5 files now); `tests/unit/db.test.ts` runs them on PGlite and proves RLS. `lib/supabase/types.ts` is hand-written; keep it in step with migrations.
- **Shell quirk:** the Bash tool here collapses `\\` to `\` inside commands; write files with backslashes (regexes) with the file tool or a quoted heredoc (`<<'EOF'`), not `node -e` strings.
- Fonts: `Big_Shoulders` and `Big_Shoulders_Stencil` with `opsz` 72 via the `font-display` and `font-stencil` utilities in `app/globals.css`.
- `next dev` maintains the Next.js block at the end of `AGENTS.md`; keep it and commit it. It also adds `.next-test` paths to `tsconfig.json`; that's expected.
- GitHub remote `origin` is https://github.com/akhil-itpro/empire-os (private). Push after every commit.
- UI components live in `components/ui/` and every one is shown on `/styleguide`. Hover styles use the custom `hov:` variant; focus rings are global.
- Screenshots: `SHOTS_DIR=<folder> npx playwright test tests/e2e/screens.spec.ts` (also the four-card test in `growth.spec.ts` saves the cards), or `node scripts/screenshot.mjs <route-without-slash> 390 <outDir>` against `npm run dev`.
- If `npm run dev` serves old styles after editing `app/globals.css`, stop it, delete `.next/dev` and start again.

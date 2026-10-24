# Handoff: read this first

Whoever works on EMPIRE OS next (Claude or Codex) starts here. It is rewritten at the end of every session by `/handoff`. History is in `docs/SESSION_LOG.md` and `git log`.

## Last updated

2026-10-24, by Claude (Opus 5.5). Session paused at a clean point after Phase 5.

## Current phase and step

The founder approved building every phase back to back ("I want the complete app"), stopping only when they must act. Status by phase (boxes in `docs/BUILD_PLAN.md`):

- Phase 0: 3 of 6. Supabase, its MCP server and Vercel wait on the founder.
- Phase 1: done, tagged `phase-1-done`.
- Phase 2: 3 of 7. Written and tested locally; open boxes need the real Supabase project (apply migrations, seed, run actions for real, `npm run test:rls`).
- Phase 3: 7 of 10. Open: real sign-up, event logging check, full landing-to-HQ test on Supabase.
- Phase 4: 8 of 8, verified in local test mode; recheck on Supabase.
- Phase 5: 5 of 6 (verified in local test mode). Open: `/security-check` checks 1 to 3 on Supabase (results so far in `docs/LAUNCH_CHECKLIST.md`).
- Phases 6 to 10: not started.

## What this session did

- Phases 1 to 5 as above, about 30 commits, all pushed. 105 unit tests and 35 Playwright tests pass; lint and typecheck clean; production build passes.
- Added local test mode, founder time travel, Founder HQ, the launch checklist table, privacy and terms drafts, export and delete.

## Next step

Phase 6 (money and growth, reserve mode): read `docs/PRODUCT.md` sections 2 and 7, `design/screens/Pass.dc.html` and `Share.dc.html`. Free limits are already enforced on the server (`chooseFreePillar`, `ensureToday`); still to build: the day-6 banner link to the paywall, the paywall sheet with reserve mode (new `reservations` writes and founder count), the four packs (40 missions, Pass only), share cards with `next/og`, and referrals (`/r/CODE`, rewards after 3 active days, caps). When the founder has Supabase ready, do that first: apply migrations, regenerate types, run `npm run test:rls`, recheck Phases 2 to 5.

## Waiting on the founder

- [ ] Kickoff step 5: create the Supabase project `empire-os-dev` in South Asia (Mumbai), fill the three values into `.env.local` (Claude created it from `.env.example`, values empty), and tell Claude the Project ID (not secret) for `.mcp.json`. Then `/mcp` to authenticate the Supabase MCP server.
- [ ] Kickoff step 6: import the repository into Vercel and add the same three environment variables.
- [ ] For email codes: in Supabase, Authentication, Email Templates, "Magic Link", include `{{ .Token }}` so the email shows a 6-digit code.
- [ ] For Google sign-in: a Google Cloud OAuth client, added under Supabase Authentication, Providers, Google.
- [ ] Confirm the five-line product summary Claude gave at kickoff step 2.

## Open questions

- The founder asked for "a portfolio as well". Unclear whether that means a personal portfolio website, a GitHub profile set up as a portfolio, or a feature inside EMPIRE OS. Asked twice; not answered yet.
- Git author name is "Akhil". If the founder wants their full name on commits, run `git config --global user.name "Full Name"`.

## Known problems

- `npm run build` prints two harmless warnings: "Failed to find font override values" for Big Shoulders and Big Shoulders Stencil.
- npm skipped the install script of `unrs-resolver` (npm 11's install-scripts allowlist). Lint works without it.
- Claude can't read `.env.local` (deny rule). `npm run test:rls` reports "Supabase isn't set up yet" until the founder fills it in.

## Notes for the next agent

- **Local test mode.** `EMPIRE_TEST_MODE=1` (only when NODE_ENV isn't production) swaps Supabase for an in-memory store (`lib/server/store-memory.ts`) and a pretend sign-in cookie. Playwright runs its own test-mode server on port 3100 with build folder `.next-test` (see `playwright.config.ts`), so `npm run dev` on 3000 stays real. `tests/unit/test-mode.test.ts` proves it's off in production.
- **Server logic** lives in `lib/server/season-service.ts` behind the `SeasonStore` interface (`lib/server/store.ts`); `store-supabase.ts` is the real one. Server actions are thin wrappers in `app/actions/`. Every action reads the user from the session (`lib/server/session.ts`), never from the browser.
- **Time travel:** cookie `empire_time_travel` (whole days), honoured only for the founder role (or in test mode). `lib/server/deps.ts`.
- **Next.js 16 + Cache Components:** pages that read cookies or the clock render inside `<Suspense>` and call `await connection()` first (see `app/(app)/(tabs)/hq/page.tsx`). Client components that read localStorage use `useHydrated()` (`lib/use-hydrated.ts`) to avoid hydration mismatches.
- **Database:** migrations in `supabase/migrations/`; the mission seed is generated (`npm run gen:missions`) from `lib/plan-engine/missions.ts`. `tests/unit/db.test.ts` runs the migrations on PGlite and proves RLS. `lib/supabase/types.ts` is hand-written; keep it in step with migrations.
- **Shell quirk:** the Bash tool here collapses `\\` to `\` inside commands and heredocs; write files with backslashes (regexes) with the file tool, not shell heredocs.
- Fonts: `Big_Shoulders` and `Big_Shoulders_Stencil` with `opsz` 72 via the `font-display` and `font-stencil` utilities in `app/globals.css`.
- `next dev` maintains the Next.js block at the end of `AGENTS.md`; keep it and commit it. It also adds `.next-test` paths to `tsconfig.json`; that's expected.
- GitHub remote `origin` is https://github.com/akhil-itpro/empire-os (private). Push after every commit.
- UI components live in `components/ui/` and every one is shown on `/styleguide`. Hover styles use the custom `hov:` variant; focus rings are global.
- Screenshots: `SHOTS_DIR=<folder> npx playwright test tests/e2e/screens.spec.ts`, or `node scripts/screenshot.mjs <route-without-slash> 390 <outDir>` against `npm run dev`.
- If `npm run dev` serves old styles after editing `app/globals.css`, stop it, delete `.next/dev` and start again.
- Every e2e spec fails on any browser console error; keep that pattern.

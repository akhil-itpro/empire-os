# Testing and verification

EMPIRE OS has domain/service tests, migration-backed database checks and browser scenarios. The local suites use synthetic data and run without a live Supabase project. The separate hosted isolation command requires configured development infrastructure.

[Documentation hub](README.md) · [Setup](SETUP.md) · [Reviewer tour](DEMO.md) · [Security](SECURITY.md)

## Current verification: 1 November 2026

The repository-presentation session ran these local checks:

| Check | Result | Scope |
| --- | --- | --- |
| `npm run lint` | Passed | Current working-tree ESLint check |
| `npm run typecheck` | Passed | Next.js route types and TypeScript |
| `npm test` | 214 passed across 14 files | Domain/service tests and PGlite migration checks |
| `npm run screens:portfolio` | 12 passed | Seven onboarding scenarios and five screenshot journeys; six gallery assets refreshed |
| `npm run docs:check` | Passed | Local Markdown links, heading fragments and image references |

The HQ capture now waits for the mission response, completion count, medal notification to appear and disappear, and fonts before saving the portfolio viewport. The viewport keeps fixed navigation at the bottom, with no transient notification covering a ticket. The original full-page design-review capture is also retained. No application routes, services or migrations changed.

The twelve-journey portfolio command passed, then the single HQ journey passed again after tightening the notification wait to require both appearance and disappearance. All six curated images were visually reviewed. GitHub's Markdown renderer also accepted the updated README.

The full functional browser regression and production build were not rerun for this documentation and capture-only change; their latest recorded results are below. The local documentation checker does not fetch external URLs, read environment-file contents or validate every Markdown construct. Reference-style links and anchors in non-Markdown targets are outside its scope. See the [handoff](../HANDOFF.md) and [session log](SESSION_LOG.md).

## Previous recorded evidence

Claude's late-afternoon [session log](SESSION_LOG.md) records these results on **26 October 2026**, after the Season 2 and export fixes:

| Check | Recorded result | Environment / limit |
| --- | --- | --- |
| `npm run lint` | Passed | ESLint against the local working tree |
| `npm run typecheck` | Passed | Next.js route type generation and TypeScript |
| `npm test` | 214 tests passed | Vitest, including PGlite migration tests and in-memory service tests |
| Functional browser scenarios | 58 passed plus screenshot journeys | Chromium at a 390 × 844 viewport, local test server |
| `npm run build` | Passed | Production compilation; not a live deployment |
| `npm run test:rls` | Pending real Supabase setup | Hosted users, RLS and college isolation still need verification |

These are dated repository records, not a claim that they were repeated whenever this file is read. The current session's actual rerun results belong in the handoff/session log and should be checked before relying on them. Earlier dependency-audit, browser-bundle and Lighthouse results remain historical unless explicitly rerun; they are not continuous monitoring or an independent security audit.

## Run the local checks

From the repository root, with Node.js 24 and dependencies installed:

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run docs:check
npm.cmd test
npx.cmd playwright install chromium
npm.cmd run test:e2e
npm.cmd run build
```

Install Chromium once before the first browser run, or when Playwright requests the matching browser version. `.cmd` avoids the Windows `npm.ps1` script restriction. No environment-file contents need to be opened or printed for these local checks.

The [Playwright configuration](../playwright.config.ts) starts a separate Next.js dev server on **port 3100** with `EMPIRE_TEST_MODE=1`, `NEXT_PUBLIC_EMPIRE_TEST_MODE=1` and output in `.next-test`. The manual demo uses port 3200 and the same ignored `.next-test` directory as shown in [setup](SETUP.md). Stop the manual demo before running Playwright, and finish Playwright before restarting the demo; these processes must not share the output directory concurrently. Local Playwright runs may reuse an existing server on 3100, so stop an unrelated server on that port before relying on the result.

## What each layer covers

| Layer | Implementation | What is exercised |
| --- | --- | --- |
| Domain rules | [tests/unit](../tests/unit/) | Quiz/archetypes, mission selection, time/budget/equipment constraints, XP, ranks, streaks, access, weekly adaptation and helper functions |
| Server services | Unit tests using [MemoryStore](../lib/server/store-memory.ts) and controlled clocks/gateways | Mission mutations, ownership checks, pass restrictions, reservations, referrals, college consent, payment verification/idempotency and other service branches |
| SQL and RLS | [db.test.ts](../tests/unit/db.test.ts) | Applies actual migration files to PGlite; recreates the Supabase roles and `auth.uid()` behavior needed by the tests; checks grants, row isolation, protected writes and seeded missions |
| Browser | [tests/e2e](../tests/e2e/) | Real rendered pages, server actions and route handlers using a local memory store and pretend sessions |
| Hosted isolation | [rls-check.ts](../scripts/rls-check.ts) | Uses actual Supabase clients and temporary identities/rows; requires a configured development project |

**Important distinction:** PGlite is used for migration tests. The interactive local demo and browser suite use an **in-memory application store**, not the PGlite database. Neither replaces verification of the hosted deployment.

### Browser scenarios

| Area | Relevant scenarios |
| --- | --- |
| Onboarding | Landing, adult age gate, eleven-question quiz, arithmetic reflections, archetype reveal, oath, reduced motion and invalid input |
| Daily loop | Three missions, first-task guidance, completion/stamps/bonus, refresh, undo from details, new-day selection, streak moments, swap and skip |
| App tabs | Thirteen-week Path, Free locks, Stats chart/table, saved private journal, future-effective plan edits, founder time travel, manifest/icons |
| Trust | Draft legal pages, authenticated JSON export, signed-out refusal, deletion confirmation, script/plain-text handling and input limits |
| Growth | Season Pass reserve mode, packs, generated share cards and referral behavior |
| College | Joining with consent, college scope, member visibility, reminders, reports, invites and leaving |
| Weekly review | Unlock on Day 7, lighter-week rules, change explanations and confirmation before applying a new plan |
| Payments | Closed/failed/successful stand-in checkout, receipt, duplicate webhook handling and forged-signature refusal |
| Presentation | Marketing pages, college demo form, style-guide/accessibility checks and optional screenshots |

Several browser suites fail on console errors or page errors and run Axe checks on selected screens. This is useful coverage, not a complete keyboard, screen-reader or real-device accessibility audit. Inspect each spec for the assertions actually made.

## Live database isolation check

After applying migrations to the intended development Supabase project and privately configuring its settings:

```powershell
npm.cmd run test:rls
```

This command is **not an offline test**. It creates throwaway students and college test fixtures, tries permitted and forbidden operations through authenticated clients, and performs cleanup. Use the intended development project and review the script before running it. A missing-configuration message means the hosted check did not run; it is not a security pass.

The founder/agent must separately verify live email/Google sign-in, provider configuration, persisted data after sign-out/sign-in, deployed callback/webhook handling and the remaining [launch gates](LAUNCH_CHECKLIST.md). Do not mark those boxes complete from an in-memory browser result.

## Capture design-review screenshots

The optional screenshot scenarios are skipped during the normal regression run. To run them using the existing Playwright server configuration:

```powershell
$env:SHOTS_DIR='test-results/portfolio-review'
npx.cmd playwright test tests/e2e/funnel.spec.ts tests/e2e/screens.spec.ts
Remove-Item Env:SHOTS_DIR
```

This captures the onboarding funnel plus HQ, Path, Stats, Me, Season Pass, College HQ and War Room sample journeys. A full-page image can be taller than the viewport. The fixture names, dates and totals are sample state. Compare final images visually before using them in documentation; a captured file alone does not establish good layout.

For the website's existing college images, `MARKETING_SHOTS=1` enables [marketing-shots.spec.ts](../tests/e2e/marketing-shots.spec.ts). That scenario writes to `public/colleges`, so run it deliberately and review the resulting changes. Documentation gallery provenance and any curated refresh command are recorded in [docs/images/README.md](images/README.md).

The older [scripts/screenshot.mjs](../scripts/screenshot.mjs) captures a single route from an already running server on port 3000. Its optional route argument omits the leading slash. It is a development utility, not an authenticated role tour.

## Test it on your phone

Use the exact [phone setup](SETUP.md#try-it-on-a-phone): start the dev server with both test switches and `--hostname 0.0.0.0 --port 3200`, connect to the same private Wi-Fi and open its printed Network address.

1. **Onboarding:** select **Find your archetype**, choose an adult age bracket and use the fictional Rahul answers in [DEMO.md](DEMO.md#1-build-a-season-before-sign-up). Check that the reveal explains the 45-minute/free/phone-only plan.
2. **Oath and save:** press and hold to take the oath, then select **Test sign-in (local test mode)**. HQ should open on Day 1 with three tickets.
3. **Completion:** mark one mission done. Check the stamp, count and XP, then refresh. Open its details and use **Undo, mark not done** if testing the reverse path.
4. **Day complete:** finish all three and confirm the **Day 1 complete** ticket with "All three missions done. Bonus +30 XP." Close a milestone/install prompt if shown.
5. **Navigation:** open **Path**, **Stats** and **Me**. Check that the chart's **Show as a table** control works and the bottom navigation remains usable without sideways page scrolling.
6. **Private journal:** save a fictional line in **One line for today** and refresh. Do not enter real private information in the memory demo.
7. **Tomorrow:** on Me, use **Founder tools → +1 day**, then open HQ. Expect Day 2 with a fresh mission set. Use **Today** to reset the clock.
8. **Weekly review:** from Day 1, advance six days with **+1 day** to Day 7 and open War Room. Choose **Too hard** and **Energy**, then **Set next week**. Read the explanation and reset to Today afterwards.
9. **Data controls:** under **Me → Privacy and data**, select **Download or delete my data** and download the sample JSON export. If desired, finish the disposable account tour by typing **DELETE** and confirming deletion; the browser should be signed out.
10. **Accessibility:** repeat core navigation with the phone's screen reader and reduced motion. Check readable labels, focus order, text size and reachable controls; record any problems instead of treating automated Axe results as a complete audit.

Phone testing is manual and remains separate from a 390-pixel Chromium test. On the intended HTTPS deployment, also verify home-screen installation, share sheet/download fallback, Android Chrome, iPhone Safari and the Instagram in-app payment return flow. Local HTTP/Wi-Fi behavior does not prove those hosted-origin features.

## Validation still needed

- Live Supabase auth/session behavior, deployed migrations, student/college RLS and provider configuration.
- Progress across real sign-out/sign-in and deployment/restart, not just a refresh of the memory store.
- Razorpay provider test-mode flows, webhook delivery/retries and the in-app browser callback on real devices.
- Real share-sheet/home-screen behavior, WhatsApp preview images and a broader accessibility review.
- Live performance measurements and operational recovery checks.
- Founder-approved operator/refund/legal content and business launch gates.

No new live service, real identity or payment is needed to review the local portfolio. See the [roadmap](ROADMAP.md), [operations guide](OPERATIONS.md) and [current handoff](../HANDOFF.md) for the next milestone.

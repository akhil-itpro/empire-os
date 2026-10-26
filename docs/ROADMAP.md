# Status and roadmap

[Project overview](../README.md) · [Documentation hub](README.md) · [Current handoff](../HANDOFF.md)

This roadmap separates implemented application behavior from live verification and future ideas. It does not start a new phase or replace the acceptance checks in [BUILD_PLAN.md](BUILD_PLAN.md).

## Implemented locally

| Area | Available behavior | Evidence to inspect |
| --- | --- | --- |
| First session | Adult check, 11-question quiz, archetype preview, oath and sign-up flow | [Funnel browser tests](../tests/e2e/funnel.spec.ts) |
| Planning and game rules | 120 core missions, four packs, constrained daily selection, XP, ranks, streaks and seven-day score | [Plan-engine tests](../tests/unit/plan-engine.test.ts), [game tests](../tests/unit/game.test.ts) |
| Student app | HQ, mission details, complete/undo/swap/skip, Path, Stats, Me and future plan edits | [Daily loop](../tests/e2e/daily-loop.spec.ts), [tabs](../tests/e2e/tabs.spec.ts) |
| Trust controls | Draft policies, data export, account deletion and founder access boundary | [Trust scenarios](../tests/e2e/trust.spec.ts), [founder scenarios](../tests/e2e/founder.spec.ts) |
| Growth and access | Seven-day trial, Free limits, reservations, story-sized cards, invite qualification and capped rewards | [Growth tests](../tests/e2e/growth.spec.ts) |
| College HQ | Founder setup, TPO invites, explicit student consent, batch access, nudges, reports and QR poster | [College tests](../tests/e2e/college.spec.ts) |
| Weekly review | War Room, next-week adjustments, explanations and confirmed plan proposals | [War Room tests](../tests/e2e/war-room.spec.ts) |
| Website | Landing, colleges offer/demo form, two guides, metadata and share images | [Website tests](../tests/e2e/website.spec.ts) |
| Payments | Server-created orders, signature/provider checks, callbacks, idempotent grants and receipts | [Payment unit tests](../tests/unit/payments.test.ts), [stand-in checkout scenarios](../tests/e2e/payments.spec.ts) |

The application has a local in-memory test store and pretend sign-in for development. It also has Supabase implementations and versioned SQL migrations. Local tests do not establish that a hosted Supabase project, Vercel deployment or Razorpay account is configured correctly. See [TESTING.md](TESTING.md) for dated evidence and limits.

## Next: verify the existing implementation live

The current handoff keeps this sequence ahead of additional features:

1. The founder creates/configures Supabase and enters credentials privately. Apply the existing migrations, compare generated database types with the checked-in types and run `npm run test:rls` against the development project.
2. Recheck real email-code and Google sign-in, account/session persistence, student operations, college isolation and export/deletion. Revisit the open phase checks only after their real acceptance conditions pass.
3. Configure Vercel with the required settings, verify the live build and inspect performance/share previews. Test the first session, install tip and actual share sheet on Android Chrome and iPhone Safari.
4. Complete the applicable operator, contact, legal and institutional launch gates before inviting the relevant audience. Legal pages currently contain labelled placeholders.
5. Keep payment collection off until the product's KYC, return and reservation gates are met. Repeat success, failure, closed checkout and replay cases with Razorpay test keys; test the callback in Instagram's in-app browser before live collection.

These are setup and acceptance tasks for built work. They are not evidence that the product is launched or ready to accept money. Detailed instructions belong in [SETUP.md](SETUP.md), [OPERATIONS.md](OPERATIONS.md) and [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md).

## Known limits and decisions still open

| Item | Current boundary |
| --- | --- |
| Real authentication, storage and database security | Provider configuration and live verification pending |
| Test-mode persistence | Records live in process memory and disappear when that server restarts |
| Payments | Reserve mode by default; provider test/production acceptance pending |
| College pilot entitlement | Founder must decide whether the 30-day pilot supplies Season Pass and configure the batch accordingly |
| “Mock interviews done” | Counts specific finished missions; does not verify interview quality or outcomes |
| Founder funnel | Event-based step counts are useful signals, not a guaranteed single-cohort conversion funnel |
| Device behavior | Browser automation does not replace actual install, vibration, native share or in-app browser checks |
| Day-90 certificate | Not implemented; excluded from the current Season Pass benefits |
| Accessibility | Designed targets and selected automated checks exist; complete real-device and assistive-technology review remains open |
| Business results | No verified customer, revenue, retention improvement or placement outcomes |

Other product choices recorded in [HANDOFF.md](../HANDOFF.md) remain decisions for the founder. This portfolio update does not resolve them by assumption.

## Deferred beyond V1

The product specification defers AI chat, a social feed/comments, user-to-user messaging, public photo uploads, live job scraping, bank integrations, automatic renewals, push/WhatsApp reminders, Hindi/Telugu UI and native apps. GCC fresher programmes are also a later market.

Any new feature or phase needs a founder decision and the corresponding specification/plan change. See [PRODUCT.md](PRODUCT.md) for the source scope and [BUSINESS_VALUE.md](BUSINESS_VALUE.md) for the validation plan.

# Security model and verification limits

EMPIRE OS protects student progress through server authorization, database policies and constrained writes. This document describes implemented boundaries and local evidence; it is not a security certification or a completed live audit.

[Architecture](ARCHITECTURE.md) · [API](API.md) · [Testing](TESTING.md) · [Operations](OPERATIONS.md) · [Report a finding](../SECURITY.md)

## Identity and privileged access

[`getSessionUserId()`](../lib/server/session.ts) reads the current identity from verified Supabase claims in live mode. Server actions do not accept a trusted student identity from the browser. [`proxy.ts`](../proxy.ts) refreshes sessions but does not replace page/action permission checks.

[`createSupabaseAdminClient()`](../lib/supabase/admin.ts) uses a server secret and is marked `server-only`. The application [`SeasonStore`](../lib/server/store.ts) adapter uses this privileged client, which **bypasses row-level security**. Services must therefore check ownership, college administration and founder roles themselves. A new method is not secure merely because its target table has RLS.

The publishable-key clients in [`lib/supabase/`](../lib/supabase/) operate with the signed-in session and database policies. The browser can insert permitted product events; it cannot directly grant XP, change computed mission state, assign roles or issue access entitlements.

## Database boundaries

Every public table introduced by the current migrations enables RLS. Policies and explicit revokes constrain anonymous and authenticated roles; database tests exercise those grants and policies under recreated Supabase roles.

| Data | Intended direct database access |
| --- | --- |
| Profile, progress, XP, entitlements, reviews and private journal | Student reads their own rows; protected changes go through server services |
| Mission library and packs | Signed-in read access; trusted seed/migration writes |
| College organizations, batches and membership | Organization administrators read their scope; students read their own membership |
| College member missions | Administrators see joined members' permitted mission rows within the batch season |
| Journal and quiz/profile details | Not exposed to college administrators by the college read policies |
| Invites, demo requests and launch checklist | No direct ordinary-client access; relevant server functions check their role |
| Payments | Students read their own rows; only trusted server code records/changes them |
| Events | Allowed bounded inserts; no direct client reads or updates |

The schema includes unique constraints for live mission slots, XP grant references, access grant sources and relevant payment identifiers. These reduce duplicate grants; live multi-step failure and retry behavior still needs validation.

## Input and link handling

Domain services validate identifiers, enumerated answers and bounded text rather than trusting client objects. Journal input strips control characters, requires a non-empty line and caps it at 280 characters. Account deletion requires `DELETE`. The auth callback restricts `next` to a same-site path rather than an external redirect.

College administrator invitations use 24 random bytes encoded in a URL-safe form; only a SHA-256 hash is stored. They expire after 14 days and can be claimed once. Batch join codes identify an invitation; they do not bypass sign-in, consent or membership checks. Treat administrator links as private credentials.

The public demo-request form has a honeypot, bounded fields, duplicate suppression and a global count limit. These are basic controls, not a substitute for deployment-level abuse monitoring or a guarantee against concurrent request floods.

## Payments

[`payment-service.ts`](../lib/server/payment-service.ts) computes prices on the server and stores orders against the authenticated user. Checkout confirmation checks order ownership and an HMAC-SHA256 signature. Redirect/webhook flows identify the stored order with a verified provider signature.

Finalization fetches the actual provider payment and order, checks captured/paid status, stored amount and INR currency, then grants access using an order-specific source. Webhooks verify the raw body signature before JSON handling. The fake gateway tests these branches locally; Razorpay test-mode and real delivery/browser behavior remain unverified.

## Local test-mode boundary

Server test mode requires `NODE_ENV !== "production"` and `EMPIRE_TEST_MODE=1`. It uses a process-memory store and deliberately simplified identity cookies. Test login, event and fake-payment handlers return 404 outside that server mode. The browser test flag only chooses its analytics path; it does not independently grant server access.

Never use test identities as a security model for real users or put test flags on a deployment. Production must also be checked for absent test routes and correct live permissions.

## Privacy boundaries

The [product specification](PRODUCT.md) limits collection to the stated student plan/activity fields and optional private journal. It excludes precise location, health details, government identifiers and banking/card information. Payment-provider IDs and amounts are stored; the application does not implement card/UPI credential collection.

Share cards are generated from earned progress and default to initials. They omit email, city and journal text. Account-linked events are unlinked when the account is deleted. This design does not by itself prove a complete privacy/legal review; operator contacts, policies and retention decisions remain launch requirements.

## Evidence and open checks

[`tests/unit/db.test.ts`](../tests/unit/db.test.ts) applies the actual migration files to PGlite and tests RLS, student isolation, protected writes, college isolation, leaving, event constraints and payment-row protection. Unit services and browser scenarios also test unauthorized operations and provider stand-ins. These are part of the normal local suite, not a live Supabase audit.

The **25 Oct 2026 handoff** reports 195 unit tests and 57 browser tests passing, plus lint, typecheck and build; five screenshot scenarios were skipped intentionally. The [testing guide](TESTING.md) records newer runs when available. Historical dependency-audit and bundle-scan results in the [launch checklist](LAUNCH_CHECKLIST.md) must not be presented as newly rerun evidence.

Before real students or colleges:

1. Apply migrations on the intended Supabase project, compare schema types, run the two-user `npm.cmd run test:rls` script and inspect Security Advisor. The script creates and deletes disposable accounts/data; it is an integration test, not a read-only probe.
2. Verify role denial and student/college isolation through the live app and direct publishable-key requests. Verify live sign-in, export, deletion and absent test routes.
3. Rebuild and inspect browser assets for server secrets, review dependencies, and test input/CSRF/session behavior on the deployed origin.
4. Verify actual provider success, failure, forged response, incorrect amount, repeated/delayed webhook and in-app-browser flow before enabling payments.
5. Confirm backups, restore steps, operator contact details and the founder's launch/professional-review gates.

## Known implementation follow-ups

- Several live export queries return empty sections on missing/error results without surfacing query errors. Verify completeness and improve error reporting before launch.
- Payment rows cascade with student deletion. Decide and implement financial-record retention with the founder's CA/lawyer before taking money; do not assume the current behavior meets those obligations.
- Anonymous college-demo requests are not account-linked; define their retention and operator handling before collecting real inquiries.
- Service writes are privileged and often span multiple store operations. Review partial failures, concurrency and retries against the real database/provider; local idempotency tests do not establish every distributed failure mode.

No launch gates are ticked by writing this guide. Use the [launch checklist](LAUNCH_CHECKLIST.md) and record only checks actually performed.

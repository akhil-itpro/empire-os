# Application interfaces

EMPIRE OS uses Next.js server actions for most mutations. It does not expose a general public REST API for mission, profile or college CRUD operations. This reference describes the implemented routes and internal action boundaries for reviewers and maintainers.

[Architecture](ARCHITECTURE.md) · [Security](SECURITY.md) · [Operations](OPERATIONS.md) · [Testing](TESTING.md)

Live-provider behavior is pending verification. Example paths below are relative to a local or configured site; no production URL is claimed.

## HTTP route handlers

| Method and path | Purpose | Authorization / result |
| --- | --- | --- |
| `GET /auth/callback` | Exchange the Google sign-in `code` for a Supabase session | Redirects to an allowed same-site `next` path, default `/hq`; missing/failed code returns `/login?error=google` |
| `GET /me/data/export` | Download the current user's data as JSON | Signed-in session required; 401 JSON error when signed out; attachment `empire-os-my-data.json` with `Cache-Control: no-store` |
| `GET /api/share/[kind]` | Render an earned 1080 × 1920 PNG story card | Signed-in session required (401); invalid/unearned card or absent season returns 404; successful response is private and not stored in shared caches |
| `POST /api/payments/callback` | Receive a signed redirect-checkout result | Uses the stored order and verified provider signature rather than relying on a cross-site session cookie; 303 redirect to `/pass?paid=1` or `/pass?payment=failed` |
| `POST /api/payments/webhook` | Process a provider webhook | Raw-body HMAC verification; documented responses below |

Implementations: [auth callback](../app/auth/callback/route.ts), [export](../app/(app)/(tabs)/me/data/export/route.ts), [share cards](../app/api/share/[kind]/route.tsx), [payment callback](../app/api/payments/callback/route.ts), [webhook](../app/api/payments/webhook/route.ts).

### Share cards

Supported kinds are `archetype`, `rank`, `streak-7`, `streak-30`, `streak-60`, `streak-90` and `season`. The server calculates availability from the current user's stored progress. A request cannot choose an arbitrary name, XP total or achieved streak.

Cards use initials unless the student chooses their first name. They include a referral link and selected progress; they exclude email, city and private journal text. See [`share-service.ts`](../lib/server/share-service.ts).

### Export contents and limitation

The export contains `exported_at` plus implemented sections for login metadata, profile, stats, missions, XP, entitlements, weekly reviews, journal, reservations, payments, referrals, events, batch membership and nudges. It contains personal data: keep downloaded exports private and use synthetic data in bug reports.

The live adapter currently defaults several failed/absent query results to empty arrays without surfacing query errors. Verify complete populated exports on Supabase before launch; a successful download alone does not establish completeness. See [operations](OPERATIONS.md).

### Payment redirect input

The callback accepts form fields `razorpay_order_id`, `razorpay_payment_id` and `razorpay_signature`. Route parsing caps each string at 200 characters; the service then validates identifiers and the 64-character lowercase hex signature. It checks the signature and retrieves the actual order/payment before granting access.

The endpoint does not accept a trusted price, grant duration or user ID from the form. The stored order associates the payment with its student.

### Payment webhook

The route reads the raw body and `X-Razorpay-Signature`. Its string-length guard returns 413 for more than 100,000 characters; this is not a streaming byte-limit guarantee. Signature validation happens in the service before JSON processing.

| Condition | HTTP status | JSON `handled` |
| --- | --- | --- |
| Gateway disabled | 503 | `payments_off` |
| Signature missing or invalid | 400 | `bad_signature` |
| Signed body is not valid JSON | 400 | `bad_json` |
| Unsupported payload, unknown order or unhandled event | 200 | `ignored` |
| Known failed payment | 200 | `failed` |
| Captured payment verified and access newly granted | 200 | `granted` |
| Previously granted order processed again | 200 | `already_granted` |
| Provider data does not satisfy verification | 200 | `not_verified` |

The JSON response also includes `ok`, which reflects whether the service returned status 200. Acknowledged/ignored does not mean a payment or pass was accepted. Accepted event names are `payment.captured`, `order.paid` and `payment.failed`; a successful finalization also needs the relevant payment identifier.

[`payment-service.ts`](../lib/server/payment-service.ts) verifies a captured INR payment, matching stored amount, matching order and paid remote order. Entitlements use `payment:<orderId>` as their grant source so replays cannot create duplicate access.

## Server actions

These are application functions compiled into the Next.js action protocol, not stable REST paths. Call them through the app and treat their serialized inputs as untrusted. Do not document or depend on generated action IDs.

| Module | Actions | Boundary |
| --- | --- | --- |
| [`season.ts`](../app/actions/season.ts) | `startSeason`, `completeMission`, `undoMission`, `skipMission`, `swapMission`, `chooseFreePillar` | Session identity; service checks assignment ownership, day, status and access |
| [`growth.ts`](../app/actions/growth.ts) | `reservePass`, `setPack`, `setShareName` | Session identity; reservation/access/pack/name-choice validation |
| [`me.ts`](../app/actions/me.ts) | `updateSettings`, `saveJournal` | Allowed settings only; changes start tomorrow; journal length and profile checks |
| [`war-room.ts`](../app/actions/war-room.ts) | `submitReview`, `decideProposal`, `completeBoss` | Current review/boss eligibility, access and validated answers |
| [`college.ts`](../app/actions/college.ts) | `joinBatch`, `leaveBatch`, `dismissNudge`, `acceptInvite`, `sendNudge`, `createOrg`, `createBatch`, `createTpoInvite`, `createSampleBatch` | Student membership consent, organization rights or founder role as appropriate |
| [`payments.ts`](../app/actions/payments.ts) | `startCheckout`, `confirmPayment` | Session identity; server-computed price; payment ownership and provider verification |
| [`founder.ts`](../app/actions/founder.ts) | `setChecklistItem` | Founder role and known checklist item |
| [`account.ts`](../app/actions/account.ts) | `deleteAccount` | Current session and exact `DELETE` confirmation; checks whether the login/profile remains |
| [`auth.ts`](../app/actions/auth.ts) | `signOut`, `setTimeTravel`, `testSignIn` | Time travel is founder-only in live mode; pretend sign-in is test-mode-only |
| [`demo.ts`](../app/actions/demo.ts) | `bookDemo` | Public validated form; honeypot, per-email duplicate suppression and global request limit |

Most domain actions return `{ ok: true, data: ... }` or `{ ok: false, error, message }`; they return a `signed_out` result when the session is absent. Account/demo/auth actions have smaller return shapes or redirect. Errors thrown by provider/database adapters remain server errors; do not assume every failed operation becomes a domain result.

The demo form requires name, role, college, city, work email and batch size; phone/note are optional. The service accepts at most one saved request per email in 24 hours and 30 requests globally per hour. These database count checks are basic flood protection, not a claim of comprehensive abuse prevention.

## Local test routes

| Method and path | Test behavior |
| --- | --- |
| `GET /api/test-login` | Create a pretend founder identity, set the test cookie, redirect to `/founder` |
| `POST /api/test-pay` | Simulate checkout with JSON `{ orderId, outcome }`; `outcome: "fail"` selects failure |
| `POST /api/test-event` | Record an allowed analytics event and bounded scalar properties in the memory store; returns 204 |
| `GET /api/test-event` | Return the current test student's recorded events; signed-out test users get an empty list |

All four behaviors are guarded by server `TEST_MODE`: a development process with `EMPIRE_TEST_MODE=1`. They return 404 outside that mode, including production builds. Test endpoints intentionally simplify identity and payment behavior; never use them to claim live-provider verification.

## Pages that act as handoff links

`/r/[code]` carries a referral to sign-up. `/join/[code]` previews a batch before joining; the authenticated action still requires consent and validates membership. `/college/invite/[token]` accepts a one-time college-administrator invitation after sign-in. These page routes are not anonymous APIs for reading student records or granting membership.

For click-by-click workflows, use the [reviewer tour](DEMO.md) and [role manuals](README.md).

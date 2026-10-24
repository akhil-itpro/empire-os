# EMPIRE OS

EMPIRE OS turns a student's next 90 days into a game "season": three short daily missions across Career, Body, Mind and Money, with XP, ranks, streaks and a plan that adapts every week. Students use it; engineering colleges (training and placement cells) pay for whole batches; individuals can buy a Season Pass.

## Who you are working with

The founder is non-technical and learning. Always:

- Explain decisions in plain English, one or two sentences, no jargon without a definition.
- Plan before editing. For any change bigger than a small fix, show the plan and wait for approval.
- Finish every task with: what is done, what is a placeholder, what failed, and exact steps to test it on a phone.
- Never install a paid service or add a new external account without asking first.
- Never ask the founder to paste a secret key into the chat. Secrets go only into `.env.local` (and Vercel), typed by the founder.

## Read these when relevant

- `docs/PRODUCT.md`: users, flows, game rules, money model, College HQ, data and honesty rules.
- `docs/DESIGN.md`: the "campaign kit" look: tokens, type, components, motion, copy voice, chart rules.
- `docs/BUILD_PLAN.md`: the phases, in order, with "Done when" checks. Work one phase at a time.
- `docs/LAUNCH_CHECKLIST.md`: what must be true before real users and before payments.
- `design/screens/*.dc.html`: reference markup for each designed screen (layouts, exact styles, copy). Match them.

## Stack

- Next.js (App Router) with TypeScript in strict mode. Tailwind CSS with the tokens from `docs/DESIGN.md`.
- Supabase for login (email one-time code and Google), Postgres with row-level security, and the dev database through the Supabase MCP server.
- `motion` for the few animations, `lucide-react` for icons, `next/og` for share images.
- Vitest for unit tests (game rules, plan engine). Playwright for end-to-end tests and screenshots.
- Vercel for hosting. Razorpay for payments, only in the payments phase.
- Use current stable versions. If an API looks different from what you remember, check the official docs before guessing.

## Commands (keep these working)

- `npm run dev`: local app at http://localhost:3000
- `npm run lint`, `npm run typecheck`: must pass before every commit
- `npm test`: unit tests. `npm run test:e2e`: Playwright. `npm run test:rls`: two-user security check

## Where things go

- `app/`: routes. Student app under `app/(app)/`, marketing pages under `app/(marketing)/`, College HQ under `app/college/`, Founder HQ under `app/founder/`.
- `components/ui/`: design-system components (Button, Ticket, Medallion, Stamp, Chip, ProgressTicks, BottomNav, Sheet, StatTile).
- `lib/game/`: XP, ranks, streaks, Empire score. Pure functions with unit tests.
- `lib/plan-engine/`: archetype, daily mission selection, weekly adaptation. Pure functions with unit tests.
- `lib/supabase/`: server and browser clients. The secret key is used only in server code.
- `supabase/migrations/`: one new SQL file per change. Never edit an old migration.
- `tests/unit/`, `tests/e2e/`, `scripts/`.

## Rules that are never broken

**Security**
- Every table with personal data has row-level security from the migration that creates it. Users read only their own rows.
- Users never write XP, streaks, ranks, mission status, trial dates, passes, referral rewards or roles directly. Those change only in server code that checks the signed-in user, validates input, then writes with the secret key.
- Never trust a user id, price or plan sent from the browser. Read the user from the session; compute prices on the server.
- The secret key and payment secrets never appear in client code or in any `NEXT_PUBLIC_` variable.
- Limit and escape all text input. No `dangerouslySetInnerHTML` with user content.

**Data**
- Collect only what `docs/PRODUCT.md` lists. Never collect exact income, bank or card data, government IDs, health conditions, photos, contacts, precise location, religion, caste, politics or sexuality.
- No ad pixels, session recording or third-party trackers. Analytics is our own `events` table.

**Honesty (India bans dark patterns)**
- No fake countdowns, fake scarcity, fake user counts, fake reviews or invented statistics.
- The decline option is always clear and neutral ("Maybe later"), never a guilt trip.
- No pre-ticked boxes, hidden charges or surprise renewals. Show the full rupee price before payment.
- Missions are general habits, not medical, financial or legal advice. Never promise results.
- Never say a feature works if it isn't built. Placeholders are labelled as placeholders.

**Design**
- Follow `docs/DESIGN.md` exactly. No component-kit default look, no generic dashboard styling.
- Mobile first at 390px wide. Tap targets at least 44px. Text contrast at least 4.5:1. Respect reduced motion.

**Workflow**
- One phase at a time, in order. Small steps, one commit each, tests passing.
- Before real users: commit to `main`. After the first real users: one branch per phase, check the Vercel preview, then merge.
- Tick a box in `docs/BUILD_PLAN.md` only after you verified it for real.
- When unsure about the product, ask the founder one clear question instead of guessing.

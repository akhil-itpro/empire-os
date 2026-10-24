# EMPIRE OS

**Turn your next 90 days into a season.** Three short missions a day across Career, Body, Mind and Money, planned around your timetable, budget and free time, with XP, ranks, streaks and a plan that adapts every week.

Built for students and freshers in India (18 to 28), and for the engineering-college training and placement cells that want their batches to stay consistent through placement season.

## Status

**Active build: Phases 1 to 6 built; waiting on the database and hosting accounts to go live.** Built and tested in a browser (with a local stand-in database): the design system, the quiz and archetype reveal, the plan engine with 120 missions plus four 10-mission packs, the daily loop (HQ, mission stamp, swap and skip, Path, Stats, Me), privacy and terms drafts, data export and delete, Founder HQ, the Season Pass paywall in reserve mode (no payment is taken), share cards and invite links with rewards. Not live yet: real sign-in and data storage (needs the Supabase project), the website on Vercel, College HQ, the War Room and payments. Verified progress is ticked in [`docs/BUILD_PLAN.md`](docs/BUILD_PLAN.md).

## What it will do

- **A plan made for you in under 3 minutes.** An 11-question quiz gives you an archetype (The Grinder, The Climber, The Founder and others), a three-act season and your first mission, before you sign up.
- **The daily loop.** Three mission "tickets" a day that fit your free minutes, budget and equipment. Mark one done and it gets stamped and your XP counts up. Streaks, ranks from Rookie to Legend, and a 7-day Empire score.
- **A deterministic plan engine.** Missions are picked by clear rules (pillar priority, time, cost, gym and laptop access, act, difficulty, no repeats within 5 days), not by an AI call, so every plan is explainable and testable.
- **The War Room.** A 60-second weekly review that makes next week easier, harder or cheaper, and says what changed and why in plain words.
- **College HQ.** A dashboard for training and placement officers: who is active, who needs a nudge, section by section, with a printable weekly report. Students opt in, and colleges only ever see their own consenting students.
- **Honest by design.** No fake countdowns, fake scarcity or invented numbers; a clear "Maybe later" on every offer; no ad trackers; export and delete your data any time.

## Tech stack

| Area | Choice |
| --- | --- |
| App | Next.js 16 (App Router), React 19, TypeScript in strict mode |
| Styling | Tailwind CSS 4 with a custom "campaign kit" design system |
| Data and login | Supabase: Postgres with row-level security on every personal table, email one-time code and Google sign-in |
| Testing | Vitest for game rules and the plan engine, Playwright for end-to-end tests at phone size |
| Hosting | Vercel |
| Payments (later) | Razorpay, verified on the server only |

## How it's built

EMPIRE OS is built by a non-technical founder working with AI coding agents: Claude Code most of the time, and OpenAI Codex as a backup. The work follows a written process:

- **A phased plan** ([`docs/BUILD_PLAN.md`](docs/BUILD_PLAN.md)): eleven phases (0 to 10), each with "Done when" checks, worked one at a time. A box is ticked only after it was verified for real.
- **Written rules for the agents** ([`CLAUDE.md`](CLAUDE.md), [`AGENTS.md`](AGENTS.md)): security, privacy, honesty and design rules that are never broken.
- **A clean handoff between agents** ([`HANDOFF.md`](HANDOFF.md), [`docs/SESSION_LOG.md`](docs/SESSION_LOG.md)): every session ends with a commit, a status note and a log entry, so either agent can continue without guessing.
- **Specs before code**: the product spec ([`docs/PRODUCT.md`](docs/PRODUCT.md)), the design system ([`docs/DESIGN.md`](docs/DESIGN.md)) and reference screens ([`design/screens/`](design/screens/)).

## Project layout

```
app/                 routes (student app, marketing pages, College HQ, Founder HQ)
components/ui/       design-system components
lib/game/            XP, ranks, streaks, Empire score (pure functions, unit tested)
lib/plan-engine/     archetypes, daily missions, weekly adaptation (pure functions, unit tested)
supabase/migrations/ database changes, with row-level security in the same file
tests/               unit and end-to-end tests
docs/                product spec, design system, build plan, launch checklist
design/screens/      reference markup for each designed screen
```

Folders appear as their phase is built.

## Run it locally

Needs Node.js 24.

```
npm install
npm run dev          # http://localhost:3000
npm run lint
npm run typecheck
npm test             # unit tests
npm run test:e2e     # Playwright, 390 x 844
```

Supabase settings go in `.env.local` (copy `.env.example`; never commit it).

## Contributing

This is a private product in active development, so outside contributions aren't open yet. If you're a founder working on the project, start with [`START-HERE.md`](START-HERE.md).

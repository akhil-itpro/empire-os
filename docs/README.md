# EMPIRE OS documentation

EMPIRE OS turns a student's next 90 days into a season of small daily missions. The application is implemented locally; hosted Supabase, authentication, Vercel and payment-provider checks are still pending. Start with [HANDOFF](../HANDOFF.md) for the latest state.

## Choose a starting point

| You want to… | Start here | Then read |
| --- | --- | --- |
| Review the portfolio | [Visual overview](../README.md) | [Case study](CASE_STUDY.md), [actual screens](images/README.md) |
| Try it without accounts | [Local setup](SETUP.md) | [Guided reviewer tour](DEMO.md) |
| Understand the product | [Product specification](PRODUCT.md) | [Business value](BUSINESS_VALUE.md), [roadmap](ROADMAP.md) |
| Understand the implementation | [Architecture](ARCHITECTURE.md) | [API reference](API.md), [security](SECURITY.md) |
| Verify behavior | [Testing](TESTING.md) | [Launch checklist](LAUNCH_CHECKLIST.md) |
| Prepare a live service | [Setup](SETUP.md) | [Operations](OPERATIONS.md), [security](SECURITY.md) |
| Continue development | [Handoff](../HANDOFF.md) | [Contributing](../CONTRIBUTING.md), [build plan](BUILD_PLAN.md) |

## Product and portfolio

| Document | What it explains |
| --- | --- |
| [Case study](CASE_STUDY.md) | The student problem, season loop, design rationale and engineering tradeoffs |
| [Business value](BUSINESS_VALUE.md) | Student/college hypotheses, proposed offers and what to measure before claiming impact |
| [Reviewer tour](DEMO.md) | Fictional student answers, mission completion, weekly review and a sample college batch |
| [Product specification](PRODUCT.md) | Roles, game rules, missions, access model, data rules and excluded scope |
| [Design system](DESIGN.md) | Forest ink, brass, ticket stubs, medallions, typography, motion and accessibility targets |
| [Reference screens](../design/screens/README.md) | Original design-canvas markup; separate from screenshots of the running app |
| [Roadmap](ROADMAP.md) | Implemented local scope, pending live checks and deferred ideas |
| [Build plan](BUILD_PLAN.md) | Phase-by-phase delivery and verification checkboxes |
| [Ideas](IDEAS.md) | Parked product ideas outside the current work |

## Build, test and operate

| Document | What it explains |
| --- | --- |
| [Architecture](ARCHITECTURE.md) | UI, actions, server services, game rules, stores, identity and payment gateway |
| [API reference](API.md) | HTTP routes, server-action boundaries, permissions, callbacks and local-only helpers |
| [Setup](SETUP.md) | Node/Windows setup, opt-in local test mode, phone access and live configuration |
| [Testing](TESTING.md) | Commands, dated evidence, test layers and limitations |
| [Security model](SECURITY.md) | Server authorization, database policies, payments, sharing and launch verification |
| [Operations](OPERATIONS.md) | Service checks, migration discipline, deployment, incident handling and recovery gaps |
| [Security reporting](../SECURITY.md) | How to report a finding without disclosing secrets or personal data |
| [Contributing](../CONTRIBUTING.md) | Rules for small changes and a reviewable Claude/Codex handoff |
| [Launch checklist](LAUNCH_CHECKLIST.md) | Checks before real students, colleges and payments |

## Guides by role

| Role | Guide | Typical tasks |
| --- | --- | --- |
| Student | [Student guide](manuals/STUDENT_GUIDE.md) | Take the quiz, complete/swap/skip missions, review the week and manage data |
| College team | [College guide](manuals/COLLEGE_GUIDE.md) | Invite consenting students, read activity, send in-app reminders and print reports |
| Founder | [Founder guide](manuals/FOUNDER_GUIDE.md) | Review the funnel, checklist, reservations and batch setup |

Use fictional data for local tours. Test-mode founder access is a development convenience, not a sign-in method for production.

## Evidence and status

The [screenshot notes](images/README.md) identify the local capture process and synthetic data. [TESTING](TESTING.md) records what was run, when, and what the checks cannot establish. [HANDOFF](../HANDOFF.md) records the next action for the next agent; [SESSION_LOG](SESSION_LOG.md) preserves prior working sessions.

Product prices are proposed offers. Sample dashboard figures are fixtures. No verified live URL, customer count, revenue, employment result or measured habit improvement is claimed. The full launch checklist and professional review of legal drafts remain separate work.

The [original starter guide](../START-HERE.md) is historical setup context; prefer the current setup guide and handoff when instructions differ. Agents start with [AGENTS](../AGENTS.md) and [CLAUDE](../CLAUDE.md). Never put environment values, keys, private journals or real student data in documentation or issues.

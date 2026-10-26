# Working on EMPIRE OS

This is a private founder-led product. Repository access does not imply an open-source license or open contribution program. This guide helps an authorized developer or AI agent make a reviewable change without losing the current session's work.

## Start with the project rules

Read [AGENTS.md](AGENTS.md), [CLAUDE.md](CLAUDE.md) and [HANDOFF.md](HANDOFF.md). Review the working tree and recent history before editing. Explain the intended change in plain English and follow the founder's approval instructions; do not overwrite uncommitted work from another session.

The [product specification](docs/PRODUCT.md), [design system](docs/DESIGN.md), [build plan](docs/BUILD_PLAN.md) and [launch checklist](docs/LAUNCH_CHECKLIST.md) are the source of requirements. Keep new ideas in [IDEAS](docs/IDEAS.md); do not start another feature or phase while completing a smaller authorized step.

## Set up and inspect

Use [SETUP](docs/SETUP.md) for the actual environment and demo commands, then follow [DEMO](docs/DEMO.md). Node.js 24 is declared in `package.json`. On this Windows machine use `npm.cmd`/`npx.cmd` if PowerShell blocks their `.ps1` wrappers.

Local test mode uses disposable process-memory data and pretend sign-in. Live tests operate on external services and need separate setup. Do not confuse either result with a production audit.

## Put changes in the right layer

| Change | Location and expectation |
| --- | --- |
| XP, ranks, streaks, access and dates | `lib/game/`; pure calculation with focused rule tests |
| Mission content, selection or weekly adaptation | `lib/plan-engine/`; deterministic and explainable, no AI API in V1 |
| Privileged behavior | `lib/server/`; explicit identity/ownership/role/input checks before secret-client operations |
| UI mutation | `app/actions/`; read identity from the session and delegate to a service |
| Database method | `SeasonStore` contract plus both memory and Supabase adapters; check provider behavior, not only types |
| Schema or policy | New file in `supabase/migrations/`; never edit an applied migration; add RLS and appropriate grants/revokes alongside the table |
| Interface | Follow `docs/DESIGN.md` and reference screens; 390px layout, accessible labels, reduced motion and generous tap targets |
| Documentation | Update affected setup/status/manual/reference pages; keep screenshots and stated evidence accurate |

Before writing Next.js code, read the relevant installed guide under `node_modules/next/dist/docs/`. The repository uses Next.js 16 with Cache Components; do not assume older APIs or caching conventions apply.

## Protect data and trust

- Never open, print or search environment files or ask the founder to paste secrets. Agents refer to variable names; the founder enters values in local/host settings.
- Never stage environment files, keys, private exports, session cookies, invitation tokens or real student information. Use synthetic fixtures for screenshots and reports.
- Never accept user IDs, XP, prices, roles or pass grants from the browser as authoritative. The server secret client bypasses RLS, so service authorization must remain explicit.
- Keep the product's no-trackers and minimal-data rules. Do not add external accounts or paid integrations without founder approval.
- Keep outcomes honest: measured app activity is not proof of fitness, job success or financial results. Planned services and unverified live behavior must be labelled.

See the [security model](docs/SECURITY.md) and [private reporting guide](SECURITY.md).

## Verify the change

The baseline commit requirements are:

```powershell
npm.cmd run lint
npm.cmd run typecheck
```

Run the relevant tests for changed behavior:

```powershell
npm.cmd test
npm.cmd run test:e2e
npm.cmd run build
```

Install the Playwright browser once if needed: `npx.cmd playwright install chromium`. `npm.cmd run test:rls` is a separate live Supabase integration test that creates/deletes disposable accounts and requires the founder's configured development project. See [TESTING](docs/TESTING.md) for the test boundaries and dated results.

For documentation work, run `npm.cmd run docs:check` to validate relative links and image references, then inspect the rendered screenshots/README. Record which checks ran and which were skipped. A test that was not run is not a pass.

## Save a clean handoff

Use small checkpoints. Read `git status` before staging files by name; Codex commit messages start with `[codex]`. Push ordinary commits to the configured remote after checks pass, following the current project workflow. Never force-push, hard-reset, clean away work or rewrite history; use `git revert` to undo a committed change.

At the end of the session, follow [the handoff instructions](.claude/skills/handoff/SKILL.md): update [HANDOFF.md](HANDOFF.md), add the newest entry to [SESSION_LOG](docs/SESSION_LOG.md), record placeholders/failures and the next action, then commit and push. Do not tag a phase or tick a launch gate until its real checks pass.

A review should explain the concrete problem, resulting behavior, relevant tests and remaining limits. For interface changes include the exact phone steps and safe screenshots. For database/security changes include the permission boundary and migration status.

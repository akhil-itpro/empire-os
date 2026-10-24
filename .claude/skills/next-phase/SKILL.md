---
name: next-phase
description: Plan and build the next unticked phase of docs/BUILD_PLAN.md, or the phase number given. Use when the founder types /next-phase.
disable-model-invocation: true
argument-hint: "[phase number]"
---

Phase requested: $ARGUMENTS
If that is empty, take the first phase in `docs/BUILD_PLAN.md` that still has unticked boxes.

1. **Read first.** `CLAUDE.md`, the phase in `docs/BUILD_PLAN.md`, and every document or screen its "Read" line names. For each screen, open its file in `design/screens/`.

2. **Plan, then wait.** Write a short plan in plain English:
   - the steps, each small enough for one commit
   - files to create or change
   - database changes (new migration file names)
   - tests you will add
   - anything the founder must do (accounts, keys, decisions)
   Ask the founder to approve. Don't edit files until they say yes.

3. **Build one step at a time.** After each step run `npm run lint`, `npm run typecheck` and the relevant tests. Fix failures before moving on. Commit with a clear message.

4. **Database changes.** Write a new SQL file in `supabase/migrations/` (never edit an old one), with row-level security in the same file. Apply it to the dev project through the Supabase MCP server, then check the security advisors and fix any warnings. If the MCP server isn't connected, ask the founder to paste the file into the Supabase SQL Editor and run it, then confirm the result together.

5. **Prove it.** Run the phase's "Done when" checks for real: unit tests, Playwright and `npm run test:rls` where relevant. For every screen you touched, start the dev server, take Playwright screenshots at 390 × 844 (and 1280 wide for desktop pages), look at them, and compare with `design/screens/` and `docs/DESIGN.md`. Fix what doesn't match.

6. **Tick honestly.** Tick only the boxes you verified. If something couldn't be verified, leave it unticked and say why.

7. **Report.** End with: what's done, what's still a placeholder, anything that failed, what the founder must do next, and exact steps to test on a phone after `/ship`. If the session is getting long or close to usage limits, stop at a clean commit and say which step to resume from.

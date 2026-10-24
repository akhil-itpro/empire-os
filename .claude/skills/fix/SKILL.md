---
name: fix
description: Find and fix one bug with the smallest safe change. Use when the founder types /fix or describes something that is broken.
argument-hint: "[what is wrong, where, and what you expected]"
---

Problem: $ARGUMENTS

1. Reproduce it first with a test, a script or Playwright. If you can't reproduce it, ask the founder one precise question (which screen, which steps, what they saw).
2. Find the root cause and explain it in one sentence.
3. Fix it with the smallest change. Don't refactor unrelated code.
4. Add a test that fails before the fix and passes after it.
5. Run `npm run lint`, `npm run typecheck` and the tests, then summarise and suggest `/ship`.

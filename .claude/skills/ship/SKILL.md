---
name: ship
description: Check, commit and push the current work so Vercel builds it. Use when the founder types /ship.
disable-model-invocation: true
---

1. Run `npm run lint`, `npm run typecheck` and `npm test`. If this change touched a user flow, also run `npm run test:e2e`. If anything fails, stop, explain it in one line and offer to fix it.
2. Run `git status` and describe the changes in plain words.
3. Make sure no secret file is staged (`.env.local` or any key file). If one is, unstage it and warn the founder.
4. Commit with a clear message saying what changed and why, then push the current branch.
5. Tell the founder: "Vercel is building this now; it takes a minute or two. Open the latest deployment from the Vercel dashboard on your phone and test the steps from the last report." If the branch isn't `main`, mention that this is a preview link and that merging to `main` updates the live site.

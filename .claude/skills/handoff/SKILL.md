---
name: handoff
description: Wrap up the session so Claude or Codex can continue later - commit, update HANDOFF.md and docs/SESSION_LOG.md, push. Use when the founder types /handoff, says "wrap up", "save everything" or "I'm switching to Codex", or when usage is close to the limit.
---

You are closing this session so the next one (Claude or Codex) can continue without guessing. Do every step; keep it short.

1. **Reach a clean point.** If you are in the middle of a step, finish it if that is quick; otherwise stop at the last working state. Run `npm run lint` and `npm run typecheck`. If they fail and the fix isn't quick, don't hide it: note it in step 3.
2. **Commit.** Run `git status`. Make sure no secret file is staged (`.env.local`, `.env`, any key file). Commit the work with a clear message. If the work is unfinished, start the message with `WIP:`. Codex starts its commit messages with `[codex]`.
3. **Rewrite `HANDOFF.md`** (keep its headings): date and agent, current phase and step, what this session did, the exact next step, what is waiting on the founder, open questions, known problems (including anything failing from step 1), and notes for the next agent. Facts only: never say something works unless you ran it.
   If a phase started or finished, also update the "Status" section of `README.md`. It is the public face of the repository, so keep it true: built features are described as built, everything else as planned.
4. **Add an entry at the top of `docs/SESSION_LOG.md`**: date, agent and model, phase, 2 to 5 bullets of what was done, the commits made, and what is next.
5. **Commit and push.** Commit these files (`Update handoff notes`), then `git push` if a remote exists. If the push fails, say why in one line and how to fix it.
6. **Tell the founder** in three short lines: what is saved, what comes next, and the sentence to paste into the next session: "Read HANDOFF.md and tell me where we are. Don't change anything until I say yes."

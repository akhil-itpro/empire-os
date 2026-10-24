# AGENTS.md: instructions for Codex and any other non-Claude agent

EMPIRE OS is built mainly with Claude Code. Codex is the backup the founder uses when Claude's usage limit is reached. Your job is to continue exactly where the last session stopped, follow the same rules, and leave a clean handoff so Claude can pick up again.

The founder is non-technical. Explain in plain English, one or two sentences at a time, and never expect them to type git commands.

## Before you change anything

1. Read `CLAUDE.md` in full. It is the project rulebook and applies to you word for word (where it says "Claude", read "you").
2. Read `HANDOFF.md`: the current phase, the last step done, the next step and what is waiting on the founder.
3. Run `git status` and `git log --oneline -10`. If there are uncommitted changes, ask the founder about them before touching anything.
4. Tell the founder in two or three lines where things stand and what you plan to do. Wait for a yes before editing.

## The slash commands

The founder may type Claude Code commands such as `/next-phase`. You don't have them as commands, but each one is a plain instruction file. When the founder types one, or asks for it in words, read the file and follow it. `$ARGUMENTS` in those files means whatever the founder typed after the command.

| Founder types | Read and follow |
| --- | --- |
| `/kickoff` | `.claude/skills/kickoff/SKILL.md` |
| `/next-phase` | `.claude/skills/next-phase/SKILL.md` |
| `/fix ...` | `.claude/skills/fix/SKILL.md` |
| `/design-review ...` | `.claude/skills/design-review/SKILL.md` |
| `/ship` | `.claude/skills/ship/SKILL.md` |
| `/security-check` | `.claude/skills/security-check/SKILL.md` |
| `/handoff` | `.claude/skills/handoff/SKILL.md` |

## Hard rules

Claude has some of these enforced by `.claude/settings.json`. Nothing enforces them for you, so follow them yourself.

- Never open, print or search `.env`, `.env.local` or any `.env.*.local` file. Never ask the founder to paste a secret key into the chat.
- Never run `git push --force`, `git reset --hard`, `git clean`, or anything else that rewrites or deletes history or uncommitted work. To undo a commit, use `git revert`.
- Never commit `.env.local` or any key. Check `git status` before every commit.
- Start every commit message with `[codex]` so Claude can find and review your work later.
- Work in small steps and stay inside the current step of the current phase. Don't start a new phase unless the founder asks. Claude will continue the rest.
- Database: Claude talks to Supabase through the MCP server in `.mcp.json`; you may not have it. If a migration needs applying and you can't reach Supabase, write the new file in `supabase/migrations/` and ask the founder to paste it into the Supabase SQL Editor and run it, as `.claude/skills/next-phase/SKILL.md` step 4 describes.
- If your sandbox blocks the network (for example `npm install` fails), say so plainly instead of working around it.

## Before you stop (always)

Follow `.claude/skills/handoff/SKILL.md`: reach a clean point, commit, rewrite `HANDOFF.md`, add an entry at the top of `docs/SESSION_LOG.md` (agent: Codex), commit and push. If you run in Codex cloud and your work arrives as a branch or pull request, write its name in `HANDOFF.md` so Claude can review and merge it.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Handoff: read this first

Whoever works on EMPIRE OS next (Claude or Codex) starts here. It is rewritten at the end of every session by `/handoff`. History is in `docs/SESSION_LOG.md` and `git log`.

## Last updated

2026-10-24, by Claude (Opus 5.5).

## Current phase and step

Phase 0 is 3 of 6 boxes (Supabase and Vercel wait on the founder). Phase 1 (design system) is done and tagged `phase-1-done`. The founder approved building every phase back to back, stopping only when they must act. Next: Phase 2 (database, mission library, game rules, plan engine).

## What this session did

- Installed Git 2.56, Node.js 24.22 LTS (npm 11.19) and GitHub CLI 2.103 with winget. Set git's author to Akhil <akhil.itpro@gmail.com>.
- Unpacked `empire-os-kit.zip` into `D:\EmpireOS` and made it the first commit, unchanged.
- Added the Claude/Codex handoff system: `AGENTS.md`, this file, `docs/SESSION_LOG.md`, the `/handoff` skill, session and git rules in `CLAUDE.md`, and a "Saving your work, and switching to Codex" section in `START-HERE.md`. Added PowerShell versions of the kit's safety rules to `.claude/settings.json`.
- Scaffolded Next.js 16.4.3 (React 19.3, Tailwind 4, ESLint 9, TypeScript strict) and moved it in without overwriting kit files.
- Put the colour tokens from `docs/DESIGN.md` into `app/globals.css`; loaded Schibsted Grotesk, Big Shoulders and Big Shoulders Stencil with `next/font` (the font names changed; see notes). Replaced the starter page with a field-coloured EMPIRE OS wordmark page.
- Added scripts: `typecheck` (`next typegen && tsc --noEmit`), `test` (Vitest, no tests yet), `test:e2e` (Playwright at 390 x 844, one passing test for the wordmark), `test:rls` (placeholder until Phase 2).
- Verified: `lint`, `typecheck`, `test`, `test:e2e`, `test:rls` and `build` all pass; looked at a 390 x 844 screenshot of the page.
- Later the same day: re-ran all checks and the app (all pass, no browser errors). Signed the GitHub CLI in as `akhil-itpro`, created the private repository https://github.com/akhil-itpro/empire-os and pushed `main`.

## Next step

Phase 2. The pure parts (`lib/game/`, `lib/plan-engine/`, the 120-mission library, migration SQL) need nothing from the founder. Applying migrations, server actions and `npm run test:rls` need the Supabase project and `.env.local` (kickoff step 5); Claude gave the founder click-by-click steps for Supabase and Vercel on 2026-10-24.

## Waiting on the founder

- [ ] Kickoff step 5: create the Supabase project `empire-os-dev` in South Asia (Mumbai), copy `.env.example` to a new file named `.env.local` and paste the three values in, and tell Claude the Project ID (not secret) for `.mcp.json`.
- [ ] Later (kickoff step 6): import the repository into Vercel and add the same three environment variables.
- [ ] Confirm the five-line product summary Claude gave at kickoff step 2.

## Open questions

- The founder asked for "a portfolio as well". Unclear whether that means a personal portfolio website, a GitHub profile set up as a portfolio, or a feature inside EMPIRE OS. Asked; waiting.
- Git author name is "Akhil". If the founder wants their full name on commits, run `git config --global user.name "Full Name"`.

## Known problems

- `npm run build` prints two harmless warnings: "Failed to find font override values" for Big Shoulders and Big Shoulders Stencil. It only means no size-matched fallback font is generated for them. Setting `adjustFontFallback: false` doesn't silence it under Turbopack, so it was left as is.
- npm skipped the install script of `unrs-resolver` (npm 11's install-scripts allowlist). Lint works without it; revisit only if ESLint import resolution breaks.
- `.env.local` doesn't exist yet. Claude can't create or read it (deny rule in `.claude/settings.json`); the founder makes it from `.env.example`.

## Notes for the next agent

- Fonts: Google renamed "Big Shoulders Display" to `Big_Shoulders` and "Big Shoulders Stencil Display" to `Big_Shoulders_Stencil`, each with an `opsz` axis. `opsz` 72 is the old Display cut, set by the `font-display` and `font-stencil` utilities in `app/globals.css`. Body text uses `font-sans` (Schibsted Grotesk).
- Phase 1 head start: the tokens are already in `app/globals.css` exactly as listed, and fonts load with `next/font`. Phase 1's first box still needs checking against `System.dc.html` before it is ticked.
- `next dev` maintains the Next.js block at the end of `AGENTS.md`; keep it and commit it.
- Node and Git were installed during this session, so shells started before that don't have them on PATH. If `git` or `node` isn't found, restart VS Code, or in PowerShell run: `$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')`.
- GitHub remote `origin` is https://github.com/akhil-itpro/empire-os (private). Push after every commit.
- UI components live in `components/ui/` and every one is shown on `/styleguide`. Pillar names, order and colour classes are in `lib/pillars.ts`. Hover styles use the custom `hov:` variant (in `app/globals.css`), so `data-demo="hover"` can show them; focus rings are global.
- Screenshots: with `npm run dev` running, `node scripts/screenshot.mjs styleguide 390 <outDir>` saves one image per phone screen (write the route without its leading slash in Git Bash).
- If `npm run dev` serves old styles after editing `app/globals.css` (Turbopack's dev cache went stale once), stop the dev server, delete `.next/dev` and start it again.
- `tests/e2e/styleguide.spec.ts` runs an axe accessibility check; copy that pattern for every new screen.

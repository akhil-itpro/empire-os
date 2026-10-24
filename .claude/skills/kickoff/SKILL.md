---
name: kickoff
description: One-time setup of the EMPIRE OS project on this laptop (Phase 0). Use only when the founder types /kickoff.
disable-model-invocation: true
---

You are setting up EMPIRE OS for a non-technical founder. Go one step at a time. Before each step, say in one plain sentence what it does. When a step needs the founder (an account, a browser sign-in, a key), stop and wait for them.

1. **Check tools.** Run `node -v`, `npm -v` and `git --version`. Node must be a current LTS version (20 or newer). If anything is missing, tell the founder exactly what to install (Node.js LTS from nodejs.org, Git from git-scm.com), to restart VS Code afterwards, and to type /kickoff again.

2. **Understand the product.** Read `CLAUDE.md`, `docs/PRODUCT.md`, `docs/DESIGN.md` and `docs/BUILD_PLAN.md`. Summarise EMPIRE OS back in five short lines and ask the founder to confirm.

3. **Scaffold the app.** Use `create-next-app` (latest) with TypeScript, App Router, Tailwind CSS, ESLint, the `@/*` import alias and no `src` folder. This folder already contains `CLAUDE.md`, `START-HERE.md`, `docs/`, `design/`, `.claude/` and `.mcp.json`; scaffold into a temporary folder and move the generated files in without overwriting any of them. Then:
   - Add scripts: `typecheck` (`tsc --noEmit`), `test` (Vitest), `test:e2e` (Playwright), `test:rls` (a placeholder that prints "not set up yet" until Phase 2).
   - Make sure `.gitignore` covers `.env*` except `.env.example`.
   - Replace the starter page with a field-coloured page showing the EMPIRE OS wordmark from `docs/DESIGN.md`.
   - Run `npm run lint`, `npm run typecheck` and `npm run build`. Fix anything that fails.

4. **Git and GitHub.** Initialise git if needed and commit. If the `gh` command is installed and signed in, create a private repository named `empire-os` and push. Otherwise ask the founder to create an empty private repository on github.com and paste its address, then add it as the remote and push.

5. **Supabase.** Ask the founder to create a free project at supabase.com named `empire-os-dev`, region South Asia (Mumbai), with a strong database password saved in their password manager. Then:
   - Create `.env.example` with the variable names only: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`.
   - Create `.env.local` with the same names and empty values, and tell the founder where to find each value in the Supabase dashboard (Project Settings, API keys). They paste the values into `.env.local` themselves. Never ask for the secret key in chat and never read `.env.local`.
   - Ask the founder for the project reference (Project Settings, General, Project ID; it is not secret) and put it into `.mcp.json` in place of `YOUR_PROJECT_REF`.
   - Tell the founder to type `/mcp`, choose `supabase` and click Authenticate, then sign in to Supabase in the browser. Confirm it shows Connected.
   - If authentication doesn't open a browser from the panel, Supabase's docs authenticate from a terminal instead: help the founder install the standalone Claude Code CLI (the official setup page has a one-line installer), run `claude` in VS Code's terminal (`Ctrl+backtick`), type `/mcp` there and authenticate. If that also fails, carry on without MCP: from then on, give the founder each migration file to paste into the Supabase dashboard's SQL Editor and run, and confirm the result with them.

6. **Vercel.** Ask the founder to sign in at vercel.com with GitHub, import the `empire-os` repository, add the three environment variables (same names, same values) and deploy. Ask for the live link and confirm the wordmark page loads. Remind them: Vercel's free Hobby plan is for non-commercial use, so switch to Pro before charging money.

7. **Finish.** Tick the Phase 0 boxes you verified in `docs/BUILD_PLAN.md`, commit, push, and tell the founder: "Setup is done. Open the live link on your phone. Next, type /next-phase to start Phase 1."

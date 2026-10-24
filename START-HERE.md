# Start here

This kit gives Claude Code everything it needs to build EMPIRE OS properly on your laptop: the product spec, the design system, the screen designs, a phase-by-phase build plan and six slash commands. You steer; Claude Code writes, tests and ships the code.

- Founder playbook (strategy, odds, costs, launch): https://claude.ai/code/artifact/76acba5b-9526-4a34-a4f8-4773f8c71f97
- Screen designs to match: https://claude.ai/artifact/ErxKEtn2Qxi8bDWFkN97qN (the same screens are in `design/screens/` for Claude Code)

## 1. Install once (about 30 minutes)

1. **VS Code** from code.visualstudio.com (version 1.94 or newer).
2. **Node.js LTS** from nodejs.org. Use the installer's default options.
3. **Git** from git-scm.com. On Windows this is "Git for Windows"; keep the defaults.
4. **Claude Code extension:** in VS Code press `Ctrl+Shift+X` (Mac: `Cmd+Shift+X`), search "Claude Code", and install the one published by Anthropic.
5. **Sign in:** open any file, click the spark icon at the top right of the editor (or "✻ Claude Code" at the bottom right), click Sign in and use your Claude Pro account.

## 2. Free accounts

- **GitHub** (github.com): stores your code.
- **Supabase** (supabase.com, sign in with GitHub): database and logins.
- **Vercel** (vercel.com, sign in with GitHub): puts the app on the internet.

## 3. Open the kit

1. Unzip this folder to `Documents\empire-os` (Mac: `Documents/empire-os`).
2. In VS Code: File, Open Folder, choose `empire-os`, and click "Yes, I trust the authors".
3. Open `START-HERE.md`, then open the Claude Code panel with the spark icon.

## 4. What to type

| When | Type this | What happens |
| --- | --- | --- |
| The very first time | `/kickoff` | Claude sets up the app, GitHub, Supabase and Vercel with you. About 1 to 2 hours |
| Each new phase | `/next-phase` | Claude reads the plan, shows you its steps, waits for your yes, builds, tests and reports |
| A screen looks off or generic | `/design-review hq` | Claude screenshots the screen, compares it with the design and fixes it |
| Something is broken | `/fix the XP bar doesn't move after Mark done` | Claude reproduces it, fixes it and adds a test |
| After each phase | `/ship` | Claude checks everything, commits and pushes; Vercel deploys |
| Before friends, a college or payments | `/security-check` | Claude runs real security tests and reports honestly |

Good things to type in between:

- "Explain what you just did like I'm new to this."
- "Before you change anything, what are three possible causes? Try the most likely first."
- "Show me how to test this on my phone, step by step."
- "Is this in the build plan? If not, add it to docs/IDEAS.md instead of building it."

## 5. Ten habits that make Claude Code work for you

1. **One phase per conversation.** Start a new conversation for each phase (Command Palette: "Claude Code: Open in New Tab"). It keeps answers sharp and saves your usage.
2. **Read the plan before you say yes.** Ask "why?" whenever something is unclear.
3. **Plan mode for big changes.** Click the mode name under the prompt box and choose Plan; Claude explains first and changes nothing until you approve.
4. **Show, don't describe.** Paste a screenshot from your phone straight into the prompt box. Point at files with `@`, for example `@docs/DESIGN.md`.
5. **Undo is safe.** Hover over a message, click rewind, choose "Rewind code to here".
6. **Test on your phone after every `/ship`.**
7. **Never paste secret keys into the chat.** You type them into `.env.local` and Vercel yourself.
8. **Watch your usage.** Type `/usage`. If you hit a limit, Claude stops at a clean commit; later, `/next-phase` picks up at the first unticked box.
9. **Stay on the plan.** New ideas go into `docs/IDEAS.md` until you reach ₹1 lakh a month.
10. **Talk to users every week.** The build is the easy part now; customers are the hard part.

## 6. The website, in short

- Two pages, two buyers: `/` for students (one button: "Find your archetype") and `/colleges` for T&P cells (one button: "Book a 20-minute demo").
- Show real app screens, never stock photos. Show proof only when it's real.
- Test the live link on pagespeed.web.dev and ask Claude to fix any mobile score under 90.
- Measure two numbers: visitors who start the quiz, and colleges-page visitors who book a demo.

## 7. What only you can do

Meet students and TPOs, run Season 0, post content, get the lawyer review, complete Razorpay KYC, ask a CA about GST, file the trademark, and decide the refund policy. The checklist is in `docs/LAUNCH_CHECKLIST.md`.

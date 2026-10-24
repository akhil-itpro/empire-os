# Screen references

Each file in `screens/` is one designed screen from the "EMPIRE OS — Screens v3" design canvas. They were written for a design-canvas runtime (`<x-dc>`, `{{holes}}`, `<sc-for>`, `<sc-if>`), so they won't render on their own in a browser. Use them as exact references for layout, spacing, sizes, colours, copy and states, and build real React components from them.

| File | Screen | Route |
| --- | --- | --- |
| `Main.dc.html` | Landing | `/` |
| `Quiz.dc.html` | Quiz question (main goal) | `/quiz` |
| `Reveal.dc.html` | Archetype reveal | `/quiz/reveal` |
| `HQ.dc.html` | HQ, today (interactive: Mark done, stamp, XP) | `/hq` |
| `Pass.dc.html` | Season Pass offer | sheet over any screen |
| `College.dc.html` | College HQ overview (desktop and phone) | `/college` |
| `Share.dc.html` | Archetype share card, 9:16 | `/api/og/archetype` |
| `System.dc.html` | Tokens and motifs | `/styleguide` |

Reading tips for Claude Code:

- Inline `style` attributes hold the exact values; convert them to Tailwind classes using the tokens in `docs/DESIGN.md`.
- `renderVals()` in each file's script shows the sample data and the logic the screen expects (for example how XP, the medallion ticks and done states are computed).
- Sample names and numbers are illustrative only. Real screens show real data.

# Portfolio images

The gallery in the [main README](../../README.md) shows the actual EMPIRE OS interface with fictional data. It is separate from the original [design references](../../design/screens/README.md).

## Provenance

Captured **1 November 2026**, using the repository's Playwright Chromium journeys and opt-in development test mode. All twelve funnel/capture journeys passed. No live accounts, provider dashboards, student records or payment details were used.

| Asset | Source |
| --- | --- |
| [cover.svg](cover.svg) | Code-drawn campaign-kit illustration; a presentation asset, not a screenshot |
| [landing.png](landing.png) | The public landing page at phone width |
| [archetype.png](archetype.png) | The Grinder reveal using Rahul's fictional quiz answers |
| [student-hq.png](student-hq.png) | Day 1 HQ viewport after one synthetic mission completion, once the medal notification has cleared |
| [season-path.png](season-path.png) | Path viewport after two synthetic mission completions |
| [war-room.png](war-room.png) | Day 7 review viewport with sample difficulty/blocker choices |
| [college-hq.png](college-hq.png) | The explicitly labelled sample CSE 2027 batch |

Mobile captures use a **390 × 844** CSS-pixel viewport at 2× scale. Student HQ, Path and War Room use the visible viewport so fixed navigation stays at the bottom; landing and archetype images capture the full page and can be taller. College HQ uses a **1280 × 980** viewport and full-page capture, also at 2× scale. Names and dashboard totals are fixtures; they do not prove adoption, retention, academic performance or revenue. Local time travel is used to demonstrate weekly review. Dates and totals vary when captures are refreshed.

The cover uses the repository's forest-ink, brass, bone and pillar colors with system font fallbacks. It illustrates a product concept; it does not represent measured usage or a newly implemented feature. App screenshots contain the served application fonts.

## Refresh the gallery

From the project root, with Node.js 24 and dependencies installed:

```powershell
npx.cmd playwright install chromium
npm.cmd run screens:portfolio
npm.cmd run docs:check
```

Stop any manual demo using `.next-test` and any server on port 3100 before starting. The command runs the existing funnel and screenshot journeys sequentially against Playwright's local server, writes the broader capture set under ignored `test-results/portfolio`, then copies the six curated images here. It requires no Supabase project or credentials. It does not change the existing `public/colleges` marketing images.

Source: [capture script](../../scripts/portfolio-screens.mjs), [browser configuration](../../playwright.config.ts), [funnel](../../tests/e2e/funnel.spec.ts) and [screen journeys](../../tests/e2e/screens.spec.ts). The screen journeys wait for streamed headings before capturing app tabs and open the sample batch through the current founder's own College HQ membership list. The HQ portfolio capture also waits for the completion response and the medal notification's full lifecycle before saving `hq-2-one-done-viewport.png`; its full-page counterpart stays in the ignored design-review capture set.

Inspect every image for legible text, complete content and synthetic-data labels before saving it to GitHub. The script does not prove live authentication, hosted storage, native sharing, installation, payment processing or real-device accessibility. Use [TESTING](../TESTING.md) and the [launch checklist](../LAUNCH_CHECKLIST.md) for those boundaries.

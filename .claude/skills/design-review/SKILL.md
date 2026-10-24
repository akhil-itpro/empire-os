---
name: design-review
description: Compare a screen with docs/DESIGN.md and design/screens/, remove anything generic and fix it. Use when the founder types /design-review or says a screen looks generic, cheap or off.
argument-hint: "[route or screen name]"
---

Screen to review: $ARGUMENTS
If that is empty, ask the founder which screen.

1. **Look at it.** Start the dev server if it isn't running. Take Playwright screenshots of the route at 390 × 844, and at 1280 wide for College HQ, Founder HQ and marketing pages. Read the screenshots.

2. **Compare with the target.** Open the matching file in `design/screens/` and check against `docs/DESIGN.md`:
   - exact colour tokens, no stray greys or hexes
   - the right typeface for each role (stencil only for the day counter, wordmark and stamp)
   - spacing on the 8px grid, 20px side padding, thumb-zone primary button
   - motifs where they belong: ticket stubs, medallion, stamp, progress ticks
   - copy: sentence case, buttons that say what happens, no hype

3. **Hunt the generic.** Go through the blacklist in `docs/DESIGN.md` and remove every match.

4. **Check access.** Text contrast 4.5:1, tap targets 44px, real buttons and links, visible focus, `aria-label` on icon buttons, reduced motion respected, empty and loading states designed.

5. **Fix and show.** Make the fixes, take new screenshots, and report before and after with one line per change. Suggest `/ship` when done.

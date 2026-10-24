# EMPIRE OS design: the campaign kit

The season is a campaign. Missions are ticket stubs with a perforation, the season is a brass medallion with one tick per day, and finished work gets a rubber stamp. Dark forest-ink field, brass for action and XP, bone for text. Bold in one place per screen, quiet everywhere else.

Reference screens (open in a browser, then match them): the "EMPIRE OS — Screens v3" design canvas, and the same artboards as markup in `design/screens/`:

| Screen | File | Notes |
| --- | --- | --- |
| Landing | `Main.dc.html` | Cropped medallion top right, pillar list left, headline, one button |
| Quiz question | `Quiz.dc.html` | 11 progress ticks, 2-column option tiles, selected tile has brass border and check badge |
| Archetype reveal | `Reveal.dc.html` | Name and emblem, three-act track, "Why this plan", two buttons |
| HQ | `HQ.dc.html` | Day counter, chips, score medallion, pillar meters, XP bar, three tickets, bottom nav |
| Season Pass | `Pass.dc.html` | The pass is a ticket with a horizontal perforation; "Maybe later" is a real, visible button |
| College HQ | `College.dc.html` | Desktop page that also works at phone width; stat tiles, chart with table view, nudge list |
| Share card | `Share.dc.html` | 9:16 story card; keep content out of the top and bottom 13% |
| Tokens | `System.dc.html` | Every colour, type role and motif |

The `.dc.html` files use a design-canvas runtime, so read them as reference markup: copy layout, spacing, sizes and copy, then build real React components.

## Colour tokens

Put these in `app/globals.css` with Tailwind's `@theme`, and use only these names:

```css
@theme {
  --color-field: #0C1310;       /* page background */
  --color-ledger: #141E19;      /* cards, tickets */
  --color-raised: #1B2721;      /* selected tiles, hover, tooltips */
  --color-rule: #2A3A31;        /* hairlines, unlit ticks, perforations */
  --color-bone: #ECE5D3;        /* primary text */
  --color-moss: #9AA597;        /* secondary text */
  --color-brass: #C9A24B;       /* primary action, XP, lit ticks */
  --color-brass-light: #E8C873; /* hover on brass */
  --color-brass-deep: #8C6A2A;  /* outlines, secondary buttons */
  --color-stamp: #D24A3C;       /* the DONE stamp only */
  --color-career: #3987E5;      /* pillar 1 */
  --color-body: #D95926;        /* pillar 2 */
  --color-mind: #9085E9;        /* pillar 3 */
  --color-money: #199E70;       /* pillar 4 */
  --color-good: #0CA30C;        /* status: up is good, always with an arrow icon and words */
}
```

- Pillar colours were validated as a set on the dark surfaces for colour-blind separation. Keep the order Career, Body, Mind, Money everywhere. Never add a fifth pillar colour.
- Pillar colour goes on marks (dots, bars, icons), never on text. Text uses bone or moss.
- Text on brass buttons is field colour. Contrast: bone on field is about 15:1, moss on ledger about 6.7:1, brass on field about 7.8:1.
- Meter tracks are the pillar colour at 22% opacity; the fill is the full colour.

## Type

- **Big Shoulders Stencil Display 900:** only the day counter ("Day 12"), the wordmark ("EMPIRE") and the DONE stamp.
- **Big Shoulders Display 800:** headings, archetype names, screen titles. Line height 0.95 to 1.05.
- **Schibsted Grotesk 400 to 700:** body text, buttons, labels, and every number in a tile, meter, chart or price.
- Load with `next/font/google`. If a family name isn't found, check Google Fonts for its current name (the Big Shoulders families have been reorganised before) and keep the same look.
- Scale (px): 12, 13, 14, 16 body, 20, 26, 32, 40, 50 to 66 display. Body line height 1.5.
- Sentence case everywhere. No all-caps labels except the wordmark and the stamp. Proportional figures for big numbers; `tabular-nums` only in tables and axis ticks.

## Layout

- Design at 390 × 844. Side padding 20px. 8px spacing grid (4px for tight icon gaps).
- Left-aligned text; centre only the share card and medallion content.
- Primary action at the bottom in the thumb zone: full-width brass button, 56px tall, radius 12px. Secondary button: 1.5px brass-deep outline, 52px.
- Bottom navigation: HQ, Path, Stats, Me. 76px tall, ledger-dark background `#0F1814`, active tab in brass with a 3px brass bar on top.
- Desktop pages (College HQ, Founder HQ): side menu plus content in a wrapping row; content max width 1040px; at phone width the menu stacks on top and wide tables scroll inside their box.

## Components

| Component | Spec |
| --- | --- |
| Ticket (mission) | Ledger background, radius 12px, 104px tall. Main area: pillar dot and name (12px moss), title (16px 600 bone, 2 lines max), clock icon and minutes. Stub 92px wide on the right, separated by a 2px dashed rule with two 16px field-coloured notches top and bottom; shows "+45 XP" and a 44px round check button |
| Stamp | "DONE", stencil 900 28px, stamp red, 3px border, inner 1.5px outline inset 7px, radius 6px, rotated -10°. Appears with a short slam (scale 1.4 to 1, 180ms) |
| Medallion | Outer milled ring of ticks (90 for days, 100 for score), lit ticks brass, unlit ticks rule; inner disc ledger with a 1.5 to 2.5px brass-deep ring. Content centred |
| Chip | 36px tall, radius 18px, 1px rule border, ledger background, icon plus value |
| Option tile | Ledger, 1.5px rule border, radius 14px, min 124px tall. Selected: raised background, 2px brass border, 22px brass check badge top right |
| Progress ticks | 11 segments, 4px tall, 4px gaps, brass done, rule to do |
| Stat tile | Label (13px moss, sentence case), value (34px Schibsted 600), optional delta with arrow icon and words ("Up 12 vs last week") in good green |
| Pass card | Ticket shape with horizontal perforation and side notches; price block below the perforation |

Icons: `lucide-react`, 1.75 to 2px stroke. Emblems and medallions are custom SVG.

## Motion

One signature moment: completing a mission. The check button fills, the stamp slams onto the ticket, the XP number counts up into the bar, and the phone vibrates lightly where supported. Rank-up: the rank medallion flips like a coin, then a share prompt. Everything else is instant or a simple 150ms fade. With `prefers-reduced-motion`, show end states with no movement.

## Charts and numbers

- One series gets one colour (brass). Several pillars use the four pillar colours in order, with a legend and direct labels.
- Columns at most 24px wide, 4px rounded top, square at the baseline. Hairline solid gridlines in rule colour; no dashed grids.
- Label selectively (the last point or the extreme), never every bar.
- Every chart has a hover and focus tooltip (value first, then date) and a table view.
- No dual axes, pies for close values, or 3D.

## Copy voice

Plain, specific, coach-like. Buttons say exactly what happens: "Find your archetype", "Start Season 1", "Mark done", "Get Season Pass for ₹299", "Maybe later". No arrows on buttons, no hype, no guilt.

Examples: "Streak paused. Your XP and rank are safe. Go again today." / "Do this one now. It takes 5 minutes." / "Your free week is over. Free stays free with one mission a day."

## Generic-UI blacklist (check every screen)

- Identical rounded cards with the same soft grey shadow everywhere
- Gradient washes, glassmorphism, purple gradients, neon glows
- Cards with a coloured left border
- All-caps tracked labels above headings; meta text joined with middle dots
- Arrows appended to button text; emoji in the interface
- Inter, Roboto or Arial; default shadcn or Material styling
- Everything centred; stock photos; fake status bars in mockups
- Big-number-with-tiny-label hero sections that say nothing

## Accessibility

Text contrast 4.5:1 (3:1 for 24px and larger). Tap targets at least 44px. Real buttons and links, never clickable divs. Visible focus rings in brass. Icon-only buttons have `aria-label`. Colour never carries meaning alone (pillar names next to dots, words next to arrows).

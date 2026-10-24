// The four pillars, always in this order (docs/DESIGN.md: never add a fifth colour).
export const PILLARS = ["career", "body", "mind", "money"] as const;

export type Pillar = (typeof PILLARS)[number];

export const PILLAR_LABEL: Record<Pillar, string> = {
  career: "Career",
  body: "Body",
  mind: "Mind",
  money: "Money",
};

// Full class names written out so Tailwind can find them.
// Pillar colour goes on marks only (dots, bars, icons), never on text.
export const PILLAR_CLASSES: Record<
  Pillar,
  { dot: string; fill: string; track: string; stroke: string }
> = {
  career: {
    dot: "bg-career",
    fill: "bg-career",
    track: "bg-career/22",
    stroke: "text-career",
  },
  body: {
    dot: "bg-body",
    fill: "bg-body",
    track: "bg-body/22",
    stroke: "text-body",
  },
  mind: {
    dot: "bg-mind",
    fill: "bg-mind",
    track: "bg-mind/22",
    stroke: "text-mind",
  },
  money: {
    dot: "bg-money",
    fill: "bg-money",
    track: "bg-money/22",
    stroke: "text-money",
  },
};

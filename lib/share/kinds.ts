// The four share card types (docs/PRODUCT.md section 7): archetype, rank-up,
// streak (7, 30, 60, 90) and season complete. Shared by the server and the browser.
export const STREAK_CARD_DAYS = [7, 30, 60, 90] as const;
export const SHARE_KINDS = ["archetype", "rank", "streak-7", "streak-30", "streak-60", "streak-90", "season"] as const;
export type ShareKind = (typeof SHARE_KINDS)[number];

export function isShareKind(value: unknown): value is ShareKind {
  return SHARE_KINDS.includes(value as ShareKind);
}

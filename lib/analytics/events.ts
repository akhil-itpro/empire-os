// The analytics events the browser may log (a subset of the names the `events`
// table allows). Props hold step numbers and labels only, never answers, names or emails.
export const CLIENT_EVENTS = [
  "landing_view",
  "quiz_start",
  "quiz_step",
  "quiz_complete",
  "reveal_view",
  "oath_done",
  "paywall_view",
  "pack_locked_tap",
  "share_card_created",
  "share_click",
  "referral_visit",
  "install_tip_view",
] as const;

export type ClientEvent = (typeof CLIENT_EVENTS)[number];

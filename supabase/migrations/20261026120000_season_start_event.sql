-- Season 2 and later (docs/PRODUCT.md section 5): the server logs "season_start"
-- when a student starts their next season, so Founder HQ can count who continues.
alter table public.events drop constraint events_name_check;
alter table public.events add constraint events_name_check check (name in (
  'landing_view', 'quiz_start', 'quiz_step', 'quiz_complete', 'under_18_exit',
  'reveal_view', 'oath_done', 'signup_done', 'first_mission_done',
  'mission_done', 'mission_skipped', 'mission_swapped', 'day_complete', 'install_tip_view',
  'paywall_view', 'reserve_click', 'pack_locked_tap',
  'share_card_created', 'share_click',
  'referral_visit', 'referral_signup', 'referral_reward',
  'weekly_review_done', 'demo_request',
  'colleges_view', 'guide_view',
  'checkout_start', 'payment_done', 'payment_failed',
  'season_start'
));

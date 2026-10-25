-- Phase 10: Season Pass payments through Razorpay (docs/PRODUCT.md section 2).
--
-- One row per Razorpay order. The server creates it with the price it computed,
-- and marks it paid only after verifying the payment signature and asking Razorpay
-- that the payment is captured and the order paid. A pass is granted once per
-- order (entitlements has one row per source: "payment:<order id>"), so a repeated
-- webhook or callback can never grant twice. Students only read their own rows.

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  razorpay_order_id text not null unique check (razorpay_order_id ~ '^order_[A-Za-z0-9]{6,40}$'),
  razorpay_payment_id text unique check (razorpay_payment_id ~ '^pay_[A-Za-z0-9]{6,40}$'),
  amount_inr integer not null check (amount_inr > 0),
  founder_price boolean not null,
  status text not null default 'created' check (status in ('created', 'paid', 'failed')),
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  check ((status = 'paid') = (paid_at is not null and razorpay_payment_id is not null))
);
create index payments_user on public.payments (user_id, created_at desc);

alter table public.payments enable row level security;
create policy "Students read their own payments" on public.payments
  for select to authenticated using ((select auth.uid()) = user_id);
revoke insert, update, delete, truncate on public.payments from authenticated;
revoke all on public.payments from anon;

-- Checkout events for Founder HQ.
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
  'checkout_start', 'payment_done', 'payment_failed'
));

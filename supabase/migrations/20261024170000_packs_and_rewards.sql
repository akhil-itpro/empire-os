-- Phase 6: packs a student turned on, and grants that can never happen twice.
--
-- Security model unchanged: students only read their own rows; the server writes
-- with the secret key after checking the signed-in user (see the core schema).

-- Packs the student turned on (Season Pass, trial or other full access only; the
-- server checks access before writing). Only the four known pack ids are allowed.
alter table public.profiles
  add column active_packs text[] not null default '{}'
  check (active_packs <@ array['placement_prep', 'home_muscle', 'speak_leader', 'savings_sprint']::text[]);

-- One grant per source per student, so a referral reward (and later a payment)
-- is idempotent: a repeated request or webhook can't add access twice.
create unique index entitlements_user_source on public.entitlements (user_id, source);

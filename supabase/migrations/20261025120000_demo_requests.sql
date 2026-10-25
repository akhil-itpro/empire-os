-- Phase 9: "Book a 20-minute demo" requests from the /colleges page.
--
-- Work contact details a TPO chooses to send us, nothing else. Only the server
-- writes (after validating and rate-limiting) and only the founder reads, through
-- the server, so RLS is on with no policies for browser roles.

create table public.demo_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  role text not null check (role in ('tpo', 'placement_staff', 'principal', 'faculty', 'other')),
  college text not null check (char_length(college) between 2 and 120),
  city text not null check (char_length(city) between 2 and 60),
  email text not null check (char_length(email) between 6 and 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text check (phone ~ '^\+?[0-9 ]{8,16}$'),
  batch_size text not null check (batch_size in ('under_100', '100_300', '300_600', 'over_600')),
  note text check (char_length(note) <= 500),
  handled boolean not null default false,
  created_at timestamptz not null default now()
);
create index demo_requests_time on public.demo_requests (created_at desc);
create index demo_requests_email on public.demo_requests (lower(email), created_at desc);

alter table public.demo_requests enable row level security;
revoke all on public.demo_requests from anon, authenticated;

-- Two new page-view events for the website: the colleges page and the guides.
-- (The list must match the core schema plus these; see lib/analytics/events.ts.)
alter table public.events drop constraint events_name_check;
alter table public.events add constraint events_name_check check (name in (
  'landing_view', 'quiz_start', 'quiz_step', 'quiz_complete', 'under_18_exit',
  'reveal_view', 'oath_done', 'signup_done', 'first_mission_done',
  'mission_done', 'mission_skipped', 'mission_swapped', 'day_complete', 'install_tip_view',
  'paywall_view', 'reserve_click', 'pack_locked_tap',
  'share_card_created', 'share_click',
  'referral_visit', 'referral_signup', 'referral_reward',
  'weekly_review_done', 'demo_request',
  'colleges_view', 'guide_view'
));

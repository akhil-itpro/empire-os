-- EMPIRE OS core schema (docs/PRODUCT.md sections 5, 6, 7 and 11).
--
-- Security model:
-- * Every table with personal data has row-level security (RLS) from this file.
-- * Students can only READ their own rows. There are no insert, update or delete
--   policies for them, and those privileges are revoked as a second lock.
-- * All writes happen in server code that checks the signed-in user, validates
--   input, then writes with the secret key (which bypasses RLS).
-- * The one exception is `events`: the browser may insert analytics events,
--   only for itself, from a fixed list of names, with a small payload.

-- ---------------------------------------------------------------------------
-- Mission library (readable by signed-in users; written only by migrations)
-- ---------------------------------------------------------------------------

create table public.packs (
  id text primary key,
  name text not null,
  description text not null
);

create table public.mission_library (
  id text primary key,
  pillar text not null check (pillar in ('career', 'body', 'mind', 'money')),
  title text not null check (char_length(title) <= 80),
  how_to text not null check (char_length(how_to) <= 200),
  minutes smallint not null check (minutes in (5, 10, 20, 30, 45)),
  cost text not null check (cost in ('free', 'low', 'paid')),
  needs text not null check (needs in ('none', 'gym', 'laptop', 'outdoors')),
  difficulty smallint not null check (difficulty between 1 and 3),
  archetypes text[] not null default '{}',
  act smallint not null check (act between 1 and 3),
  tags text[] not null default '{}',
  pack text references public.packs (id),
  active boolean not null default true
);

-- ---------------------------------------------------------------------------
-- Student tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null check (char_length(first_name) between 1 and 40),
  age_bracket text not null check (age_bracket in ('18-20', '21-24', '25-28', '29-34', '35+')),
  adult_confirmed_at timestamptz not null,
  city text not null check (city in ('hyderabad', 'bengaluru', 'pune', 'mumbai', 'delhi_ncr', 'chennai', 'kolkata', 'other')),
  situation text not null check (situation in ('student', 'job_hunting', 'working_tech', 'working_other', 'own_thing')),
  goal text not null check (goal in ('first_job', 'earn_more', 'side_income', 'fitness', 'discipline', 'money')),
  pillar_order text[] not null check (
    cardinality(pillar_order) = 4
    and pillar_order @> array['career', 'body', 'mind', 'money']
  ),
  daily_minutes smallint not null check (daily_minutes in (15, 30, 45, 60, 90)),
  budget text not null check (budget in ('free', 'under_500', '500_2000', 'flexible')),
  gym boolean not null,
  laptop boolean not null,
  enemy text not null check (enemy in ('phone', 'low_energy', 'no_plan', 'no_money', 'overthinking')),
  intensity text not null check (intensity in ('steady', 'ambitious', 'beast')),
  archetype text not null check (archetype in ('grinder', 'climber', 'founder', 'warrior', 'phoenix', 'strategist')),
  time_zone text not null default 'Asia/Kolkata' check (char_length(time_zone) <= 64),
  season_number smallint not null default 1,
  season_start date not null,
  trial_ends_at timestamptz not null,
  referral_code text not null unique check (referral_code ~ '^[A-Z0-9]{6,10}$'),
  -- Share cards show initials unless the student chooses their first name.
  share_name text not null default 'initials' check (share_name in ('initials', 'first_name')),
  -- Edits from Me apply from tomorrow and never rewrite history.
  pending_settings jsonb,
  pending_from date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  local_date date not null,
  slot smallint not null check (slot between 1 and 3),
  mission_id text not null references public.mission_library (id),
  pillar text not null check (pillar in ('career', 'body', 'mind', 'money')),
  minutes smallint not null,
  xp smallint not null check (xp > 0),
  status text not null default 'assigned' check (status in ('assigned', 'done', 'skipped', 'swapped')),
  skip_reason text check (skip_reason in ('no_time', 'not_relevant', 'too_hard')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  check ((status = 'skipped') = (skip_reason is not null)),
  check ((status = 'done') = (completed_at is not null))
);

-- One live mission per slot per day: generated once, never duplicated.
-- A swapped mission stays as history; its replacement takes the slot.
create unique index user_missions_live_slot
  on public.user_missions (user_id, local_date, slot)
  where status <> 'swapped';
create index user_missions_user_date on public.user_missions (user_id, local_date desc);

-- Every XP grant is one row, so XP is auditable and a grant can't happen twice.
create table public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('mission', 'day_bonus', 'boss')),
  ref text not null,
  xp smallint not null check (xp > 0),
  created_at timestamptz not null default now(),
  unique (user_id, kind, ref)
);

create table public.user_stats (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  xp integer not null default 0,
  current_streak integer not null default 0,
  best_streak integer not null default 0,
  last_active_date date,
  updated_at timestamptz not null default now()
);

create table public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('season_pass', 'batch', 'referral_bonus')),
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  source text not null check (char_length(source) <= 200),
  created_at timestamptz not null default now()
);
create index entitlements_user on public.entitlements (user_id, ends_at desc);

create table public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  season_number smallint not null,
  week smallint not null check (week between 1 and 13),
  felt text not null check (felt in ('too_easy', 'just_right', 'too_hard')),
  blocker text not null check (blocker in ('time', 'energy', 'motivation', 'money', 'nothing')),
  changes text[] not null default '{}',
  focus_pillar text not null check (focus_pillar in ('career', 'body', 'mind', 'money')),
  adjustments jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (user_id, season_number, week)
);

-- An optional one-line private journal. Never shared with colleges.
create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  local_date date not null,
  body text not null check (char_length(body) between 1 and 280),
  created_at timestamptz not null default now(),
  unique (user_id, local_date)
);

-- Reserve mode: a reservation records interest. No payment is taken.
create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  price_inr integer not null check (price_inr > 0),
  founder_price boolean not null,
  created_at timestamptz not null default now()
);

create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles (id) on delete cascade,
  referred_id uuid not null unique references public.profiles (id) on delete cascade,
  status text not null default 'signed_up' check (status in ('signed_up', 'qualified', 'rewarded', 'blocked')),
  created_at timestamptz not null default now(),
  qualified_at timestamptz,
  check (referrer_id <> referred_id)
);
create index referrals_referrer on public.referrals (referrer_id);

-- ---------------------------------------------------------------------------
-- Roles and analytics
-- ---------------------------------------------------------------------------

create table public.roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('founder')),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table public.events (
  id bigint generated always as identity primary key,
  name text not null check (name in (
    'landing_view', 'quiz_start', 'quiz_step', 'quiz_complete', 'under_18_exit',
    'reveal_view', 'oath_done', 'signup_done', 'first_mission_done',
    'mission_done', 'mission_skipped', 'mission_swapped', 'day_complete', 'install_tip_view',
    'paywall_view', 'reserve_click', 'pack_locked_tap',
    'share_card_created', 'share_click',
    'referral_visit', 'referral_signup', 'referral_reward',
    'weekly_review_done', 'demo_request'
  )),
  -- Kept when an account is deleted, but no longer linked to anyone.
  user_id uuid references auth.users (id) on delete set null,
  -- A random id kept in the browser so the funnel can join steps before sign-up.
  anon_id uuid,
  props jsonb not null default '{}' check (pg_column_size(props) <= 1024),
  created_at timestamptz not null default now()
);
create index events_name_time on public.events (name, created_at desc);

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.packs enable row level security;
alter table public.mission_library enable row level security;
alter table public.profiles enable row level security;
alter table public.user_missions enable row level security;
alter table public.xp_events enable row level security;
alter table public.user_stats enable row level security;
alter table public.entitlements enable row level security;
alter table public.weekly_reviews enable row level security;
alter table public.journal_entries enable row level security;
alter table public.reservations enable row level security;
alter table public.referrals enable row level security;
alter table public.roles enable row level security;
alter table public.events enable row level security;

create policy "Signed-in users read packs" on public.packs
  for select to authenticated using (true);
create policy "Signed-in users read the mission library" on public.mission_library
  for select to authenticated using (true);

create policy "Students read their own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "Students read their own missions" on public.user_missions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Students read their own XP" on public.xp_events
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Students read their own stats" on public.user_stats
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Students read their own entitlements" on public.entitlements
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Students read their own weekly reviews" on public.weekly_reviews
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Students read their own journal" on public.journal_entries
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Students read their own reservation" on public.reservations
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Referrers read their own referrals" on public.referrals
  for select to authenticated using ((select auth.uid()) = referrer_id);
create policy "Users read their own roles" on public.roles
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "Anyone logs events for themselves" on public.events
  for insert to anon, authenticated
  with check (user_id is null or user_id = (select auth.uid()));

-- Second lock: even if a policy were added by mistake, the browser roles can't write.
revoke insert, update, delete, truncate on
  public.packs, public.mission_library, public.profiles, public.user_missions,
  public.xp_events, public.user_stats, public.entitlements, public.weekly_reviews,
  public.journal_entries, public.reservations, public.referrals, public.roles
from anon, authenticated;
revoke select, update, delete, truncate on public.events from anon, authenticated;
revoke all on all tables in schema public from anon;
grant insert on public.events to anon;

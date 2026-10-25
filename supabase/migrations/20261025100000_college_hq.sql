-- Phase 7: College HQ for training and placement (T&P) cells (docs/PRODUCT.md section 9).
--
-- Security model:
-- * RLS on every table from this file. Students and college admins (TPOs) only READ.
--   All writes happen in server code with the secret key, after checking the user.
-- * A TPO reads only their own organisation: its batches, the students who joined
--   those batches with consent, and those students' missions inside the batch
--   season. Never profiles, quiz answers, journals, email or anything else.
-- * Leaving a batch deletes the membership row, so the student disappears from the
--   college view from that moment. Their account and history stay.

create table public.orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  city text check (char_length(city) <= 40),
  created_at timestamptz not null default now()
);

-- College admins (TPOs). Added only by the server, from a founder's invite.
create table public.org_admins (
  org_id uuid not null references public.orgs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);
create index org_admins_user on public.org_admins (user_id);

-- One-time invite links for TPOs. Only a hash of the link's secret is stored.
create table public.org_invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs (id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  label text check (char_length(label) <= 80),
  created_by uuid references auth.users (id) on delete set null,
  expires_at timestamptz not null,
  used_by uuid references auth.users (id) on delete set null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.batches (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 60),
  starts_on date not null,
  ends_on date not null check (ends_on > starts_on and ends_on <= starts_on + 120),
  join_code text not null unique check (join_code ~ '^[A-Z0-9]{6,10}$'),
  sections text[] not null default '{}' check (cardinality(sections) <= 30),
  -- A paid batch: members get Season Pass access for the season dates.
  grants_pass boolean not null default false,
  -- A demo batch: College HQ shows generated sample data, clearly labelled.
  is_sample boolean not null default false,
  created_at timestamptz not null default now()
);
create index batches_org on public.batches (org_id);

-- Students who joined a batch, with consent. One batch at a time per student.
-- The college sees `display_name` (first name and an optional initial), never the profile.
create table public.batch_members (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  batch_id uuid not null references public.batches (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 44),
  section text check (char_length(section) <= 30),
  consented_at timestamptz not null,
  joined_at timestamptz not null default now()
);
create index batch_members_batch on public.batch_members (batch_id);

-- In-app reminders from a TPO to a student who needs a nudge. One per student per day.
create table public.nudges (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.batches (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  sent_by uuid references auth.users (id) on delete set null,
  local_date date not null,
  seen_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, local_date)
);
create index nudges_batch on public.nudges (batch_id, local_date desc);

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.orgs enable row level security;
alter table public.org_admins enable row level security;
alter table public.org_invites enable row level security;
alter table public.batches enable row level security;
alter table public.batch_members enable row level security;
alter table public.nudges enable row level security;

create policy "Admins read their own admin rows" on public.org_admins
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "Admins read their organisation" on public.orgs
  for select to authenticated using (
    exists (select 1 from public.org_admins a where a.org_id = orgs.id and a.user_id = (select auth.uid()))
  );

create policy "Admins read their organisation's batches" on public.batches
  for select to authenticated using (
    exists (select 1 from public.org_admins a where a.org_id = batches.org_id and a.user_id = (select auth.uid()))
  );
-- (Students get their batch's name and dates from the server. A policy here that
-- looked at batch_members would loop back through batch_members' own policy.)

create policy "Students read their own membership" on public.batch_members
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Admins read members of their organisation's batches" on public.batch_members
  for select to authenticated using (
    exists (
      select 1 from public.batches b join public.org_admins a on a.org_id = b.org_id
      where b.id = batch_members.batch_id and a.user_id = (select auth.uid())
    )
  );

-- Mission progress of current members, only inside the batch season.
create policy "Admins read members' missions in the batch season" on public.user_missions
  for select to authenticated using (
    exists (
      select 1 from public.batch_members m
        join public.batches b on b.id = m.batch_id
        join public.org_admins a on a.org_id = b.org_id
      where m.user_id = user_missions.user_id
        and a.user_id = (select auth.uid())
        and user_missions.local_date between b.starts_on and b.ends_on
    )
  );

create policy "Students read their own nudges" on public.nudges
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Admins read nudges in their organisation" on public.nudges
  for select to authenticated using (
    exists (
      select 1 from public.batches b join public.org_admins a on a.org_id = b.org_id
      where b.id = nudges.batch_id and a.user_id = (select auth.uid())
    )
  );

-- Second lock: browser roles can't write any of these, and visitors can't read them.
revoke insert, update, delete, truncate on
  public.orgs, public.org_admins, public.org_invites, public.batches, public.batch_members, public.nudges
from authenticated;
revoke all on public.orgs, public.org_admins, public.org_invites, public.batches, public.batch_members, public.nudges
from anon;
revoke all on public.org_invites from authenticated;

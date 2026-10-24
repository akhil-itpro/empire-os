-- The launch checklist in Founder HQ (docs/PRODUCT.md section 10): manual
-- checkboxes saved in the database. Only the server reads or writes it, after
-- checking the founder role, so RLS is on with no policies for browser roles.

create table public.launch_checklist (
  id text primary key,
  section text not null,
  label text not null,
  position smallint not null,
  done boolean not null default false,
  done_at timestamptz,
  done_by uuid references auth.users (id) on delete set null
);

alter table public.launch_checklist enable row level security;
revoke all on public.launch_checklist from anon, authenticated;

insert into public.launch_checklist (id, section, label, position) values
  ('friends-landing-phones', 'Before inviting friends', 'Landing to HQ works on Android Chrome and iPhone Safari', 1),
  ('friends-progress-survives', 'Before inviting friends', 'Progress survives refresh, sign-out and sign-in', 2),
  ('friends-missions-differ', 'Before inviting friends', 'Missions differ for different answers', 3),
  ('friends-security-check', 'Before inviting friends', '/security-check passes and is recorded', 4),
  ('friends-policies-linked', 'Before inviting friends', 'Privacy Policy and Terms drafts published and linked', 5),
  ('friends-export-delete', 'Before inviting friends', 'Data export and account delete work', 6),
  ('college-contact-filled', 'Before the first college pilot', 'Real name or business name, contact email and grievance contact filled in', 7),
  ('college-consent-reviewed', 'Before the first college pilot', 'Consent screen for joining a college batch reviewed', 8),
  ('college-agreement', 'Before the first college pilot', 'Two-page college agreement drafted', 9),
  ('college-gst', 'Before the first college pilot', 'GST question answered by a CA', 10),
  ('college-trademark', 'Before the first college pilot', 'Trademark search for "EMPIRE OS" done', 11),
  ('money-lawyer', 'Before taking money', 'A lawyer reviewed Privacy Policy, Terms and refund policy', 12),
  ('money-kyc', 'Before taking money', 'Razorpay KYC approved', 13),
  ('money-refund', 'Before taking money', 'Refund policy decided and published', 14),
  ('money-day7', 'Before taking money', 'Day-7 return at 15% or more for the last two weekly cohorts', 15),
  ('money-dark-patterns', 'Before taking money', 'Paywall, banners and quiz checked against the 13 dark patterns', 16),
  ('money-payment-tests', 'Before taking money', 'Payment test-mode cases all pass', 17),
  ('money-pro-plans', 'Before taking money', 'Vercel Pro and Supabase Pro', 18);

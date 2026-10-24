# Launch checklist

Tick only what was verified. Claude can tick the Security and Product items after running the checks; the founder ticks the rest. Anything unticked in a section blocks that stage.

## Before inviting friends (end of Phase 5)

Product
- [ ] Landing to HQ works on Android Chrome and iPhone Safari
- [ ] Progress survives refresh, sign-out and sign-in
- [ ] Missions differ for different answers

Security (from `/security-check`)
- [ ] RLS on every personal table
- [ ] Two-user isolation test passes
- [ ] Students can't write XP, streaks, passes, rewards or roles
- [ ] No secrets in the browser bundle; `.env.local` never committed
- [ ] Script and very long input tested in name and journal
- [ ] `npm audit` has no high or critical issues in production dependencies

Privacy
- [ ] Privacy Policy and Terms drafts published and linked
- [ ] Data export works
- [ ] Account delete works and removes the login
- [ ] No ad pixels, session recording or third-party trackers

## Before the first college pilot (end of Phase 7)

- [ ] Founder's real name or business name, contact email and grievance contact filled in
- [ ] Consent screen for joining a college batch reviewed
- [ ] TPO of one college can't see another college (RLS test)
- [ ] Two-page college agreement drafted (scope, price, payment terms, student data)
- [ ] GST question answered by a CA (register now or later)
- [ ] Trademark search for "EMPIRE OS" on IP India's public search (classes 9, 41, 42)

## Before taking money (Phase 10 gate)

- [ ] A lawyer reviewed Privacy Policy, Terms and refund policy
- [ ] Razorpay KYC approved
- [ ] Refund policy decided and published
- [ ] Day-7 return at 15% or more for the last two weekly cohorts
- [ ] Paywall, banners and quiz checked against India's 13 specified dark patterns
- [ ] Payment test-mode cases all pass (success, failure, closed checkout, repeated webhook, Instagram browser)
- [ ] Vercel on the Pro plan (Hobby is non-commercial only) and Supabase on Pro (free projects pause)

## Before the data-protection duties start (13 May 2027)

- [ ] Consent notices, rights requests and breach steps reviewed against the DPDP Rules with a lawyer

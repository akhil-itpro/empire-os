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
- [x] No secrets in the browser bundle; `.env.local` never committed
- [x] Script and very long input tested in name and journal
- [x] `npm audit` has no high or critical issues in production dependencies

Privacy
- [ ] Privacy Policy and Terms drafts published and linked
- [ ] Data export works
- [ ] Account delete works and removes the login
- [x] No ad pixels, session recording or third-party trackers

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

## Security check results

### 2026-10-24, Claude (before Supabase exists)

| Check | Result | Evidence |
| --- | --- | --- |
| 1. RLS everywhere | Partly verified | `tests/unit/db.test.ts` runs every migration on PGlite (real PostgreSQL) with Supabase's roles: RLS is on for every table, owner-only reads hold. Supabase security advisors not run yet (no project). |
| 2. Two-user isolation | Not run | `npm run test:rls` is ready; needs `.env.local`. PGlite version passes. |
| 3. Protected writes | Partly verified | On PGlite, a signed-in student can't update missions, XP, stats, entitlements, roles or trial dates, or insert XP. Recheck on Supabase with `npm run test:rls`. |
| 4. Limits on the server | Verified (logic) | `tests/unit/season-service.test.ts`: one swap a day, Free gets one mission, done/skipped missions can't change, other students' missions refused. Playwright covers the same through the UI in local test mode. |
| 5. Secrets | Pass | `npm run build`, then searched `.next/static`: no `SUPABASE_SECRET`, `RAZORPAY_KEY_SECRET` or real key values. `sb_secret_` appears only as a prefix check inside the Supabase library. `git log --all -- .env.local` prints nothing; `.env.local` is ignored. |
| 6. Input | Pass | `tests/e2e/trust.spec.ts`: `<script>` in the journal is shown as text and runs nothing; the journal stops at 280 characters and the server refuses longer; a script as a first name is refused. |
| 7. Dependencies | Pass | `npm audit --omit=dev`: 0 vulnerabilities. |
| 8. College HQ | Not built yet | Phase 7. |
| 9. Payments | Not built yet | Phase 10. |
| Trackers | Pass | No third-party scripts, pixels or session recording in the source. |

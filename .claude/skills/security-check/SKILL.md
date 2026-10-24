---
name: security-check
description: Run the EMPIRE OS security self-audit and report pass or fail honestly. Use when the founder types /security-check, and before inviting real users, onboarding a college or taking payments.
disable-model-invocation: true
---

Run every check for real. Never mark a check passed without running it.

1. **RLS everywhere.** List every table in the `public` schema. Confirm row-level security is enabled and the policies match `docs/PRODUCT.md` section 11. Run the Supabase security advisors through the MCP server and record every warning.
2. **Two-user isolation.** Run `npm run test:rls`. Two test users must fail to read or write each other's rows in every personal table.
3. **Protected writes.** As a signed-in normal user using only the publishable key, try to update `user_stats`, `entitlements`, referral rewards and `roles`, and to insert `user_missions` for future days. Every attempt must fail.
4. **Limits on the server.** Call the complete, swap and pack endpoints directly beyond the Free limits. They must refuse.
5. **Secrets.** Run `npm run build`, then search `.next/static` for `SUPABASE_SECRET`, `sb_secret_`, `service_role` and `RAZORPAY_KEY_SECRET`. Nothing may match. Confirm `.env.local` is ignored and was never committed (`git log --all -- .env.local` prints nothing).
6. **Input.** Put `<script>alert(1)</script>` and a 10,000-character string into first name and journal. Confirm the text is escaped and length limits hold.
7. **Dependencies.** Run `npm audit --omit=dev` and report high or critical issues.
8. **College HQ** (once Phase 7 exists). A TPO of college A can't read college B. A student who left a batch no longer appears.
9. **Payments** (once Phase 10 exists). A forged checkout response, a replayed webhook and a wrong amount never grant a pass.

Report a table with check, result and evidence. Fix every failure, re-run, and report again. Tick only verified items in the Security section of `docs/LAUNCH_CHECKLIST.md`.

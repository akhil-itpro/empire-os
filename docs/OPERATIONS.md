# Operations runbook

This guide explains how to review and eventually operate the implemented app. It records responsibilities and verification work; it does not establish that hosting, backups, authentication or payments are already running.

[Setup](SETUP.md) · [Architecture](ARCHITECTURE.md) · [Security](SECURITY.md) · [Testing](TESTING.md) · [Handoff](../HANDOFF.md)

## Current operating state

The working app is available in local test mode. Supabase, Google sign-in, Vercel and real Razorpay flows remain founder setup and integration tasks. No verified production URL or live customer metrics are claimed.

The repository has no scheduled-job/cron endpoint. Daily missions are generated when the season service is called; college reminders are in-app nudges initiated by an administrator. There is no WhatsApp, push or email reminder service.

## Local review routine

1. Read [HANDOFF.md](../HANDOFF.md) and review the working-tree status before editing. Preserve work from other sessions.
2. Use the [setup guide](SETUP.md) to start an isolated local test server. Use generated identities and fictional student/college records.
3. Follow the [reviewer tour](DEMO.md), including a mission completion, profile change, weekly review and sample college report.
4. Run the checks appropriate to the change and record the actual results in the [testing guide](TESTING.md) and session handoff. Live tests must be recorded separately from substitute-provider tests.
5. Stop the test server when finished. Its in-memory records are disposable; restarting does not preserve a season.

If an unexpectedly empty demo appears, check whether the server restarted before assuming a persistence defect. Do not use test mode for real student information.

## Before configuring a live environment

The founder enters secret values directly into local/host settings. Agents must not read environment files or request keys in chat. Variable names and safe setup instructions are in [SETUP](SETUP.md).

| Area | Required check before relying on it |
| --- | --- |
| Database | Apply the eight migrations in filename order; compare generated types with [`lib/supabase/types.ts`](../lib/supabase/types.ts) |
| Authentication | Verify email-code and Google sign-in, redirects, sign-out and session refresh using real test accounts |
| Permissions | Run `npm.cmd run test:rls` on the intended development project and inspect Supabase Security Advisor; recheck every role's application access |
| Host | Build and deploy the intended commit, set the canonical site URL, and confirm neither local test flag is configured |
| Data rights | Verify populated JSON export and deletion with disposable accounts on the actual database |
| College | Test two organizations, consenting membership, leaving and the visibility/access effects |
| Payments | Keep reserve mode until the founder's existing business gates are met, then complete real provider test-mode cases before taking money |
| Operations | Decide alert ownership, database backups and a restoration procedure; perform a restore drill before making recovery promises |

Check the [launch checklist](LAUNCH_CHECKLIST.md) with the founder. Policy/contact placeholders and legal drafts need professional review; tax and financial-record handling need the founder's CA. Provider plan terms and regulatory guidance in earlier project files are dated material and need checking by the appropriate professional when acted on.

## Database changes

[`supabase/migrations/`](../supabase/migrations/) is the schema history. Add one new migration per change; do not edit an already-applied migration. Enable RLS and define appropriate grants/policies in the same migration that introduces personal data.

There is currently no `db:migrate` package command. Apply migrations through the authorized Supabase connection, or let the founder paste each new file into the SQL Editor when that connection is unavailable. Do not claim a file has been applied merely because it was committed. Record the project, migration filename and result without secret connection values.

Before a live schema change, confirm a recoverable backup and test the migration on a separate development project. Prefer a follow-up migration to reverse a schema change; do not delete history or reset an environment containing real records.

## Founder and college administration

Founder access comes from the database role table. Creating an account or visiting `/founder` does not make a user a founder in live mode. Use a trusted administrative process to assign that role; do not invent a browser-accessible promotion endpoint.

The founder creates an organization, batches and TPO invitations. Administrator invitations expire after 14 days, are single-use and store a SHA-256 hash rather than the original token. Copy the invitation when it is created and keep it private. A replacement invitation is the recovery path for an expired/used link.

Students join one batch at a time and explicitly consent to progress sharing. A paid batch grants access for its dates. Leaving removes college visibility and ends the membership's access grant; the student's own account and independent entitlements remain. Use the [college manual](manuals/COLLEGE_GUIDE.md) for the interface steps.

Sample College HQ figures are generated demonstration records, clearly labelled. Do not count them as customers, active students or commercial results.

## Payment operation and reconciliation

`PAYMENTS_LIVE=1` and all three server payment settings are required to create a real gateway. Otherwise the app stays in reserve mode. The local fake gateway is selected separately in test mode; it never proves a real charge or refund.

For a payment investigation:

1. Identify the student's stored order, amount, status and entitlement source without copying credentials or personal details into an issue.
2. Compare the actual provider order/payment status with the stored record. A client success message is not enough to grant access manually.
3. Review signature, amount, currency and captured/paid checks in [`payment-service.ts`](../lib/server/payment-service.ts). Repeated verified finalization uses the order grant source to avoid duplicate access.
4. Test delayed/repeated delivery and recovery on provider test accounts before relying on retries in production.

There is no refund API or refund-management workflow in this codebase. The founder's refund policy and any provider-side refund procedure remain launch work. Avoid promising a refund result or issuing financial guidance through documentation.

## Export, deletion and retention

`GET /me/data/export` downloads the signed-in user's implemented export sections as JSON. The live adapter currently uses empty-result fallbacks on several queries without checking returned errors. Before launch, create a populated disposable account and compare every expected section against the actual database. Treat completeness/error handling as an open implementation follow-up.

The account-deletion action requires the exact text `DELETE`, deletes the authenticated login and checks whether the login/profile remains. Foreign-key cascades remove linked student rows; analytics events are retained with their user association cleared. Verify these effects on the real project rather than assuming local memory behavior proves them.

Payment rows currently reference the student profile with `ON DELETE CASCADE`, so account deletion also removes those database payment records. Before taking money, the founder and CA/lawyer need to decide the required record-retention policy and reconcile it with deletion behavior. This guide does not establish a statutory retention period.

Public college-demo requests are keyed by submitted contact fields, not by an authenticated student's account. Student account deletion is not a general cleanup operation for those separate work-contact requests. A defined operator process for their retention and requests remains needed before collecting real inquiries.

## Incident and recovery notes

If a live secret is exposed, the founder must rotate it through the provider and update host settings; never paste it into a ticket, screenshot or handoff. Preserve useful error context without retaining private journal content, auth cookies or payment signatures. Follow [security reporting](../SECURITY.md).

For a bad deployment, return to a previously verified deployment through the hosting provider and record the source commit. For code undo, use a new `git revert` checkpoint; never force-push, reset hard or delete uncommitted work. A code rollback does not automatically reverse a migration or restore lost records.

Backups, monitoring, alert response and restore success have not been verified in the current project. Record the owner, last successful backup, tested restore procedure and recovery limits before promising continuity to users or colleges.

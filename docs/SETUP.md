# Set up EMPIRE OS

This guide covers the local reviewer demo and the work still needed for a live deployment. The demo uses an **in-memory store** and pretend identities. It needs no Supabase account, payment account or AI key, and its data is lost when the server process restarts.

[Documentation hub](README.md) · [Reviewer tour](DEMO.md) · [Testing](TESTING.md) · [Current handoff](../HANDOFF.md)

## Requirements

- Node.js **24.x**, as specified in [package.json](../package.json), with npm.
- A local checkout of this repository (`git clone https://github.com/akhil-itpro/empire-os.git`).
- A terminal opened in the project folder, such as `empire-os`.
- Chromium installed by Playwright only if running browser tests or generating screenshots.

The examples use Windows PowerShell. `npm.cmd` and `npx.cmd` avoid the PowerShell restriction that can prevent `npm.ps1` from running; no execution-policy change is needed. Other terminals can use `npm` and `npx`.

## Start the local demo

From the project folder:

```powershell
npm.cmd ci
$env:EMPIRE_TEST_MODE='1'
$env:NEXT_PUBLIC_EMPIRE_TEST_MODE='1'
$env:EMPIRE_DIST_DIR='.next-test'
npm.cmd run dev -- --port 3200
```

Open **http://localhost:3200**. Select **Find your archetype**, complete the adult age check and quiz, take the oath, then select **Test sign-in (local test mode)**. This creates a new pretend student and opens HQ. [DEMO.md](DEMO.md) provides a complete set of sample answers and expected screens.

Set all three variables before starting the server. The first selects the server's memory store, the second exposes the matching pretend sign-in button in the browser, and the third keeps generated files separate from the normal application build. The manual demo and Playwright both use `.next-test`: stop the demo before running Playwright, and finish Playwright before restarting the demo. They are switches and a folder name, not credentials.

| Setting | Local value | Purpose |
| --- | --- | --- |
| `EMPIRE_TEST_MODE` | `1` | Selects pretend sessions, the in-memory store and local test endpoints |
| `NEXT_PUBLIC_EMPIRE_TEST_MODE` | `1` | Shows the test sign-in option and routes browser events to the local test handler |
| `EMPIRE_DIST_DIR` | `.next-test` | Uses the ignored Next.js test output directory; run the demo and Playwright separately |

There are no pre-existing student accounts to choose from. Complete the quiz to create a student. For the separate founder and sample-college tour, open **http://localhost:3200/api/test-login** in a private browser window; it creates a new pretend founder and redirects to Founder HQ. Keep that window separate to preserve the student session in your original window.

### What this mode proves

It lets a reviewer use the real application screens, server services and domain rules with synthetic data. It does **not** verify real email/Google authentication, Supabase persistence, hosted row-level security, payment processing or deployment. Memory is shared by requests in the dev server process; browser cookies select identities. It is not a persistent local database or a production service.

The server enables test mode only when `NODE_ENV` is not `production` and `EMPIRE_TEST_MODE=1`. Production rejects the test sign-in route. Do not set either test-mode switch in hosting settings. See [test-mode.ts](../lib/server/test-mode.ts), [the test-login route](../app/api/test-login/route.ts) and [security](SECURITY.md).

### Stop the demo

Press **Ctrl+C** in its terminal. Close that terminal to discard the temporary environment switches, or remove them in the same PowerShell window:

```powershell
Remove-Item Env:EMPIRE_TEST_MODE
Remove-Item Env:NEXT_PUBLIC_EMPIRE_TEST_MODE
Remove-Item Env:EMPIRE_DIST_DIR
```

Removing a variable that is already absent reports a PowerShell message; it does not affect project files. A new server process begins with an empty memory store. Browser quiz answers may still exist in local storage; use a fresh private window for a completely fresh reviewer journey.

## Try it on a phone

1. Connect the phone and computer to the same trusted private Wi-Fi. Use fictional information: this mode deliberately includes test identities and founder access.
2. Stop the existing demo with **Ctrl+C**. In the same terminal, keep the three demo settings above and run:

   ```powershell
   npm.cmd run dev -- --hostname 0.0.0.0 --port 3200
   ```

3. Open the **Network** address printed by Next.js on the phone. It will look like `http://192.168.x.x:3200`; use the actual address printed on your computer.
4. Select **Find your archetype**, complete the quiz and oath, then select **Test sign-in (local test mode)**.
5. On HQ, mark one mission done, refresh, then open **Path**, **Stats** and **Me**. The exact ten-minute checklist is in [TESTING.md](TESTING.md#test-it-on-your-phone).
6. Stop the server after the review. The phone has its own browser identity; it does not automatically share the laptop's student session.

If Windows asks about network access, allow the private network used for this review. If the phone cannot connect, check the printed address, port and Wi-Fi, then the Windows private-network firewall rule. Home-screen installation and the device share sheet need separate real-device checks on the intended hosted origin; a local browser test alone does not prove them.

## Normal development and a production build

`npm.cmd run dev` uses port 3000 by default. Without the explicit test switches, application services use Supabase. If Supabase is not configured, the landing/quiz can still be inspected, but saving a season through real sign-in is not connected. Missing settings do **not** automatically select a demo.

The quality checks are:

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run docs:check
npm.cmd test
npx.cmd playwright install chromium
npm.cmd run test:e2e
npm.cmd run build
```

Playwright starts its own test-mode dev server on port **3100**, with output in `.next-test`. Keep that port free or ensure any reused server has exactly the expected test configuration. Stop the manual port-3200 demo before running browser tests because it uses the same output directory. Do not run two Next.js processes using that directory at the same time.

`npm.cmd run build` creates a production build. `npm.cmd run start` serves that build; it does not provide the in-memory demo, because test mode is disabled in production. See [TESTING.md](TESTING.md) for scope, evidence and limits.

## Live setup remains a separate milestone

The repository contains the live integration code, but a configured and verified live deployment is still pending. The current source expects these settings; this table lists names only.

| Setting | Used for |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project address |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser Supabase client |
| `SUPABASE_SECRET_KEY` | Server-side privileged database access; never a public variable |
| `NEXT_PUBLIC_SITE_URL` | Canonical site address used for links and metadata |
| `PAYMENTS_LIVE` | Enables checkout only when set to `1` and all payment settings are present |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | Server payment gateway and webhook verification |

The founder enters actual values privately in local and hosting settings. Never paste secrets into chat, GitHub issues or documentation, and never commit them. No payment settings are needed for the reviewer demo.

The next live work, recorded in [HANDOFF.md](../HANDOFF.md), is:

1. Create the intended Supabase project and configure the three Supabase settings privately.
2. Apply all eight existing migrations in [supabase/migrations](../supabase/migrations/) in filename order. Compare generated database types with [lib/supabase/types.ts](../lib/supabase/types.ts). Do not rewrite old migrations.
3. Configure email code templates and Google sign-in, including the application's `/auth/callback` return route. Verify the actual account/provider settings during this step.
4. Run `npm.cmd run test:rls` against the intended development project, then check student and college access with real sign-in. The script creates and removes throwaway test users and rows; it is separate from the local test suite.
5. Import the repository into the intended Vercel project, add the required settings privately and verify the deployed application. Do not copy test switches into hosting settings.
6. Complete the [launch checklist](LAUNCH_CHECKLIST.md), replace operator/contact placeholders in the legal pages and obtain the required professional reviews.

Payments remain in **reserve mode** until the founder's existing gates are satisfied. These include the documented retention gate, genuine reservations, Razorpay setup and verified provider test cases. Adding keys is not approval to accept money. Legal text and agreements require a lawyer; tax and invoicing decisions require a CA. Current provider plans, prices and account screens must be verified when live setup is performed.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| “Sign-in isn't connected yet” | The local demo was started without `NEXT_PUBLIC_EMPIRE_TEST_MODE=1`, or the browser has an old build. Stop the server, set both test switches, then restart. |
| Test sign-in button appears but saving fails | Check `EMPIRE_TEST_MODE=1` on the server as well as the public switch. Both are required. |
| Old sample session stops working after restart | The memory store was reset. Complete the quiz in a new private window to make a new sample student. |
| Port 3100 or 3200 is already in use | Stop the known process using that port, or choose another port for a manual demo. The existing Playwright configuration expects 3100. |
| Next.js reports another process using its files | Use a different `EMPIRE_DIST_DIR` for each running server, or stop the other server. |
| Supabase isn't set up yet during `test:rls` | That command requires live development-project configuration. Local `npm.cmd test` uses its own migration checks and does not need credentials. |
| Production start has no test sign-in | This is expected: use `next dev` with the explicit local test switches for the reviewer demo. |

For application internals, see [architecture](ARCHITECTURE.md); for operational work after setup, see [operations](OPERATIONS.md).

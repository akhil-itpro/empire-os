# Reviewer tour

Explore EMPIRE OS as a student, a college placement team and the founder. This is a tour of the implemented local application using **fictional data**, not a public hosted demo or evidence of customer results.

[Project overview](../README.md) · [Setup](SETUP.md) · [Case study](CASE_STUDY.md) · [Documentation hub](README.md)

## Start here

Follow [SETUP.md](SETUP.md#start-the-local-demo) to run the isolated test-mode server on **http://localhost:3200**. No external account or key is required. Test sign-in is available only with the local switches; a production build does not support it. The server stores sample data in memory, so a restart discards it.

Use two browser windows: a regular window for the student and a private window for the founder/college tour. `/api/test-login` replaces the identity in its current browser session, so use the separate window to keep both roles available.

## 1. Build a season before sign-up

Open `/` and select **Find your archetype**. Choose **21–24** at the adult age check, then use these sample answers:

| Question | Sample answer |
| --- | --- |
| First name | Rahul |
| City | Pune |
| Current situation | College student |
| Main goal | Get my first job |
| Pillar priority | Career, Mind, Body, Money, in that order |
| Daily time | 45 minutes |
| Budget | Only free stuff |
| Gym | Home only |
| Laptop | Phone only |
| Biggest obstacle | Phone |
| Intensity | Steady |

After the goal and budget answers, the app reflects the plan back using the supplied information. The time calculation for 45 minutes a day is **67.5 hours across 90 days**. The reveal should be **The Grinder**, with a three-act season and an explanation of time, budget and equipment constraints.

Select **Start Season 1**, then press and hold for the oath. With reduced motion enabled, **Take the oath** is a single tap. At **Save your plan to start Day 1**, select **Test sign-in (local test mode)**. HQ opens with three missions and a first-mission prompt.

**What to assess:** the plan exists before account creation, its explanation reflects actual answers, and the phone-only/free constraints affect mission selection. This is a deterministic plan engine, not a live AI response. [Quiz logic](../lib/quiz/) · [Plan engine](../lib/plan-engine/) · [Funnel tests](../tests/e2e/funnel.spec.ts).

## 2. Complete the daily loop

On **HQ** (`/hq`), open a mission ticket to inspect its instructions, minutes and XP. Mark one mission done. It receives a **DONE** stamp, the completion count changes and XP increases. Refresh to confirm the change remains for the running server session.

Complete the other two missions. Expect a **Day 1 complete** ticket ("All three missions done. Bonus +30 XP.") with the XP earned, the **First mission** and **Full day** medals, and a preview of tomorrow's first mission. Open a completed ticket if you want to undo it: **Undo, mark not done** lives in the detail sheet.

For a separate exercise, start a fresh student journey in another private session. Open an unfinished mission and select **Swap for another mission**; a second swap is unavailable that day. A skip asks for **No time**, **Not relevant** or **Too hard**. Use this on the sample account only.

**What to assess:** the UI distinguishes completion, swapping and skipping, while server services enforce the rules. [Daily-loop tests](../tests/e2e/daily-loop.spec.ts) · [Season service](../lib/server/season-service.ts).

## 3. Inspect Path, Stats and Me

| Tab | Try | Expected behavior |
| --- | --- | --- |
| **Path** (`/path`) | Read the weekly nodes | Thirteen weeks in three acts; the current week is marked |
| **Stats** (`/stats`) | Open **Show as a table** | Mission activity is available as a table as well as a chart |
| **Me** (`/me`) | Save a fictional **One line for today** | The journal line survives refresh for the current server session |
| **Me** | Select **Edit my plan**, change a setting and save | Changes start tomorrow; today's assigned missions remain intact |

Me also links to college membership, share cards, invites, Season Pass and privacy/data controls. Do not put personal information into the reviewer demo. [Student guide](manuals/STUDENT_GUIDE.md) · [Tab tests](../tests/e2e/tabs.spec.ts).

## 4. Review a week without waiting a week

In local test mode, **Me → Founder tools** is available to the sample student. Select **+1 day** six times, waiting for each update: a new Day 1 student is now on **Day 7**. Return to HQ and open the **War Room: week 1** link, or open `/war-room`.

Choose **Too hard** and **Energy**, then select **Set next week**. The result explains what changed using the week's actual sample activity. With a low-completion sample week, it should offer a shorter/easier plan and energy-related missions.

For the goal-change branch, select **My goal** and **Get fit and strong** before submitting. The result asks **Apply new plan?** with a way to keep the current plan. Applying a proposal changes the upcoming plan; it does not rewrite past XP and rank. Go back to Me and select **Today** to reset the local clock when done.

**What to assess:** weekly adaptation is explained and a major plan change requires a choice. Time travel changes the current browser's effective user clock; it is a testing tool, not a claim of seven days of real engagement. [War Room rules](../lib/plan-engine/war-room.ts) · [Browser coverage](../tests/e2e/war-room.spec.ts).

## 5. Inspect Free and reserve mode

From a new Day 1 sample student, use **Me → Founder tools → +7 days**, then **+1 day**. Open HQ. The first visit after the free week opens the Season Pass offer; select **Maybe later** to return.

The Free experience keeps one mission a day in the chosen pillar. Path weeks 2 to 13 and packs are locked. Open **Me → See Season Pass** to inspect the offer. By default it is in **reserve mode**: reserving a price records an intention and explicitly says no payment was taken.

**Season 2:** from a sample student who finished a mission or two, select **+7 days** thirteen times (Day 92). HQ shows **Season 1 complete** with that student's real numbers and **Start Season 2**. Starting it returns to Day 1 with XP, rank and medals kept and no second free week. [Browser coverage](../tests/e2e/daily-loop.spec.ts).

Do not enter real payment details during this tour. Automated checkout tests use a separate stand-in gateway; those checks do not establish that Razorpay has been configured or that real money moved. [Payment tests](../tests/e2e/payments.spec.ts) · [Current status](ROADMAP.md).

## 6. Open Founder HQ and a sample college

In the separate private window, open **http://localhost:3200/api/test-login**. This local-only endpoint creates a new pretend founder and redirects to **Founder HQ** (`/founder`). Inspect sign-ups, the funnel, return cohorts, skipped missions, reservations and the launch checklist. Any activity comes from the current sample store, not live customers.

Find **Create a sample batch** in the college tools, select it, then choose **Open the demo**. The generated college batch is labelled **Sample data**. Its dashboard figures and names are fixtures.

| College screen | Review |
| --- | --- |
| Overview | Active students, mission counts, chart/table view, **Need a nudge** and sections |
| Students | Consenting batch members and their progress |
| Weekly report | Printable summary; **Save as PDF** opens the browser's print workflow |
| Invite | Join code, link and printable QR poster |

Return to Founder HQ to inspect college/batch creation and the invite controls. The sample tour does not verify a real college's access configuration. [College guide](manuals/COLLEGE_GUIDE.md) · [Founder guide](manuals/FOUNDER_GUIDE.md) · [College browser tests](../tests/e2e/college.spec.ts).

## 7. Check privacy controls

Back in the student window, find **Me → Privacy and data → Download or delete my data** (`/me/data`). Download the account's JSON export. It should contain that sample student's data. Inspect the privacy and terms links; they remain clearly marked drafts with operator/contact placeholders.

Account deletion requires typing **DELETE**. Use it only at the end of a disposable sample journey: deletion removes that sample account and signs the browser out. [Trust tests](../tests/e2e/trust.spec.ts) · [Security model](SECURITY.md).

## Review the evidence and limits

- **Implementation:** inspect [architecture](ARCHITECTURE.md), [API](API.md) and the source links above.
- **Validation:** read [TESTING.md](TESTING.md) for dated results and what local tests cannot establish.
- **Visuals:** see the [README gallery](../README.md) and [capture provenance](images/README.md). They show actual application renders with synthetic data.
- **Pending launch:** real Supabase, email/Google sign-in, deployed access checks, Razorpay verification and real-device sharing remain separate work in [HANDOFF.md](../HANDOFF.md) and the [launch checklist](LAUNCH_CHECKLIST.md).

Stop the local demo with **Ctrl+C** after reviewing. Nothing in this tour establishes adoption, placement outcomes, improved health, revenue or long-term retention.

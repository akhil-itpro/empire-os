# Founder guide

[Project overview](../../README.md) · [Reviewer tour](../DEMO.md) · [Documentation hub](../README.md)

Founder HQ supports reviewing product activity, setting up colleges and tracking launch work. It is available at `/founder` only to an account with the server-managed founder role. There is no public role-selection control. The current app runs as a local demonstration; real provider and deployment setup remain pending.

## Open the dashboard

Use your authorized founder account, then open `/founder`. A normal account gets a not-found result. In local test mode the [demo guide](../DEMO.md) explains the dedicated test-login route; it is not a production sign-in mechanism.

Choose **Last 7 days**, **Last 30 days** or **Last 90 days**. The dashboard uses India time. Metrics are read-only; the **Colleges and batches** forms and **Launch checklist** below them can save changes.

## Interpret the numbers

| Area | Use it for | Keep this distinction |
| --- | --- | --- |
| **Sign-ups** / **Sign-ups per day** | Observe account creation in the selected period | Accounts are not active or paying customers |
| **Funnel** | Locate friction between landing, quiz, reveal, oath, sign-up and first mission | Steps count distinct event actors independently; they are not a guaranteed linked cohort |
| **Return** | Read Day-1, Day-7 and Day-30 mission return | Only sign-ups in range old enough for that offset qualify; a dash means no eligible cohort |
| **Missions done by pillar** | Review where activity is concentrated | Completion is self-reported |
| **Most-skipped missions** | Inspect No time / Not relevant / Too hard reasons | A reason is a clue for review, not a diagnosis |
| **Paywall views by source** | See which entry points create offer views | A view is not purchase intent |
| **Reservations** | Review saved offers | No payment was taken; this store summary is not simply a count of events in the selected date range |
| **Season Passes sold** | Review `payment_done` event count in range | Reconcile provider/payment records for financial reporting |
| **Share cards made** / **Referral sign-ups** | Review card generation and attributed sign-ups | A generated card may never be shared; a signup may not activate |
| **Website** / **Demo requests** | Review colleges-page interest and submitted work contact details | Requests are leads rather than signed pilots |

Day-N return means the student marked a mission done on the exact date N days after sign-up. Read the cohort denominator with the percentage. The [business-value guide](../BUSINESS_VALUE.md) explains measurement limits and the proposed validation sequence.

Demo requests display the latest 20 submissions, including the supplied work email, optional phone and note. Handle them as private operational contact details; do not include them in public screenshots.

## Set up a college and batch

Under **Colleges and batches**:

1. In **Add a college**, enter **College name** and optional **City**, then choose **Add college**.
2. In **Add a batch**, select **College**, enter **Batch name**, **Season starts** and **Season ends**. Optionally enter comma-separated section names.
3. Decide whether this batch should grant paid access. Only enable **Paid batch: students get Season Pass access for these dates** when that matches the agreed offer. The 30-day pilot's pass policy is still an open founder decision.
4. Choose **Add batch**. The batch and its join code appear in the list.
5. In **Invite a TPO**, select the college and optionally add **Note for yourself**, then choose **Create invite link**.
6. Use **Copy link** and provide it to the intended administrator through your normal private process. The page shows a one-time link and its expiry; copy it while visible because it is not shown again.

The recipient signs in and chooses **Accept and open College HQ**. Students enroll separately with the batch code or join link and explicit consent. Share the [college guide](COLLEGE_GUIDE.md) and [student guide](STUDENT_GUIDE.md) for those workflows.

## Demonstrate College HQ

In **Demo for a TPO**, choose **Create a sample batch**, then **Open the demo** from the college/batch list. The generated college and students are labelled **Sample data** and excluded from the real-batch student total. Its enrollment code does not accept real students.

Use this sample for product walkthroughs, not customer or revenue claims. The sample contains a range of activity patterns for the overview, nudge list, report and poster. See [DEMO.md](../DEMO.md) for the full tour.

## Track launch work

The **Launch checklist** saves manual checkboxes. Tick an item only after the corresponding check has actually passed. It records a judgement; it does not perform provider setup, run a security test, obtain a professional review or enforce every business gate automatically.

Before inviting real users, follow [LAUNCH_CHECKLIST.md](../LAUNCH_CHECKLIST.md), [SETUP.md](../SETUP.md) and [OPERATIONS.md](../OPERATIONS.md). The current [handoff](../../HANDOFF.md) records the exact next step and pending founder actions. This documentation does not complete those gates.

## Test future days

On your own student profile, open **Me → Founder tools**. **+1 day** and **+7 days** move your own app clock; **Today** restores it. This helps inspect trial expiry and weekly review without waiting. It does not advance every student or simulate a real customer's return.

The tool is restricted by server checks to founders outside local test mode. Keep sample/test activity separate from production reporting. A local test server restart clears its in-memory records, as explained in [setup](../SETUP.md).

## Keep collection and launch honest

Reserve mode is the current default. A reservation saves a price; it does not collect money or supply proof of demand. The built checkout must still pass real Razorpay test cases before enabling collection, together with the founder's KYC, return and reservation gates.

Keep operator/contact placeholders, draft legal text and provider limits visible until resolved. Never put secret keys, real student records or private contact details in documentation or issue screenshots. The [roadmap](../ROADMAP.md) lists implemented work separately from open acceptance and deferred features.

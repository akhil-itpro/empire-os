# College HQ guide

[Project overview](../../README.md) · [Reviewer tour](../DEMO.md) · [Documentation hub](../README.md)

College HQ is for an invited training and placement officer (TPO) or college administrator. It shows participation from students who explicitly join the college's batch. The current application is demonstrated locally; real authentication, live database isolation and deployment still need verification.

## Get access

The EMPIRE OS founder creates the college, batch and administrator invite. Open the invite link while signed in with the account intended for college administration, then choose **Accept and open College HQ**. This is a one-time invitation with an expiry, so request a fresh link if it is no longer usable.

After acceptance, open `/college`. An account with a batch opens its overview. An account without College HQ access gets an explanatory page; a student account does not automatically become a college administrator. See the [founder guide](FOUNDER_GUIDE.md) for setup.

## Navigate the workspace

| Item | Purpose |
| --- | --- |
| **Overview** | Activity summary for the current batch |
| **Students** | Joined students, recent activity and eligible reminders |
| **Batches** | Available batches, dates, codes and **Open overview** links |
| **Reports** | Printable weekly report for the current batch |

On a phone the menu stacks above the content. Wide tables can scroll horizontally inside their panel.

## Invite students

From Overview choose **Invite students**. The invite page provides:

- **Copy code**: students enter it under **Me → College season → Batch code**.
- **Copy link**: a `/join/CODE` link for a college group or email. A new student completes the quiz and account flow first.
- **Open the poster**: an A4 layout with the batch code, join link and QR code, intended for printing.

Share the invitation only with the intended batch. Each student sees a consent screen and chooses **Join and share my progress**. If the batch has sections, they must pick one. They can optionally add their last-name initial.

An empty dashboard can mean no students have joined, rather than a data-sync failure. It displays **No students yet** and the invite route. A sample batch is marked **Sample data**, contains generated students and has a code that cannot be used for real enrollment.

## Read the overview

Use **Last 7 days**, **Last 14 days** or **This season**, and the **Section** filter when sections exist. The chart shows students active each day for the selected view; choose **Table** for values. The named summary tiles retain their own displayed windows. “This week” uses the latest seven days ending at the batch's as-of date, clipped to the season start; it is not a Monday-to-Sunday calendar week. After a season ends, its as-of date is the season end.

| Tile or section | Meaning |
| --- | --- |
| **Active this week** | Members with at least one finished mission in the current seven-day reporting window |
| **Missions per student** | Finished missions in that window divided by the included members |
| **Need a nudge** | Students who missed three or more consecutive days |
| **Mock interviews done** | Finished mock-interview missions this season, rather than verified interview outcomes |
| **Sections this week** | Seven-day counts and averages grouped by section |

Progress is self-reported app activity. It is not an assessment of employability, mental health or placement readiness. Comparisons should retain their date window, included members and sample/live distinction.

## Send an in-app reminder

Open **Need a nudge** on Overview or use **Students** for the fuller list. An eligible student has **Send reminder**. After a successful send it becomes **Reminder sent today** and cannot be sent again that day.

The reminder appears in the student's app when they next open it and can be dismissed. This does not send an email, SMS, push notification or WhatsApp message. A send confirmation is not proof the student has seen it.

The Students list shows display name, section, last active date, active days this week, missions this week and consecutive missed days. It sorts the most missed first and displays up to 500 students. Journals and personal quiz answers are excluded.

## Save a weekly report

Choose **Download weekly report** from Overview or **Reports** from the menu. Review the batch summary, activity trend, consistency list and section breakdown. Choose **Save as PDF** to open the browser's print dialog, then select its PDF destination.

This is a browser-print workflow rather than a server-generated attachment. Review print preview before saving or distributing it. Reports contain student activity, so share them only with the people who need them for the agreed college purpose.

## Membership and access boundaries

Only opted-in members appear in College HQ. Students can leave from Me; their account and history remain, and the college loses their ongoing visibility. They may have Season Pass access through a paid batch for its configured dates; leaving ends that batch entitlement.

College admins see batches within their authorized organization. New colleges, batches, dates and pass settings are set up by the founder; the Batches screen does not provide a self-service purchase or batch editor.

If an account shows no access or a batch cannot be opened, confirm the intended account and invitation with the founder. Do not exchange account credentials or place student data in public repository issues. For an actual deployment, complete the relevant [launch checks](../LAUNCH_CHECKLIST.md) and [operations verification](../OPERATIONS.md) first.

# Business value and validation plan

[Project overview](../README.md) · [Case study](CASE_STUDY.md) · [Documentation hub](README.md)

EMPIRE OS proposes a daily consistency product for students and a batch-progress workspace for engineering-college training and placement cells. The application is currently demonstrated locally. Every commercial figure below is a product assumption or illustrative calculation, not evidence of sales, demand or profit.

## Who it is designed to help

| Stakeholder | Proposed value | What would establish it |
| --- | --- | --- |
| Student or fresher | A concrete next action that fits available time, money and equipment | Observe whether students understand their missions, finish them and return voluntarily |
| College training and placement cell | Identify consenting students who stopped participating and offer a small nudge | Pilot feedback on useful follow-up, staff effort and continued batch use |
| Founder | Understand where the first session loses people and which missions cause friction | Real funnel, skip and return data with clear definitions and adequate sample sizes |
| Reviewing product or engineering team | An inspectable connection between planning rules, UI, access controls and operational metrics | Follow the [demo](DEMO.md), source links, tests and documented tradeoffs |

The intended market starts with adult engineering students and freshers in India, particularly Hyderabad, Bengaluru and Pune. These are focus choices from [PRODUCT.md](PRODUCT.md), not a researched market-size estimate. The app is open to adults outside the initial age focus; it rejects the under-18 quiz path.

## Proposed offers

These are the offers in the product specification and current presentation. They have not been validated through live sales in this repository.

| Offer | Proposed price | Current behavior |
| --- | --- | --- |
| First full-access week | Free for seven days after sign-up | Trial entitlement unlocks the daily loop; local mode can demonstrate expiry |
| Free plan after the trial | Free | One mission a day in the selected pillar; XP and ranks continue; later Path weeks and packs are locked |
| Individual Season Pass | ₹499 once for 90 days; ₹299 founder price while the configured first-500 allocation is available | Reserve mode by default; a reservation is not a charge or a paid entitlement |
| College paid pilot | ₹15,000 for one batch for 30 days, credited to a continued season | Website offer and demo-request capture; agreement and delivery still require founder setup |
| College Placement Season | ₹400 per student for 90 days, minimum 100 students | Batch membership and dated Season Pass access are implemented; institutional billing is not an automated checkout |

Individual passes do not auto-renew. A paid batch grants access only for its configured dates and while the student remains a member. The founder must decide the pilot's access terms when setting up that batch; the current handoff flags this question. A founder-price reservation preserves the quoted price when payment opens, according to the implemented offer rules.

## Illustrative revenue arithmetic

At the proposed rates, 100 individual purchases at ₹299 would be **₹29,900 gross**, and a 100-student college season at ₹400 would be **₹40,000 gross**. If a ₹15,000 pilot is fully credited against that same season, a **₹25,000** balance would bring the total to **₹40,000**.

These examples assume every proposed purchase happens and every amount is collected. They exclude refunds, taxes, provider charges, hosting, database costs, content work, sales time and support. No acquisition cost, conversion rate, margin or break-even point has been measured. Cost planning must use the chosen providers' current terms before committing money.

## What the product can measure

The founder metrics are implemented in [lib/server/founder.ts](../lib/server/founder.ts), with [unit tests](../tests/unit/founder.test.ts). They use first-party events, profile creation and mission records rather than an advertising tracker.

| Question | Available signal | Interpretation limit |
| --- | --- | --- |
| Do people reach a useful first session? | Landing, quiz start/finish, reveal, oath, sign-up and first-mission events | Each funnel step counts distinct actors for that event in the chosen range; it is not a single linked conversion cohort |
| Do students return? | Day-1, Day-7 and Day-30 mission completion after sign-up | A return means a mission marked done on that exact offset date, among sign-ups in range old enough to qualify |
| Which work causes friction? | Most-skipped missions and No time / Not relevant / Too hard reasons | A skip reason is self-report and can have several causes |
| Is there price interest? | Reservations and founder-price allocation | Reserving is not payment, revenue or proof of willingness to finish checkout |
| Does sharing produce activity? | Cards made, referral sign-ups and earned rewards | Rendering a card is not proof it was posted; a referral account is not an incremental paying customer |
| Is a college interested? | Colleges-page visitors and submitted demo requests | A request is a lead, not a contract or successful pilot |
| Is a batch participating? | Active days, missions per student, missed-day list and mock-interview mission counts | These reflect consenting members and self-reported app activity, not job readiness or placement results |

Date filters do not make every number a period total. In particular, the reservation summary comes from the store snapshot; it is not calculated from events inside the selected date range. “Season Passes sold” counts `payment_done` events in range and should be reconciled with actual provider/payment records before financial reporting. Demo fixtures must never be mixed with real business claims.

## Validation sequence

1. **Verify the delivery foundation.** Configure and test real sign-in, database isolation, account controls, hosting and phone use. Keep payment collection gated.
2. **Observe a small founder test.** Time the first session on actual phones, watch for confusing missions and check whether progress survives account sessions. Record feedback alongside event data.
3. **Measure voluntary return.** Use the implemented return definition, eligible cohort size and exact date window. The launch checklist asks for Day-7 return of at least 15% in the last two weekly cohorts; this is a product gate, not an achieved result or industry benchmark.
4. **Validate an institutional offer.** Use the labelled sample batch for a college conversation. Agree what the pilot includes, obtain the required operator/professional reviews and observe whether the college uses the reports and nudges.
5. **Enable collection only after the gates.** Verify Razorpay test cases and the refund terms before enabling payments. Reconcile orders and grants, then assess refunds and support effort alongside revenue.

The exact launch requirements remain in [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md); this document does not replace or mark them complete.

## Cost and product boundaries

The V1 mission engine does not make AI calls, so ordinary plan generation has no per-response model charge. Hosting, database, authentication, transactional email, payments and human operations still have costs. This is not a promise of free production operation.

The product intentionally defers a social feed, AI chat coach, automatic WhatsApp/push reminders, native apps and bank integrations. These would create additional delivery, moderation, privacy or support work. Their value has not been established, and this documentation does not authorize adding them.

The strongest next evidence is a functioning live foundation and repeated use by real, consenting students. Commercial assumptions should be revised from that evidence rather than represented as traction. See [ROADMAP.md](ROADMAP.md) and the [founder guide](manuals/FOUNDER_GUIDE.md).

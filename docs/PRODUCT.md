# EMPIRE OS product spec

Version 3, October 2026. India first, English UI, Indian context (rupees, UPI, placements, freshers, home workouts, Indian food).

## 1. Who it is for

- **Students and freshers, 18 to 28.** Final- and pre-final-year engineering students first, then job seekers and early-career IT professionals. Built for ambitious young people; open to any adult. Hyderabad, Bengaluru and Pune first.
- **Training and placement (T&P) cells** at engineering colleges. They pay for batches and watch consistency in College HQ.
- **Later: GCC fresher programmes** (HR and learning teams at global capability centres).

Core promise: "Three missions a day for your career, body, mind and money, planned around your timetable, budget and free time."

## 2. The money model

| Door | Offer | Price | Rules |
| --- | --- | --- | --- |
| Students | Reverse trial | Free | Days 1 to 7: everything unlocked |
| Students | Free forever | Free | After day 7: 1 mission a day, the student picks the pillar; Path weeks 2 to 13 locked; no streak shields; packs locked. XP and ranks keep working |
| Students | Season Pass | ₹499 one-time for 90 days; ₹299 for the first 500 buyers, counted in the database | No auto-renewal in V1. A new season is a new purchase |
| Colleges | Paid pilot | ₹15,000 for one batch, 30 days | Credited to a full season |
| Colleges | Placement Season | ₹400 per student per 90 days, minimum 100 students | Students who join with the batch code get Season Pass access for that season |
| GCCs | Fresher season | Later | Needs a company, security paperwork and references |

Payments: Razorpay only, and only in the payments phase. Before that the paywall runs in "reserve" mode (see section 7).

## 3. The first session (the hook)

Goal: a new visitor reaches their plan in under 3 minutes and feels it was made for them, before any sign-up.

1. **Landing** (`/`): headline, one button "Find your archetype", "Free 2-minute quiz. No card needed." A small link for colleges.
2. **18+ check:** age brackets 18–20, 21–24, 25–28, 29–34, 35+, and "Under 18". "Under 18" ends politely ("EMPIRE OS is for adults. Come back when you're 18.") and stores nothing.
3. **Quiz**, one question per screen, big tappable tiles, progress ticks at the top, back arrow, auto-advance on single choice:
   1. First name
   2. City: Hyderabad, Bengaluru, Pune, Mumbai, Delhi NCR, Chennai, Kolkata, Other
   3. Right now you are: College student, Job hunting, Working in IT or tech, Working in another field, Running my own thing
   4. Main goal for 90 days (pick one): Get my first job, Earn more or switch, Build a side income, Get fit and strong, Fix my discipline, Control my money
   5. Order the four pillars by priority (tap in order)
   6. Free time a day: 15, 30, 45, 60, 90+ minutes
   7. Monthly spend on yourself: Only free stuff, Under ₹500, ₹500 to ₹2,000, Flexible
   8. Gym access: Yes, Home only
   9. Laptop: Yes, Phone only
   10. Biggest enemy: Phone, Low energy, No plan, No money, Overthinking
   11. Intensity: Steady, Ambitious, Beast mode (still capped by your time)

   After question 4 and question 7, show one short screen that reflects their answers with true arithmetic only, e.g. "Rahul, 45 minutes a day is 67 hours by Day 90." (45 × 90 = 4,050 minutes = 67.5 hours.)
4. **Building your season** (about 5 seconds): a checklist that ticks through real steps using their answers ("Fitting missions into 45 minutes a day", "Free resources first", "Home workouts, no gym needed").
5. **Archetype reveal:** archetype name and emblem, one identity line, the three-act arc with 2 to 3 milestones each, "Why this plan" with 2 to 3 bullets quoting their real answers, buttons "Start Season 1" and "Share my archetype".
6. **The oath:** "I'll show up for 90 days. Not perfectly. Consistently." Press and hold for 2 seconds while a brass ring fills; light vibration where supported.
7. **Sign-up:** "Save your plan to start Day 1." Email one-time code or Google. "By continuing you agree to the Terms and Privacy Policy." No pre-ticked boxes. Quiz answers live in local state until this point, then are saved.
8. **First mission:** HQ opens with mission 1 highlighted: "Do this one now. It takes 5 minutes."

## 4. The daily loop

- **HQ (today):** Season and day counter, streak chip, rank chip, this week's theme from the Path map ("Week 2 of 13: Resume week. Act I, Foundation."), Empire score medallion, four pillar meters (last 7 days), XP bar to next rank, today's three mission tickets. When the streak is alive and nothing is done yet today: "One mission today makes it 5 days in a row." (never a guilt trip). "Mark done" stamps the ticket, the XP gained rises next to the total, and XP counts up. "Swap" (once a day) and "Skip" (reason: No time, Not relevant, Too hard) live in the ticket's detail sheet. All done shows a "Day 12 complete" ticket ("All three missions done. Bonus +30 XP.", the streak, the XP earned) and a teaser of tomorrow's first mission. A newly earned medal shows a short note above the bottom bar and a card under the missions.
- **Path:** the campaign map. 13 weekly nodes in three acts. Finished weeks show XP earned; the current week pulses; future weeks show a theme ("Week 6: Interview week"). Free users see weeks 2 to 13 locked.
- **Stats:** completion by pillar (7 days and season), missions done, minutes invested ("You've invested 14h 30m in yourself"), XP by day, current and best streak. All computed from real rows.
- **Me:** profile basics; edit goal, pillar order, daily time, budget and city (applies from tomorrow, never rewrites history); pass status; join a college batch; privacy and data; sign out.
- **Installable:** web app manifest and icons. After the first completed day, a one-time tip on adding EMPIRE OS to the home screen (Android Chrome and iPhone Safari steps).
- **Milestone moments:** full-screen moment for each rank-up and for 3, 7, 14, 30, 60 and 90-day streaks, with a Share button.

## 5. Game rules

**Archetypes** (from situation and main goal):

| Archetype | When | Identity line |
| --- | --- | --- |
| The Grinder | Student or job hunting + first job | You win by stacking small reps, every single day |
| The Climber | Working + earn more or switch | You win by turning spare hours into a stronger profile |
| The Founder | Side income | You win by testing small ideas fast with real customers |
| The Warrior | Get fit and strong | You win by showing up for your body before anything else |
| The Phoenix | Fix my discipline | You win by rebuilding your routine one habit at a time |
| The Strategist | Control my money | You win by knowing exactly where every rupee goes |

**Season:** 90 days in three acts. Act I Foundation (weeks 1 to 4), Act II Execution (weeks 5 to 8), Act III Ascension (weeks 9 to 13).

**After Day 90** (added 26 Oct 2026, rules chosen by the founder): HQ shows "Season 1 complete" with real numbers (days active of 90 on a 90-tick medallion, missions done, time invested, best streak in the season, medals), "Share your season" and "Start Season 2". The next season starts the day the student taps it, from Day 1, with their current plan settings. XP, rank, medals and history stay. There is no second free week: the new season runs on whatever access the student has (Free, or a Season Pass still running); a new Season Pass is a new purchase. The server logs `season_start`, and Founder HQ counts "Next seasons started". Stats and Path show the current season.

**XP:** missions give 30, 45 or 60 by difficulty. Finishing all of today's missions adds 30. XP measures activity in the app only, never a person's worth, looks or wealth.

**Ranks:** Rookie 0, Operator 400, Strategist 1,500, Architect 3,500, Commander 6,500, Legend 10,000 XP.

**Streak:** a day counts when at least one mission is done, in the student's time zone. Pass holders get one streak shield a week, used automatically on a missed day. A missed day resets the streak gently: "Streak paused. Your XP and rank are safe. Go again today."

**Empire score:** missions completed ÷ missions assigned over the last 7 days, as 0 to 100. Pillar meters use the same formula per pillar.

**Medals** (added 26 Oct 2026, approved by the founder): twelve medals worked out from real activity each time, never typed in or stored, and kept across seasons. Shown on Stats (earned ones dated, the rest say how to earn them). First mission; Full day (every mission in one day); Early start (a mission finished between 5 and 8 in the morning, student's time zone); Comeback (a mission again after a missed day); All four (every pillar in one season week); War Room (a weekly review); Clean sweep (every mission 7 days running); Boss beaten (a weekly boss mission); Ten hours (600 minutes of missions); Fifty missions; Pack finished (all 10 missions of a pack); Thirty days (missions on 30 different days). Rules and numbers live in `lib/game/medals.ts`. Like XP, medals measure activity in the app only.

## 6. Missions and the plan engine

**Library:** 120 missions to start, 30 per pillar. Fields: pillar, title, how-to (1 to 2 lines), minutes (5, 10, 20, 30, 45), cost (free, low, paid), needs (none, gym, laptop, outdoors), difficulty (1 to 3), archetypes, act (1 to 3), pack (empty or a pack name). At least 60% must be free and doable at home with only a phone. Specific, safe and written for Indian life. Tone examples:

- Body: "20-minute no-equipment push and pull circuit", "Protein check: add eggs, paneer, dal or chana to two meals", "10-minute Surya Namaskar set", "Walk 6,000 steps; take one call on foot"
- Mind: "No phone for the first 30 minutes after waking", "Write tomorrow's top 3 before sleeping", "10 minutes on the task you're avoiding, timer on"
- Money: "Scroll last week's UPI history and tag your top 3 money leaks", "Move ₹100 into a separate savings pocket", "List 3 skills someone would pay you for"
- Career: "Record a 60-second self-introduction, replay it, fix one thing", "Apply to 3 roles with a tailored first line", "Solve 2 easy coding problems or 1 aptitude set", "Send one senior a specific question on LinkedIn"

Never medical, investment or legal advice. No crash diets, supplements or extreme training. Fitness missions show: "Check with a doctor first if you have a health condition."

**Daily selection** (deterministic, no AI API in V1; weights and maps in one config object):

- Slot 1 is the top pillar, slot 2 the second pillar, slot 3 rotates through the other two.
- The three missions fit the daily minutes, with at least one 5 to 10-minute quick win.
- Cost fits the budget level; needs are met (no gym means no gym missions; phone only means phone-friendly missions).
- Act matches the current act; difficulty comes from intensity and week number.
- No mission repeats within 5 days. Prefer missions tagged with the archetype.
- Generated once per student per local date, never duplicated.
- `previewPlan(answers)` returns archetype, top two pillars, three sample missions and three milestones per act. It works before sign-up and writes nothing. Season 1, Day 1 uses the preview's tie-breaks, so the student gets exactly the missions the reveal described.

**Packs** (Pass only): Placement Prep, Home Muscle, ₹10K Savings Sprint, Speak Like a Leader. 10 missions each.

## 7. Money and growth features

- **Reverse trial:** full access while now is before `trial_ends_at` or the student has an active pass. On day 6, one true, dismissible banner: "Your full access ends tomorrow. Keep three missions a day with Season Pass."
- **Paywall:** opens on the first visit after the trial, when tapping a locked week or pack, and from Me. At most once a day uninvited. Content: "Built for The [Archetype], [Name]", what unlocks, price block "₹499 for the full season, about ₹5.50 a day, one-time, no auto-renewal", founder price ₹299 shown only while fewer than 500 are sold (with the real count), primary button, and a clearly visible "Maybe later".
- **Reserve mode** (until payments are live): `payments_live = false`. The button says "Reserve founder price"; tapping saves a reservation and shows "Reserved. No payment taken. We'll tell you in the app when Season Pass opens." Never imply money moved.
- **Share cards** (1080 × 1920 PNG): archetype, rank-up, streak (7, 30, 60, 90), season complete. Each shows the emblem, one big title, rank, first name or initials (student chooses, default initials) and a short referral link. Never email, city, journal text or anything private. Shared through the phone's share sheet, with a download fallback.
- **Referrals:** `/r/CODE` remembers the code until sign-up. When the new student completes missions on 3 different days, both get 7 days of full access. Maximum 5 rewards per referrer; block self-referrals and repeat sign-ups.

## 8. The War Room (weekly review)

Every 7 days, 60 seconds: this week felt (too easy, just right, too hard); biggest blocker (time, energy, motivation, money, nothing); anything changed (schedule, budget, city, goal); next week's focus pillar (pre-select the weakest).

Rules: completion under 50% or "too hard" drops next week one time tier and one difficulty level, keeping a daily 5-minute quick win. Over 85% and not "too hard" raises difficulty and adds one weekly boss mission (+150 XP). Money blocker or lower budget means free-only missions next week. Energy blocker adds sleep and energy missions. A city or goal change proposes a regenerated plan for the remaining weeks, shows before and after, and asks "Apply new plan?" History, XP and rank never change.

Results screen: "What changed and why" in 2 to 4 plain bullets with real numbers. Low weeks get "Reset, don't quit" copy. Free students see what would change and one "Unlock with Season Pass" button.

## 9. College HQ (for T&P cells)

- **Organisations and batches:** a college has batches (name, season dates, join code). A TPO is an organisation admin. Students join a batch with the code from Me or a link.
- **Consent:** joining a college season shows, in plain words: "Your mission progress (not your journal or quiz answers) will be shared with [College] training and placement cell. You can leave any time; your account stays." Only students who joined appear in College HQ. Leaving removes them from the college view going forward.
- **Overview:** stat tiles (active this week, missions per student, students who need a nudge, mock interviews done), students active each day (chart with a table view), the "need a nudge" list (missed 3+ days in a row), and a sections table.
- **Weekly report:** a printable page and PDF for the principal: batch summary, trend, top consistent students (first name and initial), and sections.
- **Actions:** invite students (code, link, poster), send an in-app reminder to a student who needs a nudge.
- A TPO of one college can never see another college's data.

## 10. Founder HQ

Visible only to users with the founder role (a roles table only the server writes). Read-only cards with a date filter: sign-ups per day; the funnel (landing, quiz start, quiz complete, reveal, oath, sign-up, first mission, came back next day) with drop-off at each step; Day-1, Day-7 and Day-30 return; missions by pillar; most-skipped missions with reasons; paywall views by source; reservations and founder-price count; share cards created; referral sign-ups; next seasons started; colleges and batches. Sign-up dates come from when the account was created, never from the season start (which moves with Season 2). Plus the launch checklist with manual checkboxes saved in the database.

## 11. Data rules

**Collected:** first name, email (login), age bracket and 18+ confirmation, city (from the list), situation, main goal, pillar order, daily minutes, budget level, gym and laptop access, biggest enemy, intensity, optional one-line private journal, mission activity, college batch membership and consent.

**Never collected:** exact income, bank or card data (Razorpay handles payments), government IDs, health conditions, photos, contacts, precise location, religion, caste, politics, sexuality.

**Tables** (all personal tables have RLS, owner-only reads):

- `profiles`, `user_missions`, `user_stats`, `entitlements`, `weekly_reviews`, `journal_entries`, `reservations`, `referrals`, `payments` (Razorpay order and payment IDs, amount, status; never card or UPI details)
- `mission_library`, `packs` (readable by all signed-in users, written only by server or migrations)
- `orgs`, `org_admins`, `batches`, `batch_members` (TPO reads only consenting members of their own org), `org_invites` (server only), `nudges` (the student and their college read)
- `roles` (founder), `events` (insert only from the browser; founder reads), `launch_checklist`
- `demo_requests` (work contact details a TPO sends from `/colleges`: name, role, college, city, work email, batch size, optional phone and note; server writes, founder reads)

Retention: kept while the account is active; deleted when the student deletes the account. Export (JSON of all their rows) and delete (type DELETE to confirm) are in Me, Privacy and data.

## 12. Voice

A calm, sharp senior or coach. Short sentences. Confident, never cringe, never toxic. Celebrate effort; never shame setbacks. Self-mastery, never superiority over others. Relationship content is about respect, consent and clear communication.

## 13. Not in V1

AI chat coach, social feed or comments, public photo uploads, user-to-user messages, live job scraping, bank integrations, auto-renewing subscriptions, push or WhatsApp reminders (after proof of retention), Hindi and Telugu (after proof), native apps (after proof).

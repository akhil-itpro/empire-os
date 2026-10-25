// Guides students search for (docs/BUILD_PLAN.md Phase 9). Plain, practical and
// honest: general habits, no invented statistics, no promises of results.

export type GuideBlock = { heading: string; paragraphs?: string[]; list?: string[]; ordered?: boolean };

export type Guide = {
  slug: string;
  title: string;
  /** For search results and share previews, under 160 characters. */
  description: string;
  updated: string;
  readMinutes: number;
  intro: string[];
  blocks: GuideBlock[];
  /** Safety or scope note shown in a box. */
  note?: string;
};

export const GUIDES: Guide[] = [
  {
    slug: "90-day-placement-preparation-plan",
    title: "A 90-day placement preparation plan for final-year students",
    description:
      "A week-by-week placement prep plan: resume, aptitude, coding, mock interviews and HR rounds, in 30 to 60 minutes a day.",
    updated: "2026-10-25",
    readMinutes: 6,
    intro: [
      "Most placement prep fails the same way: a burst of work the week before a drive, then nothing. Ninety days is enough to change that if the work is small, daily and in the right order.",
      "This plan assumes 30 to 60 minutes a day around classes. It is split into three blocks of about four weeks. Adjust the topics to the roles you are targeting.",
    ],
    blocks: [
      {
        heading: "Before you start: one evening of setup",
        list: [
          "Write down the roles you want and 10 companies that hire for them: five dream companies and five realistic ones.",
          "Make a simple tracker in your notes app: company, role, date applied, status, next step.",
          "Check your college's placement calendar, so your mock tests land before the real drives.",
        ],
      },
      {
        heading: "Weeks 1 to 4: foundation",
        paragraphs: ["The goal is a working resume and daily practice that doesn't break."],
        list: [
          "Resume: one page, your best project first, every line starting with a verb and a result. Rewrite one section a day.",
          "Aptitude: 20 minutes a day on quantitative, logical and verbal sets, timed. Note the question types that cost you the most time.",
          "Coding or core subject: one topic a week (for example arrays, then strings, then recursion), two easy problems a day.",
          "Self-introduction: record a 60-second introduction, replay it and fix one thing. Repeat twice a week.",
        ],
      },
      {
        heading: "Weeks 5 to 8: execution",
        paragraphs: ["Now the work starts to look like the real process."],
        list: [
          "Apply to three roles a week with a tailored first line, and log each one in your tracker.",
          "Move to medium problems, and explain your approach out loud before you code.",
          "Run one mock interview a week with a friend: 15 minutes each way, real questions for your target role, one honest note each.",
          "Prepare two project stories: the problem, what you did, what went wrong, what you would change.",
          "Send one specific question to a senior or alumnus on LinkedIn each week. Specific beats \"any tips?\".",
        ],
      },
      {
        heading: "Weeks 9 to 13: ascension",
        paragraphs: ["Sharpen for the rounds you will actually face."],
        list: [
          "Take one full timed mock test a week, aptitude plus coding, with no breaks. Spend the next day on the two weakest areas.",
          "Before each drive, read the company's careers page and recent news, and write three questions to ask them.",
          "Practise HR answers: why this company, a weakness you are fixing, a time you disagreed with someone, and where you see yourself.",
          "Keep the daily habit going even on drive weeks: 20 minutes is enough to stay sharp.",
        ],
      },
      {
        heading: "A day in this plan",
        list: [
          "5 minutes: one quick win, like adding a line to your tracker or fixing one resume bullet.",
          "20 to 30 minutes: the main block (aptitude set, coding problems or a mock).",
          "10 minutes: something that keeps you going, like a walk or writing tomorrow's top three tasks.",
        ],
      },
      {
        heading: "When a week goes badly",
        paragraphs: [
          "You will miss days. Don't try to make them up with a six-hour Sunday. Cut the next week to the smallest version you can keep, such as 15 minutes and one problem a day, then build back up.",
        ],
      },
    ],
    note: "This is a general study plan, not career counselling. Every college and company runs its process differently, so check your placement cell's calendar and rules.",
  },
  {
    slug: "no-gym-home-workout-plan-for-students",
    title: "A 20-minute no-gym home workout plan for students",
    description:
      "No equipment, no gym fees: a 20-minute bodyweight routine for a hostel room or home, three to four days a week, with easier and harder options.",
    updated: "2026-10-25",
    readMinutes: 5,
    intro: [
      "You don't need a gym membership to get stronger. A small room, a mat or a towel, and 20 minutes three or four times a week is a real start.",
      "This routine uses only your body weight. Every exercise has an easier and a harder version, so you can begin where you are.",
    ],
    blocks: [
      {
        heading: "Warm up: 4 minutes",
        list: [
          "March on the spot for one minute, lifting your knees.",
          "Arm circles forwards and backwards, 30 seconds each.",
          "Two slow rounds of Surya Namaskar, or 10 slow bodyweight squats.",
        ],
      },
      {
        heading: "The circuit: 3 rounds, about 12 minutes",
        paragraphs: ["Do each exercise for 40 seconds, rest 20 seconds, then move to the next. Rest one minute between rounds."],
        ordered: true,
        list: [
          "Squats. Easier: sit back onto a chair and stand up. Harder: pause for two seconds at the bottom.",
          "Push-ups. Easier: hands on a bed or wall, or knees on the floor. Harder: slow down to three seconds on the way down.",
          "Reverse lunges, alternating legs. Easier: hold a wall for balance. Harder: step back further and go slower.",
          "Glute bridges, lying on your back. Harder: one leg at a time.",
          "Plank on your forearms. Easier: knees down. Keep your back straight and breathe.",
        ],
      },
      {
        heading: "Cool down: 4 minutes",
        list: [
          "Slow walking or marching for one minute.",
          "Gentle stretches for your thighs, hips, chest and shoulders, 30 seconds each. Don't bounce.",
        ],
      },
      {
        heading: "Your week",
        list: [
          "Three or four sessions, with a rest day between when you can (for example Monday, Wednesday, Friday, Saturday).",
          "On other days, walk: take one phone call on foot, or get off a stop early.",
          "Write down your reps each session. When a round feels easy two sessions in a row, move to the harder version of one exercise.",
        ],
      },
      {
        heading: "Food, simply",
        paragraphs: [
          "No crash diets or supplements needed. A useful habit is adding a protein source you already eat, such as eggs, paneer, dal, chana or curd, to two meals a day, and drinking water through the day.",
        ],
      },
    ],
    note: "Check with a doctor first if you have a health condition, an injury, or you're unsure an exercise is right for you. Stop if anything hurts beyond normal muscle effort.",
  },
];

export const GUIDES_BY_SLUG = new Map(GUIDES.map((g) => [g.slug, g]));

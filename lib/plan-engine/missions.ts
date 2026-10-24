// The mission library (docs/PRODUCT.md section 6). This file is the single source:
// `npm run gen:missions` writes the database seed from it, and previewPlan uses it
// before sign-up. Missions are general habits, never medical, investment or legal advice.
import type { Pillar } from "@/lib/pillars";
import type { Difficulty } from "@/lib/game/rules";

export const ARCHETYPES = ["grinder", "climber", "founder", "warrior", "phoenix", "strategist"] as const;
export type Archetype = (typeof ARCHETYPES)[number];

export type MissionCost = "free" | "low" | "paid";
export type MissionNeeds = "none" | "gym" | "laptop" | "outdoors";
/** phone: cuts screen time. energy: sleep and energy. planning: plans the day or week. focus: calms overthinking. earn: brings in money. */
export type MissionTag = "phone" | "energy" | "planning" | "focus" | "earn";

export type Mission = {
  id: string;
  pillar: Pillar;
  title: string;
  /** One or two lines on how to do it. */
  howTo: string;
  minutes: 5 | 10 | 20 | 30 | 45;
  /** free: no spend. low: under ₹100 of everyday things. paid: ₹100 to ₹500. */
  cost: MissionCost;
  needs: MissionNeeds;
  difficulty: Difficulty;
  /** Archetypes this suits best; empty means it suits everyone. */
  archetypes: Archetype[];
  act: 1 | 2 | 3;
  tags: MissionTag[];
  /** Empty for the base library; a pack name for Season Pass packs. */
  pack: string | null;
};

type Row = Omit<Mission, "pack" | "tags"> & { tags?: MissionTag[] };

const CAREER: Row[] = [
  // Act I: Foundation
  { id: "car-01", pillar: "career", act: 1, minutes: 5, difficulty: 1, cost: "free", needs: "none", archetypes: ["grinder", "climber"], title: "Record a 60-second self-introduction", howTo: "Record it on your phone, replay it once, and fix one thing: pace, filler words or where you look." },
  { id: "car-02", pillar: "career", act: 1, minutes: 5, difficulty: 1, cost: "free", needs: "none", archetypes: ["grinder", "climber"], title: "Write your resume headline in one line", howTo: "The role you want plus your strongest proof, like \"Final-year CSE, built two Android apps\"." },
  { id: "car-03", pillar: "career", act: 1, minutes: 5, difficulty: 1, cost: "free", needs: "none", archetypes: ["grinder", "climber", "founder"], title: "Explain one project in three sentences", howTo: "The problem, what you built, what happened. Say it aloud until it fits in 30 seconds." },
  { id: "car-04", pillar: "career", act: 1, minutes: 5, difficulty: 1, cost: "free", needs: "none", archetypes: ["grinder", "climber"], title: "Read one job post and pick three must-have skills", howTo: "Choose a post for the role you want. Write the three skills it repeats most." },
  { id: "car-05", pillar: "career", act: 1, minutes: 10, difficulty: 1, cost: "free", needs: "none", archetypes: ["grinder", "climber"], title: "List 10 companies you'd like to work for", howTo: "Five dream companies and five realistic ones in your city. Note one role at each.", tags: ["planning"] },
  { id: "car-06", pillar: "career", act: 1, minutes: 10, difficulty: 1, cost: "free", needs: "none", archetypes: ["grinder", "climber"], title: "Set up a job-search tracker", howTo: "A simple table in notes: company, role, date applied, status, next step.", tags: ["planning"] },
  { id: "car-07", pillar: "career", act: 1, minutes: 10, difficulty: 1, cost: "free", needs: "none", archetypes: ["grinder", "climber", "founder"], title: "Fix your LinkedIn headline", howTo: "Say what you do and what you want next in plain words. No buzzwords." },
  { id: "car-08", pillar: "career", act: 1, minutes: 20, difficulty: 2, cost: "free", needs: "none", archetypes: ["grinder"], title: "Solve one aptitude set of 10 questions", howTo: "Quant, logical or verbal. Time yourself, then note the question type you missed most." },
  { id: "car-09", pillar: "career", act: 1, minutes: 30, difficulty: 2, cost: "free", needs: "laptop", archetypes: ["grinder", "climber"], title: "Solve 2 easy coding problems", howTo: "Array or string problems on any free practice site. Write your approach before the code." },
  { id: "car-10", pillar: "career", act: 1, minutes: 45, difficulty: 3, cost: "free", needs: "laptop", archetypes: ["grinder", "climber"], title: "Write resume version 1", howTo: "One page, one column: education, skills, two projects, contact. A plain format that hiring software can read." },
  // Act II: Execution
  { id: "car-11", pillar: "career", act: 2, minutes: 5, difficulty: 1, cost: "free", needs: "none", archetypes: ["grinder", "climber", "founder"], title: "Send one senior a specific question on LinkedIn", howTo: "One clear question about their work, not a request for a job. Thank them either way." },
  { id: "car-12", pillar: "career", act: 2, minutes: 5, difficulty: 1, cost: "free", needs: "none", archetypes: ["grinder", "climber"], title: "Rewrite one resume bullet with a number", howTo: "\"Built a library app\" becomes \"Built a library app used by 120 students in my hostel\"." },
  { id: "car-13", pillar: "career", act: 2, minutes: 5, difficulty: 2, cost: "free", needs: "none", archetypes: ["grinder", "climber"], title: "Answer \"Why should we hire you?\" in three lines", howTo: "One skill, one proof, one reason you want this role. Read it aloud once." },
  { id: "car-14", pillar: "career", act: 2, minutes: 5, difficulty: 1, cost: "free", needs: "none", archetypes: ["grinder"], title: "Check one job alert or off-campus drive", howTo: "Open your saved alerts, pick one that fits, and add it to your tracker with a date." },
  { id: "car-15", pillar: "career", act: 2, minutes: 30, difficulty: 2, cost: "free", needs: "none", archetypes: ["grinder", "climber"], title: "Apply to 3 roles with a tailored first line", howTo: "For each one, write a first line that names the role and your closest proof. Log them in your tracker." },
  { id: "car-16", pillar: "career", act: 2, minutes: 10, difficulty: 2, cost: "free", needs: "none", archetypes: ["grinder", "climber"], title: "Practise 5 common HR questions aloud", howTo: "Strengths, weaknesses, a conflict, a failure, where you see yourself. Short, true answers." },
  { id: "car-17", pillar: "career", act: 2, minutes: 20, difficulty: 2, cost: "free", needs: "none", archetypes: ["grinder"], title: "Do a 15-question aptitude sprint", howTo: "One minute per question. Review every wrong answer before you stop." },
  { id: "car-18", pillar: "career", act: 2, minutes: 30, difficulty: 3, cost: "free", needs: "none", archetypes: ["grinder", "climber"], title: "Run a mock interview with a friend", howTo: "Swap roles, 15 minutes each, using real questions for your target role. Ask for one honest note." },
  { id: "car-19", pillar: "career", act: 2, minutes: 45, difficulty: 3, cost: "free", needs: "laptop", archetypes: ["grinder", "climber"], title: "Solve one medium coding problem", howTo: "Talk through the brute force first, then improve it. Note the pattern you used." },
  { id: "car-20", pillar: "career", act: 2, minutes: 10, difficulty: 2, cost: "free", needs: "none", archetypes: ["grinder", "climber"], title: "Write one STAR story", howTo: "Situation, task, action, result for a time you fixed a problem. Keep it under a minute." },
  // Act III: Ascension
  { id: "car-21", pillar: "career", act: 3, minutes: 5, difficulty: 1, cost: "free", needs: "none", archetypes: ["grinder", "climber"], title: "Save one interview question you can't answer yet", howTo: "Write it down now and find a good answer before tomorrow." },
  { id: "car-22", pillar: "career", act: 3, minutes: 5, difficulty: 1, cost: "free", needs: "none", archetypes: [], title: "Thank someone who helped your career", howTo: "A short, specific message: what they did and how it helped." },
  { id: "car-23", pillar: "career", act: 3, minutes: 5, difficulty: 2, cost: "free", needs: "none", archetypes: ["grinder", "climber"], title: "Give your self-introduction without notes", howTo: "Record it once. If you stumble, start again from the top." },
  { id: "car-24", pillar: "career", act: 3, minutes: 10, difficulty: 2, cost: "free", needs: "none", archetypes: ["grinder"], title: "Explain a core subject topic in 2 minutes", howTo: "DBMS, operating systems, networks or your main subject. Teach it to an empty room." },
  { id: "car-25", pillar: "career", act: 3, minutes: 10, difficulty: 2, cost: "free", needs: "none", archetypes: ["grinder", "climber"], title: "Research one company before you apply", howTo: "What they sell, who their customers are, and one recent piece of news." },
  { id: "car-26", pillar: "career", act: 3, minutes: 10, difficulty: 2, cost: "free", needs: "none", archetypes: ["grinder", "climber"], title: "Ask one employee for a referral the right way", howTo: "Send the role link, two lines on why you fit, and your resume. Make it easy to say yes." },
  { id: "car-27", pillar: "career", act: 3, minutes: 45, difficulty: 3, cost: "free", needs: "laptop", archetypes: ["grinder", "climber", "founder"], title: "Ship one improvement to a portfolio project", howTo: "Fix a bug, write the README or put it online. Make it something a recruiter can open." },
  { id: "car-28", pillar: "career", act: 3, minutes: 45, difficulty: 3, cost: "free", needs: "laptop", archetypes: ["grinder"], title: "Take a timed mock test: aptitude plus coding", howTo: "Sit it like the real thing, no breaks. Write down the two areas that cost you the most time." },
  { id: "car-29", pillar: "career", act: 3, minutes: 20, difficulty: 2, cost: "free", needs: "none", archetypes: ["climber"], title: "Know your salary range", howTo: "Check the typical range for your role and city on two public sources. Write the number you'll ask for." },
  { id: "car-30", pillar: "career", act: 3, minutes: 20, difficulty: 3, cost: "free", needs: "none", archetypes: ["grinder", "climber", "founder"], title: "Record a 2-minute project walkthrough", howTo: "The problem, a quick demo, what you'd improve. Replay it and cut the filler." },
];

const BODY: Row[] = [
  // Act I: Foundation
  { id: "bod-01", pillar: "body", act: 1, minutes: 10, difficulty: 1, cost: "free", needs: "none", archetypes: ["warrior", "phoenix"], title: "10-minute Surya Namaskar set", howTo: "Move slowly with your breath. Stop if anything hurts.", tags: ["energy"] },
  { id: "bod-02", pillar: "body", act: 1, minutes: 30, difficulty: 1, cost: "free", needs: "outdoors", archetypes: ["warrior"], title: "Walk 6,000 steps; take one call on foot", howTo: "Spread it over the day. Your phone's step counter is enough.", tags: ["energy"] },
  { id: "bod-03", pillar: "body", act: 1, minutes: 5, difficulty: 1, cost: "low", needs: "none", archetypes: ["warrior"], title: "Protein check: add eggs, paneer, dal or chana to two meals", howTo: "Use what's already in your kitchen or mess. No supplements needed." },
  { id: "bod-04", pillar: "body", act: 1, minutes: 5, difficulty: 1, cost: "free", needs: "none", archetypes: [], title: "Drink a glass of water before each meal", howTo: "Three meals, three glasses. Keep a bottle where you can see it.", tags: ["energy"] },
  { id: "bod-05", pillar: "body", act: 1, minutes: 5, difficulty: 1, cost: "free", needs: "none", archetypes: ["warrior", "phoenix"], title: "5-minute morning stretch", howTo: "Neck, shoulders, hips and hamstrings. Gentle, no bouncing.", tags: ["energy"] },
  { id: "bod-06", pillar: "body", act: 1, minutes: 5, difficulty: 1, cost: "free", needs: "none", archetypes: ["warrior"], title: "One round: 20 squats, 10 push-ups, 20-second plank", howTo: "Knee push-ups are fine. Good form beats more reps." },
  { id: "bod-07", pillar: "body", act: 1, minutes: 5, difficulty: 1, cost: "free", needs: "none", archetypes: [], title: "Stand up and move for 2 minutes, four times today", howTo: "Set a reminder every hour while you study or work. Walk, stretch or climb stairs.", tags: ["energy"] },
  { id: "bod-08", pillar: "body", act: 1, minutes: 20, difficulty: 2, cost: "free", needs: "none", archetypes: ["warrior"], title: "20-minute no-equipment push and pull circuit", howTo: "Push-ups, towel rows against a sturdy door, squats and a plank. Three rounds, rest as you need." },
  { id: "bod-09", pillar: "body", act: 1, minutes: 45, difficulty: 2, cost: "free", needs: "gym", archetypes: ["warrior"], title: "Gym: learn the squat, row and press with light weight", howTo: "Three sets of 10 with a weight you could lift 15 times. Ask a trainer to check your form." },
  { id: "bod-10", pillar: "body", act: 1, minutes: 5, difficulty: 1, cost: "free", needs: "none", archetypes: ["warrior", "phoenix"], title: "Sleep 30 minutes earlier tonight", howTo: "Set an alarm for bedtime, not just for waking up.", tags: ["energy"] },
  // Act II: Execution
  { id: "bod-11", pillar: "body", act: 2, minutes: 20, difficulty: 1, cost: "free", needs: "outdoors", archetypes: [], title: "Brisk 20-minute walk", howTo: "Fast enough that talking takes a little effort. Morning or evening.", tags: ["energy"] },
  { id: "bod-12", pillar: "body", act: 2, minutes: 10, difficulty: 2, cost: "free", needs: "none", archetypes: ["warrior"], title: "Three rounds: 15 squats, 10 push-ups, 30-second plank", howTo: "Rest a minute between rounds. Write down your total push-ups." },
  { id: "bod-13", pillar: "body", act: 2, minutes: 5, difficulty: 1, cost: "free", needs: "none", archetypes: [], title: "Plate check: half veg, quarter protein, quarter roti or rice", howTo: "Look at one meal today and adjust it. No calorie counting." },
  { id: "bod-14", pillar: "body", act: 2, minutes: 5, difficulty: 1, cost: "free", needs: "none", archetypes: [], title: "Skip the lift wherever you can today", howTo: "Stairs at college, work or home. Take them at your own pace." },
  { id: "bod-15", pillar: "body", act: 2, minutes: 20, difficulty: 2, cost: "free", needs: "none", archetypes: ["warrior"], title: "Home leg day: lunges, squats and glute bridges", howTo: "Three rounds of 12 each. Hold a water bottle in each hand if it feels easy." },
  { id: "bod-16", pillar: "body", act: 2, minutes: 10, difficulty: 1, cost: "free", needs: "none", archetypes: [], title: "10-minute mobility for desk necks and backs", howTo: "Chin tucks, shoulder rolls, cat-cow and a hip stretch. Slow and easy.", tags: ["energy"] },
  { id: "bod-17", pillar: "body", act: 2, minutes: 5, difficulty: 1, cost: "low", needs: "none", archetypes: [], title: "Swap one packaged snack for fruit, roasted chana or curd", howTo: "Just one swap today. Keep it simple and cheap." },
  { id: "bod-18", pillar: "body", act: 2, minutes: 45, difficulty: 3, cost: "free", needs: "gym", archetypes: ["warrior"], title: "Gym: full-body session, three lifts, three sets each", howTo: "Squat or leg press, a row and a press. Log your weights so you can progress slowly." },
  { id: "bod-19", pillar: "body", act: 2, minutes: 30, difficulty: 2, cost: "free", needs: "outdoors", archetypes: ["warrior"], title: "30-minute walk or easy jog", howTo: "Easy enough to talk in short sentences. Walk breaks are fine.", tags: ["energy"] },
  { id: "bod-20", pillar: "body", act: 2, minutes: 5, difficulty: 1, cost: "free", needs: "none", archetypes: ["phoenix"], title: "No screens 30 minutes before bed", howTo: "Charge your phone away from your bed. Read, stretch or plan tomorrow instead.", tags: ["energy", "phone"] },
  // Act III: Ascension
  { id: "bod-21", pillar: "body", act: 3, minutes: 5, difficulty: 2, cost: "free", needs: "none", archetypes: ["warrior"], title: "Push-up test: count your clean reps", howTo: "One set to near failure with good form. Write the number and compare it with Week 1." },
  { id: "bod-22", pillar: "body", act: 3, minutes: 5, difficulty: 2, cost: "free", needs: "none", archetypes: ["warrior"], title: "Five rounds of 30 seconds of high knees", howTo: "Rest 30 seconds between rounds. March in place if your knees need it.", tags: ["energy"] },
  { id: "bod-23", pillar: "body", act: 3, minutes: 10, difficulty: 1, cost: "free", needs: "outdoors", archetypes: ["phoenix"], title: "10-minute morning sunlight walk", howTo: "Within an hour of waking. Leave your earphones in your pocket.", tags: ["energy"] },
  { id: "bod-24", pillar: "body", act: 3, minutes: 10, difficulty: 2, cost: "free", needs: "none", archetypes: ["warrior"], title: "Core finisher: plank, side planks and dead bugs", howTo: "30 seconds each, two rounds. Keep your lower back flat." },
  { id: "bod-25", pillar: "body", act: 3, minutes: 5, difficulty: 1, cost: "free", needs: "none", archetypes: [], title: "Hydration day: eight glasses of water", howTo: "Tick them off in your notes. More if it's hot or you trained.", tags: ["energy"] },
  { id: "bod-26", pillar: "body", act: 3, minutes: 30, difficulty: 3, cost: "free", needs: "none", archetypes: ["warrior"], title: "30-minute home strength session", howTo: "Push-ups, squats, lunges, towel rows and planks. Four rounds, rest as you need." },
  { id: "bod-27", pillar: "body", act: 3, minutes: 10, difficulty: 1, cost: "low", needs: "none", archetypes: ["warrior"], title: "Prep tomorrow's protein: soak chana or boil eggs", howTo: "Ten minutes tonight saves you a fried snack tomorrow." },
  { id: "bod-28", pillar: "body", act: 3, minutes: 45, difficulty: 3, cost: "free", needs: "gym", archetypes: ["warrior"], title: "Gym: beat one lift from last week by a small step", howTo: "One more rep or the smallest plate. Never at the cost of form." },
  { id: "bod-29", pillar: "body", act: 3, minutes: 30, difficulty: 2, cost: "free", needs: "outdoors", archetypes: [], title: "Play a sport outside for 30 minutes", howTo: "Cricket, football, badminton or a long cycle. Anything that gets you moving with others.", tags: ["energy"] },
  { id: "bod-30", pillar: "body", act: 3, minutes: 20, difficulty: 2, cost: "free", needs: "none", archetypes: ["warrior", "phoenix"], title: "20-minute slow yoga flow", howTo: "Follow a free beginner video or your own Surya Namaskar sets. Breathe through the nose.", tags: ["energy"] },
];

const MIND: Row[] = [
  // Act I: Foundation
  { id: "min-01", pillar: "mind", act: 1, minutes: 5, difficulty: 1, cost: "free", needs: "none", archetypes: ["phoenix"], title: "No phone for the first 30 minutes after waking", howTo: "Put your alarm across the room. Wash up, drink water and plan before you scroll.", tags: ["phone"] },
  { id: "min-02", pillar: "mind", act: 1, minutes: 5, difficulty: 1, cost: "free", needs: "none", archetypes: ["phoenix", "grinder", "climber"], title: "Write tomorrow's top 3 before sleeping", howTo: "Three tasks, most important first. Keep the list where you'll see it in the morning.", tags: ["planning"] },
  { id: "min-03", pillar: "mind", act: 1, minutes: 10, difficulty: 1, cost: "free", needs: "none", archetypes: ["phoenix"], title: "10 minutes on the task you're avoiding, timer on", howTo: "Just 10 minutes. Stop when the timer rings if you want to.", tags: ["focus"] },
  { id: "min-04", pillar: "mind", act: 1, minutes: 5, difficulty: 1, cost: "free", needs: "none", archetypes: ["phoenix"], title: "Turn off notifications for three apps", howTo: "Start with the ones that pull you in most. Calls and messages from people can stay on.", tags: ["phone"] },
  { id: "min-05", pillar: "mind", act: 1, minutes: 10, difficulty: 1, cost: "free", needs: "none", archetypes: [], title: "Read 10 pages of a book", howTo: "Any book you'd like to finish. Free e-books and library copies count." },
  { id: "min-06", pillar: "mind", act: 1, minutes: 5, difficulty: 1, cost: "free", needs: "none", archetypes: ["phoenix"], title: "Two-minute brain dump", howTo: "Write everything on your mind, then circle one thing to do today.", tags: ["focus", "planning"] },
  { id: "min-07", pillar: "mind", act: 1, minutes: 5, difficulty: 1, cost: "free", needs: "none", archetypes: [], title: "Box breathing: four rounds", howTo: "In for 4, hold for 4, out for 4, hold for 4. Use it before an exam or a hard call.", tags: ["focus"] },
  { id: "min-08", pillar: "mind", act: 1, minutes: 30, difficulty: 2, cost: "free", needs: "none", archetypes: ["phoenix", "grinder", "climber"], title: "One 25-minute focus block, phone in another room", howTo: "One task only. When your mind wanders, write the thought down and go back.", tags: ["phone", "focus"] },
  { id: "min-09", pillar: "mind", act: 1, minutes: 10, difficulty: 1, cost: "free", needs: "none", archetypes: ["phoenix"], title: "Plan your week in 10 minutes", howTo: "Classes, work, deadlines and three things you want done by Sunday.", tags: ["planning"] },
  { id: "min-10", pillar: "mind", act: 1, minutes: 5, difficulty: 1, cost: "free", needs: "none", archetypes: ["phoenix"], title: "Check your screen time and set one app limit", howTo: "Find your top app this week and set a daily limit a little below it.", tags: ["phone"] },
  // Act II: Execution
  { id: "min-11", pillar: "mind", act: 2, minutes: 45, difficulty: 3, cost: "free", needs: "none", archetypes: ["phoenix", "grinder", "climber"], title: "Two 20-minute focus blocks with a short break", howTo: "Phone in another room. Walk or drink water in the break, no scrolling.", tags: ["phone", "focus"] },
  { id: "min-12", pillar: "mind", act: 2, minutes: 5, difficulty: 1, cost: "free", needs: "none", archetypes: [], title: "Write one line: what went well today", howTo: "Something small counts. Add it to your private journal in Me." },
  { id: "min-13", pillar: "mind", act: 2, minutes: 5, difficulty: 1, cost: "free", needs: "none", archetypes: ["phoenix"], title: "Eat one meal with no phone", howTo: "Put it face down or in another room. Just eat, or talk to whoever's with you.", tags: ["phone"] },
  { id: "min-14", pillar: "mind", act: 2, minutes: 20, difficulty: 2, cost: "free", needs: "none", archetypes: [], title: "Learn one new idea and explain it in your own words", howTo: "Read or watch something for 10 minutes, then write 5 lines without looking." },
  { id: "min-15", pillar: "mind", act: 2, minutes: 20, difficulty: 2, cost: "free", needs: "none", archetypes: ["phoenix"], title: "Do the hardest task first", howTo: "Before 11 am, give 20 minutes to the task you'd most like to skip.", tags: ["focus"] },
  { id: "min-16", pillar: "mind", act: 2, minutes: 10, difficulty: 1, cost: "free", needs: "outdoors", archetypes: [], title: "10-minute walk without your phone", howTo: "Let your mind wander. Notice three things you usually miss.", tags: ["phone", "energy"] },
  { id: "min-17", pillar: "mind", act: 2, minutes: 20, difficulty: 2, cost: "free", needs: "none", archetypes: ["phoenix"], title: "Swap 15 minutes of scrolling for reading", howTo: "When you reach for a feed, open a book or a long article instead.", tags: ["phone"] },
  { id: "min-18", pillar: "mind", act: 2, minutes: 5, difficulty: 1, cost: "free", needs: "none", archetypes: ["phoenix"], title: "Name the worry, then the next small action", howTo: "When you catch yourself overthinking, write the worry in one line and one action you can take today.", tags: ["focus"] },
  { id: "min-19", pillar: "mind", act: 2, minutes: 10, difficulty: 1, cost: "free", needs: "none", archetypes: [], title: "Tidy your study or work space for 10 minutes", howTo: "Clear the desk, put away what you don't need today, keep water within reach." },
  { id: "min-20", pillar: "mind", act: 2, minutes: 10, difficulty: 1, cost: "free", needs: "none", archetypes: ["phoenix", "strategist"], title: "Weekly look-back in 10 minutes", howTo: "What worked, what didn't, and one change for next week.", tags: ["planning"] },
  // Act III: Ascension
  { id: "min-21", pillar: "mind", act: 3, minutes: 45, difficulty: 3, cost: "free", needs: "none", archetypes: ["phoenix", "grinder", "climber"], title: "Single-task for 45 minutes", howTo: "One task, one tab, phone away. Note how far you got.", tags: ["phone", "focus"] },
  { id: "min-22", pillar: "mind", act: 3, minutes: 5, difficulty: 2, cost: "free", needs: "none", archetypes: [], title: "Say no to one thing that isn't a priority", howTo: "Politely and clearly. Use the time for something on your top 3.", tags: ["planning"] },
  { id: "min-23", pillar: "mind", act: 3, minutes: 10, difficulty: 2, cost: "free", needs: "none", archetypes: [], title: "Teach someone one thing you learnt this week", howTo: "A friend, sibling or classmate. Explaining it shows you what you really know." },
  { id: "min-24", pillar: "mind", act: 3, minutes: 5, difficulty: 2, cost: "free", needs: "none", archetypes: ["phoenix"], title: "Digital sunset: charge your phone outside your room", howTo: "Use a cheap alarm clock or keep the volume up from the next room.", tags: ["phone", "energy"] },
  { id: "min-25", pillar: "mind", act: 3, minutes: 10, difficulty: 1, cost: "free", needs: "none", archetypes: [], title: "Write a letter to yourself on Day 90", howTo: "What you want to be true by then, and what you'll say no to on the way." },
  { id: "min-26", pillar: "mind", act: 3, minutes: 30, difficulty: 2, cost: "free", needs: "none", archetypes: [], title: "Read 20 pages", howTo: "Somewhere quiet, phone on silent. Write one line you want to remember." },
  { id: "min-27", pillar: "mind", act: 3, minutes: 30, difficulty: 3, cost: "free", needs: "none", archetypes: ["phoenix"], title: "Finish one thing you started and left", howTo: "A form, an assignment, a course module. Done beats perfect.", tags: ["focus"] },
  { id: "min-28", pillar: "mind", act: 3, minutes: 5, difficulty: 1, cost: "free", needs: "none", archetypes: [], title: "Write three specific things you're grateful for", howTo: "Specific beats general: \"Amma packed lunch\" rather than \"family\"." },
  { id: "min-29", pillar: "mind", act: 3, minutes: 20, difficulty: 2, cost: "free", needs: "none", archetypes: ["phoenix", "strategist"], title: "Plan the next 7 days in time blocks", howTo: "Put your top tasks into real slots in your calendar, with breaks.", tags: ["planning"] },
  { id: "min-30", pillar: "mind", act: 3, minutes: 20, difficulty: 2, cost: "free", needs: "none", archetypes: [], title: "Learn a skill for 20 minutes with a free course", howTo: "Pick one lesson and finish it. Take notes in your own words." },
];

const MONEY: Row[] = [
  // Act I: Foundation
  { id: "mon-01", pillar: "money", act: 1, minutes: 10, difficulty: 1, cost: "free", needs: "none", archetypes: ["strategist"], title: "Scroll last week's UPI history and tag your top 3 money leaks", howTo: "Food delivery, impulse buys, small daily spends. Just name them; no guilt." },
  { id: "mon-02", pillar: "money", act: 1, minutes: 5, difficulty: 1, cost: "free", needs: "none", archetypes: ["strategist"], title: "Move ₹100 into a separate savings pocket", howTo: "If ₹100 is too much, move ₹20. The habit matters more than the amount." },
  { id: "mon-03", pillar: "money", act: 1, minutes: 5, difficulty: 1, cost: "free", needs: "none", archetypes: ["founder"], title: "List 3 skills someone would pay you for", howTo: "Tutoring, editing, design, coding, translation. Anything you do better than most.", tags: ["earn"] },
  { id: "mon-04", pillar: "money", act: 1, minutes: 5, difficulty: 1, cost: "free", needs: "none", archetypes: ["strategist"], title: "Write down every spend today", howTo: "Amount and what it was for, in your notes. Even ₹10 chai counts." },
  { id: "mon-05", pillar: "money", act: 1, minutes: 5, difficulty: 1, cost: "free", needs: "none", archetypes: ["strategist"], title: "Find one subscription you don't use", howTo: "Check app stores, UPI autopay and your bank SMS. Cancel it or set a reminder to." },
  { id: "mon-06", pillar: "money", act: 1, minutes: 5, difficulty: 1, cost: "free", needs: "none", archetypes: ["strategist"], title: "Set a weekly spending cap", howTo: "Pick one number for food and fun this week. Write it where you'll see it.", tags: ["planning"] },
  { id: "mon-07", pillar: "money", act: 1, minutes: 10, difficulty: 1, cost: "free", needs: "none", archetypes: [], title: "Find out what your bank charges you", howTo: "Check your bank app or SMS for fees: minimum balance, SMS alerts, card charges." },
  { id: "mon-08", pillar: "money", act: 1, minutes: 20, difficulty: 2, cost: "free", needs: "none", archetypes: ["strategist"], title: "Make a simple monthly budget", howTo: "Money in, fixed costs, savings first, then what's left for everything else.", tags: ["planning"] },
  { id: "mon-09", pillar: "money", act: 1, minutes: 20, difficulty: 2, cost: "free", needs: "none", archetypes: ["founder"], title: "Ask 3 people what they'd pay for one of your skills", howTo: "Friends, seniors or local shops. Ask about the problem first, then the price.", tags: ["earn"] },
  { id: "mon-10", pillar: "money", act: 1, minutes: 10, difficulty: 1, cost: "free", needs: "none", archetypes: [], title: "Learn three common UPI scams", howTo: "You never need your PIN or an OTP to receive money, and a collect request takes money out." },
  // Act II: Execution
  { id: "mon-11", pillar: "money", act: 2, minutes: 5, difficulty: 2, cost: "free", needs: "none", archetypes: ["strategist"], title: "No-spend day: essentials only", howTo: "Food you'd eat anyway, travel and bills are fine. Skip everything else for one day." },
  { id: "mon-12", pillar: "money", act: 2, minutes: 5, difficulty: 1, cost: "free", needs: "none", archetypes: [], title: "Compare prices before one purchase", howTo: "Check two shops or apps before you pay. Note what you saved." },
  { id: "mon-13", pillar: "money", act: 2, minutes: 10, difficulty: 2, cost: "free", needs: "none", archetypes: ["founder"], title: "Write a one-line offer for your skill", howTo: "Who it's for, what you do, the price. For example: \"Resume formatting for freshers, ₹199.\"", tags: ["earn"] },
  { id: "mon-14", pillar: "money", act: 2, minutes: 20, difficulty: 1, cost: "low", needs: "none", archetypes: ["strategist"], title: "Cook or carry one meal instead of ordering", howTo: "Compare it with what the delivery would have cost and note the difference." },
  { id: "mon-15", pillar: "money", act: 2, minutes: 5, difficulty: 1, cost: "free", needs: "none", archetypes: ["strategist"], title: "Check your spends against your weekly cap", howTo: "Add up this week so far. If you're over, pick one spend to skip." },
  { id: "mon-16", pillar: "money", act: 2, minutes: 10, difficulty: 2, cost: "free", needs: "none", archetypes: ["strategist"], title: "Set an emergency-fund target", howTo: "Add up one month of essentials: rent or hostel, food, travel, phone. That's your first target." },
  { id: "mon-17", pillar: "money", act: 2, minutes: 10, difficulty: 2, cost: "free", needs: "none", archetypes: ["founder"], title: "Share your offer in one group you're already in", howTo: "A college, hostel or community group where it's allowed. One clear message, no spam.", tags: ["earn"] },
  { id: "mon-18", pillar: "money", act: 2, minutes: 20, difficulty: 2, cost: "free", needs: "none", archetypes: [], title: "Sell or give away one thing you don't use", howTo: "Old books, gadgets or clothes. List it today; done is better than the perfect price.", tags: ["earn"] },
  { id: "mon-19", pillar: "money", act: 2, minutes: 45, difficulty: 3, cost: "free", needs: "none", archetypes: ["founder"], title: "Do one small paid task", howTo: "Tutoring, a design, a small fix for someone. Agree the price before you start.", tags: ["earn"] },
  { id: "mon-20", pillar: "money", act: 2, minutes: 5, difficulty: 1, cost: "free", needs: "none", archetypes: [], title: "Note one thing you didn't buy today", howTo: "Write what you skipped and what it would have cost. It adds up." },
  // Act III: Ascension
  { id: "mon-21", pillar: "money", act: 3, minutes: 10, difficulty: 2, cost: "free", needs: "none", archetypes: ["strategist"], title: "Make one small saving automatic", howTo: "Set a monthly reminder or a standing instruction for a small amount on the day money comes in." },
  { id: "mon-22", pillar: "money", act: 3, minutes: 10, difficulty: 2, cost: "free", needs: "none", archetypes: ["strategist"], title: "Work out your season leak", howTo: "Total last month's top 3 leaks and multiply by three. That's what 90 days of them costs." },
  { id: "mon-23", pillar: "money", act: 3, minutes: 20, difficulty: 2, cost: "free", needs: "none", archetypes: ["grinder", "climber"], title: "Learn to read an offer letter", howTo: "CTC versus in-hand pay: basic, HRA, PF and tax. Practise on a sample offer you find online." },
  { id: "mon-24", pillar: "money", act: 3, minutes: 5, difficulty: 2, cost: "free", needs: "none", archetypes: [], title: "Ask politely for a better price once", howTo: "At a local shop or for a service. A friendly ask, and fine if the answer is no." },
  { id: "mon-25", pillar: "money", act: 3, minutes: 5, difficulty: 2, cost: "free", needs: "none", archetypes: ["founder"], title: "Follow up with one person who showed interest", howTo: "A short, friendly message with your offer and one clear next step.", tags: ["earn"] },
  { id: "mon-26", pillar: "money", act: 3, minutes: 10, difficulty: 2, cost: "free", needs: "none", archetypes: ["strategist"], title: "Write your three money rules", howTo: "One line each, like \"Save first, then spend.\" Keep them where you pay from." },
  { id: "mon-27", pillar: "money", act: 3, minutes: 20, difficulty: 3, cost: "free", needs: "none", archetypes: ["strategist"], title: "Review your spending trend for the season", howTo: "Compare your weekly totals since Week 1. Note what changed and why." },
  { id: "mon-28", pillar: "money", act: 3, minutes: 20, difficulty: 3, cost: "free", needs: "none", archetypes: ["founder"], title: "Price your service from your costs and time", howTo: "Hours per job times what an hour is worth to you, plus costs. Compare it with what people said they'd pay.", tags: ["earn"] },
  { id: "mon-29", pillar: "money", act: 3, minutes: 5, difficulty: 1, cost: "free", needs: "none", archetypes: [], title: "Check any card or pay-later dues", howTo: "Note the due dates and pay in full where you can. Skip this if you have none." },
  { id: "mon-30", pillar: "money", act: 3, minutes: 5, difficulty: 1, cost: "free", needs: "none", archetypes: ["strategist"], title: "Move this week's savings into your pocket", howTo: "Whatever you saved by skipping or comparing, move it now so it stays saved." },
];

export const MISSIONS: Mission[] = [...CAREER, ...BODY, ...MIND, ...MONEY].map((m) => ({
  ...m,
  tags: m.tags ?? [],
  pack: null,
}));

export const MISSIONS_BY_ID = new Map(MISSIONS.map((m) => [m.id, m]));

/** Shown with every Body mission (docs/PRODUCT.md section 6). */
export const BODY_HEALTH_NOTE = "Check with a doctor first if you have a health condition.";

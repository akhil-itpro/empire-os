// A theme for each of the 13 weeks, per archetype, shown on the Path map.
// They name the focus of the week; they are not promises of results.
import type { Archetype } from "./missions";

export const WEEK_THEMES: Record<Archetype, string[]> = {
  grinder: [
    "Set-up week", "Resume week", "Aptitude week", "Profile week",
    "Apply week", "Interview week", "Coding week", "Mock week",
    "Project week", "Referral week", "Polish week", "Placement prep week", "Final push",
  ],
  climber: [
    "Direction week", "Profile week", "Skill week", "Proof week",
    "Network week", "Project week", "Visibility week", "Interview week",
    "Apply week", "Pitch week", "Negotiation week", "Momentum week", "Final push",
  ],
  founder: [
    "Skills week", "Offer week", "Customer week", "Pricing week",
    "Outreach week", "First sale week", "Delivery week", "Feedback week",
    "Repeat week", "Referral week", "Systems week", "Numbers week", "Final push",
  ],
  warrior: [
    "Baseline week", "Routine week", "Protein week", "Mobility week",
    "Strength week", "Conditioning week", "Recovery week", "Progress week",
    "Endurance week", "Heavy week", "Consistency week", "Peak week", "Retest week",
  ],
  phoenix: [
    "Mornings week", "Phone week", "Sleep week", "Planning week",
    "Focus week", "Avoidance week", "Energy week", "Routine week",
    "Deep work week", "Boundaries week", "Finish week", "Autopilot week", "Final push",
  ],
  strategist: [
    "Tracking week", "Leaks week", "Budget week", "Cap week",
    "Savings week", "Spending week", "Earning week", "Safety-net week",
    "Automation week", "Rules week", "Review week", "Season numbers week", "Final push",
  ],
};

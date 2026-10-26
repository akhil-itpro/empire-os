import "server-only";
import { hasSeasonPass, passCoversDate, showTrialEndingBanner } from "@/lib/game/access";
import { addDays, seasonPosition } from "@/lib/game/dates";
import { empireScore, pillarScores } from "@/lib/game/score";
import { earnedMedals } from "@/lib/game/medals";
import { SEASON_DAYS } from "@/lib/game/rules";
import { computeStreak, type StreakState } from "@/lib/game/streak";
import { rankFor, type RankProgress } from "@/lib/game/xp";
import type { Pillar } from "@/lib/pillars";
import { ARCHETYPE_INFO } from "@/lib/plan-engine/archetype";
import { LIBRARY, LIBRARY_BY_ID } from "@/lib/plan-engine/library";
import { selectDailyMissions } from "@/lib/plan-engine/select";
import { WEEK_THEMES } from "@/lib/plan-engine/week-themes";
import { medalInput } from "./medal-service";
import { ensureToday, packContext, packNameOf, settingsOn, weekAdjustments, type Deps, type Result, type Today } from "./season-service";
import type { MissionStatus, ShareName } from "./store";

export type TicketData = {
  id: string;
  slot: number;
  pillar: Pillar;
  title: string;
  howTo: string;
  minutes: number;
  xp: number;
  status: MissionStatus;
  /** The pack it comes from, or null for the base library. */
  packName: string | null;
};

export type HqData = {
  firstName: string;
  shareName: ShareName;
  referralCode: string;
  archetypeName: string;
  seasonNumber: number;
  day: number;
  /** This week of the campaign and its theme, as on the Path map. */
  week: number;
  act: 1 | 2 | 3;
  weekTheme: string;
  seasonFinished: boolean;
  fullAccess: boolean;
  hasPass: boolean;
  trialEndingSoon: boolean;
  /** Free after the trial and nothing reserved: HQ may open the paywall once, uninvited. */
  offerPaywall: boolean;
  swapsLeft: number;
  missions: TicketData[];
  xp: number;
  rank: RankProgress;
  streak: { current: number; best: number; state: StreakState };
  score: number | null;
  pillars: Record<Pillar, number | null>;
  dayComplete: boolean;
  tomorrow: { title: string; pillar: Pillar; minutes: number } | null;
  /** After Day 90: the finished season in numbers, all from the student's own rows. */
  debrief: SeasonDebrief | null;
};

export type SeasonDebrief = {
  /** Days of the 90 with at least one mission done. */
  activeDays: number;
  missionsDone: number;
  minutes: number;
  /** The longest run of days in a row inside this season. */
  bestStreak: number;
  /** Medals earned so far (they're kept across seasons). */
  medals: number;
};

async function seasonDebrief(deps: Deps, profile: Today["profile"], hasShieldOn: (d: string) => boolean): Promise<SeasonDebrief> {
  const end = addDays(profile.seasonStart, SEASON_DAYS - 1);
  const [season, medals] = await Promise.all([
    deps.store.listMissions(profile.id, profile.seasonStart, end),
    medalInput(deps, profile),
  ]);
  const done = season.filter((m) => m.status === "done");
  const days = [...new Set(done.map((m) => m.localDate))];
  return {
    activeDays: days.length,
    missionsDone: done.length,
    minutes: done.reduce((sum, m) => sum + m.minutes, 0),
    bestStreak: computeStreak({ activeDays: days, today: end, seasonStart: profile.seasonStart, hasShieldOn }).best,
    medals: earnedMedals(medals).size,
  };
}

export async function loadHq(deps: Deps, userId: string): Promise<Result<HqData>> {
  const todayResult = await ensureToday(deps, userId);
  if (!todayResult.ok) return todayResult;
  const t = todayResult.data;
  const { store } = deps;

  const [recent, xp, activeDays, entitlements, reservation] = await Promise.all([
    store.listMissions(userId, addDays(t.today, -6), t.today),
    store.xpTotal(userId),
    store.activeDays(userId),
    store.entitlements(userId),
    t.fullAccess ? null : store.getReservation(userId),
  ]);

  const tz = t.profile.timeZone;
  const streak = computeStreak({
    activeDays,
    today: t.today,
    seasonStart: t.profile.seasonStart,
    hasShieldOn: passCoversDate(entitlements, tz),
  });

  const counted = recent
    .filter((m) => m.status !== "swapped")
    .map((m) => ({ localDate: m.localDate, pillar: m.pillar, done: m.status === "done" }));

  const missions: TicketData[] = t.missions.map((m) => {
    const def = LIBRARY_BY_ID.get(m.missionId);
    return {
      id: m.id,
      slot: m.slot,
      pillar: m.pillar,
      title: def?.title ?? "Mission",
      howTo: def?.howTo ?? "",
      minutes: m.minutes,
      xp: m.xp,
      status: m.status,
      packName: packNameOf(m.missionId),
    };
  });
  const dayComplete = missions.length > 0 && missions.every((m) => m.status === "done");

  // Tomorrow's first mission, from the same plan engine with today in the history.
  let tomorrow: HqData["tomorrow"] = null;
  if (dayComplete && t.fullAccess) {
    const date = addDays(t.today, 1);
    const pos = seasonPosition(t.profile.seasonStart, date);
    if (!pos.finished) {
      const history = (await store.listMissions(userId, addDays(date, -5), t.today)).map((m) => ({
        missionId: m.missionId,
        date: m.localDate,
      }));
      const [first] = selectDailyMissions(LIBRARY, {
        seed: userId,
        date,
        seasonDay: pos.day,
        week: pos.week,
        act: pos.act,
        archetype: t.profile.archetype,
        settings: settingsOn(t.profile, date),
        history,
        adjustments: await weekAdjustments(store, t.profile, pos.week),
        ...(await packContext(deps, t.profile, t.today, true)),
      });
      if (first) tomorrow = { title: first.mission.title, pillar: first.mission.pillar, minutes: first.mission.minutes };
    }
  }

  return {
    ok: true,
    data: {
      firstName: t.profile.firstName,
      shareName: t.profile.shareName,
      referralCode: t.profile.referralCode,
      archetypeName: ARCHETYPE_INFO[t.profile.archetype].name,
      seasonNumber: t.profile.seasonNumber,
      day: t.day,
      week: t.week,
      act: t.act,
      weekTheme: WEEK_THEMES[t.profile.archetype][t.week - 1],
      seasonFinished: t.seasonFinished,
      fullAccess: t.fullAccess,
      hasPass: hasSeasonPass(deps.now, entitlements),
      trialEndingSoon: showTrialEndingBanner(deps.now, t.profile.trialEndsAt, entitlements),
      offerPaywall: !t.fullAccess && !t.seasonFinished && !reservation,
      swapsLeft: t.swapsLeft,
      missions,
      xp,
      rank: rankFor(xp),
      streak: { current: streak.current, best: streak.best, state: streak.state },
      score: empireScore(counted, t.today),
      pillars: pillarScores(counted, t.today),
      dayComplete,
      tomorrow,
      debrief: t.seasonFinished ? await seasonDebrief(deps, t.profile, passCoversDate(entitlements, tz)) : null,
    },
  };
}

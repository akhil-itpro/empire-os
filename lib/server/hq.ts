import "server-only";
import { hasSeasonPass, showTrialEndingBanner } from "@/lib/game/access";
import { addDays, localDate, seasonPosition } from "@/lib/game/dates";
import { empireScore, pillarScores } from "@/lib/game/score";
import { computeStreak, type StreakState } from "@/lib/game/streak";
import { rankFor, type RankProgress } from "@/lib/game/xp";
import type { Pillar } from "@/lib/pillars";
import { ARCHETYPE_INFO } from "@/lib/plan-engine/archetype";
import { MISSIONS, MISSIONS_BY_ID } from "@/lib/plan-engine/missions";
import { selectDailyMissions } from "@/lib/plan-engine/select";
import { ensureToday, settingsOn, type Deps, type Result } from "./season-service";
import type { MissionStatus } from "./store";

export type TicketData = {
  id: string;
  slot: number;
  pillar: Pillar;
  title: string;
  howTo: string;
  minutes: number;
  xp: number;
  status: MissionStatus;
};

export type HqData = {
  firstName: string;
  archetypeName: string;
  seasonNumber: number;
  day: number;
  seasonFinished: boolean;
  fullAccess: boolean;
  hasPass: boolean;
  trialEndingSoon: boolean;
  swapsLeft: number;
  missions: TicketData[];
  xp: number;
  rank: RankProgress;
  streak: { current: number; best: number; state: StreakState };
  score: number | null;
  pillars: Record<Pillar, number | null>;
  dayComplete: boolean;
  tomorrow: { title: string; pillar: Pillar; minutes: number } | null;
};

export async function loadHq(deps: Deps, userId: string): Promise<Result<HqData>> {
  const todayResult = await ensureToday(deps, userId);
  if (!todayResult.ok) return todayResult;
  const t = todayResult.data;
  const { store } = deps;

  const [recent, xp, activeDays, entitlements] = await Promise.all([
    store.listMissions(userId, addDays(t.today, -6), t.today),
    store.xpTotal(userId),
    store.activeDays(userId),
    store.entitlements(userId),
  ]);

  const tz = t.profile.timeZone;
  const streak = computeStreak({
    activeDays,
    today: t.today,
    seasonStart: t.profile.seasonStart,
    hasShieldOn: (date) =>
      entitlements.some(
        (e) => e.kind === "season_pass" && localDate(e.startsAt, tz) <= date && date < localDate(e.endsAt, tz),
      ),
  });

  const counted = recent
    .filter((m) => m.status !== "swapped")
    .map((m) => ({ localDate: m.localDate, pillar: m.pillar, done: m.status === "done" }));

  const missions: TicketData[] = t.missions.map((m) => {
    const def = MISSIONS_BY_ID.get(m.missionId);
    return {
      id: m.id,
      slot: m.slot,
      pillar: m.pillar,
      title: def?.title ?? "Mission",
      howTo: def?.howTo ?? "",
      minutes: m.minutes,
      xp: m.xp,
      status: m.status,
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
      const [first] = selectDailyMissions(MISSIONS, {
        seed: userId,
        date,
        seasonDay: pos.day,
        week: pos.week,
        act: pos.act,
        archetype: t.profile.archetype,
        settings: settingsOn(t.profile, date),
        history,
      });
      if (first) tomorrow = { title: first.mission.title, pillar: first.mission.pillar, minutes: first.mission.minutes };
    }
  }

  return {
    ok: true,
    data: {
      firstName: t.profile.firstName,
      archetypeName: ARCHETYPE_INFO[t.profile.archetype].name,
      seasonNumber: t.profile.seasonNumber,
      day: t.day,
      seasonFinished: t.seasonFinished,
      fullAccess: t.fullAccess,
      hasPass: hasSeasonPass(deps.now, entitlements),
      trialEndingSoon: showTrialEndingBanner(deps.now, t.profile.trialEndsAt, entitlements),
      swapsLeft: t.swapsLeft,
      missions,
      xp,
      rank: rankFor(xp),
      streak: { current: streak.current, best: streak.best, state: streak.state },
      score: empireScore(counted, t.today),
      pillars: pillarScores(counted, t.today),
      dayComplete,
      tomorrow,
    },
  };
}

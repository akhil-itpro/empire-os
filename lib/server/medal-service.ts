// Medals for Stats and HQ: the pure rules in lib/game/medals.ts applied to the
// student's own rows. Read-only: medals are worked out each time, never saved.
import { localDate, type LocalDate } from "@/lib/game/dates";
import { earnedMedals, MEDALS, newMedals, type MedalId, type MedalInput } from "@/lib/game/medals";
import { LIBRARY, LIBRARY_BY_ID } from "@/lib/plan-engine/library";
import type { Deps, Result } from "./season-service";
import type { Profile } from "./store";

// Every season counts, so medals stay when a new season starts.
const FIRST_DAY: LocalDate = "2000-01-01";

const PACK_SIZES: Record<string, number> = {};
for (const m of LIBRARY) if (m.pack) PACK_SIZES[m.pack] = (PACK_SIZES[m.pack] ?? 0) + 1;

export async function medalInput(deps: Deps, profile: Profile): Promise<MedalInput> {
  const [missions, reviews, bosses] = await Promise.all([
    deps.store.listMissions(profile.id, FIRST_DAY, localDate(deps.now, profile.timeZone)),
    deps.store.countWeeklyReviews(profile.id),
    deps.store.countXp(profile.id, "boss"),
  ]);
  return {
    missions: missions.map((m) => ({
      id: m.id,
      missionId: m.missionId,
      localDate: m.localDate,
      pillar: m.pillar,
      minutes: m.minutes,
      status: m.status,
      completedAt: m.completedAt,
      pack: LIBRARY_BY_ID.get(m.missionId)?.pack ?? null,
    })),
    timeZone: profile.timeZone,
    seasonStart: profile.seasonStart,
    reviews,
    bosses,
    packSizes: PACK_SIZES,
  };
}

export type MedalView = {
  id: MedalId;
  name: string;
  how: string;
  earned: boolean;
  /** The local date it was earned, when known. */
  earnedOn: LocalDate | null;
};

export async function loadMedals(deps: Deps, userId: string): Promise<Result<MedalView[]>> {
  const profile = await deps.store.getProfile(userId);
  if (!profile) return { ok: false, error: "not_started", message: "Start your season first." };
  const earned = earnedMedals(await medalInput(deps, profile));
  return {
    ok: true,
    data: MEDALS.map((m) => ({
      id: m.id,
      name: m.name,
      how: m.how,
      earned: earned.has(m.id),
      earnedOn: earned.get(m.id) ?? null,
    })),
  };
}

/** Medals that finishing this mission row just earned: the same history with the row still open, compared. */
export async function medalsFromMission(deps: Deps, profile: Profile, rowId: string): Promise<MedalId[]> {
  const input = await medalInput(deps, profile);
  const before = earnedMedals({
    ...input,
    missions: input.missions.map((m) => (m.id === rowId ? { ...m, status: "assigned", completedAt: null } : m)),
  });
  return newMedals(before, earnedMedals(input));
}

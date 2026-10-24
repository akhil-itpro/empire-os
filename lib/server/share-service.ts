// Share cards (docs/PRODUCT.md section 7): archetype, rank-up, streak (7, 30, 60, 90)
// and season complete. Every number comes from the student's own rows on the server,
// so a card can't claim a rank or streak that wasn't earned. A card shows the
// archetype, rank, first name or initials and a referral link; never email, city,
// journal text or anything private.
import { daysBetween, localDate, seasonPosition } from "@/lib/game/dates";
import { SEASON_DAYS, type RankName } from "@/lib/game/rules";
import { rankFor } from "@/lib/game/xp";
import { ARCHETYPE_INFO } from "@/lib/plan-engine/archetype";
import type { Archetype } from "@/lib/plan-engine/missions";
import { isShareKind, STREAK_CARD_DAYS, type ShareKind } from "@/lib/share/kinds";
import { seasonStreak, type Deps, type Result } from "./season-service";
import type { ShareName } from "./store";


export type ShareCard = {
  kind: ShareKind;
  archetype: Archetype;
  title: string;
  line: string;
  chips: string[];
  /** Initials ("R.") unless the student chose their first name. */
  name: string;
  referralCode: string;
  /** Lit ticks on the 90-tick medallion. */
  ticks: number;
};

export type ShareOption = { kind: ShareKind; label: string };

const nf = new Intl.NumberFormat("en-IN");

type ShareStats = {
  firstName: string;
  shareName: ShareName;
  archetype: Archetype;
  referralCode: string;
  seasonNumber: number;
  day: number;
  /** Day 90 reached. */
  seasonComplete: boolean;
  xp: number;
  rank: RankName;
  currentStreak: number;
  bestStreak: number;
};

async function loadStats(deps: Deps, userId: string): Promise<ShareStats | null> {
  const profile = await deps.store.getProfile(userId);
  if (!profile) return null;
  const today = localDate(deps.now, profile.timeZone);
  const [xp, activeDays, entitlements] = await Promise.all([
    deps.store.xpTotal(userId),
    deps.store.activeDays(userId),
    deps.store.entitlements(userId),
  ]);
  const streak = seasonStreak(profile, today, activeDays, entitlements);
  return {
    firstName: profile.firstName,
    shareName: profile.shareName,
    archetype: profile.archetype,
    referralCode: profile.referralCode,
    seasonNumber: profile.seasonNumber,
    day: seasonPosition(profile.seasonStart, today).day,
    seasonComplete: daysBetween(profile.seasonStart, today) + 1 >= SEASON_DAYS,
    xp,
    rank: rankFor(xp).rank,
    currentStreak: streak.current,
    bestStreak: streak.best,
  };
}

/** "an Operator", "a Strategist". */
function withArticle(rank: RankName) {
  return /^[AEIOU]/.test(rank) ? `an ${rank}` : `a ${rank}`;
}

function available(stats: ShareStats): ShareOption[] {
  const options: ShareOption[] = [{ kind: "archetype", label: `I'm ${ARCHETYPE_INFO[stats.archetype].name}` }];
  if (stats.rank !== "Rookie") options.push({ kind: "rank", label: `Rank: ${stats.rank}` });
  for (const days of STREAK_CARD_DAYS) {
    if (stats.bestStreak >= days) options.push({ kind: `streak-${days}`, label: `${days}-day streak` });
  }
  if (stats.seasonComplete) options.push({ kind: "season", label: `Season ${stats.seasonNumber} complete` });
  return options;
}

/** The cards this student has earned, for Me. */
export async function shareOptions(deps: Deps, userId: string): Promise<ShareOption[]> {
  const stats = await loadStats(deps, userId);
  return stats ? available(stats) : [];
}

/** The first letter of the first name, like "R.", unless the student chose the full first name. */
export function displayName(firstName: string, shareName: ShareName): string {
  if (shareName === "first_name") return firstName;
  return `${(Array.from(firstName.trim())[0] ?? "").toUpperCase()}.`;
}

export async function shareCard(deps: Deps, userId: string, kind: unknown): Promise<Result<ShareCard>> {
  if (!isShareKind(kind)) return { ok: false, error: "not_found", message: "That card doesn't exist." };
  const stats = await loadStats(deps, userId);
  if (!stats) return { ok: false, error: "not_started", message: "Start your season first." };
  if (!available(stats).some((o) => o.kind === kind)) {
    return { ok: false, error: "not_found", message: "That card isn't earned yet." };
  }

  const archetypeName = ARCHETYPE_INFO[stats.archetype].name;
  const season = `Season ${stats.seasonNumber}, day ${stats.day}.`;
  const rankChips = [stats.rank, `${nf.format(stats.xp)} XP`];
  const base = {
    kind,
    archetype: stats.archetype,
    name: displayName(stats.firstName, stats.shareName),
    referralCode: stats.referralCode,
  };

  if (kind === "archetype") {
    return {
      ok: true,
      data: {
        ...base,
        title: `I'm ${archetypeName}.`,
        line: `${ARCHETYPE_INFO[stats.archetype].identity.replace(/^You win/, "I win")} ${season}`,
        chips: stats.currentStreak >= 3 ? [...rankChips, `${stats.currentStreak}-day streak`] : rankChips,
        ticks: stats.day,
      },
    };
  }
  if (kind === "rank") {
    return {
      ok: true,
      data: {
        ...base,
        title: `I'm ${withArticle(stats.rank)}.`,
        line: `${archetypeName}. ${season}`,
        // The title already names the rank.
        chips: [`${nf.format(stats.xp)} XP`, ...(stats.currentStreak >= 3 ? [`${stats.currentStreak}-day streak`] : [])],
        ticks: stats.day,
      },
    };
  }
  if (kind === "season") {
    return {
      ok: true,
      data: {
        ...base,
        title: `Season ${stats.seasonNumber} complete.`,
        line: `90 days as ${archetypeName}.`,
        chips: [...rankChips, `Best streak ${stats.bestStreak} days`],
        ticks: SEASON_DAYS,
      },
    };
  }
  const days = Number(kind.slice("streak-".length));
  return {
    ok: true,
    data: { ...base, title: `${days} days in a row.`, line: `${archetypeName}. ${season}`, chips: rankChips, ticks: days },
  };
}

/** Initials or first name on share cards. */
export async function setShareName(deps: Deps, userId: string, value: unknown): Promise<Result<{ shareName: ShareName }>> {
  if (value !== "initials" && value !== "first_name") {
    return { ok: false, error: "invalid_input", message: "Pick initials or first name." };
  }
  if (!(await deps.store.getProfile(userId))) return { ok: false, error: "not_started", message: "Start your season first." };
  await deps.store.setShareName(userId, value);
  return { ok: true, data: { shareName: value } };
}

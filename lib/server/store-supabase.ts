import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Entitlement } from "@/lib/game/access";
import type { Pillar } from "@/lib/pillars";
import type { Answers } from "@/lib/plan-engine/answers";
import type { Archetype } from "@/lib/plan-engine/missions";
import type { PlanSettings } from "@/lib/plan-engine/select";
import type { Database, ProfileRow, UserMissionRow } from "@/lib/supabase/types";
import type {
  EventName,
  MissionStatus,
  NewProfile,
  NewUserMission,
  Profile,
  SeasonStore,
  StatsRow,
  UserMission,
  XpKind,
} from "./store";

const UNIQUE_VIOLATION = "23505";

function fail(what: string, error: { message: string }): never {
  throw new Error(`${what}: ${error.message}`);
}

function toProfile(row: ProfileRow): Profile {
  const answers = {
    firstName: row.first_name,
    ageBracket: row.age_bracket,
    city: row.city,
    situation: row.situation,
    goal: row.goal,
    pillarOrder: row.pillar_order as Pillar[],
    dailyMinutes: row.daily_minutes,
    budget: row.budget,
    gym: row.gym,
    laptop: row.laptop,
    enemy: row.enemy,
    intensity: row.intensity,
  } as Answers;
  return {
    id: row.id,
    firstName: row.first_name,
    answers,
    archetype: row.archetype as Archetype,
    timeZone: row.time_zone,
    seasonNumber: row.season_number,
    seasonStart: row.season_start,
    trialEndsAt: new Date(row.trial_ends_at),
    referralCode: row.referral_code,
    pendingSettings: (row.pending_settings as PlanSettings | null) ?? null,
    pendingFrom: row.pending_from,
  };
}

function toMission(row: UserMissionRow): UserMission {
  return {
    id: row.id,
    userId: row.user_id,
    localDate: row.local_date,
    slot: row.slot,
    missionId: row.mission_id,
    pillar: row.pillar as Pillar,
    minutes: row.minutes,
    xp: row.xp,
    status: row.status,
    skipReason: row.skip_reason,
    completedAt: row.completed_at ? new Date(row.completed_at) : null,
  };
}

/** SeasonStore on Supabase, using the admin client. Every query is scoped to one user id. */
export class SupabaseSeasonStore implements SeasonStore {
  constructor(private db: SupabaseClient<Database>) {}

  async getProfile(userId: string) {
    const { data, error } = await this.db.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (error) fail("getProfile", error);
    return data ? toProfile(data) : null;
  }

  async insertProfile(p: NewProfile) {
    const a = p.answers;
    const { error } = await this.db.from("profiles").insert({
      id: p.id,
      first_name: a.firstName,
      age_bracket: a.ageBracket,
      adult_confirmed_at: p.adultConfirmedAt.toISOString(),
      city: a.city,
      situation: a.situation,
      goal: a.goal,
      pillar_order: a.pillarOrder,
      daily_minutes: a.dailyMinutes,
      budget: a.budget,
      gym: a.gym,
      laptop: a.laptop,
      enemy: a.enemy,
      intensity: a.intensity,
      archetype: p.archetype,
      time_zone: p.timeZone,
      season_number: p.seasonNumber,
      season_start: p.seasonStart,
      trial_ends_at: p.trialEndsAt.toISOString(),
      referral_code: p.referralCode,
    });
    if (error?.code === UNIQUE_VIOLATION && error.message.includes("profiles_pkey")) return "exists" as const;
    if (error) fail("insertProfile", error);
    return "created" as const;
  }

  async isReferralCodeTaken(code: string) {
    const { data, error } = await this.db.from("profiles").select("id").eq("referral_code", code).limit(1);
    if (error) fail("isReferralCodeTaken", error);
    return (data?.length ?? 0) > 0;
  }

  async findUserIdByReferralCode(code: string) {
    const { data, error } = await this.db.from("profiles").select("id").eq("referral_code", code).maybeSingle();
    if (error) fail("findUserIdByReferralCode", error);
    return data?.id ?? null;
  }

  async insertReferral(referrerId: string, referredId: string) {
    const { error } = await this.db.from("referrals").insert({ referrer_id: referrerId, referred_id: referredId });
    if (error && error.code !== UNIQUE_VIOLATION) fail("insertReferral", error);
  }

  async listMissions(userId: string, from: string, to: string) {
    const { data, error } = await this.db
      .from("user_missions")
      .select("*")
      .eq("user_id", userId)
      .gte("local_date", from)
      .lte("local_date", to);
    if (error) fail("listMissions", error);
    return (data ?? []).map(toMission);
  }

  async insertMissions(rows: NewUserMission[]) {
    // One at a time: a slot that's already taken (two tabs at once) is skipped.
    for (const r of rows) {
      const { error } = await this.db.from("user_missions").insert({
        user_id: r.userId,
        local_date: r.localDate,
        slot: r.slot,
        mission_id: r.missionId,
        pillar: r.pillar,
        minutes: r.minutes,
        xp: r.xp,
      });
      if (error && error.code !== UNIQUE_VIOLATION) fail("insertMissions", error);
    }
  }

  async updateMissionStatus(
    userId: string,
    id: string,
    localDate: string,
    from: MissionStatus[],
    patch: { status: MissionStatus; skipReason?: string | null; completedAt?: Date | null },
  ) {
    const update: Database["public"]["Tables"]["user_missions"]["Update"] = { status: patch.status };
    if (patch.skipReason !== undefined) update.skip_reason = patch.skipReason;
    if (patch.completedAt !== undefined) update.completed_at = patch.completedAt?.toISOString() ?? null;
    const { data, error } = await this.db
      .from("user_missions")
      .update(update)
      .eq("id", id)
      .eq("user_id", userId)
      .eq("local_date", localDate)
      .in("status", from)
      .select("*")
      .maybeSingle();
    if (error) fail("updateMissionStatus", error);
    return data ? toMission(data) : null;
  }

  async addXp(userId: string, kind: XpKind, ref: string, xp: number) {
    const { error } = await this.db.from("xp_events").insert({ user_id: userId, kind, ref, xp });
    if (error?.code === UNIQUE_VIOLATION) return false;
    if (error) fail("addXp", error);
    return true;
  }

  async removeXp(userId: string, kind: XpKind, ref: string) {
    const { error } = await this.db.from("xp_events").delete().eq("user_id", userId).eq("kind", kind).eq("ref", ref);
    if (error) fail("removeXp", error);
  }

  async xpTotal(userId: string) {
    const { data, error } = await this.db.from("xp_events").select("xp").eq("user_id", userId);
    if (error) fail("xpTotal", error);
    return (data ?? []).reduce((sum, row) => sum + row.xp, 0);
  }

  async activeDays(userId: string) {
    const { data, error } = await this.db
      .from("user_missions")
      .select("local_date")
      .eq("user_id", userId)
      .eq("status", "done");
    if (error) fail("activeDays", error);
    return [...new Set((data ?? []).map((r) => r.local_date))];
  }

  async entitlements(userId: string): Promise<Entitlement[]> {
    const { data, error } = await this.db.from("entitlements").select("kind, starts_at, ends_at").eq("user_id", userId);
    if (error) fail("entitlements", error);
    return (data ?? []).map((e) => ({ kind: e.kind, startsAt: new Date(e.starts_at), endsAt: new Date(e.ends_at) }));
  }

  async saveStats(s: StatsRow) {
    const { error } = await this.db.from("user_stats").upsert({
      user_id: s.userId,
      xp: s.xp,
      current_streak: s.currentStreak,
      best_streak: s.bestStreak,
      last_active_date: s.lastActiveDate,
      updated_at: new Date().toISOString(),
    });
    if (error) fail("saveStats", error);
  }

  async logEvent(name: EventName, userId: string, props: Record<string, string | number | boolean> = {}) {
    // Analytics must never break the student's action.
    await this.db.from("events").insert({ name, user_id: userId, props });
  }
}

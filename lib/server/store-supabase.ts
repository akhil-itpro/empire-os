import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Entitlement, NewEntitlement } from "@/lib/game/access";
import type { Pillar } from "@/lib/pillars";
import type { Answers } from "@/lib/plan-engine/answers";
import type { Archetype } from "@/lib/plan-engine/missions";
import { isPackId, type PackId } from "@/lib/plan-engine/packs";
import { addDays } from "@/lib/game/dates";
import type { Database, ProfileRow, UserMissionRow } from "@/lib/supabase/types";
import type { ChecklistItem, FounderSnapshot } from "./founder";
import type {
  EventName,
  PendingSettings,
  MissionStatus,
  NewProfile,
  NewUserMission,
  Profile,
  ReferralStatus,
  SeasonStore,
  ShareName,
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
    activePacks: (row.active_packs ?? []).filter(isPackId),
    shareName: row.share_name,
    pendingSettings: (row.pending_settings as PendingSettings | null) ?? null,
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

  async insertReferral(referrerId: string, referredId: string, status: ReferralStatus = "signed_up") {
    const { error } = await this.db.from("referrals").insert({ referrer_id: referrerId, referred_id: referredId, status });
    if (error && error.code !== UNIQUE_VIOLATION) fail("insertReferral", error);
  }

  async claimReferral(referredId: string, at: Date) {
    // One conditional update, so two requests at once can't both claim it.
    const { data, error } = await this.db
      .from("referrals")
      .update({ status: "qualified", qualified_at: at.toISOString() })
      .eq("referred_id", referredId)
      .eq("status", "signed_up")
      .select("id, referrer_id")
      .maybeSingle();
    if (error) fail("claimReferral", error);
    return data ? { id: data.id, referrerId: data.referrer_id } : null;
  }

  async markReferralRewarded(id: string) {
    const { error } = await this.db.from("referrals").update({ status: "rewarded" }).eq("id", id).eq("status", "qualified");
    if (error) fail("markReferralRewarded", error);
  }

  async listReferrals(referrerId: string) {
    const { data, error } = await this.db.from("referrals").select("status").eq("referrer_id", referrerId);
    if (error) fail("listReferrals", error);
    return data ?? [];
  }

  async loginEmail(userId: string) {
    const { data, error } = await this.db.auth.admin.getUserById(userId);
    if (error) fail("loginEmail", error);
    return data.user?.email ?? null;
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
    const { data, error } = await this.db.from("entitlements").select("kind, starts_at, ends_at, source").eq("user_id", userId);
    if (error) fail("entitlements", error);
    return (data ?? []).map((e) => ({
      kind: e.kind,
      startsAt: new Date(e.starts_at),
      endsAt: new Date(e.ends_at),
      source: e.source,
    }));
  }

  async grantEntitlement(userId: string, grant: NewEntitlement) {
    const { error } = await this.db.from("entitlements").insert({
      user_id: userId,
      kind: grant.kind,
      starts_at: grant.startsAt.toISOString(),
      ends_at: grant.endsAt.toISOString(),
      source: grant.source,
    });
    if (error?.code === UNIQUE_VIOLATION) return false;
    if (error) fail("grantEntitlement", error);
    return true;
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

  async logEvent(name: EventName, userId: string | null, props: Record<string, string | number | boolean> = {}) {
    // Analytics must never break the student's action.
    await this.db.from("events").insert({ name, user_id: userId, props });
  }

  async setActivePacks(userId: string, packs: PackId[]) {
    const { error } = await this.db
      .from("profiles")
      .update({ active_packs: packs, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (error) fail("setActivePacks", error);
  }

  async setShareName(userId: string, shareName: ShareName) {
    const { error } = await this.db
      .from("profiles")
      .update({ share_name: shareName, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (error) fail("setShareName", error);
  }

  async getReservation(userId: string) {
    const { data, error } = await this.db
      .from("reservations")
      .select("price_inr, founder_price, created_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) fail("getReservation", error);
    return data ? { priceInr: data.price_inr, founderPrice: data.founder_price, createdAt: new Date(data.created_at) } : null;
  }

  async insertReservation(userId: string, priceInr: number, founderPrice: boolean) {
    const { error } = await this.db.from("reservations").insert({ user_id: userId, price_inr: priceInr, founder_price: founderPrice });
    if (error?.code === UNIQUE_VIOLATION) return "exists" as const;
    if (error) fail("insertReservation", error);
    return "created" as const;
  }

  async countFounderReservations() {
    const { count, error } = await this.db
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .eq("founder_price", true);
    if (error) fail("countFounderReservations", error);
    return count ?? 0;
  }

  async savePendingSettings(userId: string, settings: PendingSettings, from: string) {
    const { error } = await this.db
      .from("profiles")
      .update({ pending_settings: settings, pending_from: from, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (error) fail("savePendingSettings", error);
  }

  async commitPendingSettings(userId: string) {
    const profile = await this.getProfile(userId);
    const p = profile?.pendingSettings;
    if (!p) return;
    const { error } = await this.db
      .from("profiles")
      .update({
        goal: p.goal,
        city: p.city,
        archetype: p.archetype,
        pillar_order: p.pillarOrder,
        daily_minutes: p.dailyMinutes,
        budget: p.budget,
        gym: p.gym,
        laptop: p.laptop,
        enemy: p.enemy,
        intensity: p.intensity,
        pending_settings: null,
        pending_from: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
    if (error) fail("commitPendingSettings", error);
  }

  async listJournal(userId: string, from: string, to: string) {
    const { data, error } = await this.db
      .from("journal_entries")
      .select("local_date, body")
      .eq("user_id", userId)
      .gte("local_date", from)
      .lte("local_date", to)
      .order("local_date", { ascending: false });
    if (error) fail("listJournal", error);
    return (data ?? []).map((j) => ({ localDate: j.local_date, body: j.body }));
  }

  async saveJournal(userId: string, localDate: string, body: string) {
    const { error } = await this.db
      .from("journal_entries")
      .upsert({ user_id: userId, local_date: localDate, body }, { onConflict: "user_id,local_date" });
    if (error) fail("saveJournal", error);
  }

  async exportUser(userId: string) {
    const by = async (table: "profiles" | "user_stats", column: string) =>
      (await this.db.from(table).select("*").eq(column, userId)).data ?? [];
    const own = async (
      table: "user_missions" | "xp_events" | "entitlements" | "weekly_reviews" | "journal_entries" | "reservations",
    ) => (await this.db.from(table).select("*").eq("user_id", userId)).data ?? [];
    const { data: login } = await this.db.auth.admin.getUserById(userId);
    const referrals =
      (await this.db.from("referrals").select("*").or(`referrer_id.eq.${userId},referred_id.eq.${userId}`)).data ?? [];
    const events = (await this.db.from("events").select("name, props, created_at").eq("user_id", userId)).data ?? [];
    return {
      login: login.user ? { email: login.user.email, created_at: login.user.created_at } : null,
      profile: (await by("profiles", "id"))[0] ?? null,
      stats: (await by("user_stats", "user_id"))[0] ?? null,
      missions: await own("user_missions"),
      xp: await own("xp_events"),
      entitlements: await own("entitlements"),
      weekly_reviews: await own("weekly_reviews"),
      journal: await own("journal_entries"),
      reservations: await own("reservations"),
      referrals,
      events,
    };
  }

  async deleteUser(userId: string) {
    // Deleting the login cascades to every table linked to it (see the migrations).
    const { error } = await this.db.auth.admin.deleteUser(userId);
    if (error) fail("deleteUser", error);
  }

  async userExists(userId: string) {
    const { data } = await this.db.auth.admin.getUserById(userId);
    const profile = await this.getProfile(userId);
    return Boolean(data.user) || Boolean(profile);
  }

  async founderSnapshot(since: string): Promise<FounderSnapshot> {
    // Early-stage sizes; move these to SQL views once there are tens of thousands of rows.
    const cohortStart = addDays(since, -31);
    const [profiles, events, missions, reservations, referrals] = await Promise.all([
      this.db.from("profiles").select("id, season_start").gte("season_start", cohortStart),
      this.db.from("events").select("name, user_id, anon_id, props, created_at").gte("created_at", `${since}T00:00:00Z`).limit(50000),
      this.db.from("user_missions").select("user_id, local_date, pillar, mission_id, status, skip_reason").gte("local_date", cohortStart).limit(100000),
      this.db.from("reservations").select("founder_price"),
      this.db
        .from("referrals")
        .select("id", { count: "exact", head: true })
        .neq("status", "blocked")
        .gte("created_at", `${since}T00:00:00Z`),
    ]);
    for (const r of [profiles, events, missions, reservations]) if (r.error) fail("founderSnapshot", r.error);
    return {
      signups: (profiles.data ?? []).map((p) => ({ userId: p.id, signupDate: p.season_start })),
      events: (events.data ?? []).map((e) => ({ name: e.name, userId: e.user_id, anonId: e.anon_id, props: e.props ?? {}, at: new Date(e.created_at) })),
      missions: (missions.data ?? []).map((m) => ({
        userId: m.user_id,
        localDate: m.local_date,
        pillar: m.pillar as Pillar,
        missionId: m.mission_id,
        status: m.status,
        skipReason: m.skip_reason,
      })),
      reservations: {
        total: reservations.data?.length ?? 0,
        founderPrice: (reservations.data ?? []).filter((r) => r.founder_price).length,
      },
      referralSignups: referrals.count ?? 0,
    };
  }

  async listChecklist(): Promise<ChecklistItem[]> {
    const { data, error } = await this.db.from("launch_checklist").select("id, section, label, done").order("position");
    if (error) fail("listChecklist", error);
    return data ?? [];
  }

  async setChecklistItem(id: string, done: boolean, userId: string) {
    const { error } = await this.db
      .from("launch_checklist")
      .update({ done, done_at: done ? new Date().toISOString() : null, done_by: done ? userId : null })
      .eq("id", id);
    if (error) fail("setChecklistItem", error);
  }

  async isFounder(userId: string) {
    const { data, error } = await this.db.from("roles").select("role").eq("user_id", userId).eq("role", "founder").maybeSingle();
    if (error) fail("isFounder", error);
    return Boolean(data);
  }
}

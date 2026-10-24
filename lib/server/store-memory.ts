// An in-memory SeasonStore for unit tests and the local test mode (never production).
// It mirrors the database rules that matter: one live mission per slot per day,
// and one XP grant per kind + ref.
import type { Entitlement, NewEntitlement } from "@/lib/game/access";
import type { PackId } from "@/lib/plan-engine/packs";
import { LAUNCH_ITEMS, type ChecklistItem, type FounderSnapshot } from "./founder";
import type {
  EventName,
  PendingSettings,
  MissionStatus,
  NewProfile,
  NewUserMission,
  Profile,
  ReferralStatus,
  Reservation,
  SeasonStore,
  ShareName,
  StatsRow,
  UserMission,
  XpKind,
} from "@/lib/server/store";

export class MemoryStore implements SeasonStore {
  profiles = new Map<string, Profile>();
  missions: UserMission[] = [];
  xp: { userId: string; kind: XpKind; ref: string; xp: number }[] = [];
  stats = new Map<string, StatsRow>();
  grants: (Entitlement & { userId: string })[] = [];
  referrals: { id: string; referrerId: string; referredId: string; status: ReferralStatus; qualifiedAt: Date | null }[] = [];
  events: { name: EventName; userId: string; props?: Record<string, unknown>; at: Date }[] = [];
  reservations: (Reservation & { userId: string })[] = [];
  /** Login emails, set by tests that need them (local test mode has none). */
  emails = new Map<string, string>();
  checklist: ChecklistItem[] = LAUNCH_ITEMS.map((i) => ({ ...i, done: false }));
  founders = new Set<string>();
  journal: { userId: string; localDate: string; body: string }[] = [];
  private nextId = 1;

  private uuid() {
    return `00000000-0000-4000-8000-${String(this.nextId++).padStart(12, "0")}`;
  }

  async getProfile(userId: string) {
    return this.profiles.get(userId) ?? null;
  }

  async insertProfile(p: NewProfile) {
    if (this.profiles.has(p.id)) return "exists" as const;
    this.profiles.set(p.id, {
      id: p.id,
      firstName: p.firstName,
      answers: p.answers,
      archetype: p.archetype,
      timeZone: p.timeZone,
      seasonNumber: p.seasonNumber,
      seasonStart: p.seasonStart,
      trialEndsAt: p.trialEndsAt,
      referralCode: p.referralCode,
      activePacks: [],
      shareName: "initials",
      pendingSettings: null,
      pendingFrom: null,
    });
    return "created" as const;
  }

  async isReferralCodeTaken(code: string) {
    return [...this.profiles.values()].some((p) => p.referralCode === code);
  }

  async findUserIdByReferralCode(code: string) {
    return [...this.profiles.values()].find((p) => p.referralCode === code)?.id ?? null;
  }

  async insertReferral(referrerId: string, referredId: string, status: ReferralStatus = "signed_up") {
    if (this.referrals.some((r) => r.referredId === referredId)) return;
    this.referrals.push({ id: this.uuid(), referrerId, referredId, status, qualifiedAt: null });
  }

  async claimReferral(referredId: string, at: Date) {
    const r = this.referrals.find((x) => x.referredId === referredId && x.status === "signed_up");
    if (!r) return null;
    r.status = "qualified";
    r.qualifiedAt = at;
    return { id: r.id, referrerId: r.referrerId };
  }

  async markReferralRewarded(id: string) {
    const r = this.referrals.find((x) => x.id === id);
    if (r) r.status = "rewarded";
  }

  async listReferrals(referrerId: string) {
    return this.referrals.filter((r) => r.referrerId === referrerId).map((r) => ({ status: r.status }));
  }

  async loginEmail(userId: string) {
    return this.emails.get(userId) ?? null;
  }

  async listMissions(userId: string, from: string, to: string) {
    return this.missions.filter((m) => m.userId === userId && m.localDate >= from && m.localDate <= to).map((m) => ({ ...m }));
  }

  async insertMissions(rows: NewUserMission[]) {
    for (const r of rows) {
      const taken = this.missions.some(
        (m) => m.userId === r.userId && m.localDate === r.localDate && m.slot === r.slot && m.status !== "swapped",
      );
      if (taken) continue;
      this.missions.push({ ...r, id: this.uuid(), status: "assigned", skipReason: null, completedAt: null });
    }
  }

  async updateMissionStatus(
    userId: string,
    id: string,
    localDate: string,
    from: MissionStatus[],
    patch: { status: MissionStatus; skipReason?: string | null; completedAt?: Date | null },
  ) {
    const m = this.missions.find((x) => x.id === id && x.userId === userId && x.localDate === localDate && from.includes(x.status));
    if (!m) return null;
    m.status = patch.status;
    if (patch.skipReason !== undefined) m.skipReason = patch.skipReason;
    if (patch.completedAt !== undefined) m.completedAt = patch.completedAt;
    return { ...m };
  }

  async addXp(userId: string, kind: XpKind, ref: string, xp: number) {
    if (this.xp.some((e) => e.userId === userId && e.kind === kind && e.ref === ref)) return false;
    this.xp.push({ userId, kind, ref, xp });
    return true;
  }

  async removeXp(userId: string, kind: XpKind, ref: string) {
    this.xp = this.xp.filter((e) => !(e.userId === userId && e.kind === kind && e.ref === ref));
  }

  async xpTotal(userId: string) {
    return this.xp.filter((e) => e.userId === userId).reduce((s, e) => s + e.xp, 0);
  }

  async activeDays(userId: string) {
    return [...new Set(this.missions.filter((m) => m.userId === userId && m.status === "done").map((m) => m.localDate))];
  }

  async entitlements(userId: string) {
    return this.grants.filter((g) => g.userId === userId);
  }

  async grantEntitlement(userId: string, grant: NewEntitlement) {
    if (this.grants.some((g) => g.userId === userId && g.source === grant.source)) return false;
    this.grants.push({ ...grant, userId });
    return true;
  }

  async saveStats(stats: StatsRow) {
    this.stats.set(stats.userId, stats);
  }

  async logEvent(name: EventName, userId: string | null, props?: Record<string, unknown>) {
    this.events.push({ name, userId: userId ?? "", props, at: new Date() });
  }

  async setActivePacks(userId: string, packs: PackId[]) {
    const p = this.profiles.get(userId);
    if (p) this.profiles.set(userId, { ...p, activePacks: [...packs] });
  }

  async setShareName(userId: string, shareName: ShareName) {
    const p = this.profiles.get(userId);
    if (p) this.profiles.set(userId, { ...p, shareName });
  }

  async getReservation(userId: string) {
    const r = this.reservations.find((x) => x.userId === userId);
    return r ? { priceInr: r.priceInr, founderPrice: r.founderPrice, createdAt: r.createdAt } : null;
  }

  async insertReservation(userId: string, priceInr: number, founderPrice: boolean) {
    if (this.reservations.some((r) => r.userId === userId)) return "exists" as const;
    this.reservations.push({ userId, priceInr, founderPrice, createdAt: new Date() });
    return "created" as const;
  }

  async countFounderReservations() {
    return this.reservations.filter((r) => r.founderPrice).length;
  }

  async isFounder(userId: string) {
    return this.founders.has(userId);
  }

  async savePendingSettings(userId: string, settings: PendingSettings, from: string) {
    const p = this.profiles.get(userId);
    if (p) this.profiles.set(userId, { ...p, pendingSettings: settings, pendingFrom: from });
  }

  async commitPendingSettings(userId: string) {
    const p = this.profiles.get(userId);
    if (!p?.pendingSettings) return;
    const { archetype, ...answers } = p.pendingSettings;
    this.profiles.set(userId, {
      ...p,
      answers: { ...p.answers, ...answers },
      archetype,
      pendingSettings: null,
      pendingFrom: null,
    });
  }

  async listJournal(userId: string, from: string, to: string) {
    return this.journal
      .filter((j) => j.userId === userId && j.localDate >= from && j.localDate <= to)
      .map(({ localDate, body }) => ({ localDate, body }));
  }

  async saveJournal(userId: string, localDate: string, body: string) {
    this.journal = this.journal.filter((j) => !(j.userId === userId && j.localDate === localDate));
    this.journal.push({ userId, localDate, body });
  }

  async exportUser(userId: string) {
    return {
      profile: this.profiles.get(userId) ?? null,
      missions: this.missions.filter((m) => m.userId === userId),
      xp: this.xp.filter((x) => x.userId === userId),
      stats: this.stats.get(userId) ?? null,
      entitlements: this.grants.filter((g) => g.userId === userId),
      reservations: this.reservations.filter((r) => r.userId === userId),
      journal: this.journal.filter((j) => j.userId === userId),
      referrals: this.referrals.filter((r) => r.referrerId === userId || r.referredId === userId),
      events: this.events.filter((e) => e.userId === userId),
    };
  }

  async deleteUser(userId: string) {
    this.profiles.delete(userId);
    this.stats.delete(userId);
    this.founders.delete(userId);
    this.missions = this.missions.filter((m) => m.userId !== userId);
    this.xp = this.xp.filter((x) => x.userId !== userId);
    this.grants = this.grants.filter((g) => g.userId !== userId);
    this.journal = this.journal.filter((j) => j.userId !== userId);
    this.reservations = this.reservations.filter((r) => r.userId !== userId);
    this.referrals = this.referrals.filter((r) => r.referrerId !== userId && r.referredId !== userId);
    // Events stay, but no longer linked to anyone (like the database's "on delete set null").
    this.events = this.events.map((e) => (e.userId === userId ? { ...e, userId: "" } : e));
  }

  async userExists(userId: string) {
    return this.profiles.has(userId);
  }

  async founderSnapshot(since: string): Promise<FounderSnapshot> {
    return {
      signups: [...this.profiles.values()]
        .filter((p) => p.seasonStart >= since)
        .map((p) => ({ userId: p.id, signupDate: p.seasonStart })),
      events: this.events.map((e) => ({ name: e.name, userId: e.userId || null, anonId: null, props: e.props ?? {}, at: e.at })),
      missions: this.missions
        .filter((m) => m.localDate >= since)
        .map((m) => ({ userId: m.userId, localDate: m.localDate, pillar: m.pillar, missionId: m.missionId, status: m.status, skipReason: m.skipReason })),
      reservations: {
        total: this.reservations.length,
        founderPrice: this.reservations.filter((r) => r.founderPrice).length,
      },
      referralSignups: this.referrals.filter((r) => r.status !== "blocked").length,
    };
  }

  async listChecklist() {
    return this.checklist.map((c) => ({ ...c }));
  }

  async setChecklistItem(id: string, done: boolean) {
    this.checklist = this.checklist.map((c) => (c.id === id ? { ...c, done } : c));
  }
}

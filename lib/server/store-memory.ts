// An in-memory SeasonStore for unit tests and the local test mode (never production).
// It mirrors the database rules that matter: one live mission per slot per day,
// and one XP grant per kind + ref.
import type { Entitlement } from "@/lib/game/access";
import type {
  EventName,
  PendingSettings,
  MissionStatus,
  NewProfile,
  NewUserMission,
  Profile,
  SeasonStore,
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
  referrals: { referrerId: string; referredId: string }[] = [];
  events: { name: EventName; userId: string; props?: Record<string, unknown> }[] = [];
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

  async insertReferral(referrerId: string, referredId: string) {
    this.referrals.push({ referrerId, referredId });
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

  async saveStats(stats: StatsRow) {
    this.stats.set(stats.userId, stats);
  }

  async logEvent(name: EventName, userId: string, props?: Record<string, unknown>) {
    this.events.push({ name, userId, props });
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
}

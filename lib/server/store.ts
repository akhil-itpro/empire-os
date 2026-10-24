// What the season service needs from the database. The app uses the Supabase
// version (store-supabase.ts); unit tests use an in-memory one.
import type { Entitlement } from "@/lib/game/access";
import type { LocalDate } from "@/lib/game/dates";
import type { Pillar } from "@/lib/pillars";
import type { Answers } from "@/lib/plan-engine/answers";
import type { Archetype } from "@/lib/plan-engine/missions";
import type { PlanSettings } from "@/lib/plan-engine/select";

export type MissionStatus = "assigned" | "done" | "skipped" | "swapped";
export type XpKind = "mission" | "day_bonus" | "boss";
export type EventName =
  | "signup_done"
  | "first_mission_done"
  | "mission_done"
  | "mission_skipped"
  | "mission_swapped"
  | "day_complete";

export type Profile = {
  id: string;
  firstName: string;
  answers: Answers;
  archetype: Archetype;
  timeZone: string;
  seasonNumber: number;
  seasonStart: LocalDate;
  trialEndsAt: Date;
  referralCode: string;
  /** Edits from Me that apply from `pendingFrom`. */
  pendingSettings: PlanSettings | null;
  pendingFrom: LocalDate | null;
};

export type NewProfile = Omit<Profile, "pendingSettings" | "pendingFrom"> & {
  adultConfirmedAt: Date;
};

export type UserMission = {
  id: string;
  userId: string;
  localDate: LocalDate;
  slot: number;
  missionId: string;
  pillar: Pillar;
  minutes: number;
  xp: number;
  status: MissionStatus;
  skipReason: string | null;
  completedAt: Date | null;
};

export type NewUserMission = Pick<
  UserMission,
  "userId" | "localDate" | "slot" | "missionId" | "pillar" | "minutes" | "xp"
>;

export type StatsRow = {
  userId: string;
  xp: number;
  currentStreak: number;
  bestStreak: number;
  lastActiveDate: LocalDate | null;
};

export interface SeasonStore {
  getProfile(userId: string): Promise<Profile | null>;
  /** "exists" when the user already has a profile (a second tap on Start, for example). */
  insertProfile(profile: NewProfile): Promise<"created" | "exists">;
  isReferralCodeTaken(code: string): Promise<boolean>;
  findUserIdByReferralCode(code: string): Promise<string | null>;
  insertReferral(referrerId: string, referredId: string): Promise<void>;

  /** Every mission row (including swapped ones) between two local dates, inclusive. */
  listMissions(userId: string, from: LocalDate, to: LocalDate): Promise<UserMission[]>;
  /** Inserts rows; a row whose live slot is already taken is skipped, not an error. */
  insertMissions(rows: NewUserMission[]): Promise<void>;
  /**
   * Changes one of the user's missions on `localDate`, only if its status is one of
   * `from`. Returns the updated row, or null if nothing matched.
   */
  updateMissionStatus(
    userId: string,
    id: string,
    localDate: LocalDate,
    from: MissionStatus[],
    patch: { status: MissionStatus; skipReason?: string | null; completedAt?: Date | null },
  ): Promise<UserMission | null>;

  /** Records an XP grant; false if the same grant (kind + ref) already exists. */
  addXp(userId: string, kind: XpKind, ref: string, xp: number): Promise<boolean>;
  removeXp(userId: string, kind: XpKind, ref: string): Promise<void>;
  xpTotal(userId: string): Promise<number>;
  /** Local dates with at least one mission done. */
  activeDays(userId: string): Promise<LocalDate[]>;
  entitlements(userId: string): Promise<Entitlement[]>;
  saveStats(stats: StatsRow): Promise<void>;

  logEvent(name: EventName, userId: string, props?: Record<string, string | number | boolean>): Promise<void>;
}

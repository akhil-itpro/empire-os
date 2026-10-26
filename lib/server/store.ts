// What the season service needs from the database. The app uses the Supabase
// version (store-supabase.ts); unit tests use an in-memory one.
import type { ClientEvent } from "@/lib/analytics/track";
import type { Entitlement, NewEntitlement } from "@/lib/game/access";
import type { LocalDate } from "@/lib/game/dates";
import type { Pillar } from "@/lib/pillars";
import type { Answers } from "@/lib/plan-engine/answers";
import type { Archetype } from "@/lib/plan-engine/missions";
import type { PackId } from "@/lib/plan-engine/packs";
import type { PlanSettings, WeekAdjustments } from "@/lib/plan-engine/select";
import type { ChecklistItem, FounderSnapshot } from "./founder";

export type MissionStatus = "assigned" | "done" | "skipped" | "swapped";
export type XpKind = "mission" | "day_bonus" | "boss";
export type EventName =
  | "signup_done"
  | "first_mission_done"
  | "mission_done"
  | "mission_skipped"
  | "mission_swapped"
  | "day_complete"
  | "reserve_click"
  | "referral_signup"
  | "referral_reward"
  | "weekly_review_done"
  | "demo_request"
  | "checkout_start"
  | "payment_done"
  | "payment_failed"
  | "season_start"
  // Browser events, logged by the server only in local test mode (see app/api/test-event).
  | ClientEvent;

/** Share cards show initials unless the student chooses their first name. */
export type ShareName = "initials" | "first_name";

/** Edits from Me: the new plan settings plus goal, city and the archetype the goal implies. */
export type PendingSettings = PlanSettings & {
  goal: Answers["goal"];
  city: Answers["city"];
  archetype: Archetype;
};

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
  /** Packs turned on (used only while the student has full access). */
  activePacks: PackId[];
  shareName: ShareName;
  /** Edits from Me that apply from `pendingFrom`. */
  pendingSettings: PendingSettings | null;
  pendingFrom: LocalDate | null;
};

export type NewProfile = Omit<Profile, "pendingSettings" | "pendingFrom" | "activePacks" | "shareName"> & {
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

/** Reserve mode: interest in Season Pass, with the price shown at the time. No payment. */
export type Reservation = { priceInr: number; founderPrice: boolean; createdAt: Date };

export type ReferralStatus = "signed_up" | "qualified" | "rewarded" | "blocked";

/** What a War Room review saved: next week's changes and how they were explained. */
export type ReviewOutcome = WeekAdjustments & {
  boss?: boolean;
  reasons: string[];
  lowWeek: boolean;
  /** False for Free students: they see what would change, but nothing is applied. */
  applied: boolean;
  /** This week's numbers, kept so the results screen shows the same figures later. */
  done: number;
  assigned: number;
  /** A city or goal change waits for "Apply new plan?". */
  proposal?: {
    goal: Answers["goal"];
    city: Answers["city"];
    fromGoal: Answers["goal"];
    fromCity: Answers["city"];
    status: "open" | "applied" | "kept";
  };
};

export type WeeklyReview = {
  seasonNumber: number;
  week: number;
  felt: string;
  blocker: string;
  changes: string[];
  focusPillar: Pillar;
  outcome: ReviewOutcome;
  createdAt: Date;
};

/** One Razorpay order for Season Pass, with the price the server computed. */
export type Payment = {
  userId: string;
  orderId: string;
  paymentId: string | null;
  amountInr: number;
  founderPrice: boolean;
  status: "created" | "paid" | "failed";
  createdAt: Date;
  paidAt: Date | null;
};

/** "Book a 20-minute demo" from /colleges: work contact details a TPO sends us. */
export type DemoRequest = {
  name: string;
  role: "tpo" | "placement_staff" | "principal" | "faculty" | "other";
  college: string;
  city: string;
  email: string;
  phone: string | null;
  batchSize: "under_100" | "100_300" | "300_600" | "over_600";
  note: string | null;
};

// College HQ (docs/PRODUCT.md section 9).
export type Org = { id: string; name: string; city: string | null };

export type Batch = {
  id: string;
  orgId: string;
  name: string;
  startsOn: LocalDate;
  endsOn: LocalDate;
  joinCode: string;
  sections: string[];
  /** A paid batch: members get Season Pass access for the season dates. */
  grantsPass: boolean;
  /** A demo batch: College HQ shows generated, labelled sample data. */
  isSample: boolean;
};

export type BatchMember = {
  userId: string;
  batchId: string;
  /** What the college sees: first name and an optional last-name initial, e.g. "Aarav K.". */
  displayName: string;
  section: string | null;
  joinedAt: Date;
};

export type Nudge = { id: string; batchId: string; userId: string; localDate: LocalDate; seenAt: Date | null };

/** Mission rows a college may see: day, status and which mission. Nothing else. */
export type MemberMission = { userId: string; localDate: LocalDate; status: MissionStatus; missionId: string };

export interface SeasonStore {
  getProfile(userId: string): Promise<Profile | null>;
  /** "exists" when the user already has a profile (a second tap on Start, for example). */
  insertProfile(profile: NewProfile): Promise<"created" | "exists">;
  isReferralCodeTaken(code: string): Promise<boolean>;
  findUserIdByReferralCode(code: string): Promise<string | null>;
  insertReferral(referrerId: string, referredId: string, status?: ReferralStatus): Promise<void>;
  /**
   * Moves the student's referral from "signed_up" to "qualified", once. Returns it,
   * or null if there is none or it was already claimed (so a reward can't repeat).
   */
  claimReferral(referredId: string, at: Date): Promise<{ id: string; referrerId: string } | null>;
  markReferralRewarded(id: string): Promise<void>;
  /** The statuses of everyone this student invited, for Me. */
  listReferrals(referrerId: string): Promise<{ status: ReferralStatus }[]>;
  /** The login email, used only to block self-referrals through email aliases. */
  loginEmail(userId: string): Promise<string | null>;

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
  /** Adds access; false if a grant from the same source already exists. */
  grantEntitlement(userId: string, grant: NewEntitlement): Promise<boolean>;
  saveStats(stats: StatsRow): Promise<void>;

  /** userId is null for a visitor who isn't signed in. */
  logEvent(name: EventName, userId: string | null, props?: Record<string, string | number | boolean>): Promise<void>;

  setActivePacks(userId: string, packs: PackId[]): Promise<void>;
  setShareName(userId: string, shareName: ShareName): Promise<void>;

  getReservation(userId: string): Promise<Reservation | null>;
  /** "exists" when the student already reserved; the first reservation stands. */
  insertReservation(userId: string, priceInr: number, founderPrice: boolean): Promise<"created" | "exists">;
  /** Reservations at the founder price, counted toward the first 500. */
  countFounderReservations(): Promise<number>;
  /** Founder places taken: students with a founder-price reservation or a paid founder-price pass. */
  countFounderPlaces(): Promise<number>;

  // --- Payments (Razorpay). Only the server writes; students read their own. ---
  insertPayment(p: Pick<Payment, "userId" | "orderId" | "amountInr" | "founderPrice">): Promise<void>;
  getPayment(orderId: string): Promise<Payment | null>;
  /** Marks an order paid, once. True only for the call that changed it. */
  markPaymentPaid(orderId: string, paymentId: string, at: Date): Promise<boolean>;
  /** Marks an order failed, unless it was already paid. */
  markPaymentFailed(orderId: string): Promise<void>;
  listPayments(userId: string): Promise<Payment[]>;

  /** True if the user has the founder role (written only by the server). */
  isFounder(userId: string): Promise<boolean>;

  /** Saves Me edits to apply from `from` (tomorrow); history is never rewritten. */
  savePendingSettings(userId: string, settings: PendingSettings, from: LocalDate): Promise<void>;
  /** Makes pending settings the current ones and clears them. */
  commitPendingSettings(userId: string): Promise<void>;
  /**
   * Moves the student from season `from` to `to`, starting on `start`. False when the
   * season number had already moved (a second tap or a second tab), so it runs once.
   */
  startNewSeason(userId: string, from: number, to: number, start: LocalDate): Promise<boolean>;

  /** The private one-line journal. */
  listJournal(userId: string, from: LocalDate, to: LocalDate): Promise<{ localDate: LocalDate; body: string }[]>;
  saveJournal(userId: string, localDate: LocalDate, body: string): Promise<void>;

  /** Every record linked to the user, for "Download my data". */
  exportUser(userId: string): Promise<Record<string, unknown>>;
  /** Deletes the login and every record linked to the user. Events are kept unlinked. */
  deleteUser(userId: string): Promise<void>;
  /** True if any login or profile still exists for the user (to report the true result). */
  userExists(userId: string): Promise<boolean>;

  // --- Demo requests (/colleges). Only the founder reads them, through the server. ---
  insertDemoRequest(request: DemoRequest): Promise<void>;
  /** Requests since a moment, all or from one email (for rate limits). */
  countDemoRequests(since: Date, email?: string): Promise<number>;
  listDemoRequests(limit: number): Promise<(DemoRequest & { createdAt: Date })[]>;

  // --- War Room ---
  getWeeklyReview(userId: string, seasonNumber: number, week: number): Promise<WeeklyReview | null>;
  /** "exists" when this week was already reviewed (the first review stands). */
  insertWeeklyReview(userId: string, review: Omit<WeeklyReview, "createdAt">): Promise<"created" | "exists">;
  updateReviewOutcome(userId: string, seasonNumber: number, week: number, outcome: ReviewOutcome): Promise<void>;
  /** True if this XP grant already exists (the weekly boss, for example). */
  hasXp(userId: string, kind: XpKind, ref: string): Promise<boolean>;
  /** How many XP grants of one kind the student has (weekly bosses finished, for medals). */
  countXp(userId: string, kind: XpKind): Promise<number>;
  /** How many weekly reviews the student has finished, in every season (for medals). */
  countWeeklyReviews(userId: string): Promise<number>;

  // --- College HQ. Callers check the founder role or org admin rights first. ---
  createOrg(name: string, city: string | null): Promise<Org>;
  getOrg(orgId: string): Promise<Org | null>;
  /** Every organisation with its batches and member counts (Founder HQ). */
  listOrgs(): Promise<{ org: Org; batches: (Batch & { members: number })[]; admins: number }[]>;
  addOrgAdmin(orgId: string, userId: string): Promise<void>;
  /** Organisations this user administers. */
  adminOrgIds(userId: string): Promise<string[]>;
  createOrgInvite(orgId: string, tokenHash: string, label: string | null, createdBy: string, expiresAt: Date): Promise<void>;
  /** Uses an invite once, if it exists and hasn't expired. Returns its organisation. */
  claimOrgInvite(tokenHash: string, userId: string, at: Date): Promise<string | null>;
  /** "code_taken" when the join code already exists (the caller tries another). */
  createBatch(batch: Omit<Batch, "id">): Promise<Batch | "code_taken">;
  getBatch(batchId: string): Promise<Batch | null>;
  findBatchByCode(joinCode: string): Promise<Batch | null>;
  listBatches(orgIds: string[]): Promise<Batch[]>;
  getMembership(userId: string): Promise<BatchMember | null>;
  /** "exists" when the student is already in a batch (one at a time). */
  insertMember(member: Omit<BatchMember, "joinedAt"> & { consentedAt: Date }): Promise<"created" | "exists">;
  deleteMember(userId: string): Promise<void>;
  listMembers(batchId: string): Promise<BatchMember[]>;
  /** Mission rows of these students between two dates, inclusive. */
  listMemberMissions(userIds: string[], from: LocalDate, to: LocalDate): Promise<MemberMission[]>;
  /** Adds access, or updates the dates of the grant from the same source. */
  upsertEntitlement(userId: string, grant: NewEntitlement): Promise<void>;
  /** Ends a grant at `at` (deletes it if it hadn't started yet). */
  endEntitlement(userId: string, source: string, at: Date): Promise<void>;
  /** "exists" when the student already got a reminder that day. */
  insertNudge(batchId: string, userId: string, sentBy: string, localDate: LocalDate): Promise<"created" | "exists">;
  listNudges(batchId: string, from: LocalDate): Promise<Nudge[]>;
  /** The newest reminder the student hasn't dismissed. */
  unseenNudge(userId: string): Promise<Nudge | null>;
  markNudgeSeen(userId: string, nudgeId: string, at: Date): Promise<void>;

  /** Founder HQ only (the caller checks the founder role): raw rows from `since` on. */
  founderSnapshot(since: LocalDate): Promise<FounderSnapshot>;
  listChecklist(): Promise<ChecklistItem[]>;
  setChecklistItem(id: string, done: boolean, userId: string): Promise<void>;
}

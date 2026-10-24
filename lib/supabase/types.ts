// Database types, matching supabase/migrations. Keep in step with every new migration.
// (Once the Supabase MCP server is connected, these can be regenerated from the database.)

type Table<Row, Defaulted extends keyof Row = never> = {
  Row: Row;
  Insert: Omit<Row, Defaulted> & Partial<Pick<Row, Defaulted>>;
  Update: Partial<Row>;
  Relationships: [];
};

export type ProfileRow = {
  id: string;
  first_name: string;
  age_bracket: string;
  adult_confirmed_at: string;
  city: string;
  situation: string;
  goal: string;
  pillar_order: string[];
  daily_minutes: number;
  budget: string;
  gym: boolean;
  laptop: boolean;
  enemy: string;
  intensity: string;
  archetype: string;
  time_zone: string;
  season_number: number;
  season_start: string;
  trial_ends_at: string;
  referral_code: string;
  share_name: "initials" | "first_name";
  pending_settings: Record<string, unknown> | null;
  pending_from: string | null;
  created_at: string;
  updated_at: string;
};

export type MissionStatus = "assigned" | "done" | "skipped" | "swapped";

export type UserMissionRow = {
  id: string;
  user_id: string;
  local_date: string;
  slot: number;
  mission_id: string;
  pillar: string;
  minutes: number;
  xp: number;
  status: MissionStatus;
  skip_reason: string | null;
  completed_at: string | null;
  created_at: string;
};

export type XpEventRow = {
  id: string;
  user_id: string;
  kind: "mission" | "day_bonus" | "boss";
  ref: string;
  xp: number;
  created_at: string;
};

export type UserStatsRow = {
  user_id: string;
  xp: number;
  current_streak: number;
  best_streak: number;
  last_active_date: string | null;
  updated_at: string;
};

export type EntitlementRow = {
  id: string;
  user_id: string;
  kind: "season_pass" | "batch" | "referral_bonus";
  starts_at: string;
  ends_at: string;
  source: string;
  created_at: string;
};

export type WeeklyReviewRow = {
  id: string;
  user_id: string;
  season_number: number;
  week: number;
  felt: string;
  blocker: string;
  changes: string[];
  focus_pillar: string;
  adjustments: Record<string, unknown>;
  created_at: string;
};

export type JournalEntryRow = {
  id: string;
  user_id: string;
  local_date: string;
  body: string;
  created_at: string;
};

export type ReservationRow = {
  id: string;
  user_id: string;
  price_inr: number;
  founder_price: boolean;
  created_at: string;
};

export type ReferralRow = {
  id: string;
  referrer_id: string;
  referred_id: string;
  status: "signed_up" | "qualified" | "rewarded" | "blocked";
  created_at: string;
  qualified_at: string | null;
};

export type RoleRow = { user_id: string; role: "founder"; created_at: string };

export type EventRow = {
  id: number;
  name: string;
  user_id: string | null;
  anon_id: string | null;
  props: Record<string, unknown>;
  created_at: string;
};

export type MissionLibraryRow = {
  id: string;
  pillar: string;
  title: string;
  how_to: string;
  minutes: number;
  cost: string;
  needs: string;
  difficulty: number;
  archetypes: string[];
  act: number;
  tags: string[];
  pack: string | null;
  active: boolean;
};

export type PackRow = { id: string; name: string; description: string };

export type Database = {
  public: {
    Tables: {
      profiles: Table<ProfileRow, "time_zone" | "season_number" | "share_name" | "pending_settings" | "pending_from" | "created_at" | "updated_at">;
      user_missions: Table<UserMissionRow, "id" | "status" | "skip_reason" | "completed_at" | "created_at">;
      xp_events: Table<XpEventRow, "id" | "created_at">;
      user_stats: Table<UserStatsRow, "xp" | "current_streak" | "best_streak" | "last_active_date" | "updated_at">;
      entitlements: Table<EntitlementRow, "id" | "created_at">;
      weekly_reviews: Table<WeeklyReviewRow, "id" | "changes" | "adjustments" | "created_at">;
      journal_entries: Table<JournalEntryRow, "id" | "created_at">;
      reservations: Table<ReservationRow, "id" | "created_at">;
      referrals: Table<ReferralRow, "id" | "status" | "created_at" | "qualified_at">;
      roles: Table<RoleRow, "created_at">;
      events: Table<EventRow, "id" | "user_id" | "anon_id" | "props" | "created_at">;
      mission_library: Table<MissionLibraryRow, "archetypes" | "tags" | "pack" | "active">;
      packs: Table<PackRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

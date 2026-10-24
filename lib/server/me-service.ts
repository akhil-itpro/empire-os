import "server-only";
import { fullAccessUntil, hasSeasonPass } from "@/lib/game/access";
import { addDays, localDate, seasonPosition } from "@/lib/game/dates";
import { answersSchema, type Answers } from "@/lib/plan-engine/answers";
import { ARCHETYPE_INFO, archetypeFor } from "@/lib/plan-engine/archetype";
import type { Deps, Result } from "./season-service";
import type { PendingSettings, ShareName } from "./store";

export const EDITABLE = ["goal", "pillarOrder", "dailyMinutes", "budget", "city", "gym", "laptop"] as const;
export type EditableSettings = Pick<Answers, (typeof EDITABLE)[number]>;

const editSchema = answersSchema.pick({
  goal: true,
  pillarOrder: true,
  dailyMinutes: true,
  budget: true,
  city: true,
  gym: true,
  laptop: true,
});

export type Access =
  | { kind: "trial"; until: string }
  /** Full access from a referral reward after the trial. */
  | { kind: "bonus"; until: string }
  | { kind: "pass"; until: string }
  | { kind: "free" };

export type MeData = {
  firstName: string;
  archetypeName: string;
  day: number;
  seasonNumber: number;
  access: Access;
  /** Reserve mode: the price reserved at, or null. */
  reservedAt: number | null;
  settings: EditableSettings;
  /** Settings saved in Me that start tomorrow. */
  pending: { from: string; settings: EditableSettings } | null;
  journalToday: string;
  journalRecent: { localDate: string; body: string }[];
  isFounder: boolean;
  shareName: ShareName;
  referralCode: string;
};

function editable(source: Answers | PendingSettings): EditableSettings {
  return {
    goal: source.goal,
    pillarOrder: source.pillarOrder,
    dailyMinutes: source.dailyMinutes,
    budget: source.budget,
    city: source.city,
    gym: source.gym,
    laptop: source.laptop,
  };
}

export async function loadMe(deps: Deps, userId: string, isFounder: boolean): Promise<Result<MeData>> {
  const profile = await deps.store.getProfile(userId);
  if (!profile) return { ok: false, error: "not_started", message: "Start your season first." };
  const today = localDate(deps.now, profile.timeZone);
  const [entitlements, reservation] = await Promise.all([
    deps.store.entitlements(userId),
    deps.store.getReservation(userId),
  ]);
  const pass = entitlements
    .filter((e) => e.kind === "season_pass" && e.startsAt <= deps.now && deps.now < e.endsAt)
    .sort((a, b) => b.endsAt.getTime() - a.endsAt.getTime())[0];

  // The last day covered: an end at midnight belongs to the day before.
  const lastDay = (end: Date) => localDate(new Date(end.getTime() - 1), profile.timeZone);
  const until = fullAccessUntil(deps.now, profile.trialEndsAt, entitlements);
  const access: Access =
    pass && hasSeasonPass(deps.now, entitlements)
      ? { kind: "pass", until: lastDay(pass.endsAt) }
      : until
        ? { kind: deps.now < profile.trialEndsAt ? "trial" : "bonus", until: lastDay(until) }
        : { kind: "free" };

  const journal = await deps.store.listJournal(userId, addDays(today, -6), today);

  return {
    ok: true,
    data: {
      firstName: profile.firstName,
      archetypeName: ARCHETYPE_INFO[profile.archetype].name,
      day: seasonPosition(profile.seasonStart, today).day,
      seasonNumber: profile.seasonNumber,
      access,
      reservedAt: reservation?.priceInr ?? null,
      settings: editable(profile.answers),
      pending:
        profile.pendingSettings && profile.pendingFrom && profile.pendingFrom > today
          ? { from: profile.pendingFrom, settings: editable(profile.pendingSettings) }
          : null,
      journalToday: journal.find((j) => j.localDate === today)?.body ?? "",
      journalRecent: journal.filter((j) => j.localDate !== today).sort((a, b) => b.localDate.localeCompare(a.localDate)),
      isFounder,
      shareName: profile.shareName,
      referralCode: profile.referralCode,
    },
  };
}

/** Saves edits from Me. They apply from tomorrow and never rewrite past days. */
export async function updateSettings(deps: Deps, userId: string, input: unknown): Promise<Result<{ from: string }>> {
  const parsed = editSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input", message: "Some choices aren't on the list. Check them and try again." };
  const profile = await deps.store.getProfile(userId);
  if (!profile) return { ok: false, error: "not_started", message: "Start your season first." };
  const edit = parsed.data as EditableSettings;
  const from = addDays(localDate(deps.now, profile.timeZone), 1);
  const base = profile.pendingSettings ?? { ...profile.answers, archetype: profile.archetype };
  const settings: PendingSettings = {
    ...base,
    ...edit,
    enemy: base.enemy,
    intensity: base.intensity,
    archetype: archetypeFor(edit.goal),
  };
  await deps.store.savePendingSettings(userId, settings, from);
  return { ok: true, data: { from } };
}

const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;

/** Today's private journal line, up to 280 characters. Never shared with anyone. */
export async function saveJournalEntry(deps: Deps, userId: string, input: unknown): Promise<Result<{ saved: true }>> {
  if (typeof input !== "string") return { ok: false, error: "invalid_input", message: "Write a line first." };
  const body = input.replace(CONTROL_CHARS, " ").trim();
  if (body.length === 0 || body.length > 280) {
    return { ok: false, error: "invalid_input", message: "Keep it to one line, up to 280 characters." };
  }
  const profile = await deps.store.getProfile(userId);
  if (!profile) return { ok: false, error: "not_started", message: "Start your season first." };
  await deps.store.saveJournal(userId, localDate(deps.now, profile.timeZone), body);
  return { ok: true, data: { saved: true } };
}

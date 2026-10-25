// The Season Pass offer and reserve mode (docs/PRODUCT.md section 7). Until payments
// are live, "Reserve founder price" saves a reservation and no money moves. The price
// always comes from the server's own count, never from the browser.
import { fullAccessUntil, hasSeasonPass, isPassLike } from "@/lib/game/access";
import { localDate, seasonPosition, type LocalDate } from "@/lib/game/dates";
import { paywallSource, type PassOffer } from "@/lib/game/pass";
import { ARCHETYPE_INFO } from "@/lib/plan-engine/archetype";
import type { Archetype } from "@/lib/plan-engine/missions";
import { priceFor } from "./payment-service";
import type { Deps, Result } from "./season-service";

export type PassData = {
  firstName: string;
  archetype: Archetype;
  archetypeName: string;
  day: number;
  seasonNumber: number;
  /** The price for this student; `reserved` when they keep a founder price they reserved. */
  offer: PassOffer & { reserved: boolean };
  paymentsLive: boolean;
  /** The last day of an active Season Pass, or null. */
  passUntil: LocalDate | null;
  /** The last day of full access from the trial or a reward, or null on Free. */
  accessUntil: LocalDate | null;
  reservation: { priceInr: number; founderPrice: boolean } | null;
};

const NOT_STARTED = { ok: false as const, error: "not_started" as const, message: "Start your season first." };

export async function loadPass(deps: Deps, userId: string): Promise<Result<PassData>> {
  const { store, now } = deps;
  const profile = await store.getProfile(userId);
  if (!profile) return NOT_STARTED;
  const [entitlements, reservation, offer] = await Promise.all([
    store.entitlements(userId),
    store.getReservation(userId),
    priceFor(store, userId),
  ]);
  const tz = profile.timeZone;
  const pass = entitlements
    .filter((e) => isPassLike(e) && e.startsAt <= now && now < e.endsAt)
    .sort((a, b) => b.endsAt.getTime() - a.endsAt.getTime())[0];
  const until = fullAccessUntil(now, profile.trialEndsAt, entitlements);
  return {
    ok: true,
    data: {
      firstName: profile.firstName,
      archetype: profile.archetype,
      archetypeName: ARCHETYPE_INFO[profile.archetype].name,
      day: seasonPosition(profile.seasonStart, localDate(now, tz)).day,
      seasonNumber: profile.seasonNumber,
      offer,
      paymentsLive: Boolean(deps.payments),
      passUntil: pass && hasSeasonPass(now, entitlements) ? localDate(new Date(pass.endsAt.getTime() - 1), tz) : null,
      accessUntil: until ? localDate(new Date(until.getTime() - 1), tz) : null,
      reservation: reservation ? { priceInr: reservation.priceInr, founderPrice: reservation.founderPrice } : null,
    },
  };
}

/**
 * Reserve mode: records interest at today's price. Takes no payment. A second tap
 * keeps the first reservation and its price.
 */
export async function reservePass(
  deps: Deps,
  userId: string,
  source: unknown,
): Promise<Result<{ priceInr: number; founderPrice: boolean; created: boolean }>> {
  const { store, now } = deps;
  if (deps.payments) {
    return { ok: false, error: "invalid_input", message: "Reservations are closed. Season Pass is open now." };
  }
  const profile = await store.getProfile(userId);
  if (!profile) return NOT_STARTED;
  if (hasSeasonPass(now, await store.entitlements(userId))) {
    return { ok: false, error: "already_has_pass", message: "You already have Season Pass." };
  }

  const offer = await priceFor(store, userId);
  const outcome = await store.insertReservation(userId, offer.priceInr, offer.founderPrice);
  const saved = (await store.getReservation(userId))!;
  await store.logEvent("reserve_click", userId, {
    source: paywallSource(source),
    price: saved.priceInr,
    created: outcome === "created",
  });
  return { ok: true, data: { priceInr: saved.priceInr, founderPrice: saved.founderPrice, created: outcome === "created" } };
}

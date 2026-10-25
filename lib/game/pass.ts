// Season Pass prices and reserve mode (docs/PRODUCT.md sections 2 and 7).
// Prices are worked out on the server only; the browser never sends a price.
import { SEASON_DAYS } from "./rules";

export const PASS_PRICE_INR = 499;
export const FOUNDER_PRICE_INR = 299;
/** The founder price is for the first 500, counted in the database. */
export const FOUNDER_PLACES = 500;

/**
 * Reserve mode until live payments (Phase 10): the paywall saves a reservation and
 * no payment is ever taken while this is false.
 */
export const PAYMENTS_LIVE = false;

/** Where the paywall was opened from, for Founder HQ's "paywall views by source". */
export const PAYWALL_SOURCES = ["trial_end", "trial_banner", "free_hq", "path_week", "pack", "me", "war_room", "direct"] as const;
export type PaywallSource = (typeof PAYWALL_SOURCES)[number];

export function paywallSource(value: unknown): PaywallSource {
  return PAYWALL_SOURCES.includes(value as PaywallSource) ? (value as PaywallSource) : "direct";
}

export type PassOffer = {
  priceInr: number;
  regularPriceInr: number;
  /** True while fewer than 500 founder places are taken. */
  founderPrice: boolean;
  /** Founder places taken so far (reservations in reserve mode), at most 500. */
  founderTaken: number;
  founderPlaces: number;
  /** About this many rupees a day over the season, like "3.30". */
  perDay: string;
};

/** Rupees a day over the 90-day season, rounded to 10 paise: ₹499 is "5.50". */
export function perDayInr(priceInr: number): string {
  return (Math.round((priceInr / SEASON_DAYS) * 10) / 10).toFixed(2);
}

export function passOffer(founderTaken: number): PassOffer {
  const founderPrice = founderTaken < FOUNDER_PLACES;
  const priceInr = founderPrice ? FOUNDER_PRICE_INR : PASS_PRICE_INR;
  return {
    priceInr,
    regularPriceInr: PASS_PRICE_INR,
    founderPrice,
    founderTaken: Math.min(founderTaken, FOUNDER_PLACES),
    founderPlaces: FOUNDER_PLACES,
    perDay: perDayInr(priceInr),
  };
}

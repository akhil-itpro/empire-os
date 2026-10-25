import "server-only";
import { headers } from "next/headers";

/**
 * The site's address for links people copy or scan ("https://empireos.in").
 * NEXT_PUBLIC_SITE_URL wins when set; otherwise it comes from this request.
 */
export async function siteOrigin(): Promise<string> {
  const fixed = process.env.NEXT_PUBLIC_SITE_URL;
  if (fixed) return fixed.replace(/\/+$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (/^(localhost|127\.)/.test(host) ? "http" : "https");
  return `${proto}://${host}`;
}

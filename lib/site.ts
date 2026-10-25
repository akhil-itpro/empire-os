// The public site address, for share images, canonical links and the sitemap.
// NEXT_PUBLIC_SITE_URL (set in Vercel once there's a domain) wins; then Vercel's
// production address; then the local dev server.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")
).replace(/\/+$/, "");

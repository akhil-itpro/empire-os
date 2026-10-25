import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Playwright test server builds into its own folder so it can run
  // next to `npm run dev` (see playwright.config.ts).
  distDir: process.env.EMPIRE_DIST_DIR || ".next",
  cacheComponents: true,
  // No Next.js badge in the corner while developing: screenshots show the real app.
  devIndicators: false,
  partialPrefetching: true,
  // Screenshots on /colleges: AVIF first (smallest), and a lighter quality for them.
  images: { formats: ["image/avif", "image/webp"], qualities: [60, 75] },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

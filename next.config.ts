import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Playwright test server builds into its own folder so it can run
  // next to `npm run dev` (see playwright.config.ts).
  distDir: process.env.EMPIRE_DIST_DIR || ".next",
  cacheComponents: true,
  partialPrefetching: true,
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

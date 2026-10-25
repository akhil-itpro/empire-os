import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Search engines may read the public pages; the app, College HQ and Founder HQ stay out.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/hq",
        "/path",
        "/stats",
        "/me",
        "/war-room",
        "/pass",
        "/start",
        // College HQ, but not the public /colleges page (rules match by prefix).
        "/college$",
        "/college/",
        "/founder",
        "/api/",
        "/auth/",
        "/r/",
        "/join/",
        "/styleguide",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

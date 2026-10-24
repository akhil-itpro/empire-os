import type { MetadataRoute } from "next";

// Makes EMPIRE OS installable on the home screen; it opens straight to HQ.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EMPIRE OS",
    short_name: "EMPIRE OS",
    description: "Three missions a day for your career, body, mind and money.",
    start_url: "/hq",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0C1310",
    theme_color: "#0C1310",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

import type { Metadata, Viewport } from "next";
import { Schibsted_Grotesk } from "next/font/google";
import localFont from "next/font/local";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const schibstedGrotesk = Schibsted_Grotesk({
  variable: "--font-schibsted-grotesk",
  subsets: ["latin"],
});

// Big Shoulders at optical size 72 (the old "Display" cut), as small Latin-only
// files made from the static fonts in assets/fonts (SIL OFL). About 13 KB each,
// instead of about 58 KB for Google's variable versions, so headings show sooner.
const bigShoulders = localFont({
  variable: "--font-big-shoulders",
  src: "./fonts/BigShoulders-ExtraBold-latin.woff2",
  weight: "800",
  fallback: ["Arial Narrow", "sans-serif"],
});

const bigShouldersStencil = localFont({
  variable: "--font-big-shoulders-stencil",
  src: "./fonts/BigShouldersStencil-Black-latin.woff2",
  weight: "900",
  fallback: ["Arial Narrow", "sans-serif"],
  // Only the wordmark, day counter and stamp use it: load it without holding up the page.
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "EMPIRE OS", template: "%s | EMPIRE OS" },
  openGraph: { siteName: "EMPIRE OS", locale: "en_IN", type: "website" },
  twitter: { card: "summary_large_image" },
  applicationName: "EMPIRE OS",
  appleWebApp: { capable: true, title: "EMPIRE OS", statusBarStyle: "black" },
  description:
    "Three missions a day for your career, body, mind and money, planned around your timetable, budget and free time.",
};

export const viewport: Viewport = {
  themeColor: "#0C1310",
  // Lets the bottom navigation sit above the iPhone home indicator.
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${schibstedGrotesk.variable} ${bigShoulders.variable} ${bigShouldersStencil.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import {
  Big_Shoulders,
  Big_Shoulders_Stencil,
  Schibsted_Grotesk,
} from "next/font/google";
import "./globals.css";

const schibstedGrotesk = Schibsted_Grotesk({
  variable: "--font-schibsted-grotesk",
  subsets: ["latin"],
});

const bigShoulders = Big_Shoulders({
  variable: "--font-big-shoulders",
  subsets: ["latin"],
  axes: ["opsz"],
});

const bigShouldersStencil = Big_Shoulders_Stencil({
  variable: "--font-big-shoulders-stencil",
  subsets: ["latin"],
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: { default: "EMPIRE OS", template: "%s | EMPIRE OS" },
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

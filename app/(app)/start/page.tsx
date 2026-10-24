import type { Metadata } from "next";
import { StartSeason } from "./StartSeason";

export const metadata: Metadata = { title: "Starting your season", robots: { index: false } };

export default function StartPage() {
  return <StartSeason />;
}

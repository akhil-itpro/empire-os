import type { Metadata } from "next";
import { DataControls } from "./DataControls";

export const metadata: Metadata = { title: "Your data", robots: { index: false } };

export default function DataPage() {
  return (
    <main className="px-5 pt-5">
      <h1 className="font-display text-[40px] leading-none font-extrabold">Your data</h1>
      <p className="mt-3 text-[15px] text-moss">
        Download everything we hold about you, or delete your account and all of it.
      </p>
      <DataControls />
    </main>
  );
}

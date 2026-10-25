import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/ui/Wordmark";
import { GUIDES } from "@/lib/guides";

export const metadata: Metadata = {
  title: "Guides",
  description: "Short, practical guides for students: placement preparation, home workouts and daily habits.",
  alternates: { canonical: "/guides" },
};

export default function GuidesPage() {
  return (
    <main className="mx-auto w-full max-w-[680px] px-5 pb-10">
      <header className="pt-3.5">
        <Link href="/" className="inline-block py-2">
          <Wordmark size={24} />
          <span className="sr-only"> home page</span>
        </Link>
      </header>
      <h1 className="mt-8 font-display text-[44px] leading-none font-extrabold">Guides</h1>
      <p className="mt-3 text-[15px] text-moss">Short, practical plans you can start today.</p>
      <ul className="mt-6 flex flex-col border-t border-rule">
        {GUIDES.map((g) => (
          <li key={g.slug} className="border-b border-rule">
            <Link href={`/guides/${g.slug}`} className="block py-4 hov:bg-ledger">
              <span className="block text-[17px] font-bold text-bone">{g.title}</span>
              <span className="mt-1 block text-sm text-moss">{g.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

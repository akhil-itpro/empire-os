import Link from "next/link";
import type { ReactNode } from "react";
import { Wordmark } from "@/components/ui/Wordmark";

/** Shared frame for the Privacy Policy and Terms drafts. */
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-[720px] px-5 pt-3.5 pb-16">
      <Link href="/" className="inline-block py-2">
        <Wordmark size={24} />
        <span className="sr-only"> home page</span>
      </Link>
      <p className="mt-6 rounded-xl border border-brass-deep bg-ledger px-4 py-3 text-sm font-semibold text-bone">
        Draft, pending legal review. Text in [BRACKETS] is still to be filled in.
      </p>
      <h1 className="mt-6 font-display text-[40px] leading-none font-extrabold">{title}</h1>
      <p className="mt-2 text-sm text-moss">Last updated {updated}</p>
      <div className="mt-6 flex flex-col gap-6 text-base leading-[1.6] [&_h2]:font-display [&_h2]:text-[26px] [&_h2]:leading-none [&_h2]:font-extrabold [&_li]:mt-1 [&_ul]:list-disc [&_ul]:pl-5 [&_a]:font-semibold [&_a]:text-brass">
        {children}
      </div>
    </main>
  );
}

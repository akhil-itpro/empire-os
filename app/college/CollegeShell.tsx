import Link from "next/link";
import type { ReactNode } from "react";
import { Wordmark } from "@/components/ui/Wordmark";
import { cn } from "@/lib/cn";

export type CollegeTab = "overview" | "students" | "batches" | "reports";

/**
 * The College HQ frame from College.dc.html: a side menu and the content in a
 * wrapping row. At phone width the menu stacks on top.
 */
export function CollegeShell({
  batchId,
  orgName,
  active,
  children,
}: {
  batchId: string | null;
  orgName: string | null;
  active: CollegeTab | null;
  children: ReactNode;
}) {
  const links: { tab: CollegeTab; label: string; href: string }[] = batchId
    ? [
        { tab: "overview", label: "Overview", href: `/college/${batchId}` },
        { tab: "students", label: "Students", href: `/college/${batchId}/students` },
        { tab: "batches", label: "Batches", href: "/college/batches" },
        { tab: "reports", label: "Reports", href: `/college/${batchId}/report` },
      ]
    : [];

  return (
    <div className="flex min-h-dvh flex-wrap bg-field print:block print:min-h-0 print:bg-white">
      <aside className="flex flex-[1_1_220px] flex-col gap-7 border-r border-rule bg-(--ledger-dark) px-5 py-6 print:hidden">
        <div>
          <Link href="/college" className="inline-block">
            <Wordmark size={24} />
            <span className="sr-only"> College HQ home</span>
          </Link>
          <div className="mt-0.5 text-[13px] text-moss">College HQ</div>
        </div>
        {links.length > 0 ? (
          <nav aria-label="College HQ" className="flex flex-col gap-0.5">
            {links.map((l) => (
              <Link
                key={l.tab}
                href={l.href}
                aria-current={active === l.tab ? "page" : undefined}
                className={cn(
                  "flex h-11 items-center rounded-[10px] px-3 text-[15px]",
                  active === l.tab ? "bg-raised font-semibold text-bone" : "font-medium text-moss hov:bg-raised hov:text-bone",
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        ) : null}
        {orgName ? (
          <div className="mt-auto text-[13px] leading-normal text-moss">
            {orgName}
            <br />
            Training and placement cell
          </div>
        ) : null}
      </aside>
      <main className="min-w-0 flex-[999_1_560px] px-5 pt-7 pb-10 sm:px-8 print:p-0">
        <div className="flex max-w-[1040px] flex-col gap-[22px]">{children}</div>
      </main>
    </div>
  );
}

/** Shown on every College HQ page: who appears here and what is never shown. */
export function PrivacyNote() {
  return (
    <p className="flex items-start gap-2 text-[13px] text-moss">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-0.5 flex-none">
        <rect x="5" y="11" width="14" height="9" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
      <span>Only students who opted in to share progress appear here. Journals and personal answers are never shown.</span>
    </p>
  );
}

export function SampleChip() {
  return (
    <span className="flex h-[26px] items-center rounded-[13px] border border-rule px-2.5 text-xs font-semibold text-moss">
      Sample data
    </span>
  );
}

export const panel = "rounded-[14px] border border-rule/70 bg-ledger px-5 py-[18px]";
export const panelTitle = "font-display text-2xl leading-[1.1] font-extrabold text-bone";

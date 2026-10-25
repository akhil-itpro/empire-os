"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import type { Range } from "@/lib/server/college-metrics";

const LABELS: Record<Range, string> = { "7": "Last 7 days", "14": "Last 14 days", season: "This season" };

function href(batchId: string, range: Range, section: string | null) {
  const q = new URLSearchParams({ range });
  if (section) q.set("section", section);
  return `/college/${batchId}?${q}`;
}

/** Date range and section filters. They live in the address, so a filtered view can be shared. */
export function Filters({
  batchId,
  range,
  section,
  sections,
}: {
  batchId: string;
  range: Range;
  section: string | null;
  sections: string[];
}) {
  const router = useRouter();
  return (
    <div className="flex flex-wrap items-center gap-2">
      {(Object.keys(LABELS) as Range[]).map((r) => (
        <Link
          key={r}
          href={href(batchId, r, section)}
          aria-current={r === range ? "page" : undefined}
          className={cn(
            "flex h-11 items-center gap-1.5 rounded-full border px-3.5 text-sm sm:h-10",
            r === range ? "border-brass-deep bg-raised font-semibold text-bone" : "border-rule font-medium text-moss hov:text-bone",
          )}
        >
          {r === range ? (
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-brass">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          ) : null}
          {LABELS[r]}
        </Link>
      ))}
      {sections.length > 0 ? (
        <>
          <label htmlFor="section-filter" className="ml-2 text-sm text-moss">
            Section
          </label>
          <select
            id="section-filter"
            value={section ?? ""}
            onChange={(e) => router.push(href(batchId, range, e.target.value || null))}
            className="h-11 rounded-[10px] border border-rule bg-ledger px-3 text-sm text-bone sm:h-10"
          >
            <option value="">All sections</option>
            {sections.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </>
      ) : null}
    </div>
  );
}

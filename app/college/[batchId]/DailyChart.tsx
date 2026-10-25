"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

export type DailyPoint = { date: string; label: string; active: number; share: number };

const Y_TICKS = [100, 75, 50, 25, 0];

/**
 * "Students active each day" from College.dc.html: one brass series of shares,
 * columns at most 24px wide, hairline gridlines, the last day labelled, a tooltip
 * on hover and keyboard focus (value first, then date), and a table view.
 */
export function DailyChart({ points, total, title }: { points: DailyPoint[]; total: number; title: string }) {
  const [view, setView] = useState<"chart" | "table">("chart");
  const [hover, setHover] = useState<number | null>(null);
  const last = points.length - 1;
  // About seven date labels on a laptop and four on a phone, whatever the range.
  const tick = (i: number, labels: number) => (last - i) % Math.max(1, Math.ceil(points.length / labels)) === 0;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl leading-[1.1] font-extrabold text-bone">{title}</h2>
          <p className="mt-1 text-[13px] text-moss">Share of {total} students who finished at least one mission</p>
        </div>
      <div role="group" aria-label="View" className="flex overflow-hidden rounded-[10px] border border-rule">
        {(["chart", "table"] as const).map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={view === v}
            onClick={() => {
              setView(v);
              setHover(null);
            }}
            className={cn(
              "h-11 px-3.5 text-[13px] capitalize sm:h-9",
              view === v ? "bg-raised font-semibold text-bone" : "font-medium text-moss hov:text-bone",
            )}
          >
            {v}
          </button>
        ))}
      </div>
      </div>

      {points.length === 0 ? (
        <p className="mt-6 text-sm text-moss">The chart fills in once the season starts.</p>
      ) : view === "chart" ? (
        <div className="mt-[18px] flex gap-2.5">
          <div aria-hidden="true" className="relative h-[200px] w-9 flex-none text-right text-xs text-moss tabular-nums">
            {Y_TICKS.map((t) => (
              <span key={t} className="absolute right-0" style={{ top: `${((100 - t) / 100) * 200 - 8}px` }}>
                {t}%
              </span>
            ))}
          </div>
          <div className="min-w-0 flex-1">
            <div className="relative h-[200px]">
              {Y_TICKS.map((t) => (
                <div
                  key={t}
                  aria-hidden="true"
                  className={cn("absolute inset-x-0 border-t", t === 0 ? "border-rule" : "border-rule/50")}
                  style={{ top: `${((100 - t) / 100) * 200}px` }}
                />
              ))}
              <div role="group" aria-label={`Share of ${total} students active each day`} className="absolute inset-0 flex">
                {points.map((p, i) => {
                  const active = hover === i;
                  return (
                    <button
                      key={p.date}
                      type="button"
                      aria-label={`${p.share}% active, ${p.active} students, ${p.label}`}
                      onPointerEnter={() => setHover(i)}
                      onPointerLeave={() => setHover(null)}
                      onFocus={() => setHover(i)}
                      onBlur={() => setHover(null)}
                      className="relative flex h-[200px] min-w-0 flex-1 cursor-default items-end justify-center outline-none focus-visible:bg-raised/60"
                    >
                      <span
                        className={cn("block w-3/5 max-w-6 rounded-t", active ? "bg-brass-light" : "bg-brass")}
                        style={{ height: `${p.share}%` }}
                      />
                      {i === last && !active ? (
                        <span
                          className="absolute left-1/2 -translate-x-1/2 text-xs font-semibold whitespace-nowrap text-bone"
                          style={{ bottom: `calc(${p.share}% + 6px)` }}
                        >
                          {p.share}%
                        </span>
                      ) : null}
                      {active ? (
                        <span
                          aria-hidden="true"
                          className={cn(
                            "absolute z-10 flex flex-col gap-0.5 rounded-lg border border-rule bg-raised px-2.5 py-1.5 text-left whitespace-nowrap",
                            i > points.length / 2 ? "right-0" : "left-0",
                          )}
                          style={{ bottom: `calc(${Math.min(p.share, 70)}% + 10px)` }}
                        >
                          <span className="text-sm font-bold text-bone">{p.share}% active</span>
                          <span className="text-xs text-moss">
                            {p.active} students, {p.label}
                          </span>
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
            <div aria-hidden="true" className="mt-2 flex text-xs text-moss">
              {points.map((p, i) => (
                <span
                  key={p.date}
                  className={cn(
                    "min-w-0 flex-1 overflow-visible text-center whitespace-nowrap",
                    tick(i, 4) ? "" : tick(i, 7) ? "invisible sm:visible" : "invisible",
                  )}
                >
                  {p.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div tabIndex={0} className="mt-3.5 max-h-[236px] overflow-auto rounded-[10px] border border-rule/70">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-ledger text-left text-moss">
              <tr>
                <th scope="col" className="border-b border-rule px-3.5 py-2.5 font-semibold">Date</th>
                <th scope="col" className="border-b border-rule px-3.5 py-2.5 text-right font-semibold">Students active</th>
                <th scope="col" className="border-b border-rule px-3.5 py-2.5 text-right font-semibold">Share</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.date}>
                  <td className="border-b border-rule/50 px-3.5 py-2">{p.label}</td>
                  <td className="border-b border-rule/50 px-3.5 py-2 text-right tabular-nums">{p.active}</td>
                  <td className="border-b border-rule/50 px-3.5 py-2 text-right tabular-nums">{p.share}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

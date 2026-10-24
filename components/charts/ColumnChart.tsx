"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/cn";

export type Column = { key: string; label: string; value: number };

type Props = {
  data: Column[];
  /** What one column means, e.g. "XP". Used in the tooltip and table. */
  unit: string;
  /** A sentence describing the chart for screen readers. */
  summary: string;
  height?: number;
};

const nf = new Intl.NumberFormat("en-IN");

/** Clean y-axis ticks: 0 and two round steps above the maximum. */
function ticks(max: number): number[] {
  if (max <= 0) return [0];
  const raw = max / 2;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? raw;
  return [0, step, step * 2];
}

/**
 * One series of columns in brass (docs/DESIGN.md chart rules): columns at most
 * 24px wide with a 4px rounded top, hairline solid gridlines, only the highest
 * column labelled, a tooltip on hover and keyboard focus, and a table view.
 */
export function ColumnChart({ data, unit, summary, height = 180 }: Props) {
  const [active, setActive] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const tableId = useId();

  const width = 350;
  const padLeft = 34;
  const padTop = 20;
  const padBottom = 24;
  const plotW = width - padLeft;
  const plotH = height - padTop - padBottom;
  const max = Math.max(0, ...data.map((d) => d.value));
  const yTicks = ticks(max);
  const top = yTicks.at(-1) || 1;
  const band = plotW / Math.max(1, data.length);
  const colW = Math.min(24, band - 2);
  const peak = data.findIndex((d) => d.value === max && max > 0);
  const y = (v: number) => padTop + plotH - (v / top) * plotH;
  const xLabels = new Set([0, Math.floor((data.length - 1) / 2), data.length - 1]);

  const columnPath = (x: number, v: number) => {
    const h = Math.max(0, (v / top) * plotH);
    const base = padTop + plotH;
    if (h === 0) return "";
    const r = Math.min(4, h, colW / 2);
    return `M${x} ${base}V${base - h + r}Q${x} ${base - h} ${x + r} ${base - h}H${x + colW - r}Q${x + colW} ${base - h} ${x + colW} ${base - h + r}V${base}Z`;
  };

  const shown = active !== null ? data[active] : null;

  return (
    <div>
      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="group" aria-label={summary}>
          {yTicks.map((t) => (
            <g key={t}>
              <line x1={padLeft} x2={width} y1={y(t)} y2={y(t)} strokeWidth="1" className="stroke-rule" />
              <text x={padLeft - 6} y={y(t) + 4} textAnchor="end" className="fill-moss text-[11px] tabular-nums">
                {t >= 1000 ? `${t / 1000}K` : t}
              </text>
            </g>
          ))}
          {data.map((d, i) => {
            const x = padLeft + i * band + (band - colW) / 2;
            return (
              <g
                key={d.key}
                tabIndex={0}
                role="img"
                aria-label={`${nf.format(d.value)} ${unit}, ${d.label}`}
                onPointerEnter={() => setActive(i)}
                onPointerLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className="outline-none"
              >
                {/* The hit area is the whole band, not just the column. */}
                <rect x={padLeft + i * band} y={padTop} width={band} height={plotH} fill="transparent" />
                <path d={columnPath(x, d.value)} className={cn(active === i ? "fill-brass-light" : "fill-brass")} />
                {active === i ? (
                  <rect x={x - 2} y={padTop - 2} width={colW + 4} height={plotH + 4} rx="4" fill="none" strokeWidth="1.5" className="stroke-brass" />
                ) : null}
                {i === peak ? (
                  <text x={x + colW / 2} y={y(d.value) - 6} textAnchor="middle" className="fill-bone text-[11px] font-semibold">
                    {nf.format(d.value)}
                  </text>
                ) : null}
                {xLabels.has(i) ? (
                  <text x={x + colW / 2} y={height - 6} textAnchor="middle" className="fill-moss text-[11px]">
                    {d.label}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
        {shown ? (
          <div
            className="pointer-events-none absolute top-0 right-0 rounded-lg border border-rule bg-raised px-3 py-1.5 text-right"
            aria-hidden="true"
          >
            <div className="text-sm font-bold text-bone">
              {nf.format(shown.value)} {unit}
            </div>
            <div className="text-xs text-moss">{shown.label}</div>
          </div>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => setTable((t) => !t)}
        aria-expanded={table}
        aria-controls={tableId}
        className="mt-2 min-h-11 text-sm font-semibold text-brass hov:text-brass-light"
      >
        {table ? "Hide the table" : "Show as a table"}
      </button>
      {table ? (
        <div id={tableId} className="mt-1 max-h-64 overflow-y-auto rounded-xl border border-rule">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-ledger text-moss">
              <tr>
                <th scope="col" className="px-3 py-2 text-left font-semibold">Day</th>
                <th scope="col" className="px-3 py-2 text-right font-semibold">{unit}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.key} className="border-t border-rule">
                  <td className="px-3 py-1.5">{d.label}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{nf.format(d.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

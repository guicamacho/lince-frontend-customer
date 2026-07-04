"use client";

import { useState } from "react";
import { chartSeries, chartLabels, type ChartRange } from "@/lib/sample-home";
import { cn } from "@/lib/utils";

/**
 * Hand-rolled SVG area chart with a 1A/6M/3M range toggle (mock BalanceChart).
 * No chart library. The fade on range change is gated behind motion-safe so
 * prefers-reduced-motion users get an instant swap.
 */
const RANGES: ChartRange[] = ["1A", "6M", "3M"];

// Fixed viewBox; the SVG scales to its container (preserveAspectRatio none).
const W = 720;
const H = 240;
const PAD = 8;
const MAX = 10;
const MIN = 3;

export function BalanceChart() {
  const [range, setRange] = useState<ChartRange>("1A");
  const data = chartSeries[range];
  const labels = chartLabels[range];

  const pts = data.map((v, i) => {
    const x = PAD + (i * (W - PAD * 2)) / (data.length - 1);
    const y = H - 20 - ((v - MIN) / (MAX - MIN)) * (H - 50);
    return [x, y] as const;
  });
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  const area = `${line} L${last[0].toFixed(1)} ${H - 20} L${pts[0][0].toFixed(1)} ${H - 20} Z`;

  return (
    <div className="rounded-[18px] bg-ink-800 p-[22px] ring-1 ring-foreground/10">
      <div className="mb-[18px] flex items-center justify-between">
        <div>
          <div className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-gold-500">
            Tesouraria
          </div>
          <div className="mt-1.5 font-display text-[19px] font-bold">Histórico de saldo</div>
        </div>
        <div className="inline-flex gap-0.5 rounded-full bg-ink-700 p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              aria-pressed={range === r}
              className={cn(
                "cursor-pointer rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                range === r ? "bg-ink-900 text-bone-100" : "text-warm-400 hover:text-warm-100",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <svg
        key={range}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="h-60 w-full motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300"
        role="img"
        aria-label={`Histórico de saldo — período ${range}`}
      >
        {[0, 1, 2, 3].map((i) => (
          <line key={i} x1="0" x2={W} y1={20 + i * 55} y2={20 + i * 55} className="stroke-foreground/10" strokeWidth="1" />
        ))}
        <path d={area} className="fill-gold-500 opacity-[0.07]" />
        <path d={line} fill="none" className="stroke-gold-500" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={last[0]} cy={last[1]} r="4.5" className="fill-gold-500 stroke-ink-800" strokeWidth="2" />
      </svg>

      <div className="mt-2 flex justify-between">
        {labels.map((l, i) => (
          <span key={i} className="font-mono text-[10px] text-warm-500">
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

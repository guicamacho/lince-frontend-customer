"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Histórico de saldo — REAL daily consolidated balance (BRL) from /app/balance-history.
 * Hand-rolled SVG area (no chart lib): stretched paths only; every label, the crosshair, the
 * hover dot and the tooltip are HTML positioned by percentages, so nothing distorts under
 * preserveAspectRatio="none". Single series in the brand gold — the title names it, no legend.
 * Hover/focus: crosshair snaps to the nearest day; arrow keys walk days (same readout).
 */
export interface ChartPoint {
  date: string; // YYYY-MM-DD
  value: number; // consolidated BRL (reais)
}

const RANGES = [
  { key: "7D", days: 7 },
  { key: "1M", days: 30 },
  { key: "3M", days: 90 },
  { key: "Tudo", days: Infinity },
] as const;
type RangeKey = (typeof RANGES)[number]["key"];

const W = 720;
const H = 240;
const TOP = 14; // headroom so the line never kisses the card edge
const BOTTOM = 10;

const fmtBrl = (n: number) =>
  `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtTick = (n: number) =>
  `R$ ${n.toLocaleString("pt-BR", { notation: "compact", maximumFractionDigits: 1 })}`;
const fmtDay = (iso: string) => {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
};
const fmtDayLong = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" });

/** 3-4 "nice" ticks spanning [min, max]. */
function niceTicks(min: number, max: number): number[] {
  const span = max - min;
  const rawStep = span / 3;
  const mag = 10 ** Math.floor(Math.log10(rawStep));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= rawStep) ?? rawStep;
  const first = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let v = first; v <= max + 1e-9; v += step) ticks.push(v);
  return ticks;
}

export function BalanceChart({ points, convertedNote = false }: { points: ChartPoint[]; convertedNote?: boolean }) {
  const [range, setRange] = useState<RangeKey>("Tudo");
  const [hover, setHover] = useState<number | null>(null);

  const days = RANGES.find((r) => r.key === range)!.days;
  const data = Number.isFinite(days) ? points.slice(-days) : points;

  const scale = useMemo(() => {
    if (data.length < 2) return null;
    const values = data.map((p) => p.value);
    let min = Math.min(...values);
    let max = Math.max(...values);
    if (min === max) {
      // Flat series: pad so the line sits mid-plot instead of collapsing the domain.
      const pad = Math.max(1, Math.abs(min) * 0.1);
      min -= pad;
      max += pad;
    } else {
      const pad = (max - min) * 0.12;
      min = Math.max(0, min - pad);
      max += pad;
    }
    return { min, max, ticks: niceTicks(min, max) };
  }, [data]);

  if (!scale) {
    return (
      <div className="rounded-[18px] bg-ink-800 p-[22px] ring-1 ring-foreground/10">
        <Header range={range} setRange={setRange} />
        <div className="flex h-60 items-center justify-center text-sm text-warm-500">
          O histórico aparece após suas primeiras transações.
        </div>
      </div>
    );
  }

  const { min, max, ticks } = scale;
  const xFrac = (i: number) => i / (data.length - 1);
  const yFrac = (v: number) => 1 - (v - min) / (max - min);
  const px = (i: number) => xFrac(i) * W;
  const py = (v: number) => TOP + yFrac(v) * (H - TOP - BOTTOM);

  const line = data.map((p, i) => `${i ? "L" : "M"}${px(i).toFixed(1)} ${py(p.value).toFixed(1)}`).join(" ");
  const area = `${line} L${W} ${H} L0 ${H} Z`;
  const active = hover ?? data.length - 1;
  const activePt = data[active]!;

  // ~4 x-labels on evenly spaced indexes; justify-between keeps them aligned with the linear scale.
  const xLabelIdx = data.length <= 4
    ? data.map((_, i) => i)
    : [0, 1, 2, 3].map((k) => Math.round((k * (data.length - 1)) / 3));

  function pointFromEvent(e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    setHover(Math.round(frac * (data.length - 1)));
  }
  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowLeft") setHover(Math.max(0, active - 1));
    else if (e.key === "ArrowRight") setHover(Math.min(data.length - 1, active + 1));
    else if (e.key === "Escape") setHover(null);
    else return;
    e.preventDefault();
  }

  return (
    <div className="rounded-[18px] bg-ink-800 p-[22px] ring-1 ring-foreground/10">
      <Header range={range} setRange={setRange} />

      <div
        className="relative h-60 w-full cursor-crosshair touch-none outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        role="img"
        aria-label={`Histórico de saldo — ${fmtBrl(activePt.value)} em ${fmtDayLong(activePt.date)}. Use as setas para navegar.`}
        tabIndex={0}
        onPointerMove={pointFromEvent}
        onPointerDown={pointFromEvent}
        onPointerLeave={() => setHover(null)}
        onBlur={() => setHover(null)}
        onKeyDown={onKeyDown}
      >
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-full w-full" aria-hidden>
          {ticks.map((t) => (
            <line key={t} x1="0" x2={W} y1={py(t)} y2={py(t)} className="stroke-foreground/10" strokeWidth="1"
              vectorEffect="non-scaling-stroke" />
          ))}
          <path d={area} className="fill-gold-500 opacity-[0.07]" />
          <path d={line} fill="none" className="stroke-gold-500" strokeWidth="2.5" strokeLinecap="round"
            strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>

        {/* Y tick labels — text tokens, never the series color */}
        {ticks.map((t) => (
          <span key={t} aria-hidden
            className="absolute left-0 -translate-y-full pb-0.5 font-mono text-[10px] text-warm-500"
            style={{ top: `${((py(t) - 0) / H) * 100}%` }}>
            {fmtTick(t)}
          </span>
        ))}

        {/* Crosshair + dot + tooltip on the active day */}
        {hover !== null && (
          <div aria-hidden className="absolute top-0 bottom-0 w-px bg-foreground/20"
            style={{ left: `${xFrac(active) * 100}%` }} />
        )}
        <div aria-hidden
          className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-500 ring-2 ring-ink-800"
          style={{ left: `${xFrac(active) * 100}%`, top: `${(py(activePt.value) / H) * 100}%` }} />
        {hover !== null && (
          <div aria-hidden
            className="pointer-events-none absolute z-10 -translate-y-1/2 rounded-lg bg-ink-900 px-3 py-2 shadow-lg ring-1 ring-foreground/15"
            style={{
              top: `${(py(activePt.value) / H) * 100}%`,
              ...(xFrac(active) > 0.62
                ? { right: `${(1 - xFrac(active)) * 100 + 2}%` }
                : { left: `${xFrac(active) * 100 + 2}%` }),
            }}>
            <div className="text-sm font-bold tabular-nums text-warm-100">{fmtBrl(activePt.value)}</div>
            <div className="mt-0.5 text-[11px] text-warm-500">{fmtDayLong(activePt.date)}</div>
          </div>
        )}
      </div>

      <div className="mt-2 flex justify-between">
        {xLabelIdx.map((i) => (
          <span key={i} className="font-mono text-[10px] text-warm-500">{fmtDay(data[i]!.date)}</span>
        ))}
      </div>
      {convertedNote && (
        <p className="mt-3 text-[11px] text-warm-500">Stablecoins convertidas à taxa atual de câmbio.</p>
      )}
    </div>
  );
}

function Header({ range, setRange }: { range: RangeKey; setRange: (r: RangeKey) => void }) {
  return (
    <div className="mb-[18px] flex items-center justify-between">
      <div>
        <div className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-gold-500">Tesouraria</div>
        <div className="mt-1.5 font-display text-[19px] font-bold">Histórico de saldo</div>
      </div>
      <div className="inline-flex gap-0.5 rounded-full bg-ink-700 p-1">
        {RANGES.map(({ key }) => (
          <button
            key={key}
            type="button"
            onClick={() => setRange(key)}
            aria-pressed={range === key}
            className={cn(
              "cursor-pointer rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              range === key ? "bg-ink-900 text-bone-100" : "text-warm-400 hover:text-warm-100",
            )}
          >
            {key}
          </button>
        ))}
      </div>
    </div>
  );
}

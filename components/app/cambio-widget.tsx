"use client";

import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { Rates } from "@/lib/lince-api";
import { fetchRatesAction } from "@/app/app/rates-actions";
import { BrlFlag, UsdFlag, EurFlag } from "@/components/app/currency-marks";

const REFRESH_MS = 30_000;

function fmt(n: number | null): string {
  return n === null ? "—" : n.toLocaleString("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}

function Leg({ label, value, icon }: { label: string; value: number | null; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="flex items-center gap-1.5 text-xs text-warm-400">
        {icon}
        {label}
      </span>
      <span className="font-mono text-sm tabular-nums text-warm-100">R$ {fmt(value)}</span>
    </div>
  );
}

function Pair({
  title,
  flag,
  buy,
  sell,
  mid,
}: {
  title: string;
  flag: React.ReactNode;
  buy: number | null;
  sell?: number | null; // omitted for one-way pairs (BRL/EUR)
  mid: number | null;
}) {
  return (
    <div className="rounded-xl bg-ink-800 p-3.5 ring-1 ring-foreground/10">
      <div className="mb-1 flex items-center gap-2">
        {flag}
        <span className="text-sm font-semibold text-warm-200">{title}</span>
      </div>
      <Leg label="Compra" value={buy} icon={<ArrowUpRight className="size-3.5 text-clay-400" aria-hidden />} />
      {sell !== undefined && (
        <Leg label="Venda" value={sell} icon={<ArrowDownRight className="size-3.5 text-emerald-400" aria-hidden />} />
      )}
      <div className="mt-1 flex items-center justify-between border-t border-foreground/10 pt-1.5">
        <span className="text-[11px] text-warm-500">Mercado (mid)</span>
        <span className="font-mono text-[11px] tabular-nums text-warm-500">R$ {fmt(mid)}</span>
      </div>
    </div>
  );
}

export function CambioWidget({ initial }: { initial: Rates | null }) {
  const [rates, setRates] = useState<Rates | null>(initial);

  useEffect(() => {
    const tick = () => fetchRatesAction().then((r) => r && setRates(r));
    const iv = setInterval(tick, REFRESH_MS);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="rounded-[20px] bg-ink-800 p-5 ring-1 ring-foreground/10">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-display text-base font-bold">Câmbio</span>
        <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-wide text-emerald-400 uppercase">
          <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" aria-hidden />
          Ao vivo
        </span>
      </div>
      <div className="space-y-3">
        <Pair title="BRL / USD" flag={<PairFlags a={<BrlFlag />} b={<UsdFlag />} />} buy={rates?.brlUsd.buy ?? null} sell={rates?.brlUsd.sell ?? null} mid={rates?.brlUsd.mid ?? null} />
        <Pair title="BRL / EUR" flag={<PairFlags a={<BrlFlag />} b={<EurFlag />} />} buy={rates?.brlEur.buy ?? null} mid={rates?.brlEur.mid ?? null} />
      </div>
      <p className="mt-3 text-[11px] leading-snug text-warm-500">
        Taxas de referência (sem tarifas). O valor final é confirmado no momento da operação.
      </p>
    </div>
  );
}

function PairFlags({ a, b }: { a: React.ReactNode; b: React.ReactNode }) {
  return (
    <span className="flex items-center">
      {a}
      <span className="-ml-1.5">{b}</span>
    </span>
  );
}

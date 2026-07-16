"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/** Saldo disponível — TOTAL across wallets (BRLA + stablecoins valued at the mid rate), with a
 *  BRL/USD display toggle. USD uses the mid rate (BRL per USD); the toggle is disabled when no
 *  rate is available. When the rate is down while stablecoins are held, the caller passes the
 *  BRL wallet alone with stablecoinExcluded so we say so. Display-only — no money moves. */
export function SaldoDisponivel({
  brl,
  brlPerUsd,
  stablecoinExcluded = false,
}: {
  brl: number | null;
  brlPerUsd: number | null;
  stablecoinExcluded?: boolean;
}) {
  const [ccy, setCcy] = useState<"BRL" | "USD">("BRL");
  const usd = brl !== null && brlPerUsd ? brl / brlPerUsd : null;
  const showUsd = ccy === "USD" && usd !== null;
  const value = showUsd ? usd : brl;
  const symbol = showUsd ? "US$ " : "R$ ";

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="font-mono text-[11px] font-bold tracking-[0.16em] text-gold-500 uppercase">
          Saldo disponível
        </span>
        <div className="flex overflow-hidden rounded-full ring-1 ring-foreground/15" role="group" aria-label="Moeda do saldo">
          {(["BRL", "USD"] as const).map((c) => {
            const disabled = c === "USD" && usd === null;
            return (
              <button
                key={c}
                type="button"
                aria-pressed={ccy === c}
                disabled={disabled}
                onClick={() => setCcy(c)}
                className={cn(
                  "cursor-pointer px-2.5 py-0.5 text-[11px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                  ccy === c ? "bg-gold-500 text-ink-900" : "text-warm-400 hover:text-warm-200",
                )}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-2 font-display text-[40px] leading-none font-bold tracking-[-0.03em] tabular-nums sm:text-[48px]">
        {value === null ? (
          "—"
        ) : (
          (() => {
            // Round to cents ONCE, then split — deriving cents independently of the integer part
            // would render e.g. 100.9962 as "100,100" (no carry). USD is an arbitrary quotient.
            const cents = Math.round(value * 100);
            const whole = Math.trunc(cents / 100);
            const frac = Math.abs(cents % 100);
            return (
              <>
                {symbol}
                {whole.toLocaleString("pt-BR")}
                <span className="font-sans text-[22px] font-semibold text-warm-400">
                  ,{String(frac).padStart(2, "0")}
                </span>
              </>
            );
          })()
        )}
      </div>
      <div className="mt-2.5 text-sm text-warm-500">
        {stablecoinExcluded
          ? "Não inclui stablecoins (taxa indisponível) · "
          : showUsd
            ? "Convertido pela taxa de mercado · "
            : "Em custódia · "}
        atualizado após cada confirmação
      </div>
    </div>
  );
}

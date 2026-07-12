import type { ReactNode } from "react";
import { Coin } from "@/components/app/coin";
import { cn } from "@/lib/utils";
import type { CurrencyCode } from "@/lib/sample-home";

/** Live wallet cards from ledger balances (minor units). Stablecoin (USDT+USDC), Fiat (BRL only),
 *  Investimento (em breve). Amounts are settled money — the same ints the ledger holds. */
function fmtBRL(minor: number): string {
  return `R$ ${(minor / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtUSD(units: number): string {
  return `US$ ${units.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Decorative upward growth motif for the (empty) investimento card — gives it life without an image.
 *  Purely presentational: aria-hidden, no network fetch, behind the content. */
function InvestimentoArt() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute -top-10 -right-8 size-40 rounded-full bg-sky-500/10 blur-2xl" />
      <svg
        viewBox="0 0 200 80"
        preserveAspectRatio="none"
        className="absolute bottom-0 left-0 h-16 w-full text-sky-400/30"
      >
        <defs>
          <linearGradient id="investimento-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0 62 L40 54 L80 58 L120 36 L160 24 L200 8 L200 80 L0 80 Z" fill="url(#investimento-fill)" />
        <path
          d="M0 62 L40 54 L80 58 L120 36 L160 24 L200 8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

type Card = {
  title: string;
  amount: string | null; // null => "em breve"
  coins: CurrencyCode[];
  accent: "gold" | "emerald" | "sky";
  sub: string;
  decoration?: ReactNode;
};

export function WalletCards({ balances }: { balances: Record<string, number> }) {
  const stableUsd = (balances.USDT ?? 0) / 1e6 + (balances.USDC ?? 0) / 1e6;
  const cards: Card[] = [
    { title: "Carteira stablecoin", amount: fmtUSD(stableUsd), coins: ["USDT", "USDC"], accent: "gold", sub: "USDT · USDC" },
    { title: "Carteira fiat", amount: fmtBRL(balances.BRLA ?? 0), coins: ["BRL"], accent: "emerald", sub: "BRL" },
    { title: "Carteira investimento", amount: null, coins: [], accent: "sky", sub: "Renda sobre o seu saldo, em breve", decoration: <InvestimentoArt /> },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => (
        <div
          key={c.title}
          className={cn(
            "relative overflow-hidden rounded-[20px] bg-ink-800 p-5 ring-1",
            c.accent === "gold" ? "ring-gold-500/30" : "ring-foreground/10",
          )}
        >
          {c.decoration}
          <div className="relative z-10">
            <span className="text-[13px] font-semibold text-warm-300">{c.title}</span>
            {c.amount ? (
              <div className="mt-2.5 font-display text-[26px] font-bold tracking-[-0.025em] tabular-nums text-warm-100">
                {c.amount}
              </div>
            ) : (
              <div className="mt-2.5 inline-flex rounded-full bg-ink-700 px-2.5 py-1 text-xs font-semibold text-warm-400">
                Em breve
              </div>
            )}
            <div className="mt-3.5 flex min-h-[30px] items-center">
              {c.coins.map((code, i) => (
                <Coin key={code} code={code} size={30} overlap={i > 0} ringClass="border-ink-800" />
              ))}
            </div>
            <p className="mt-2 text-xs text-warm-500">{c.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

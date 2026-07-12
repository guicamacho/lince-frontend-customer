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

type Card = {
  title: string;
  amount: string | null; // null => "em breve"
  coins: CurrencyCode[];
  accent: "gold" | "emerald" | "sky";
  sub: string;
};

export function WalletCards({ balances }: { balances: Record<string, number> }) {
  const stableUsd = (balances.USDT ?? 0) / 1e6 + (balances.USDC ?? 0) / 1e6;
  const cards: Card[] = [
    { title: "Carteira stablecoin", amount: fmtUSD(stableUsd), coins: ["USDT", "USDC"], accent: "gold", sub: "USDT · USDC" },
    { title: "Carteira fiat", amount: fmtBRL(balances.BRLA ?? 0), coins: ["BRL"], accent: "emerald", sub: "BRL · MXN e COP em breve" },
    { title: "Carteira investimento", amount: null, coins: [], accent: "sky", sub: "Em breve" },
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
      ))}
    </div>
  );
}

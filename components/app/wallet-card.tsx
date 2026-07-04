import { ArrowUpRight } from "lucide-react";
import { Coin } from "@/components/app/coin";
import { cn } from "@/lib/utils";
import type { Wallet } from "@/lib/sample-home";

/**
 * Per-wallet balance card (mock WalletCard). The gold `accent` is the hero
 * variant: gold ring + gold transfer button. Transfer button is inert sample UI.
 */
export function WalletCard({ title, amount, coins, accent }: Wallet) {
  const hero = accent === "gold";
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[20px] bg-ink-800 p-5 ring-1",
        hero ? "ring-gold-500/30" : "ring-foreground/10",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold text-warm-300">{title}</span>
        <button
          type="button"
          aria-label={`Transferir de ${title}`}
          className={cn(
            "flex size-7 cursor-pointer items-center justify-center rounded-full transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            hero ? "bg-gold-500 text-ink-900 hover:bg-gold-400" : "bg-ink-600 text-bone-100 hover:bg-ink-500",
          )}
        >
          <ArrowUpRight className="size-[15px]" aria-hidden />
        </button>
      </div>
      <div className="mt-2.5 font-display text-[29px] font-bold tracking-[-0.025em] tabular-nums">
        {amount}
        <span className="font-sans text-[15px] font-semibold text-warm-400"> USD</span>
      </div>
      <div className="mt-3.5 flex">
        {coins.map((c, i) => (
          <Coin key={c} code={c} size={30} overlap={i > 0} ringClass="border-ink-800" />
        ))}
      </div>
    </div>
  );
}

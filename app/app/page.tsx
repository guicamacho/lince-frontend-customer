import Link from "next/link";
import { Send, Repeat, TrendingUp } from "lucide-react";
import { SampleBanner } from "@/components/app/sample-banner";
import { WalletCard } from "@/components/app/wallet-card";
import { BalanceChart } from "@/components/app/balance-chart";
import { TxTable } from "@/components/app/tx-table";
import { AttentionRail } from "@/components/app/attention-rail";
import { SafeguardingPanel } from "@/components/app/safeguarding-panel";
import { totalNetWorth, wallets } from "@/lib/sample-home";

// HomeView (mock). SAMPLE data throughout — see lib/sample-home / SampleBanner.
export default function AppHome() {
  return (
    <div className="space-y-4">
      <SampleBanner />

      {/* Total + primary actions */}
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-gold-500">
            Patrimônio total
          </div>
          <div className="mt-2 font-display text-[40px] leading-none font-bold tracking-[-0.03em] tabular-nums sm:text-[48px]">
            {totalNetWorth.whole}
            <span className="font-sans text-[22px] font-semibold text-warm-400">
              {totalNetWorth.fraction} {totalNetWorth.currency}
            </span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-sm font-bold text-emerald-500">
            <TrendingUp className="size-[15px]" aria-hidden />
            {totalNetWorth.trend}
          </div>
        </div>
        <div className="flex gap-2.5">
          <Link
            href="/app/payouts"
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-gold-500 px-[18px] text-sm font-bold text-ink-900 transition-colors hover:bg-gold-400 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Send className="size-4" aria-hidden />
            Enviar pagamento
          </Link>
          <Link
            href="/app/convert"
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-ink-800 px-[18px] text-sm font-bold text-bone-100 ring-1 ring-foreground/20 transition-colors hover:bg-ink-700 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Repeat className="size-4" aria-hidden />
            Converter
          </Link>
        </div>
      </div>

      {/* Wallet cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {wallets.map((w) => (
          <WalletCard key={w.title} {...w} />
        ))}
      </div>

      {/* Chart + transactions (left) · attention rail (right) */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.7fr_1fr] lg:items-start">
        <div className="flex flex-col gap-4">
          <BalanceChart />
          <TxTable />
        </div>
        <AttentionRail />
      </div>

      {/* BRLA-safeguarding disclosure — kept visible wherever balances are shown. */}
      <SafeguardingPanel />
    </div>
  );
}

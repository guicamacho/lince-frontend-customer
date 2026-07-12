import Link from "next/link";
import { Send, Repeat } from "lucide-react";
import { WalletCards } from "@/components/app/wallet-cards";
import { SaldoDisponivel } from "@/components/app/saldo-disponivel";
import { CambioWidget } from "@/components/app/cambio-widget";
import { BalanceChart } from "@/components/app/balance-chart";
import { TransactionsView } from "@/components/app/transactions-view";
import { SafeguardingPanel } from "@/components/app/safeguarding-panel";
import { getBalances, getRates, listTransactions } from "@/lib/lince-api";

// HomeView — live. Balances + recent transactions are REAL (ledger); Câmbio is the bare Avenia
// stablecoin rate checked against mid-market. Approvals section removed (pre-go-live).
export default async function AppHome() {
  const [balancesRes, rates, txRes] = await Promise.all([getBalances(), getRates(), listTransactions()]);
  const balances = balancesRes.ok ? balancesRes.data.balances : {};
  const brlaMinor = balancesRes.ok ? (balances.BRLA ?? 0) : null;
  const recent = txRes.ok ? txRes.data.slice(0, 6) : [];

  return (
    <div className="space-y-6">
      {/* Real balance + toggle + primary actions */}
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <SaldoDisponivel brlaMinor={brlaMinor} brlPerUsd={rates?.brlUsd.mid ?? null} />
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

      <WalletCards balances={balances} />

      {/* Chart + recent transactions (left) · Câmbio (right) */}
      <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr] lg:items-start">
        <div className="flex flex-col gap-4">
          <BalanceChart />
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-base font-bold">Transações recentes</h2>
              <Link href="/app/transactions" className="text-sm text-gold-500 transition-colors hover:text-gold-400">
                Ver todas
              </Link>
            </div>
            {recent.length > 0 ? (
              <TransactionsView transactions={recent} />
            ) : (
              <div className="rounded-[18px] bg-ink-800 p-8 text-center text-sm text-warm-500 ring-1 ring-foreground/10">
                Nenhuma transação ainda.
              </div>
            )}
          </div>
        </div>
        <CambioWidget initial={rates} />
      </div>

      <SafeguardingPanel />
    </div>
  );
}

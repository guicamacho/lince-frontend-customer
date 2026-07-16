import Link from "next/link";
import { UserPlus } from "lucide-react";
import { getBalances, listBeneficiaries } from "@/lib/lince-api";
import { PayoutForm } from "@/components/app/payout-form";

// Pagamentos (PRD-11): payout of held balance to a saved payee over the payee's rail — PIX
// (R$), USD via ACH/Wire, or crypto to an external wallet. This folder route takes precedence
// over the [section] "Em breve" placeholder. Balances + payees are real.
export default async function PayoutsPage() {
  const [balancesRes, beneficiaries] = await Promise.all([getBalances(), listBeneficiaries()]);
  const balances = balancesRes.ok ? balancesRes.data.balances : {};
  const payees = beneficiaries.filter((b) => b.status === "active");

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="font-display text-2xl">Pagamentos</h1>
        <p className="mt-1 text-sm text-warm-400">
          Envie seu saldo para um beneficiário salvo — PIX, transferência em dólar ou cripto.
        </p>
      </div>
      {payees.length === 0 ? (
        <div className="rounded-[22px] bg-ink-800 p-6 text-center ring-1 ring-foreground/10">
          <UserPlus className="mx-auto size-8 text-warm-500" aria-hidden />
          <h2 className="mt-3 font-display text-lg font-bold">Nenhum beneficiário</h2>
          <p className="mt-2 text-sm leading-relaxed text-warm-300">
            Para enviar um pagamento, cadastre primeiro um beneficiário.
          </p>
          <Link
            href="/app/beneficiaries"
            className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-gold-500 px-4 text-sm font-bold text-ink-900 transition-colors hover:bg-gold-400"
          >
            Cadastrar beneficiário
          </Link>
        </div>
      ) : (
        <PayoutForm balances={balances} payees={payees} />
      )}
    </div>
  );
}

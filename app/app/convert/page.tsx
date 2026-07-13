import { getBalances, getRates } from "@/lib/lince-api";
import { ConvertForm } from "@/components/app/convert-form";

// Convert (PRD-10): standalone swap of the customer's own balance (BRL <-> USD). This folder route
// takes precedence over the [section] "Em breve" placeholder. Balances + reference rates are real.
export default async function ConvertPage() {
  const [balancesRes, rates] = await Promise.all([getBalances(), getRates()]);
  const balances = balancesRes.ok ? balancesRes.data.balances : {};

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="font-display text-2xl">Converter</h1>
        <p className="mt-1 text-sm text-warm-400">
          Converta seu saldo entre moedas e mantenha o resultado na sua carteira.
        </p>
      </div>
      <ConvertForm balances={balances} rates={rates} />
    </div>
  );
}

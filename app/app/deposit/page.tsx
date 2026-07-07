import { getDepositDetails } from "@/lib/lince-api";
import { DepositView } from "@/components/app/deposit-view";
import { Card } from "@/components/ui/card";

// Server component. This folder route takes precedence over the [section] "Em breve" placeholder;
// the sidebar "Depositar" entry already points here. Gated by the app layout (org active), which
// matches the product rule: deposit details appear once the admin portal approves the account.
export default async function DepositPage() {
  const result = await getDepositDetails();

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-2xl">Depositar</h1>
        <p className="mt-1 text-sm text-warm-400">
          Envie um PIX e o valor entra como saldo em reais (R$) na sua conta. Custódia Avenia.
        </p>
      </div>

      {result.ok ? (
        <DepositView details={result.data} />
      ) : (
        <Card className="items-center gap-2 p-10 text-center">
          <p className="text-warm-300">Não foi possível carregar seus dados de depósito agora.</p>
          <p className="text-sm text-warm-500">Tente novamente em instantes.</p>
        </Card>
      )}
    </div>
  );
}

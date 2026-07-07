import { listTransactions } from "@/lib/lince-api";
import { TransactionsView } from "@/components/app/transactions-view";
import { Card } from "@/components/ui/card";

// Server component. This folder route takes precedence over the [section] "Em breve" placeholder;
// the sidebar "Transações" entry already points here. Gated by the app layout (org active).
export default async function TransactionsPage() {
  const result = await listTransactions();

  return (
    <div className="max-w-[1100px] space-y-8">
      <div>
        <h1 className="font-display text-2xl">Transações</h1>
        <p className="mt-1 text-sm text-warm-400">
          Seus depósitos, conversões e pagamentos. Os valores conferem com o seu extrato.
        </p>
      </div>

      {result.ok ? (
        <TransactionsView transactions={result.data} />
      ) : (
        // Graceful degrade while the backend route is unbuilt (404) or unreachable. Neutral copy.
        <Card className="items-center gap-2 p-10 text-center">
          <p className="text-warm-300">Não foi possível carregar suas transações agora.</p>
          <p className="text-sm text-warm-500">Tente novamente em instantes.</p>
        </Card>
      )}
    </div>
  );
}

import { Clock } from "lucide-react";
import { Card } from "@/components/ui/card";

const TITLES: Record<string, string> = {
  balances: "Saldos",
  pay: "Pagar / Enviar",
  transactions: "Transações",
  beneficiaries: "Beneficiários",
  team: "Equipe",
  settings: "Configurações",
};

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const title = TITLES[section] ?? "Página";
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-display text-2xl">{title}</h1>
      <Card className="items-center gap-3 p-10 text-center">
        <span className="flex size-10 items-center justify-center rounded-full bg-ink-800 text-warm-400">
          <Clock className="size-5" aria-hidden />
        </span>
        <p className="text-warm-300">Em breve</p>
        <p className="text-sm text-warm-500">Esta seção estará disponível em breve.</p>
      </Card>
    </div>
  );
}

import { Clock } from "lucide-react";
import { Card } from "@/components/ui/card";

// Only sections WITHOUT a real folder route reach this placeholder (Next.js matches static
// segments first). deposit/convert/payouts/transactions have real pages now.
const TITLES: Record<string, string> = {
  accounts: "Contas",
  rewards: "Recompensas",
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

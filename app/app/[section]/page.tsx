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
    <div className="space-y-2">
      <h1 className="font-display text-2xl">{title}</h1>
      <p className="text-warm-500">Em construção.</p>
    </div>
  );
}

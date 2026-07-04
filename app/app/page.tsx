import { HomeTiles } from "@/components/app/home-tiles";
import { SafeguardingPanel } from "@/components/app/safeguarding-panel";

export default function AppHome() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="space-y-1">
        <h1 className="font-display text-2xl">Bem-vindo à Lince Finance</h1>
        <p className="text-warm-300">Comece por aqui. Adicione um beneficiário para começar.</p>
      </header>
      <HomeTiles />
      <SafeguardingPanel />
    </div>
  );
}

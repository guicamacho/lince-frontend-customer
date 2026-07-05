import { listNotifications, listMyCases } from "@/lib/lince-api";
import { AvisosList } from "@/components/app/avisos-list";

export default async function AvisosPage() {
  const [{ notifications }, cases] = await Promise.all([listNotifications(), listMyCases()]);

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-2xl">Avisos</h1>
        <p className="mt-1 text-sm text-warm-400">
          Acompanhe as solicitações da nossa equipe e responda quando necessário.
        </p>
      </div>

      <AvisosList notifications={notifications} cases={cases} />
    </div>
  );
}

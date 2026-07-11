import { getMe, getTeam } from "@/lib/lince-api";
import { Card } from "@/components/ui/card";
import { TeamManager } from "@/components/app/team-manager";

// Equipe (PRD-03). Server-rendered list; all mutations go through server actions that call
// the backend, which is the real authority. The UI hides controls a viewer/finance can't use,
// but the backend 403s them regardless.
export default async function TeamPage() {
  const [me, team] = await Promise.all([getMe(), getTeam()]);

  if (!me.ok || !team.ok) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="font-display text-2xl">Equipe</h1>
        <Card className="items-center gap-2 p-10 text-center">
          <p className="text-warm-300">Não foi possível carregar a equipe.</p>
          <p className="text-sm text-warm-500">Atualize a página em instantes.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-2xl">Equipe</h1>
        <p className="mt-1 text-sm text-warm-400">Convide pessoas e defina o que cada uma pode fazer.</p>
      </div>
      <TeamManager members={team.data.members} myRoles={me.data.roles} />
    </div>
  );
}

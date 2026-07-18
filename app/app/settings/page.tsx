import { currentUser } from "@clerk/nextjs/server";
import { SignOutButton } from "@clerk/nextjs";
import { getMe } from "@/lib/lince-api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PasswordForm, ActiveSessions } from "@/components/app/account-settings";
import { MfaSettings } from "@/components/app/mfa-settings";
import { CloseAccount } from "@/components/app/close-account";

// Configurações — Lince-owned settings surface (product decision 2026-07-09: Clerk's
// user-settings modal is hidden; account management grows here instead).
export default async function SettingsPage() {
  const [me, user] = await Promise.all([getMe(), currentUser()]);

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-2xl">Configurações</h1>
        <p className="mt-1 text-sm text-warm-400">Dados da sua empresa e do seu acesso.</p>
      </div>

      <Card className="gap-4 p-6">
        <h2 className="font-medium text-warm-200">Empresa</h2>
        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium tracking-wide text-warm-500 uppercase">Razão social</dt>
            <dd className="mt-1 text-warm-200">{me.ok ? me.data.razao_social : "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium tracking-wide text-warm-500 uppercase">Status da conta</dt>
            <dd className="mt-1 text-emerald-500">{me.ok && me.data.state === "active" ? "Ativa" : "—"}</dd>
          </div>
        </dl>
      </Card>

      <Card className="gap-4 p-6">
        <h2 className="font-medium text-warm-200">Senha</h2>
        <PasswordForm />
      </Card>

      <Card className="gap-4 p-6">
        <h2 className="font-medium text-warm-200">Verificação em duas etapas</h2>
        <MfaSettings />
      </Card>

      <Card className="gap-4 p-6">
        <h2 className="font-medium text-warm-200">Acesso</h2>
        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium tracking-wide text-warm-500 uppercase">E-mail de login</dt>
            <dd className="mt-1 text-warm-200">{user?.primaryEmailAddress?.emailAddress ?? "—"}</dd>
          </div>
        </dl>
        <div>
          <p className="mb-2 text-xs font-medium tracking-wide text-warm-500 uppercase">Sessões ativas</p>
          <ActiveSessions />
        </div>
        <div>
          <SignOutButton redirectUrl="/sign-in">
            <Button variant="outline" className="cursor-pointer">Sair da conta</Button>
          </SignOutButton>
        </div>
      </Card>

      {me.ok && me.data.roles.includes("owner") && (
        <Card className="gap-4 border-clay-500/20 p-6">
          <h2 className="font-medium text-warm-200">Encerrar conta</h2>
          <CloseAccount />
        </Card>
      )}

      <p className="text-xs text-warm-500">
        Precisa alterar dados da empresa? Fale com nosso suporte pelos Avisos.
      </p>
    </div>
  );
}

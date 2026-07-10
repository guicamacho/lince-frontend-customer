import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getOnboardingState, getRfiThread } from "@/lib/lince-api";
import { CompanyDetailsForm } from "@/components/onboarding/company-details-form";
import { AdvanceButton } from "@/components/onboarding/advance-button";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { RfiThread } from "@/components/onboarding/rfi-thread";
import { TopBar } from "@/components/top-bar";
import { Card, CardContent } from "@/components/ui/card";

// Same card shell + fixed min-height as the company form, so the panel stays one
// consistent size across every onboarding step.
function Screen({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <Card className="min-h-[30rem] w-full max-w-md justify-center border-ink-500 bg-ink-700">
      <CardContent className="space-y-4 text-center">
        <h1 className="font-display text-2xl">{title}</h1>
        {children}
      </CardContent>
    </Card>
  );
}

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const result = await getOnboardingState();
  // A failed read is NOT "no company": never show the signup form to an approved account
  // over a blip. Neutral retry screen instead.
  if (!result.ok) {
    return (
      <div className="flex min-h-screen flex-col">
        <TopBar />
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-8 px-6 py-12">
          <Screen title="Não foi possível carregar seus dados">
            <p className="text-warm-300">Tente recarregar a página em instantes.</p>
          </Screen>
        </main>
      </div>
    );
  }
  const state = result.state;
  if (state?.state === "active") redirect("/app");
  // Only fetch the RFI thread when it's the relevant screen (avoids a round-trip otherwise).
  const rfi = state?.state === "rfi_required" ? await getRfiThread() : null;

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-8 px-6 py-12">
        <OnboardingProgress state={state?.state ?? null} />

        {!state && <CompanyDetailsForm />}

        {state?.state === "pending_lince_approval" && (
          <Screen title="Vamos verificar sua empresa">
            <p className="text-warm-300">
              A verificação de identidade e da empresa (KYB) é conduzida pela Didit e enviada à Avenia.
            </p>
            <AdvanceButton step="launch-verification" label="Iniciar verificação" pendingLabel="Abrindo…" />
          </Screen>
        )}

        {state?.state === "kyb_in_progress" && (
          <Screen title="Verificação em andamento">
            <p className="text-warm-300">
              Conclua as etapas na janela da Didit. Ao finalizar, seus dados são enviados automaticamente à Avenia.
            </p>
            <AdvanceButton step="mock-verify" label="Simular conclusão (dev)" pendingLabel="Concluindo…" />
          </Screen>
        )}

        {state?.state === "vendor_pending" && (
          <Screen title="Em análise">
            <p className="text-warm-300">
              Recebemos os dados da sua empresa e os enviamos para verificação. Avisaremos assim que sua conta for
              confirmada.
            </p>
            <p className="text-sm text-warm-500">Você pode sair com segurança e voltar depois.</p>
          </Screen>
        )}

        {state?.state === "rfi_required" && (
          <Screen title="Precisamos de mais informações">
            {rfi && rfi.case && rfi.messages.length > 0 ? (
              <>
                <p className="text-warm-300">
                  Solicitamos algumas informações para dar continuidade à sua conta. Veja abaixo e
                  responda por aqui.
                </p>
                <RfiThread messages={rfi.messages} closed={rfi.case.status === "closed"} />
                <p className="pt-2 text-xs text-warm-500">
                  Se for necessário refazer a verificação, use o botão abaixo.
                </p>
                <AdvanceButton step="launch-verification" label="Reiniciar verificação" pendingLabel="Abrindo…" />
              </>
            ) : (
              <>
                <p className="text-warm-300">
                  Verifique seu e-mail para os detalhes. Quando estiver pronto, reinicie a verificação.
                </p>
                <AdvanceButton step="launch-verification" label="Reiniciar verificação" pendingLabel="Abrindo…" />
              </>
            )}
          </Screen>
        )}

        {(state?.state === "declined" || state?.state === "rejected") && (
          <Screen title="Cadastro não aprovado">
            <p className="text-warm-300">Infelizmente sua conta não foi aprovada neste momento.</p>
          </Screen>
        )}
      </main>
    </div>
  );
}

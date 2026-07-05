import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getOnboardingState, listNotifications } from "@/lib/lince-api";
import { Sidebar } from "@/components/app/sidebar";
import { TopBar } from "@/components/top-bar";
import { AppTopBar } from "@/components/app/app-top-bar";
import { AppFooter } from "@/components/app/app-footer";
import { SessionTimeout } from "@/components/auth/session-timeout";
import { Card, CardContent } from "@/components/ui/card";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/");

  // The single gate: no app surface until the org is active.
  const state = await getOnboardingState();
  if (state?.state !== "active") redirect("/onboarding");

  // Tipping-off-safe hold: suspended/blocked orgs get one neutral screen (same
  // copy for both — no reason, no distinction). Render, don't redirect: onboarding
  // bounces active orgs back to /app, so a redirect would loop. Same Screen shell
  // as app/onboarding/page.tsx. No Sidebar, no children — no features advertised.
  if (state.accessStatus && state.accessStatus !== "active") {
    return (
      <div className="flex min-h-screen flex-col">
        <TopBar />
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-8 px-6 py-12">
          <Card className="min-h-[30rem] w-full max-w-md justify-center border-ink-500 bg-ink-700">
            <CardContent className="space-y-4 text-center">
              <h1 className="font-display text-2xl">Conta em análise</h1>
              <p className="text-warm-300">
                Sua conta está temporariamente indisponível enquanto realizamos uma verificação de
                rotina. Nenhuma ação é necessária da sua parte neste momento.
              </p>
              <p className="text-sm text-warm-500">
                Em caso de dúvidas, entre em contato com nosso suporte.
              </p>
            </CardContent>
          </Card>
        </main>
        <SessionTimeout />
      </div>
    );
  }

  // Past the active gate (held/blocked orgs returned above with no inbox): the unread ping count
  // drives the bell dot + sidebar "Avisos" badge.
  const { unread } = await listNotifications();

  return (
    <div className="flex min-h-screen">
      <Sidebar unreadCount={unread} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopBar unreadCount={unread} />
        <main className="mx-auto w-full max-w-[1320px] flex-1 px-5 py-8 lg:px-9 lg:pb-16">{children}</main>
        <AppFooter />
      </div>
      <SessionTimeout />
    </div>
  );
}

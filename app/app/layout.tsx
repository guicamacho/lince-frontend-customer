import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getOnboardingState } from "@/lib/lince-api";
import { Sidebar } from "@/components/app/sidebar";
import { TopBar } from "@/components/top-bar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/");

  // The single gate: no app surface until the org is active.
  const state = await getOnboardingState();
  if (state?.state !== "active") redirect("/onboarding");

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}

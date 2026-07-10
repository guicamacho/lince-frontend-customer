import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getOnboardingState } from "@/lib/lince-api";

// Routes by org state so approved accounts land straight on /app after sign-in —
// /onboarding is only for accounts that aren't active yet (or, on a failed state
// read, the place whose neutral retry screen handles it).
export default async function Home() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const result = await getOnboardingState();
  if (result.ok && result.state?.state === "active") redirect("/app");
  redirect("/onboarding");
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

/**
 * Post-auth landing gate. A CLIENT component on purpose: right after Clerk sign-in, a
 * server component here would run before the session (and its backend token) is fully
 * committed, so the state read failed and the user got stranded until a manual reload.
 * `useAuth().isLoaded` is the reliable "session is ready" signal — we only route once it
 * flips. Signed-in users go to /app (whose server layout does the active-org gating and
 * sends non-active orgs to /onboarding); signed-out users go to /sign-in.
 */
export default function Home() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    router.replace(isSignedIn ? "/app" : "/sign-in");
  }, [isLoaded, isSignedIn, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-900">
      <span
        className="size-6 animate-spin rounded-full border-2 border-ink-500 border-t-gold-500"
        role="status"
        aria-label="Carregando"
      />
    </div>
  );
}

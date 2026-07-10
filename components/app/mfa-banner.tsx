"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { ShieldAlert } from "lucide-react";

/**
 * Persistent security notice: prompts the user to enable MFA. Client component so it can read
 * the full Clerk user (the server user object drops `passkeys`). MFA is satisfied by EITHER a
 * second factor OR a passkey (ruling 2026-07-10), so it self-hides once either exists. Shown on
 * every app page (per user, every login) until then; hidden on the settings page itself.
 */
export function MfaBanner() {
  const { user, isLoaded } = useUser();
  const pathname = usePathname();
  if (!isLoaded || !user) return null;
  const hasMfa = user.twoFactorEnabled || (user.passkeys?.length ?? 0) > 0;
  if (hasMfa || pathname === "/app/settings") return null;

  return (
    <div
      role="note"
      className="mb-6 flex flex-col gap-3 rounded-[14px] bg-gold-500/10 px-4 py-3 text-[13px] leading-snug text-gold-400 ring-1 ring-gold-500/25 sm:flex-row sm:items-center"
    >
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-px size-4 shrink-0" aria-hidden />
        <p>
          <span className="font-semibold">Proteja sua conta</span> — ative a verificação em duas
          etapas (app autenticador ou passkey). Ela é exigida para cadastrar beneficiários e pagar.
        </p>
      </div>
      <Link
        href="/app/settings"
        className="inline-flex min-h-9 shrink-0 cursor-pointer items-center justify-center rounded-[10px] bg-gold-500 px-3.5 text-[13px] font-bold text-ink-900 transition-colors hover:bg-gold-400 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:ml-auto"
      >
        Ativar agora
      </Link>
    </div>
  );
}

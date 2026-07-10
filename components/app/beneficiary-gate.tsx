"use client";

/**
 * Gates the add-payee form on MFA (TOTP OR passkey — ruling 2026-07-10). Client component so it
 * can read the full Clerk user (the server user object drops `passkeys`); the backend enforces
 * the same rule. Not enrolled => an enroll prompt to Configurações instead of the form.
 */
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { ShieldAlert } from "lucide-react";
import { BeneficiaryForm } from "@/components/app/beneficiary-form";
import { Card } from "@/components/ui/card";

export function BeneficiaryGate() {
  const { user, isLoaded } = useUser();
  if (!isLoaded) return null;
  const hasMfa = (user?.twoFactorEnabled ?? false) || (user?.passkeys?.length ?? 0) > 0;

  if (hasMfa) return <BeneficiaryForm />;

  return (
    <Card className="gap-3 p-6">
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 size-5 shrink-0 text-gold-500" aria-hidden />
        <div>
          <h2 className="font-medium text-warm-200">Ative a verificação em duas etapas</h2>
          <p className="mt-1 text-sm text-warm-400">
            Para cadastrar um beneficiário (destinatário de pagamentos), ative a verificação em duas
            etapas — app autenticador ou passkey. É rápido e protege seus pagamentos.
          </p>
          <Link
            href="/app/settings"
            className="mt-3 inline-flex min-h-9 cursor-pointer items-center rounded-[10px] bg-gold-500 px-3.5 text-[13px] font-bold text-ink-900 transition-colors hover:bg-gold-400 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Ir para Configurações
          </Link>
        </div>
      </div>
    </Card>
  );
}

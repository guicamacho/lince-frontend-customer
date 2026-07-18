"use server";

import { reverificationError } from "@clerk/nextjs/server";
import { closeAccount } from "@/lib/lince-api";

const MESSAGES: Record<string, string> = {
  balance_not_zero:
    "Para encerrar a conta, todo o saldo precisa estar zerado. Envie ou converta o que restar e tente novamente.",
  transactions_in_flight: "Há transações em andamento. Aguarde a conclusão e tente novamente.",
  org_not_active: "A conta não está em um estado que permita encerramento.",
  forbidden: "Somente o proprietário pode encerrar a conta.",
  mfa_required: "Ative a verificação em duas etapas para encerrar a conta.",
  money_out_held:
    "Por segurança, alterações ficam temporariamente bloqueadas após a recuperação da conta. Tente novamente mais tarde.",
};

/** step_up_required -> Clerk reverification hint; the card's wrapper re-auths and retries. */
export async function closeAccountAction(): Promise<
  { ok: true } | { error: string } | ReturnType<typeof reverificationError>
> {
  const res = await closeAccount();
  if (res.ok) return { ok: true };
  if (res.error === "step_up_required") return reverificationError("strict");
  return { error: MESSAGES[res.error] ?? "Não foi possível encerrar a conta. Tente novamente." };
}

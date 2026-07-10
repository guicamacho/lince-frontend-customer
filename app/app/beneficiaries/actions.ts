"use server";

import { beneficiarySchema, type BeneficiaryInput } from "@/lib/schemas";
import { createBeneficiary } from "@/lib/lince-api";

export async function createBeneficiaryAction(
  values: BeneficiaryInput,
): Promise<{ ok: true } | { error: string }> {
  const parsed = beneficiarySchema.safeParse(values);
  if (!parsed.success) return { error: "Dados inválidos." };
  const res = await createBeneficiary(parsed.data);
  if (!res.ok) {
    // Backend money-out gate: 2FA required to add a payee (defense in depth — the page
    // already gates the form on enrollment).
    if (res.error === "mfa_required") {
      return { error: "Ative a verificação em duas etapas em Configurações para cadastrar beneficiários." };
    }
    return { error: res.error };
  }
  return { ok: true };
}

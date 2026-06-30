"use server";

import { beneficiarySchema, type BeneficiaryInput } from "@/lib/schemas";
import { createBeneficiary } from "@/lib/lince-api";

export async function createBeneficiaryAction(
  values: BeneficiaryInput,
): Promise<{ ok: true } | { error: string }> {
  const parsed = beneficiarySchema.safeParse(values);
  if (!parsed.success) return { error: "Dados inválidos." };
  const res = await createBeneficiary(parsed.data);
  if (!res.ok) return { error: res.error };
  return { ok: true };
}

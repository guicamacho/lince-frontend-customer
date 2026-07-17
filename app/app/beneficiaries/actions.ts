"use server";

import { reverificationError } from "@clerk/nextjs/server";
import { createBeneficiary, type CreateBeneficiaryInput } from "@/lib/lince-api";

// Backend rail-validation codes -> pt-BR. The backend (rails.validateBeneficiary) is the wall;
// this maps its neutral codes. missing_<field>/invalid_<field> fall back to a generic line.
const RAIL_ERROR_PT: Record<string, string> = {
  invalid_rail: "Selecione um tipo de destino válido.",
  invalid_pix_key_type: "Selecione o tipo de chave PIX.",
  missing_pixKey: "Informe a chave PIX.",
  invalid_routing_number: "Routing number inválido (9 dígitos).",
  invalid_iban: "IBAN inválido.",
  invalid_bic: "BIC / SWIFT inválido.",
  invalid_swift_asset: "Moeda não suportada para SWIFT (USD, EUR ou GBP).",
  invalid_swift_bic: "SWIFT / BIC inválido.",
  missing_account: "Informe o IBAN ou o número da conta.",
  invalid_crypto_asset: "Selecione USDT ou USDC.",
  invalid_network: "Selecione uma rede válida para essa stablecoin.",
  invalid_wallet_address: "Endereço de carteira inválido para a rede escolhida.",
  mfa_required: "Ative a verificação em duas etapas em Configurações para cadastrar beneficiários.",
  forbidden: "Seu papel não permite cadastrar beneficiários. Fale com um administrador da conta.",
};

export async function createBeneficiaryAction(
  input: CreateBeneficiaryInput,
): Promise<{ ok: true } | { error: string } | ReturnType<typeof reverificationError>> {
  const res = await createBeneficiary(input);
  if (!res.ok) {
    // step_up_required -> Clerk reverification hint; the form's useReverification wrapper
    // re-auths and retries (payee create is idempotent-safe to resubmit from the same form).
    if (res.error === "step_up_required") return reverificationError("strict");
    if (RAIL_ERROR_PT[res.error]) return { error: RAIL_ERROR_PT[res.error] };
    if (res.error.startsWith("missing_")) return { error: "Preencha todos os campos obrigatórios." };
    if (res.error.startsWith("invalid_") || res.error.startsWith("too_long_")) return { error: "Verifique os dados informados." };
    return { error: "Não foi possível salvar o beneficiário. Tente novamente." };
  }
  return { ok: true };
}

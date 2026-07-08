"use server";

import { createDeposit, type DepositReceipt } from "@/lib/lince-api";

export async function createDepositAction(
  values: { amountBrl: string; idemKey: string },
): Promise<{ ok: true; receipt: DepositReceipt } | { error: string }> {
  const amount = values.amountBrl.replace(",", "."); // pt-BR decimal comma
  if (!/^\d+(\.\d{1,2})?$/.test(amount) || Number(amount) <= 0) {
    return { error: "Informe um valor válido em reais (ex.: 250,00)." };
  }
  if (!values.idemKey) return { error: "Recarregue a página e tente novamente." };
  const res = await createDeposit({ amountBrl: amount, idemKey: values.idemKey });
  if (!res.ok) {
    return {
      error:
        res.error === "idem_key_payload_mismatch"
          ? "Este envio já foi usado com outro valor. Recarregue a página para gerar um novo depósito."
          : "Não foi possível gerar o depósito agora. Tente novamente em instantes.",
    };
  }
  return { ok: true, receipt: res.data };
}

"use server";

import { createDispute } from "@/lib/lince-api";

const MESSAGES: Record<string, string> = {
  transaction_not_found: "Transação não encontrada.",
  empty_body: "Descreva o problema para enviarmos à equipe.",
  forbidden: "Seu papel não permite abrir manifestações.",
};

/** PRD-04 §13.1: report a problem on a transaction -> a case thread in Avisos. */
export async function reportProblemAction(
  transactionId: string,
  message: string,
): Promise<{ ok: true; caseId: string } | { error: string }> {
  const res = await createDispute({ transactionId, message });
  if (!res.ok) return { error: MESSAGES[res.error] ?? "Não foi possível enviar. Tente novamente." };
  return { ok: true, caseId: res.data.caseId };
}

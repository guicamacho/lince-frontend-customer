"use server";

import { caseReplySchema, type CaseReplyInput } from "@/lib/schemas";
import { postCaseReply, markNotificationRead } from "@/lib/lince-api";

// Neutral pt-BR mapping for the backend reply error codes — the customer never sees a raw code
// or a reason (tipping-off-safe). Unknown codes fall back to a generic retry message.
const REPLY_ERROR_PT: Record<string, string> = {
  empty_body: "Escreva uma mensagem.",
  case_closed: "Esta solicitação foi encerrada e não aceita novas mensagens.",
  case_not_open_to_reply: "Esta solicitação não aceita respostas no momento.",
  case_not_found: "Solicitação não encontrada.",
};

export async function createCaseReplyAction(
  caseId: string,
  values: CaseReplyInput,
): Promise<{ ok: true } | { error: string }> {
  const parsed = caseReplySchema.safeParse(values);
  if (!parsed.success) return { error: "Dados inválidos." };
  const res = await postCaseReply(caseId, parsed.data.body);
  if (!res.ok) return { error: REPLY_ERROR_PT[res.error] ?? "Não foi possível enviar. Tente novamente." };
  return { ok: true };
}

export async function markNotificationReadAction(
  id: string,
): Promise<{ ok: true } | { error: string }> {
  const res = await markNotificationRead(id);
  if (!res.ok) return { error: res.error };
  return { ok: true };
}

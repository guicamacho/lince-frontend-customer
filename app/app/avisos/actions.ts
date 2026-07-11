"use server";

import { caseReplySchema, type CaseReplyInput } from "@/lib/schemas";
import { postCaseReply, markNotificationRead, uploadCaseDocument } from "@/lib/lince-api";

// Mirror the backend accept-list + cap (documents.service.ts). Validated here AND server-side.
const ALLOWED_DOC_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
const MAX_DOC_BYTES = 15 * 1024 * 1024;
const DOC_ERROR_PT: Record<string, string> = {
  unsupported_file_type: "Tipo de arquivo não suportado. Envie PDF, JPG, PNG ou WEBP.",
  file_too_large: "Arquivo muito grande. O limite é 15 MB.",
  empty_file: "O arquivo está vazio.",
  case_not_open_to_documents: "Esta solicitação não aceita documentos no momento.",
  case_not_found: "Solicitação não encontrada.",
  document_forward_failed: "Não foi possível enviar o documento agora. Tente novamente em instantes.",
};

export async function uploadDocumentAction(
  caseId: string,
  formData: FormData,
): Promise<{ ok: true } | { error: string }> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Selecione um arquivo." };
  if (!ALLOWED_DOC_TYPES.has(file.type)) return { error: DOC_ERROR_PT.unsupported_file_type };
  if (file.size > MAX_DOC_BYTES) return { error: DOC_ERROR_PT.file_too_large };
  const buffer = await file.arrayBuffer();
  const res = await uploadCaseDocument(caseId, { name: file.name, type: file.type, buffer });
  if (!res.ok) return { error: DOC_ERROR_PT[res.error] ?? "Não foi possível enviar. Tente novamente." };
  return { ok: true };
}

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

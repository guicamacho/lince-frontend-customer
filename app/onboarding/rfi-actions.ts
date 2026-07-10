"use server";

import { replyRfi } from "@/lib/lince-api";

export async function replyRfiAction(body: string): Promise<{ ok: true } | { error: string }> {
  const text = body.trim();
  if (!text) return { error: "Escreva uma resposta antes de enviar." };
  const res = await replyRfi(text);
  if (!res.ok) {
    return {
      error:
        res.error === "case_closed"
          ? "Esta solicitação já foi encerrada."
          : "Não foi possível enviar sua resposta agora. Tente novamente.",
    };
  }
  return { ok: true };
}

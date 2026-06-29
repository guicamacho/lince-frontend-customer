"use server";

import { currentUser } from "@clerk/nextjs/server";
import { bootstrapOrg, advanceOnboarding } from "@/lib/lince-api";
import { companySchema, type CompanyInput } from "@/lib/schemas";

/** Create the org from the signup company details + the Clerk user's identity. */
export async function bootstrapAction(values: CompanyInput): Promise<{ ok: true } | { error: string }> {
  const parsed = companySchema.safeParse(values);
  if (!parsed.success) return { error: "Dados inválidos." };

  const user = await currentUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };
  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || "Representante legal";
  const email = user.primaryEmailAddress?.emailAddress ?? "";

  const res = await bootstrapOrg({ ...parsed.data, fullName, email });
  if (!res.ok) return { error: res.error };
  return { ok: true };
}

/** Mock Didit launch -> kyb_in_progress, then complete -> vendor_pending. */
export async function advanceAction(
  step: "launch-verification" | "mock-verify",
): Promise<{ ok: true } | { error: string }> {
  const res = await advanceOnboarding(step);
  if (!res.ok) return { error: res.error };
  return { ok: true };
}

/** Look up public Receita data (razão social + situação) for a CNPJ via BrasilAPI, to pre-fill the form. */
export async function lookupCnpjAction(
  cnpj: string,
): Promise<{ razaoSocial: string; ativa: boolean } | { error: string }> {
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) return { error: "CNPJ inválido." };

  // Authenticated callers only — don't expose this as an open CNPJ proxy.
  if (!(await currentUser())) return { error: "Sessão expirada. Entre novamente." };

  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`, {
      // Cloudflare 403s the default undici User-Agent — any UA gets through.
      headers: { "User-Agent": "lince-finance", Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (res.status === 404) return { error: "CNPJ não encontrado na Receita." };
    if (!res.ok) return { error: "Não foi possível consultar o CNPJ agora." };

    const data = await res.json();
    const razaoSocial = String(data.razao_social ?? "").trim();
    if (!razaoSocial) return { error: "CNPJ sem razão social na Receita." };
    // ponytail: BrasilAPI returns both a code (2 = ATIVA) and a label — accept either.
    const ativa = data.descricao_situacao_cadastral === "ATIVA" || data.situacao_cadastral === 2;
    return { razaoSocial, ativa };
  } catch {
    return { error: "Não foi possível consultar o CNPJ agora." };
  }
}

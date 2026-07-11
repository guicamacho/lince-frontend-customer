"use server";

import { currentUser } from "@clerk/nextjs/server";
import { bootstrapOrg, advanceOnboarding, lookupCnpj } from "@/lib/lince-api";
import { companySchema, CNPJ_ALREADY_REGISTERED_MSG, type CompanyInput } from "@/lib/schemas";

// Backend CNPJ error codes -> the existing neutral pt-BR strings (tipping-off-safe).
// rate_limited / cnpj_lookup_unavailable fall through to the generic "unavailable" note.
const CNPJ_ERROR_PT: Record<string, string> = {
  cnpj_invalid: "CNPJ inválido.",
  cnpj_not_found: "CNPJ não encontrado na Receita.",
  cnpj_no_name: "CNPJ sem razão social na Receita.",
  unauthenticated: "Sessão expirada. Entre novamente.",
};

// Bootstrap rejections -> guidance or NEUTRAL copy. cnpj_denylisted deliberately falls
// through to the same generic failure as anything else (tipping-off-safe: indistinguishable).
const BOOTSTRAP_ERROR_PT: Record<string, string> = {
  cnpj_already_registered: CNPJ_ALREADY_REGISTERED_MSG,
  unauthenticated: "Sessão expirada. Entre novamente.",
};
const BOOTSTRAP_GENERIC = "Não foi possível concluir o cadastro. Tente novamente.";

/** Create the org from the signup company details + the Clerk user's identity. */
export async function bootstrapAction(values: CompanyInput): Promise<{ ok: true } | { error: string }> {
  const parsed = companySchema.safeParse(values);
  if (!parsed.success) return { error: "Dados inválidos." };

  const user = await currentUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };
  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || "Representante legal";
  const email = user.primaryEmailAddress?.emailAddress ?? "";

  // consentAccepted is a client-side gate only — the backend owns the versioned
  // consent set and stamps it once per org, so it is not forwarded here.
  const { cnpj, razaoSocial, role } = parsed.data;
  const res = await bootstrapOrg({ cnpj, razaoSocial, role, fullName, email });
  if (!res.ok) return { error: BOOTSTRAP_ERROR_PT[res.error] ?? BOOTSTRAP_GENERIC };
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
): Promise<{ razaoSocial: string; ativa: boolean; alreadyRegistered?: boolean } | { error: string; unavailable?: boolean }> {
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) return { error: "CNPJ inválido." };

  // Authenticated callers only — don't expose this as an open CNPJ proxy.
  if (!(await currentUser())) return { error: "Sessão expirada. Entre novamente." };

  // Lookup lives server-side (BrasilAPI moved off the customer app); map neutral codes to pt-BR.
  const res = await lookupCnpj(digits);
  if (res.ok) return res.data;
  // Definitive data-negatives (invalid/not-found/no-name) are NOT a fallback case — the CNPJ
  // itself is the problem, and bootstrap re-validates. A service outage (unavailable / rate-limited
  // / any unmapped code) is: let the user type razão social manually so an outage can't block signup.
  const unavailable = !(res.error in CNPJ_ERROR_PT);
  return {
    error: CNPJ_ERROR_PT[res.error] ?? "Não foi possível consultar o CNPJ agora. Informe a razão social manualmente.",
    unavailable,
  };
}

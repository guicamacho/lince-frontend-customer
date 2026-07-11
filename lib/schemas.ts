import { z } from "zod";

/** Roles permitted to represent/operate the PJ — a controlled list to cut data-entry errors. */
export const OPERATOR_ROLES = [
  "Sócio",
  "Sócio-administrador",
  "Administrador",
  "Diretor",
  "Procurador",
  "Representante legal",
] as const;

/** Company details captured at signup (Modelo A: CNPJ only — no CPF/PII). */
export const companySchema = z.object({
  cnpj: z
    .string()
    .refine((v) => v.replace(/\D/g, "").length === 14, { message: "CNPJ deve ter 14 dígitos" }),
  razaoSocial: z.string().trim().min(1, { message: "Informe a razão social" }),
  role: z
    .string()
    .refine((v) => (OPERATOR_ROLES as readonly string[]).includes(v), { message: "Selecione um cargo" }),
  // Versioned ToS acceptance gate (PRD-02 AC-17). The backend owns the version
  // strings and stamps the `consent.accepted` audit row on org creation; this flag
  // only enforces that the box was checked (re-validated server-side in bootstrapAction).
  consentAccepted: z.literal(true, "É necessário aceitar os termos para continuar."),
});

export type CompanyInput = z.infer<typeof companySchema>;

/**
 * Shared duplicate-CNPJ guidance (shown at CNPJ blur AND on bootstrap rejection).
 * Lives here because "use server" action files may only export async functions.
 */
export const CNPJ_ALREADY_REGISTERED_MSG =
  "Esta empresa já está cadastrada na Lince. Fale com o administrador da sua empresa para receber um convite, ou entre com a conta original (você pode recuperar a senha no login).";

// Beneficiary capture moved to the rail-aware form (components/app/beneficiary-form.tsx +
// lib/rails.ts); the backend (modules/beneficiaries/rails.ts) is the authoritative validator.

/**
 * Customer reply to a staff-opened case (D1: reply-only — customers never open cases in v1).
 * Neutral free text. The 4000-char cap mirrors the backend sanitizer (MAX_REPLY_LEN) so the UI
 * pre-validates; the server still strips HTML/URLs and re-caps at the trust boundary.
 */
export const caseReplySchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, { message: "Escreva uma mensagem" })
    .max(4000, { message: "Mensagem muito longa (máximo de 4000 caracteres)" }),
});

export type CaseReplyInput = z.infer<typeof caseReplySchema>;

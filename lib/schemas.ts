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
});

export type CompanyInput = z.infer<typeof companySchema>;

/**
 * Neutral, tipping-off-safe pt-BR labels for the customer inbox ("Avisos").
 * The customer only ever sees the two customer-facing case types and a soft status;
 * never a reason, a suspicion, or the word "compliance". Escalation is NOT surfaced
 * (reads as "Em andamento") — L5 of the tipping-off model.
 */

export const CASE_TYPE_LABEL: Record<string, string> = {
  rfi_relay: "Solicitação de informações",
  kyb_completeness: "Complemento de cadastro",
};

export function caseTypeLabel(type: string): string {
  return CASE_TYPE_LABEL[type] ?? "Solicitação";
}

export const CASE_STATUS_LABEL: Record<string, string> = {
  open: "Aberto",
  in_review: "Em andamento",
  escalated: "Em andamento", // neutral: escalation is never surfaced to the customer
  closed: "Encerrado",
};

export function caseStatusLabel(status: string): string {
  return CASE_STATUS_LABEL[status] ?? "Em andamento";
}

const DAY = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });
const FULL = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/** Short "12 mai" for list rows. */
export function formatDay(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : DAY.format(d);
}

/** "12 mai, 14:30" for thread messages. */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : FULL.format(d);
}

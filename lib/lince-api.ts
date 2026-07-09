/**
 * BFF client for the Lince backend (lince-phase1 @ LINCE_API_URL).
 * Server-only: calls are server-to-server (no CORS), authenticated with the
 * caller's Clerk session token (the backend's clerkMiddleware verifies it).
 */
import "server-only";
import { auth } from "@clerk/nextjs/server";

const BASE = process.env.LINCE_API_URL ?? "http://localhost:3000";

async function authedFetch(path: string, init?: RequestInit): Promise<Response> {
  const { getToken } = await auth();
  const token = await getToken();
  return fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
}

export interface OrgSnapshot {
  orgId: string;
  state: string;
  admissionState?: string;
  accessStatus?: string; // optional: tolerates backends that predate migration 0002
}

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

async function toResult<T>(res: Response): Promise<Result<T>> {
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) return { ok: false, error: (body.error as string) ?? `HTTP ${res.status}` };
  return { ok: true, data: body as T };
}

// --- Depositar: Avenia account deposit details, visible post-approval (backend /app gate).
//     Custódia Avenia (Modelo A); funds rest as BRLA shown as R$.
export interface DepositDetails {
  pixKey: string | null;
  brCode: string | null;
  wallets: Array<{ chain: string; address: string }>;
}

export async function getDepositDetails(): Promise<Result<DepositDetails>> {
  return toResult<DepositDetails>(await authedFetch("/app/deposit-details"));
}

// Amount-specific PIX deposit: quote+ticket on the org's subaccount; returns the brCode to pay.
// idemKey binds the request (same key + same amount replays the same ticket; different -> 409).
export interface DepositReceipt {
  id: string;
  state: string;
  brCode: string | null;
  expiration: string | null;
  sourceAmount: number; // centavos
  destAmount: number | null;
  fees: Array<{ label: string; amount: number; currency: string; rebatable: boolean }>;
}

export async function createDeposit(input: { amountBrl: string; idemKey: string }): Promise<Result<DepositReceipt>> {
  return toResult<DepositReceipt>(
    await authedFetch("/app/deposits", { method: "POST", body: JSON.stringify(input) }),
  );
}

/** Ledger balances (minor units per currency) — settled money only. */
export async function getBalances(): Promise<Result<{ balances: Record<string, number> }>> {
  return toResult<{ balances: Record<string, number> }>(await authedFetch("/app/balances"));
}

/** The caller's company (id + razão social + state) — the Configurações page reads it. */
export async function getMe(): Promise<Result<{ id: string; razao_social: string; state: string }>> {
  return toResult<{ id: string; razao_social: string; state: string }>(await authedFetch("/app/me"));
}

/** The caller's org state (drives the onboarding + app shell gates).
 *  DISTINGUISHES "no org yet" (ok + null) from a failed read (ok: false — backend blip,
 *  401 during the post-sign-in handshake, timeout). Conflating the two once showed the
 *  company form to an approved account; callers must render errors as errors. */
export type OnboardingStateResult = { ok: true; state: OrgSnapshot | null } | { ok: false };

export async function getOnboardingState(): Promise<OnboardingStateResult> {
  try {
    const res = await authedFetch("/onboarding/state");
    if (!res.ok) return { ok: false };
    return { ok: true, state: (await res.json()) as OrgSnapshot | null };
  } catch {
    return { ok: false };
  }
}

export async function bootstrapOrg(input: {
  cnpj: string;
  razaoSocial: string;
  role: string;
  fullName: string;
  email: string;
}): Promise<Result<OrgSnapshot>> {
  return toResult<OrgSnapshot>(
    await authedFetch("/onboarding/bootstrap", { method: "POST", body: JSON.stringify(input) }),
  );
}

/** Advance the caller's org one onboarding step (mock Didit launch / complete). */
export async function advanceOnboarding(
  step: "launch-verification" | "mock-verify",
): Promise<Result<OrgSnapshot>> {
  return toResult<OrgSnapshot>(await authedFetch(`/onboarding/${step}`, { method: "POST" }));
}

/** Public Receita lookup (BrasilAPI, now server-side in the backend) to pre-fill signup. */
export async function lookupCnpj(
  cnpj: string,
): Promise<Result<{ razaoSocial: string; ativa: boolean; alreadyRegistered?: boolean }>> {
  return toResult<{ razaoSocial: string; ativa: boolean; alreadyRegistered?: boolean }>(
    await authedFetch("/onboarding/cnpj-lookup", { method: "POST", body: JSON.stringify({ cnpj }) }),
  );
}

export interface Beneficiary {
  id: string;
  label: string;
  payee_legal_name: string | null;
  payee_country: string | null;
  payee_bank_psp: string | null;
  payee_account: string | null;
  payee_memo: string | null;
  purpose_of_payment: string | null;
  source_of_funds: string | null;
  status: string;
  avenia_beneficiary_id: string | null;
  created_at: string;
}

export async function listBeneficiaries(): Promise<Beneficiary[]> {
  const res = await authedFetch("/app/beneficiaries");
  if (!res.ok) return [];
  const body = (await res.json().catch(() => ({}))) as { beneficiaries?: Beneficiary[] };
  return body.beneficiaries ?? [];
}

export async function createBeneficiary(input: {
  label: string;
  payeeLegalName: string;
  payeeCountry: string;
  payeeBankPsp: string;
  payeeAccount: string;
  payeeMemo?: string;
  purposeOfPayment: string;
  sourceOfFunds?: string;
}): Promise<Result<{ id: string }>> {
  return toResult<{ id: string }>(
    await authedFetch("/app/beneficiaries", { method: "POST", body: JSON.stringify(input) }),
  );
}

// --- Transações (F3). Amounts are ledger minor units + currency (the same ints the ledger holds,
//     posted from Avenia ticket actuals). Fees are the itemized Avenia appliedFees[] plus the Lince
//     rebate line — never a blended/all-in FX rate (Modelo A). Built against the frozen
//     GET /app/transactions contract; degrades to a Result error while the route is unbuilt (404). ---

export type TxType = "deposit" | "convert_and_send" | "payout";

export interface TxFee {
  label: string;
  amount: number; // minor units
  currency: string;
  rebatable: boolean;
}

export interface TxRebate {
  label?: string;
  amount: number; // minor units
  currency: string;
}

export interface TxQuoteSnapshot {
  basePrice?: string;
  pairName?: string;
  sourceAmount?: number; // minor units
  destAmount?: number; // minor units
}

export interface Transaction {
  id: string;
  type: TxType;
  state: string; // org_transactions.state (created/funding/executing/settled/failed/…)
  status: string; // Avenia ticket lifecycle: UNPAID | PROCESSING | PAID | FAILED | PARTIAL_FAILED
  statusLabel?: string; // optional backend copy; F3 maps status -> neutral label locally (tipping-off)
  sourceCurrency: string;
  sourceAmount: number; // minor units
  destCurrency: string;
  destAmount: number; // minor units
  fees: TxFee[];
  rebate?: TxRebate | null;
  beneficiaryLabel: string | null;
  createdAt: string;
  vendorRef: string | null;
  quote?: TxQuoteSnapshot | null;
}

/** Result (not []) so the page can show a neutral degraded state while the backend route 404s. */
export async function listTransactions(): Promise<Result<Transaction[]>> {
  const res = await authedFetch("/app/transactions");
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    return { ok: false, error: body.error ?? `HTTP ${res.status}` };
  }
  const body = (await res.json().catch(() => ({}))) as { transactions?: Transaction[] };
  return { ok: true, data: body.transactions ?? [] };
}

// --- Customer inbox ("Avisos"). Org is implicit (the backend derives it from res.locals.orgId).
//     Reads only return customer_visible messages on allowlisted-type cases; author_id is never
//     serialized to the customer (L4 of the tipping-off model). ---

export interface CustomerNotification {
  id: string;
  kind: string;
  case_id: string | null;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

export interface CustomerCaseSummary {
  id: string;
  type: string;
  status: string;
  opened_at: string;
  closed_at: string | null;
  last_message_at: string | null;
}

export interface CustomerCaseMessage {
  id: string;
  case_id: string;
  author_type: string; // 'admin' | 'customer' | 'system'
  body: string;
  created_at: string;
}

export interface CustomerCaseThread {
  case: { id: string; type: string; status: string; opened_at: string; closed_at: string | null };
  messages: CustomerCaseMessage[];
}

export async function listNotifications(): Promise<{
  notifications: CustomerNotification[];
  unread: number;
}> {
  const res = await authedFetch("/app/notifications");
  if (!res.ok) return { notifications: [], unread: 0 };
  const body = (await res.json().catch(() => ({}))) as {
    notifications?: CustomerNotification[];
    unread?: number;
  };
  return { notifications: body.notifications ?? [], unread: body.unread ?? 0 };
}

export async function markNotificationRead(id: string): Promise<Result<{ ok: true }>> {
  return toResult<{ ok: true }>(
    await authedFetch(`/app/notifications/${id}/read`, { method: "POST" }),
  );
}

export async function listMyCases(): Promise<CustomerCaseSummary[]> {
  const res = await authedFetch("/app/cases");
  if (!res.ok) return [];
  const body = (await res.json().catch(() => ({}))) as { cases?: CustomerCaseSummary[] };
  return body.cases ?? [];
}

/** null when the case is not the caller's org (backend 404) — surfaced as a neutral "não encontrado". */
export async function getCaseThread(id: string): Promise<CustomerCaseThread | null> {
  const res = await authedFetch(`/app/cases/${id}/messages`);
  if (!res.ok) return null;
  return (await res.json()) as CustomerCaseThread;
}

export async function postCaseReply(caseId: string, body: string): Promise<Result<{ id: string }>> {
  return toResult<{ id: string }>(
    await authedFetch(`/app/cases/${caseId}/messages`, {
      method: "POST",
      body: JSON.stringify({ body }),
    }),
  );
}

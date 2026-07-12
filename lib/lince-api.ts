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

// --- Câmbio (display FX). Bare Avenia stablecoin rate (BRLA<>USDT / BRLA>EUR) checked against
//     mid-market; any leg can be null (unavailable/suspect). BRL per 1 unit of USD/EUR. ---
export interface Rates {
  brlUsd: { buy: number | null; sell: number | null; mid: number | null };
  brlEur: { buy: number | null; mid: number | null };
  updatedAt: string;
}
export async function getRates(): Promise<Rates | null> {
  const res = await authedFetch("/app/rates");
  if (!res.ok) return null;
  return (await res.json()) as Rates;
}

/** The caller's company + their access roles (KYB tags never leave the backend). */
export interface Me {
  id: string;
  razao_social: string;
  state: string;
  roles: AccessRole[];
}
export async function getMe(): Promise<Result<Me>> {
  return toResult<Me>(await authedFetch("/app/me"));
}

// --- Equipe (PRD-03): list, invite, role change, remove, transfer. Authorization is
//     server-side; the UI only hides controls the backend would 403 anyway. ---
export type AccessRole = "owner" | "admin" | "finance" | "viewer";
export interface TeamMember {
  personId: string;
  name: string;
  email: string;
  roles: AccessRole[];
  status: "invited" | "active" | "suspended";
  /** Seconds until this person can be re-invited (0 = ready). Seeds the resend countdown. */
  cooldownRemaining: number;
}

export async function getTeam(): Promise<Result<{ members: TeamMember[] }>> {
  return toResult<{ members: TeamMember[] }>(await authedFetch("/app/team"));
}

export async function inviteTeamMember(input: { email: string; role: string }): Promise<Result<TeamMember>> {
  return toResult<TeamMember>(
    await authedFetch("/app/team/invitations", { method: "POST", body: JSON.stringify(input) }),
  );
}

export async function changeTeamMemberRole(personId: string, role: string): Promise<Result<{ roles: AccessRole[] }>> {
  return toResult<{ roles: AccessRole[] }>(
    await authedFetch(`/app/team/members/${encodeURIComponent(personId)}/role`, {
      method: "POST",
      body: JSON.stringify({ role }),
    }),
  );
}

export async function resendTeamInvitation(personId: string): Promise<Result<{ resent: boolean }>> {
  return toResult<{ resent: boolean }>(
    await authedFetch(`/app/team/members/${encodeURIComponent(personId)}/resend`, { method: "POST" }),
  );
}

export async function removeTeamMember(personId: string): Promise<Result<{ removed: boolean }>> {
  return toResult<{ removed: boolean }>(
    await authedFetch(`/app/team/members/${encodeURIComponent(personId)}`, { method: "DELETE" }),
  );
}

export async function transferTeamOwnership(toPersonId: string): Promise<Result<{ transferred: boolean }>> {
  return toResult<{ transferred: boolean }>(
    await authedFetch("/app/team/transfer-ownership", { method: "POST", body: JSON.stringify({ toPersonId }) }),
  );
}

// --- RFI (EDD info request) — readable/repliable DURING onboarding (pre-active). ---
export interface RfiMessage {
  id: string;
  author_type: "admin" | "customer" | "system";
  body: string;
  created_at: string;
}
export interface RfiThread {
  case: { id: string; status: "open" | "closed" } | null;
  messages: RfiMessage[];
}

export async function getRfiThread(): Promise<RfiThread | null> {
  const res = await authedFetch("/onboarding/rfi");
  if (!res.ok) return null;
  return (await res.json()) as RfiThread;
}

export async function replyRfi(body: string): Promise<Result<{ id: string }>> {
  return toResult<{ id: string }>(
    await authedFetch("/onboarding/rfi/reply", { method: "POST", body: JSON.stringify({ body }) }),
  );
}

/** The caller's org state (drives the onboarding + app shell gates).
 *  DISTINGUISHES "no org yet" (ok + null) from a failed read (ok: false — backend blip,
 *  401 during the post-sign-in handshake, timeout). Conflating the two once showed the
 *  company form to an approved account; callers must render errors as errors. */
export type OnboardingStateResult = { ok: true; state: OrgSnapshot | null } | { ok: false };

export async function getOnboardingState(): Promise<OnboardingStateResult> {
  // Two attempts: the request immediately after sign-in intermittently fails its read
  // (fresh-session token mint + Clerk dev-instance throttling); a short retry absorbs it.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await authedFetch("/onboarding/state");
      if (res.ok) return { ok: true, state: (await res.json()) as OrgSnapshot | null };
      console.warn("onboarding_state_read_failed", JSON.stringify({ attempt, status: res.status }));
    } catch (e) {
      console.warn("onboarding_state_read_failed", JSON.stringify({ attempt, error: e instanceof Error ? e.message : String(e) }));
    }
    if (attempt === 0) await new Promise((r) => setTimeout(r, 400));
  }
  return { ok: false };
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
  rail: string | null; // pix | ach | fedwire | sepa | swift | crypto
  asset: string | null; // BRL | USD | EUR | GBP | USDC | USDT
  network: string | null; // crypto chain, else null
  dest_hint: string | null; // masked identifier tail (last 4)
  payee_legal_name: string | null;
  payee_country: string | null;
  purpose_of_payment: string | null;
  verification_status: string | null;
  status: string;
  created_at: string;
}

export async function listBeneficiaries(): Promise<Beneficiary[]> {
  const res = await authedFetch("/app/beneficiaries");
  if (!res.ok) return [];
  const body = (await res.json().catch(() => ({}))) as { beneficiaries?: Beneficiary[] };
  return body.beneficiaries ?? [];
}

/** Rail-aware payload; the backend (rails.validateBeneficiary) is the authoritative wall. */
export interface CreateBeneficiaryInput {
  label: string;
  rail: string;
  asset?: string; // required for swift/crypto; derived for the others
  network?: string; // crypto only
  payeeLegalName: string;
  payeeCountry?: string; // asked for swift/crypto; derived for the fixed-country rails
  purposeOfPayment: string;
  sourceOfFunds?: string;
  destination: Record<string, string>; // rail-specific identifier fields
}

export async function createBeneficiary(input: CreateBeneficiaryInput): Promise<Result<{ id: string }>> {
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

// --- Document uploads (EDD/RFI). No-retention: the file streams to Didit (mock); Lince keeps
//     only a reference. Real submission is gated on Didit — see the "em preparação" note. ---
export interface DocumentRef {
  id: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  status: "received" | "forwarded" | "failed";
  createdAt: string;
}

export async function getCaseDocuments(caseId: string): Promise<DocumentRef[]> {
  const res = await authedFetch(`/app/cases/${caseId}/documents`);
  if (!res.ok) return [];
  const body = (await res.json().catch(() => ({}))) as { documents?: DocumentRef[] };
  return body.documents ?? [];
}

/** Forwards the raw bytes as octet-stream (filename/type in headers) — the backend streams them
 *  to Didit and stores only a reference. */
export async function uploadCaseDocument(
  caseId: string,
  file: { name: string; type: string; buffer: ArrayBuffer },
): Promise<Result<DocumentRef>> {
  return toResult<DocumentRef>(
    await authedFetch(`/app/cases/${caseId}/documents`, {
      method: "POST",
      headers: {
        "content-type": "application/octet-stream",
        "x-filename": encodeURIComponent(file.name),
        "x-content-type": file.type,
      },
      body: file.buffer,
    }),
  );
}

export async function postCaseReply(caseId: string, body: string): Promise<Result<{ id: string }>> {
  return toResult<{ id: string }>(
    await authedFetch(`/app/cases/${caseId}/messages`, {
      method: "POST",
      body: JSON.stringify({ body }),
    }),
  );
}

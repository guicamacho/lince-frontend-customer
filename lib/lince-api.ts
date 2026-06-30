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
}

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

async function toResult<T>(res: Response): Promise<Result<T>> {
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) return { ok: false, error: (body.error as string) ?? `HTTP ${res.status}` };
  return { ok: true, data: body as T };
}

/** The caller's org state (drives the onboarding shell gate). null if no org yet. */
export async function getOnboardingState(): Promise<OrgSnapshot | null> {
  const res = await authedFetch("/onboarding/state");
  if (!res.ok) return null;
  return (await res.json()) as OrgSnapshot | null;
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

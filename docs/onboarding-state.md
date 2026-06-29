# Onboarding & session state

How sign-in sessions and onboarding progress are persisted, and what resumes
versus what is lost on reload. Captured because it was never explicitly designed,
only emerged from the architecture.

## Summary

Macro onboarding progress is **server-authoritative and resumable** across reloads,
sessions, and devices. A returning user re-enters at the step they last committed,
never from the start. The only things **not** persisted are in-step drafts: a
partially filled company form, and the in-flight Didit (KYB) session.

## Auth session

Clerk owns the auth session (cookies). Closing the tab and returning keeps the user
signed in until Clerk's session expires. After sign-in the user is force-routed to
`/onboarding` (`signInForceRedirectUrl` in `app/layout.tsx`), which then sends them
to the correct step.

## Onboarding state machine

Progress is stored in Postgres as the org's `state`, owned by the backend
(`lince-phase1`). The customer app reads it fresh on every load
(`getOnboardingState()` in `lib/lince-api.ts`, `cache: "no-store"`), passing the
caller's Clerk token; the backend resolves the org from the user's `clerk_user_id`.
`app/onboarding/page.tsx` renders one screen per state:

| `state.state`            | Screen / step                              |
| ------------------------ | ------------------------------------------ |
| `null` (no org yet)      | Step 1: company details form               |
| `pending_lince_approval` | Step 2: start verification (KYB)           |
| `kyb_in_progress`        | Step 2: verification in progress (Didit)   |
| `vendor_pending`         | Step 3: under review                       |
| `active`                 | Done (redirects to `/app`)                 |
| `rfi_required`           | Off-ramp: more information requested        |
| `declined` / `rejected`  | Off-ramp: not approved                      |

`/app` is gated the same way: any non-`active` state redirects back to
`/onboarding` (`app/app/layout.tsx`).

## Progress indicator & Didit transitions

The progress bar (`components/onboarding/onboarding-progress.tsx`) shows **three**
linear steps: **Empresa → Verificação → Análise**. There is deliberately **no
"Concluído" step**: approval is asynchronous. The applicant is notified by email and
lands directly in `/app` the moment the org becomes `active`, so they never sit on a
completion step during the session.

State to progress-step mapping (distinct from the screen table above):

| `state.state`                         | Progress step        |
| ------------------------------------- | -------------------- |
| `null`                                | 1 · Empresa          |
| `pending_lince_approval`              | 2 · Verificação      |
| `kyb_in_progress`                     | 2 · Verificação (em andamento) |
| `rfi_required`                        | 2 · Verificação (documentos adicionais) |
| `vendor_pending`                      | 3 · Análise          |
| `declined` / `rejected`               | terminal (clay bar, "não aprovado") |

`rfi_required` loops **back to Verificação**: a Didit document re-request is not a
rejection, so the user supplies more documents and continues. Only `declined` /
`rejected` are hard stops.

### Didit webhooks (not yet wired — currently mocked)

The transitions through Verificação are driven by **Didit webhooks**, and these need
to be unambiguous when the real integration replaces the mock. Expected mapping:

| Didit signal                        | Resulting state          |
| ----------------------------------- | ------------------------ |
| verification session launched       | `kyb_in_progress`        |
| verification approved / passed       | advance to `vendor_pending` (Lince review) |
| additional documents requested      | `rfi_required` (→ shown under Verificação) |
| verification declined / failed       | `declined` / `rejected`  |

Today these moves are simulated by `advanceOnboarding` (the dev buttons). When Didit
goes live, a single webhook handler should own this mapping so the state machine has
exactly one source of truth for KYB transitions.

## What resumes

Because the state lives in Postgres keyed to the Clerk user, the user resumes at
whatever step they last committed, on any device. A state only advances when a
server action commits: `bootstrapOrg` creates the org (moving past step 1),
`advanceOnboarding` moves the KYB steps. Once an org exists, all forward progress
is durable.

## What does NOT persist (known gaps)

1. **Company details form draft.** CNPJ, razão social, and cargo live in client-side
   `react-hook-form` state. Filling it partially and leaving loses the input; it
   becomes durable only after pressing Continuar (which creates the org). Low stakes
   (three fields). No `localStorage`/`sessionStorage` draft is kept by design.
2. **Didit KYB session.** Launching sets `kyb_in_progress`, but the verification
   itself runs in Didit's own window. Closing mid-flow leaves our state at
   `kyb_in_progress` and the user lands on "Verificação em andamento", yet resuming
   the actual Didit session is **not wired** (Didit is currently mocked). For
   production, persist the Didit verification link / session id and re-open it here.

## Files

- `lince-customer/lib/lince-api.ts` — BFF client; reads/advances state server-to-server.
- `lince-customer/app/onboarding/page.tsx` — the state-to-screen renderer.
- `lince-customer/app/app/layout.tsx` — the active-org gate.
- `lince-phase1/src/modules/onboarding/` — backend state machine (source of truth).

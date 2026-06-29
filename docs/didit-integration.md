# Didit integration & Lince theming

How the customer onboarding embeds Didit, and the exact values to white-label Didit
to the Lince design system. Under Modelo A: **Didit captures + verifies (KYB + per-person
KYC + AML) and forwards to Avenia; Avenia decides admission.** Lince builds **only** the
launch wrapper and the wait/outcome states. We do NOT rebuild verification screens.

Source: https://docs.didit.me (web SDKs, sessions API, white-label). Gated on PRD-01 §12
open items (Didit BR-CNPJ registry coverage; the Didit→Avenia transfer mechanism). Mocked
in dev until confirmed.

## What Lince builds vs what Didit hosts

| Surface | Owner |
| --- | --- |
| Sign-up / sign-in (Clerk, themed) | Lince |
| **Launch wrapper** ("Iniciar verificação" → mounts Didit) | Lince |
| Company KYB, document upload, key-people declaration, questionnaire, AML, per-person ID + liveness | **Didit (hosted, themed)** |
| Awaiting-key-people roster (status reflection from webhooks) | Lince (thin) |
| Under review / outcome (approved / more-info / rejected) | Lince |
| Admission decision | **Avenia** (ops records the relay) |

No KYC PII touches a Lince screen or DB (CPF, IDs, liveness, ownership %). CNPJ (public) is
the only company field a Lince screen captures.

## Embed method

Use the **JavaScript SDK** (`@didit-protocol/sdk-web`), inline mode — best UX, stays on our
domain, real-time event callbacks. InContext iframe is the no-backend fallback; redirect is for
cross-device. All three return the decision via webhooks regardless.

```ts
import { DiditSdk } from "@didit-protocol/sdk-web";
DiditSdk.shared.onComplete = (r) => {
  // 'completed' | 'cancelled' | 'failed' — UX only; the authoritative result arrives by webhook
};
DiditSdk.shared.startVerification({ url }); // `url` from POST /v3/session/ (KYB), via our backend
```

Iframe permissions if using InContext: `allow="camera; microphone; fullscreen; autoplay; encrypted-media"`.

## Flow (real, once ungated)

1. Backend `POST /v3/session/` (KYB Business Verification) → `{ url, session_token }`; store the
   Didit session id on `didit_verifications` (references only).
2. Frontend mounts the SDK with `url`; Didit runs registry → UBO/officers → docs → questionnaire →
   AML, and emails per-person KYC links.
3. Didit **forwards verified data to Avenia** and fires **webhooks** to our backend; we map Didit
   statuses → onboarding states (`kyb_in_progress` → `vendor_pending`), idempotent on event id
   (`webhook_events`). Backend mock already exists: `lince-phase1 src/modules/providers/didit/mock.kyb.ts`.
4. Avenia decides; ops records the relay (PRD-04). Customer sees under-review → outcome.

## Theming = Didit Console → White Label → Style Editor (not code)

Configure once, then enable per workflow (Workflow → Settings → Options → **Include custom style**).
Values from `app/globals.css`:

| Style Editor field | Lince value |
| --- | --- |
| Primary / buttons | `gold-500` **#f2a93c** (hover `gold-400` #ffc25a; text on gold `ink-900` #0e1411) |
| Background | `ink-900` **#0e1411** |
| Panels / cards | `ink-700` **#1b231e** |
| Borders / dividers | `ink-500` **#2e3933** |
| Primary text | `warm-100` **#e8eae6** |
| Muted text | `warm-500` **#6b756f** |
| Error | `clay-500` **#e0573d** |
| Typography — headings | **Schibsted Grotesk** |
| Typography — body | **Manrope** |
| Border radius | **10px** (`--radius` 0.625rem) |
| Logos | square: `public/lince-mark-light.svg`; rectangular: "Lince Finance" lockup |
| Login screen | **Skip** (we launch from our authenticated wrapper) |
| Custom domain | **verify.lincefinance.xyz** (CNAME) so no `verify.didit.me` in the URL |

## Disclosure (do not skip)

Didit's white-label terms still require surfacing, in our launch wrapper: that **Lince requests** the
verification and **Didit powers** it, plus links to Didit's Verification Privacy Notice + End User Terms,
and explicit consent before capture. This is **separate** from the Avenia contracted-entity disclosure,
which lives in the **signup terms** (PRD-02 v3.1) — not a per-page badge.

## Environments, testing & seam — no Didit sandbox

⚠️ **Didit has no Sandbox environment** — the console offers **Live only** (Sandbox is "Coming soon"),
so there is **no sandbox API key**. Consequences:

- **Dev & staging stay on the mock.** Already the v1-milestone posture, now also a hard constraint. The
  mock simulates "verified + forwarded" (`advanceAction` → backend `advanceOnboarding`; backend
  `src/modules/providers/didit/mock.kyb.ts`). No Didit key needed; the whole skeleton flow runs offline.
- **Real end-to-end testing needs a Live key.** Didit's free tier covers KYC (500/mo); **KYB business
  verification is ~$2/company** (confirm what's free-tier eligible). Run a few real verifications in a
  controlled preview/staging env behind the flag — these are **real KYC on real data**. Never point
  dev's every-test loop at Live. Treat the Live key as a production secret (per-env, secret store,
  never in the repo).
- **Seam:** one interface, flipped by env. `NEXT_PUBLIC_DIDIT_MODE=mock|live` — `live` mounts
  `DiditSdk.startVerification({ url })` (url from our backend `POST /v3/session/`); `mock` keeps the
  placeholder. Add `@didit-protocol/sdk-web` only when wiring `live`.

Net: the integration **code** can be written now, but it can only be **validated** against Live (no
sandbox). So build the mock-backed seam for the skeleton; do the live wiring + a free-tier smoke test
together once a Live key exists.

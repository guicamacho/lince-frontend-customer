# Lince Finance — Customer Frontend Design Handover

**How to use this doc.** This is the single source of truth for recreating the Lince Finance customer frontend in Figma. Every value here is read from the shipped code (not aspirational): exact hex, px/rem, font names/weights, and component variants/states. Build it bottom-up: first create the color and text styles in Section 3–4, then the spacing/radius/shadow primitives in Section 5, then the component sets in Section 6 (primitives before feature components), then assemble the screens in Section 7 using those components. Sections 8–10 cover interaction, iconography, and accessibility details you wire into the component variants and prototype flows. Section 11 lists items that are in-flux (read it before you finalize the auth screens). Section 12 is the concrete Figma file setup (pages, styles, artboards). Where the live app omits something that exists upstream, it is flagged as "upstream only / design intent" — do not ship those unless asked.

---

## 1. Overview

- **Product:** Lince Finance customer frontend. B2B cross-border payments for Brazilian companies: pay the world from Latin America. Pay-in locally (BRL live; MXN/COP coming), pay-out worldwide (USD / EUR / USDC / USDT).
- **Language:** Brazilian Portuguese (`<html lang="pt-BR">`). All copy and number formatting are pt-BR (`140.750,00` — period thousands, comma decimals).
- **Brand posture:** dark-first, warm, quietly premium. One gold accent used with restraint. Sentence case everywhere. Wordmark "lince" is lowercase in brand contexts; the in-app lockup reads "Lince Finance" with "Finance" in gold.
- **Stack (drives component behavior):** Next.js App Router, Tailwind v4 (CSS-variable design tokens, no `tailwind.config` hex), shadcn components on Base UI primitives, Clerk auth (themed + localized `ptBR`).

> **NOTE — "Powered by Avenia" (provider of record).** Avenia is the regulated provider of record behind the product (KYB is run by Didit and submitted to Avenia; see onboarding copy). A "Powered by Avenia" disclosure is **PRD-required** but is **not currently rendered** in the code. Treat it as a required addition (see Section 11). Design a disclosure slot now so it can drop into the auth footer / app footer without a relayout.

---

## 2. Design language

- **Dark-first.** `:root` declares `color-scheme: dark` and puts dark values directly in `:root` — components render dark by default, no `.dark` wrapper needed. The customer app is **dark-only** today (the upstream `.theme-bone` light theme is documented in Section 3 for completeness but is not in the live app).
- **Lince Gold is the one accent.** `gold-500 #f2a93c` drives CTAs, the brand "Finance" word, active nav, progress fill, focus ring. Rule: one gold action per view. Emerald = money-in, Clay = money-out/errors — functional only, never decoration.
- **Surfaces are warm green-black, not pure black.** The ink ramp is green-tinted; shadows are tinted with ink-900 (`rgba(14,20,17,…)`), so elevation reads warm, never neutral-gray.
- **Separation by hairline over shadow.** 1px borders/rings do most of the separation work; the only signature shadow is a gold glow reserved for primary/CTA emphasis.
- **Personality:** sharp, calm operator. Warm-modern, precise. Tabular exact numbers, always with currency code.
- **Anti-patterns (do not introduce):** no purple-blue gradients, no noisy stock photography, no hand-drawn illustration, no emoji, no Unicode glyphs as icons, no spinners-as-personality, no infinite decorative loops, no spring overshoot, no Title Case UI, no exclamation marks in product copy. Radii are never sharp 0 and never huge bubbly.

---

## 3. Color tokens

All colors are CSS variables; the app never hard-codes hex in components. Build each row below as a Figma color style under the namespace shown (e.g. `gold/500`). **Two hex mappings circulate in the source inventory** — the live `globals.css` values are authoritative; a slightly different canonical mapping appeared in one feature-component doc. Where they differ, the **globals.css value is listed first and is the one to use**; the variant is noted.

### Gold — signature accent
| Token | Hex | Role |
|---|---|---|
| `gold-300` | `#ffd488` | Tints, glows, light gold |
| `gold-400` | `#ffc25a` | Hover / bright accent |
| `gold-500` | `#f2a93c` | ★ SIGNATURE — CTAs, brand "Finance", active nav, progress fill, primary, ring |
| `gold-600` | `#d98e22` | Pressed / deep; bone-theme accent |
| `gold-700` | `#a96b17` | On-bone text accent; chart-5 |

### Ink — warm green-black canvas
| Token | Hex | Role |
|---|---|---|
| `ink-900` | `#0e1411` | ★ Base canvas / body bg → `--background`, `--primary-foreground` |
| `ink-800` | `#141b17` | Raised surface → `--popover`, `--sidebar`, top-bar (at 80% + blur) |
| `ink-700` | `#1b231e` | Cards, popovers, tooltips, active-nav bg → `--card`, `--secondary`, `--muted` |
| `ink-600` | `#232c27` | Hover surface → `--accent` |
| `ink-500` | `#2e3933` | All strokes/borders, progress track → `--border`, `--input` |

### Warm — neutral text ramp (warm gray)
| Token | Hex | Role |
|---|---|---|
| `warm-100` | `#e8eae6` | ★ Primary text → `--foreground` |
| `warm-300` | `#a8b0ab` | Secondary / body copy on cards |
| `warm-400` | `#8a938d` | Captions, helper/hint text, footer links |
| `warm-500` | `#6b756f` | Muted → `--muted-foreground` |
| `warm-600` | `#525b55` | Deep muted (upstream/bone) |
| `warm-700` | `#3a423d` | Faintest neutral |

### Bone — warm paper / light surfaces (rare; dark-only app)
| Token | Hex | Role |
|---|---|---|
| `bone-50` | `#fbfaf6` | Lightest surface |
| `bone-100` | `#f4f1e9` | Base paper canvas (light theme bg) |
| `bone-200`* | `#ece7db` | Raised on bone (upstream only) |
| `bone-300`* | `#ded7c7` | Strokes/dividers on bone (upstream only) |

### Semantic / functional
| Token | Hex | Role |
|---|---|---|
| `emerald-500` | `#1fa877` | Positive / money-in / gains; chart-2 |
| `clay-500` | `#e0573d` | Negative / errors / terminal/declined → `--destructive`; chart-4 |
| `sky-500` | `#4fa0b8` | Info / neutral system state; chart-3 |
| `emerald-400`* | `#3fc793` | Positive (upstream only) |
| `clay-400`* | `#f26f54` | Negative (upstream only) |

\* `bone-200/300`, `emerald-400`, `clay-400`, and all `*-tint` rgba washes exist upstream but are **NOT** in the customer app. The upstream `--gold-tint: rgba(242,169,60,0.12)` (wash behind gold) is also upstream-only.

> **Hex-variant note (resolve before pixel-locking brand color):** one feature-component inventory listed an alternate canonical mapping — `ink-900 #0B0F14`, `ink-800 #11161D`, `ink-700 #161C24`, `ink-500 #2A323D`, `warm-100 #F5F1EA`, `gold-500 #E0B050`, `clay-500 #C5563D`. These are **not** the `globals.css` values. Use the `globals.css` values above; flag this to engineering only if a contested screenshot disagrees.

### shadcn semantic mapping (live `:root`, dark-first)
Wire these as **aliases** to the raw color styles above so a token edit propagates.

| Semantic | Hex | Maps to |
|---|---|---|
| `--background` | `#0e1411` | ink-900 |
| `--foreground` | `#e8eae6` | warm-100 |
| `--card` / `--card-foreground` | `#1b231e` / `#e8eae6` | ink-700 / warm-100 |
| `--popover` / `--popover-foreground` | `#141b17` / `#e8eae6` | ink-800 / warm-100 |
| `--primary` / `--primary-foreground` | `#f2a93c` / `#0e1411` | gold-500 / ink-900 (ink on gold) |
| `--secondary` / `--secondary-foreground` | `#1b231e` / `#e8eae6` | ink-700 / warm-100 |
| `--muted` / `--muted-foreground` | `#1b231e` / `#6b756f` | ink-700 / warm-500 |
| `--accent` / `--accent-foreground` | `#232c27` / `#e8eae6` | ink-600 / warm-100 |
| `--destructive` | `#e0573d` | clay-500 (no explicit `--destructive-foreground`; shadcn default) |
| `--border` / `--input` | `#2e3933` | ink-500 |
| `--ring` | `#f2a93c` | gold-500 |
| `--chart-1…5` | gold / emerald / sky / clay / gold-700 | `#f2a93c` `#1fa877` `#4fa0b8` `#e0573d` `#a96b17` |
| `--sidebar` | `#141b17` | ink-800 |
| `--sidebar-foreground` / `-accent` / `-accent-foreground` | `#e8eae6` / `#1b231e` / `#e8eae6` | warm-100 / ink-700 / warm-100 |
| `--sidebar-primary` / `-primary-foreground` | `#f2a93c` / `#0e1411` | gold-500 / ink-900 |
| `--sidebar-border` / `-ring` | `#2e3933` / `#f2a93c` | ink-500 / gold-500 |

### Clerk theming variables (from `app/layout.tsx`)
| Clerk variable | Value | Maps to |
|---|---|---|
| `colorPrimary` | `#f2a93c` | gold-500 |
| `colorBackground` | `#0e1411` | ink-900 |
| `colorNeutral` | `#e8eae6` | warm-100 |
| `fontFamily` | `var(--font-manrope), system-ui, sans-serif` | Manrope |
| `borderRadius` | `0.625rem` (10px) | base `--radius` |

Clerk is localized `ptBR`; routes `signInUrl=/sign-in`, `signUpUrl=/sign-up`; all redirects (force + fallback, sign-in + sign-up) point to `/onboarding`.

### Upstream-only `.theme-bone` light theme (NOT in app — reference only)
`--bg` bone-100 `#f4f1e9`, `--surface` bone-50 `#fbfaf6`, `--surface-2` `#ffffff`, `--surface-hi` bone-200 `#ece7db`, `--border` bone-300 `#ded7c7`, `--border-strong` `#cfc6b2`, `--text` ink-900, `--text-muted` warm-600, `--text-faint` warm-400, `--accent` gold-600, `--accent-hover` gold-500, `--on-accent` ink-900, `--positive` emerald-500, `--negative` clay-500.

---

## 4. Typography

Loaded via `next/font/google` (`subsets: ["latin"]`), each exposing a CSS variable, bound into Tailwind `@theme` tokens.

| Family | Role | `@theme` token | Weights loaded |
|---|---|---|---|
| **Schibsted Grotesk** | Display / headings / financial figures | `--font-display` (also `--font-heading`) | 400, 500, 600, 700, 800 |
| **Manrope** | Sans / UI / body (default) | `--font-sans` | 400, 500, 600, 700, 800 |
| **Space Mono** | Mono / data / eyebrows / tabular figures | `--font-mono` | 400, 700 |

Fallback stacks: display → `"Segoe UI", system-ui, sans-serif`; sans → `system-ui, -apple-system, sans-serif`; mono → `ui-monospace, "SFMono-Regular", monospace`. Body baseline: `bg-ink-900 font-sans text-warm-100 antialiased`.

### Type scale (upstream design intent; app inherits the conventions)
| Token | Size | Notes |
|---|---|---|
| `--display` | `clamp(2.75rem, 1.6rem + 4.6vw, 4.75rem)` | 44→76px hero |
| `--h1` | `clamp(2.25rem, 1.5rem + 2.8vw, 3.25rem)` | 36→52px |
| `--h2` | `clamp(1.75rem, 1.3rem + 1.6vw, 2.5rem)` | 28→40px |
| `--h3` | `1.5rem` | 24px |
| `--h4` | `1.25rem` | 20px |
| `--body-lg` | `1.125rem` | 18px |
| `--body` | `1rem` | 16px |
| `--small` | `0.875rem` | 14px |
| `--xsmall` / `--eyebrow` | `0.75rem` | 12px |

### Semantic text styles (build these as Figma text styles)
| Style | Family | Weight | Size | Line-height | Tracking | Extra |
|---|---|---|---|---|---|---|
| `lince-display` | display | 700 | `--display` | 0.98 | -0.025em | text-wrap: balance |
| `lince-h1` | display | 700 | `--h1` | 1.04 | -0.02em | balance |
| `lince-h2` | display | 700 | `--h2` | 1.08 | -0.018em | balance |
| `lince-h3` | display | 600 | `--h3` (24px) | 1.18 | -0.012em | — |
| `lince-h4` | sans | 700 | `--h4` (20px) | 1.3 | -0.006em | — |
| `lince-body-lg` | sans | 400 | 18px | 1.6 | — | — |
| `lince-body` | sans | 400 | 16px | 1.6 | — | — |
| `lince-small` | sans | 500 | 14px | 1.5 | — | — |
| `lince-eyebrow` | mono | 700 | 12px | 1 | 0.18em | uppercase |
| `lince-figure` | display | 700 | — | — | -0.02em | tabular-nums |
| `lince-mono` | mono | — | — | — | — | tabular-nums |

**In-app usage actually observed:** card/section titles use `font-display text-2xl` (Schibsted 24px). Brand lockup: app top-bar `text-lg font-bold` (18px); auth screen `text-4xl font-bold` (36px). Eyebrow on auth hero: `text-xs font-semibold uppercase tracking-[0.25em]` (note: 0.25em here, vs 0.18em in the `lince-eyebrow` utility). Step labels in progress bar: `text-[11px]`. Money/figures should use tabular numerics.

---

## 5. Spacing, radius, shadows, elevation

### Spacing
Tailwind v4 base: 1 unit = 0.25rem = **4px**. `--spacing(n)` = n × 4px. Upstream named ramp (design intent, not separate tokens in app): `--s-1` 4, `--s-2` 8, `--s-3` 12, `--s-4` 16, `--s-5` 24, `--s-6` 32, `--s-7` 48, `--s-8` 64, `--s-9` 96 (px). Big vertical rhythm between sections uses `--s-8/--s-9`.

### Radius — base `--radius: 0.625rem` (10px)
Derived via `@theme inline`:
| Token | Formula | rem | px@16 |
|---|---|---|---|
| `radius-sm` | base × 0.6 | 0.375 | 6 |
| `radius-md` | base × 0.8 | 0.5 | 8 |
| `radius-lg` | base | 0.625 | 10 |
| `radius-xl` | base × 1.4 | 0.875 | 14 |
| `radius-2xl` | base × 1.8 | 1.125 | 18 |
| `radius-3xl` | base × 2.2 | 1.375 | 22 |
| `radius-4xl` | base × 2.6 | 1.625 | 26 |

Practical mapping: buttons/inputs `rounded-lg` (~8px in component usage), cards `rounded-xl` (~12px), auth hero frame `rounded-3xl` (~22px), flags `rounded-[3px]`, pills `999px`. Upstream fixed-px intent: `--r-xs 6`, `--r-sm 10`, `--r-md 14`, `--r-lg 20`, `--r-xl 28`, `--r-pill 999`.

### Shadows / elevation
| Token | Value | Use |
|---|---|---|
| `shadow-glow-gold` | `0 0 0 1px rgba(242,169,60,0.3), 0 12px 40px -8px rgba(242,169,60,0.35)` | gold 1px ring + soft glow on primary/CTA emphasis |
| `shadow-sm`* | `0 1px 2px rgba(14,20,17,0.16)` | upstream intent |
| `shadow-md`* | `0 8px 24px -8px rgba(14,20,17,0.30)` | upstream intent |
| `shadow-lg`* | `0 24px 60px -16px rgba(14,20,17,0.45)` | upstream intent |

\* The ramp is upstream design intent, **not in the customer app** (only `shadow-glow-gold` ships). In-app `shadow-xl` appears on popovers/tooltips (Tailwind default). All elevation shadows are tinted ink-900 → warm, never neutral black.

### Motion tokens (upstream intent)
Easing `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)` (gentle decel), `--ease: cubic-bezier(0.22, 0.61, 0.36, 1)`. Durations `--dur-fast 140ms`, `--dur 240ms`, `--dur-slow 420ms`. In live code only two motions exist: a 500ms progress-width transition and a 150ms tooltip fade (see Section 8).

---

## 6. Component library

Build each as a Figma component set with the variant axes and states below. Wire fills/strokes to the **token color styles** (Section 3), not raw hex, so dark+light share one component. Shared token shorthand: `--primary`=gold, `--primary-foreground`=ink-on-gold, `--border`=ink-500, `--input`=ink-500, `--ring`=gold, `--destructive`=clay.

### 6.1 PRIMITIVES

#### Button (`components/ui/button.tsx` — Base UI + CVA). Axes: **Variant (6) × Size (8)** + interaction States.
**Base (every button):** `inline-flex items-center justify-center shrink-0 whitespace-nowrap`, `rounded-lg` (~8px), 1px transparent border, `bg-clip-padding`, `text-sm`(14)/`font-medium`(500), `transition-all`, `outline-none`. SVG icons default `size-4` (16), `pointer-events-none shrink-0`. Active (pressed): whole button `translate-y-px` (1px down), except on `aria-haspopup` triggers.

Variants (fill / text / hover):
| Variant | Default fill | Text | Hover |
|---|---|---|---|
| `default` | `bg-primary` (gold) | ink-on-gold | `bg-primary/80` |
| `outline` | `bg-background`, `border-border` | foreground | `bg-muted`; dark: `border-input`,`bg-input/30`→hover `bg-input/50`; `aria-expanded`→`bg-muted` |
| `secondary` | `bg-secondary` (ink-700) | warm-100 | secondary +5% foreground (color-mix) |
| `ghost` | transparent | inherit | `bg-muted`; dark hover `bg-muted/50` |
| `destructive` | `bg-destructive/10` | clay (red text) | `bg-destructive/20`; dark base `/20`→hover `/30`; focus ring `destructive/20` |
| `link` | transparent | gold | underline offset-4 |

Sizes (height / pad-x / radius / text / icon):
| Size | H | px | Radius | Text | Icon |
|---|---|---|---|---|---|
| `default` | 32 | 10 | lg(8) | 14 | 16 |
| `xs` | 24 | 8 | min(md,10) | 12 | 12 |
| `sm` | 28 | 10 | min(md,12) | ~12.8 | 14 |
| `lg` | 36 | 10 | lg(8) | 14 | 16 |
| `icon` | 32×32 | — | lg | — | 16 |
| `icon-xs` | 24×24 | — | min(md,10) | — | 12 |
| `icon-sm` | 28×28 | — | min(md,12) | — | 16 |
| `icon-lg` | 36×36 | — | lg | — | 16 |
Gaps: default/lg gap 6px (icon-side pad `pr-2`/`pl-2`); xs/sm gap 4px (icon-side 6px). Defaults: `variant=default`, `size=default`.

**States (apply to all combos):** Default · Hover (per-variant fill) · **Focus-visible** `border-ring` + `ring-3` (3px) at `ring-ring/50` (destructive: ring `destructive/20`, border `destructive/40`) · **Active** `translate-y-px` · **Disabled** `pointer-events-none opacity-50` · **aria-invalid** `border-destructive` + `ring-3 ring-destructive/20` (dark `border-destructive/50`, `ring-destructive/40`) · **aria-expanded** outline/secondary/ghost hold the muted fill active.

#### Card (`components/ui/card.tsx` — plain divs, no CVA). Axis: **Size = default | sm** (via `data-size`).
- Root: `flex flex-col`, internal gap `--card-spacing` (default 16px / sm 12px), `rounded-xl` (~12px), `overflow-hidden`, `bg-card` (ink-700), `text-card-foreground` `text-sm`(14), **outline = `ring-1 ring-foreground/10`** (1px inset ring at 10% foreground, NOT a border), vertical padding `py-(--card-spacing)`. Leading `<img>` removes top pad + `rounded-t-xl`; trailing `<img>` `rounded-b-xl`. If a `CardFooter` exists, bottom pad collapses to 0.
- Slots: **CardHeader** (grid, gap 4px, `px-(--card-spacing)`, `rounded-t-xl`; 2-col `[1fr_auto]` when an action is present; `[.border-b]:pb` when bordered) · **CardTitle** (`font-heading`, `text-base`(16)/`leading-snug`/`font-medium`; sm card → `text-sm`(14)) · **CardDescription** (`text-sm`, `text-muted-foreground`) · **CardAction** (top-right: `col-start-2 row-span-2 row-start-1`, `self-start justify-self-end`) · **CardContent** (`px-(--card-spacing)` only) · **CardFooter** (`flex items-center`, `rounded-b-xl`, `border-t`, `bg-muted/50`, `p-(--card-spacing)`).
- States: none (static container). Only variant = spacing 16 vs 12 (which also shrinks title 16→14).

#### Input (`components/ui/input.tsx` — Base UI, single style). States only.
- Default: `h-8`(32), `w-full min-w-0`, `rounded-lg`(~8), 1px `border-input`(ink-500), `bg-transparent` (dark `bg-input/30`), pad `px-2.5 py-1` (10/4), text `text-base`(16) mobile → `md:text-sm`(14) ≥768px (anti-zoom), placeholder `muted-foreground` (#6b756f), `transition-colors outline-none`. File input: inline button `h-6`(24), no border, transparent, `text-sm font-medium text-foreground`.
- States: **Focus-visible** `border-ring` + `ring-3 ring-ring/50` · **Disabled** `pointer-events-none cursor-not-allowed bg-input/50 opacity-50` (dark `bg-input/80`) · **aria-invalid** `border-destructive` + `ring-3 ring-destructive/20` (dark `/50`, `/40`).

#### Label (`components/ui/label.tsx` — plain label). 
- Default: `flex items-center gap-2`(8px), `text-sm`(14)/`font-medium`/`leading-none`, `select-none`.
- States: **Group disabled** (`group-data-[disabled]`) and **Peer disabled** (`peer-disabled`) → both 50% opacity (group adds `pointer-events-none`, peer adds `cursor-not-allowed`).

### 6.2 FEATURE COMPONENTS

#### TopBar (`components/top-bar.tsx`) — used in app shell AND onboarding
Sticky header, brand left / Clerk `UserButton` right. `flex items-center justify-between border-b border-ink-500 bg-ink-900/80 px-5 py-3 backdrop-blur` (20×12 pad, 80% ink-900 + blur, 1px ink-500 bottom border). Brand link `/`: logo `lince-mark-light.svg` 24×24 + `font-display text-lg font-bold` "Lince " (warm-100) + "Finance" (gold-500), `gap-2`. Right: `UserButton` (see Section 8.4). Static shell; only the avatar/menu has states. Props: none.

#### AuthShell (`components/auth/auth-shell.tsx`) — split-screen sign-in/up
Root `grid min-h-screen lg:grid-cols-2` (single column below `lg`=1024px; right panel hidden below `lg`). Props: `children` (required), `footer?` (optional). No interaction states; only the responsive breakpoint variation. Full layout in Section 7.

#### CompanyDetailsForm (`components/onboarding/company-details-form.tsx`)
Step-1 form in a fixed card. Card `min-h-[30rem]`(480) `w-full max-w-md`(448) `justify-center border-ink-500 bg-ink-700`. CardTitle `font-display text-2xl` "Dados da empresa"; CardDescription `text-warm-300`. Form `space-y-4 noValidate`; each field group `space-y-2`(8px).
Fields: (1) **CNPJ** `inputMode=numeric`, placeholder `00.000.000/0000-00`, blur→14-digit lookup; states below it in priority: error `text-sm text-clay-500` / loading "Buscando dados na Receita…" `text-sm text-warm-400` / note `text-sm text-clay-500`. (2) **Razão social** `readOnly cursor-default`, placeholder "Preenchido pelo CNPJ", auto-filled; helper `text-xs text-warm-400` or error `text-sm text-clay-500`. (3) **Seu cargo** label row `flex items-center gap-1.5` + help tooltip (Section 8.2) + native `<select>` styled like Input (`h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base md:text-sm text-warm-100`, first option "Selecione…" disabled, options from `OPERATOR_ROLES` each `bg-ink-700 text-warm-100`); error `text-sm text-clay-500`. (4) **Consent** — required checkbox gate (`companySchema.consentAccepted: z.literal(true)`): `<label flex items-start gap-2.5 text-sm text-warm-300>` with `<input type=checkbox size-4 accent-gold-500 cursor-pointer>` + "Li e aceito os **Termos da Avenia**, os **Termos da Lince** e o **Consentimento LGPD**." (the three doc names `text-gold-500`; **pending-counsel** → become real links to the ToS/LGPD pages when they land, *needs-figma-reconcile*). Error `text-sm text-clay-500` "É necessário aceitar os termos para continuar." Form-level server error `text-sm text-clay-500`. Submit `Button w-full` default: "Continuar" → "Enviando…" (disabled) while submitting. States: CNPJ idle/loading/error+success · per-field validation · consent unchecked/checked · submit idle/submitting · server error. Props: none.

#### AdvanceButton (`components/onboarding/advance-button.tsx`)
Centered step-advance. Wrapper `flex flex-col items-center gap-2`. `Button` default (gold), `min-w-48`(192), disabled while pending. Optional error line `text-sm text-clay-500`. Props: `step ("launch-verification" | "mock-verify")`, `label`, `pendingLabel`. States: idle (`label`) / pending (`pendingLabel`, disabled) / error. On success: `router.refresh()`.

#### OnboardingProgress (`components/onboarding/onboarding-progress.tsx`) — present on every onboarding screen
`w-full max-w-md`. Track `role=progressbar`, `h-1.5`(6px) `w-full overflow-hidden rounded-full bg-ink-500`. Fill `h-full rounded-full`, width inline `style`, `transition-[width] duration-500 motion-reduce:transition-none`; color `bg-gold-500` normally / `bg-clay-500` terminal. Step row `<ol> mt-2 flex justify-between text-[11px] leading-none`: **Empresa · Verificação · Análise**. Caption (conditional) `mt-2 flex items-center gap-1.5 text-xs`. Full state table in Section 7/8. Props: `state?: string | null`.

#### Sidebar (`components/app/sidebar.tsx`) — left app nav
`nav flex flex-col gap-1 w-56`(224) `shrink-0 border-r border-ink-500 bg-ink-800 p-3`. 7 links, each `flex items-center gap-3 rounded-lg px-3 py-2 text-sm`, lucide icon `size-4`(16):
| # | Label | href | Icon |
|---|---|---|---|
| 1 | Início | `/app` | Home |
| 2 | Saldos | `/app/balances` | Wallet |
| 3 | Pagar / Enviar | `/app/pay` | Send |
| 4 | Transações | `/app/transactions` | ArrowLeftRight |
| 5 | Beneficiários | `/app/beneficiaries` | Users2 |
| 6 | Equipe | `/app/team` | UserCog |
| 7 | Configurações | `/app/settings` | Settings |
States: **Active** `bg-ink-700 text-gold-500` (+ `aria-current="page"`) · **Inactive** `text-warm-300` · **Inactive hover** `hover:bg-ink-700 hover:text-warm-100` · **Focus-visible** `ring-3 ring-ring/50`. Each item `min-h-11`(44) for touch targets. Active rule: `/app` exact match; others `pathname.startsWith(href)`. Props: none.

#### PoweredByAvenia (`components/powered-by-avenia.tsx`) — *new; needs-figma-reconcile*
Single line `text-xs text-warm-400`, sentence-case: "Serviços de pagamento fornecidos pela Avenia." Presentational, optional `className`. Rendered in the auth footer (sign-in + sign-up) and the app footer. **pending-counsel-#6/#17** — wording is a neutral placeholder until counsel finalizes it.

#### AppFooter (`components/app/app-footer.tsx`) — *new; needs-figma-reconcile*
App-shell footer: `border-t border-ink-500 px-8 py-4`, stacked `flex flex-col gap-1` → `<PoweredByAvenia>` + "not a bank" line `text-xs text-warm-400` "A Lince é uma plataforma de tecnologia, não um banco." Wired into `app/app/layout.tsx` **active shell only** (the "Conta em análise" hold branch stays bare). Props: none.

#### SafeguardingPanel (`components/app/safeguarding-panel.tsx`) — *new; needs-figma-reconcile*
`section` with `aria-label`, `flex items-start gap-3 rounded-xl bg-ink-800 p-4 ring-1 ring-foreground/10`. Lucide `ShieldCheck` `size-4 text-warm-400` + copy `text-sm leading-relaxed text-warm-300`. Placed on the app home. No money numbers. **pending-counsel-#16** — provisional BRLA-safeguarding wording ("saldo em stablecoin… não é depósito bancário… sem garantia do FGC").

#### HomeTiles (`components/app/home-tiles.tsx`) — *new; needs-figma-reconcile*
`<ul>` tile grid `grid gap-4 sm:grid-cols-2 lg:grid-cols-3` driven by one `TILES` array mirroring the sidebar sections. Each tile = `Card` `h-full gap-3 p-4`: top row = icon chip `size-9 rounded-lg bg-ink-800` (gold-500 icon if available, warm-500 if not) + status badge (`text-emerald-500` "Disponível" | `text-warm-500` "Em breve"); body = `font-heading text-base font-medium` label + `text-sm text-warm-400` desc. **Available** tiles wrap in `<Link>` (`cursor-pointer`, `hover:ring-gold-500/40`, `focus-visible:ring-3 ring-ring/50`); **Em breve** tiles are non-interactive `aria-disabled` Cards (reserved space, no layout shift, no dead link). Today: Beneficiários=Disponível → `/app/beneficiaries`; Saldos/Pagar-Enviar/Transações/Equipe=Em breve. Flip `available`+`href` as features land.

---

## 7. Screens & flows

Dark-first; root `bg-ink-900`, text `warm-100`, font Manrope; titles `font-display text-2xl`. Cards `rounded-xl`, buttons/inputs `rounded-lg`.

### Root redirect — `/` (no UI)
Server gate, renders nothing. Signed-in → `/onboarding`; signed-out → `/sign-in`. *Omit from Figma.*

### Auth split-screen (shared `AuthShell`)
Frames: **`Auth / Sign In`**, **`Auth / Sign Up`**.
- **Left column** (always visible): `flex flex-col justify-center`, pad `px-6 py-12` → `sm:px-12` → `lg:px-16` (24/48/64 horiz, 48 vert). Inner `mx-auto w-full max-w-sm`(384), centered.
  - Brand lockup (link `/`): `mb-10 flex items-center justify-center gap-4`. Logo `lince-mark-light.svg` 64×64 `priority`. Wordmark `font-display text-4xl font-bold` "Lince " (warm-100) + "Finance" (gold-500).
  - Form slot = Clerk `<SignIn/>` / `<SignUp/>` (themed by Section 3 Clerk vars).
  - Footer slot (sign-up only): `mt-8 text-sm text-warm-400` "Já tem uma conta? **Entrar**" — "Entrar" `Link` to `/sign-in`, `font-medium text-gold-500 hover:text-gold-400`. (Sign-in has no footer.)
- **Right column** (`hidden lg:block`, hero video panel):
  - Inset video card: `absolute inset-4`(16px inset all sides) `overflow-hidden rounded-3xl ring-1 ring-ink-500`.
  - Video `/hero-globe.webm` → `/hero-globe.mp4`, `absolute inset-0 size-full object-cover`, autoplay/muted/loop/playsInline, `preload=metadata`, poster `/hero-globe-poster.jpg`.
  - Scrim: `absolute inset-0 bg-gradient-to-b from-ink-900/85 via-ink-900/15 to-transparent` (dark top → transparent bottom).
  - Copy block `absolute inset-x-0 top-0 p-10`(40): eyebrow `mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-gold-500` "Pagamentos para a América Latina"; headline `font-display text-4xl font-bold leading-[1.05] text-warm-100 xl:text-5xl` "Pague o mundo a partir do **Brasil.**" ("Brasil." in gold-500).
  - **Flag row** `<ul> mt-6 flex flex-wrap items-center gap-2.5`(10). 7 flags in order **br, mx, co, ar, pe, cl, uy** (Brasil, México, Colômbia, Argentina, Peru, Chile, Uruguai). Each `/flags/{code}.svg`: `h-6 w-auto`(24 tall) `rounded-[3px] shadow-sm ring-1 ring-white/15`, `loading=lazy`.
- States: presentational; only responsive (<lg = left only; ≥lg = split).

### Onboarding state machine — `/onboarding`
Gates: no `userId` → `/`; `state==="active"` → `/app`. Layout (every state): outer `flex min-h-screen flex-col` → `<TopBar/>` → `<main mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-8 px-6 py-12>` (centered, 448 max, 32px gap). First child = `<OnboardingProgress>`; second = the step card. Shared card shell (`Screen` helper, and the company form manually): `min-h-[30rem]`(480) `w-full max-w-md`(448) `justify-center border-ink-500 bg-ink-700` + base `rounded-xl overflow-hidden py-(16) ring-1 ring-foreground/10 text-sm`. Static states use `CardContent space-y-4 text-center`, title `font-display text-2xl`.

**State → screen / progress map:**
| state | Step | Fill % | Fill color | Frame | Title / body | CTA |
|---|---|---|---|---|---|---|
| `null` / no org | 1 | 33% | gold | `Onboarding / 01 Company Form` | CompanyDetailsForm (header left-aligned) | "Continuar" |
| `pending_lince_approval` | 2 | 67% | gold | `Onboarding / 02 Start Verification` | "Vamos verificar sua empresa" / KYB by Didit → Avenia | AdvanceButton `launch-verification` "Iniciar verificação"/"Abrindo…" |
| `kyb_in_progress` | 2 | 67% | gold | `Onboarding / 03 Verification In Progress` (caption "Verificação em andamento") | "Verificação em andamento" / conclude in Didit window | AdvanceButton `mock-verify` "Simular conclusão (dev)"/"Concluindo…" |
| `vendor_pending` | 3 | 100% | gold | `Onboarding / 04 Under Review` | "Em análise" / received + sent for verification + `text-sm text-warm-500` "Você pode sair com segurança e voltar depois." | none |
| `rfi_required` | 2 | 67% | gold | `Onboarding / 05 RFI Required` (caption "Documentos adicionais necessários") | "Precisamos de mais informações" / "Verifique seu e-mail para os detalhes. Quando estiver pronto, reinicie a verificação." | AdvanceButton `launch-verification` "Reiniciar verificação"/"Abrindo…" (re-enters Didit; loops to step 2, not terminal) |
| `declined` / `rejected` | terminal | 100% | **clay** | `Onboarding / 06 Declined` (caption "Cadastro não aprovado" clay + AlertTriangle) | "Cadastro não aprovado" / não aprovado neste momento | none |
| `active` | — | — | — | (redirects to `/app`) | — | — |
| unknown string | 1 (clamped) | 33% | gold | — | — | — |

Body copy color `text-warm-300`. `pct = round(step/3*100)` → 33/67/100; terminal forces 100%. No 4th "Concluído" step (approval is async, user emailed). Progress step-label colors: current `font-semibold text-warm-100`; completed (n<step, non-terminal) `text-warm-300`; upcoming / all-while-terminal `text-warm-400`.

### Post-active app shell — `app/app/layout.tsx`
Gate: no `userId` → `/`; `state !== "active"` → `/onboarding` (single hard gate). Frame **`App / Shell (Top-bar + Sidebar + Main)`**: outer `flex min-h-screen flex-col` → `<TopBar/>` → row `flex flex-1` [ `<Sidebar/>` + `<main className="flex-1 p-8">` (32px pad) ] → `<AppFooter/>` (active shell only; the "Conta em análise" hold branch stays bare).
- **`App / Home`** (`/app`, *needs-figma-reconcile* — no dashboard visual spec): `mx-auto max-w-4xl space-y-8` → header `h1 font-display text-2xl` "Bem-vindo à Lince Finance" + `p text-warm-300` "Comece por aqui. Adicione um beneficiário para começar."; then `<HomeTiles/>` (see §6.2) and `<SafeguardingPanel/>`. No money numbers.
- **`App / Section (Placeholder)`** (`/app/[section]`, one variant per section): `mx-auto max-w-3xl space-y-6` → `h1 font-display text-2xl` = title from map; `Card items-center gap-3 p-10 text-center` with Lucide `Clock` chip `size-10 rounded-full bg-ink-800` + `p text-warm-300` "Em breve" + `p text-sm text-warm-500` "Esta seção estará disponível em breve." Title map: balances→"Saldos", pay→"Pagar / Enviar", transactions→"Transações", beneficiaries→"Beneficiários", team→"Equipe", settings→"Configurações"; unknown→"Página". (Beneficiários has its own real route, so it never hits this placeholder.)

### Flow summary
`/` → `/sign-in` (out) or `/onboarding` (in). Clerk force-redirects → `/onboarding`. Onboarding: `null` → company form → `pending_lince_approval` → (Iniciar) → `kyb_in_progress` → (verify) → `vendor_pending` → async approval → `active` → `/app`. `rfi_required` loops to step-2 messaging; `declined`/`rejected` terminal clay. `/app/*` only when `active`.

---

## 8. Interaction patterns

### 8.1 Onboarding progress states
Fill animates **width only**, 500ms, `motion-reduce:transition-none` (disabled under reduced-motion → fill at final width, no transition). No pulse/shimmer anywhere (deliberate). Color gold normally, clay terminal. Caption strings: `kyb_in_progress`→"Verificação em andamento" (warm-400); `rfi_required`→"Documentos adicionais necessários" (warm-400); `declined`/`rejected`→"Cadastro não aprovado" (clay-500 + `AlertTriangle size-3.5`/14px). Build progress component variants by step (1/2/3) × color (gold/clay) × caption (none/warm/clay).

### 8.2 Help tooltip (CSS-only, "Seu cargo")
Wrapper `span.group.relative.inline-flex`. Trigger `button` `inline-flex cursor-help text-warm-400 hover:text-warm-200 focus-visible:text-warm-200 focus-visible:outline-none`, `aria-label="Por que pedimos seu cargo?"`, `CircleHelp size-4`(16). Bubble `role=tooltip`, `absolute bottom-full left-0 mb-2 z-10 -translate-x-2 w-56`(224), `rounded-lg border border-ink-500 bg-ink-700 px-3 py-2 text-xs leading-snug text-warm-200 shadow-xl`, `pointer-events-none`. Reveal: `opacity-0` → `group-hover:opacity-100 group-focus-within:opacity-100`, `transition-opacity duration-150` (works on hover AND keyboard focus). Copy: "Você precisa ser um representante legal da empresa para se cadastrar." Figma: ink-700 fill, 1px ink-500 border, 10px radius, shadow-xl, warm-200 text-xs, 224px wide, anchored top-left above a 16px icon; default opacity 0, 150ms fade.

### 8.3 CNPJ blur → autofill
On blur, strip non-digits; fire BrasilAPI/Receita lookup only at exactly **14 digits**. Loading caption `text-sm text-warm-400` "Buscando dados na Receita…". Success fills + validates the read-only "Razão social". Error/note `text-sm text-clay-500` (e.g. "Situação cadastral não ativa na Receita."). Figma: 3 CNPJ-field variants (default / loading / error-note) and 2 Razão social variants (empty-readonly warm-400 hint / filled-readonly).

### 8.4 Clerk avatar + menu theming (`UserButton`)
`appearance.elements`: `userButtonAvatarBox` = `size-9`(36×36) `isolate bg-gold-500 ring-1 ring-ink-500`; `avatarImage` = `mix-blend-luminosity` (avatar glyph blended luminosity-only over gold → reads solid brand gold; in Figma, place avatar layer in **Luminosity** blend over a `#f2a93c` fill). `userButtonPopoverCard` = `border border-ink-500 bg-ink-700 shadow-xl` (inherits 10px radius). `userButtonPopoverFooter` = `hidden` (no "Secured by Clerk" — do NOT mock it). Net: 36px gold circle → dark ink-700 popover, 1px ink-500 border, large shadow, 10px corners, Manrope text, no footer.

### 8.5 Flag row
Self-hosted SVGs in `/public/flags` (no CDN). Each `h-6 w-auto rounded-[3px] shadow-sm ring-1 ring-white/15`, `loading=lazy`, alt/title = pt-BR country name. Order fixed: br, mx, co, ar, pe, cl, uy. Corridor scope (positioning): BRL live, MXN/COP "soon"; pay-out USD/EUR/USDC/USDT. Model live-vs-soon if a status row is added.

### 8.6 Focus & motion
Inputs/selects: `focus-visible:border-ring` + `focus-visible:ring-3 focus-visible:ring-ring/50` (3px ring at 50%). Invalid: `aria-invalid:border-destructive` + `aria-invalid:ring-3 aria-invalid:ring-destructive/20`. Help button uses `focus-visible:outline-none` and signals focus by color shift to warm-200. Buttons press `translate-y-px`. Only two documented motions: 500ms progress width, 150ms tooltip fade.

---

## 9. Iconography & assets

- **System icons:** lucide-react, stroke weight 2, `currentColor`, 4px-grid sizes (16/20/24), rounded caps/joins. Monochrome, inherit text color; **gold only for active/selected** nav. In-app sizes seen: nav `size-4`(16), help `size-4`(16), terminal caption `AlertTriangle size-3.5`(14). Icons in use: Home, Wallet, Send, ArrowLeftRight, Users2, UserCog, Settings (sidebar); CircleHelp (role help); AlertTriangle (terminal/RFI captions).
- **Currency/coin marks (DS intent, not on current screens):** USDC/USDT official coin logos; fiat as circular country-flag tokens.
- **Brand marks:** `assets/lince-mark-light.svg` (for dark bg — the only one used in-app) and `assets/lince-mark-ink.svg` (for light bg). Logo is reserved for nav/favicon/loading/footer, not a UI icon. In-app: top-bar 24×24, auth 64×64.
- **LatAm flag SVGs:** `/public/flags/{br,mx,co,ar,pe,cl,uy}.svg`, self-hosted, rendered 24px tall, 3px corners, 15%-white hairline ring.
- **Hero media:** `/public/hero-globe.webm` + `/public/hero-globe.mp4` + poster `/public/hero-globe-poster.jpg`. In Figma, use the poster frame as a static fill behind the scrim + copy.
- **No emoji, no Unicode glyphs as icons** (currency symbols inside coin tokens excepted).

---

## 10. Accessibility notes

- **Contrast pairs to verify in Figma:** primary text warm-100 `#e8eae6` on ink-900 `#0e1411` (high). Body warm-300 `#a8b0ab` on ink-700 `#1b231e`. Captions warm-400 `#8a938d` — check against ink-700/ink-900; treat as the floor (helper/hint text), do not go fainter for essential copy. Gold-500 `#f2a93c` text only on dark; ink-on-gold (`#0e1411` on `#f2a93c`) for primary buttons. Clay-500 `#e0573d` error text on dark.
- **Focus rings:** 3px ring everywhere (`ring-3`); accent-tinted at 50% (`ring-ring/50`) for normal, destructive-tinted at 20% (40% dark) for invalid. Always pair with a border color change. Never remove focus indication except the help button, which substitutes a warm-200 color shift.
- **ARIA:** progress bar `role=progressbar` with `aria-valuemin=0 / -max=100 / -now={pct}` and `aria-valuetext` = caption else "Etapa {step} de {TOTAL}: {label}". Active step `aria-current="step"`. Tooltip trigger has `aria-label`, bubble `role=tooltip`, icon `aria-hidden`; reveal via `group-focus-within` (keyboard reachable, not hover-only). Razão social `aria-readonly`; CNPJ/role/razão toggle `aria-invalid`. Form is `noValidate` (RHF + zod).
- **Reduced-motion gap (flag, do not "fix" in Figma):** `globals.css` ships **no global `prefers-reduced-motion` reset**. It is handled ad hoc — the progress fill opts out via `motion-reduce:transition-none`; the component deliberately omits any pulse for `kyb_in_progress`. Implication: any new motion introduced in design must ship its own `motion-reduce` opt-out; there is no app-wide safety net.

---

## 11. Open / in-flux items

- **"Powered by Avenia" disclosure — NOW BUILT** as `PoweredByAvenia` (§6.2), rendered in the auth footer (sign-in + sign-up) and the `AppFooter`. Avenia is the regulated provider of record. **Still open:** exact wording is counsel-gated (`pending-counsel-#6/#17`) — the shipped string is a neutral placeholder; *needs-figma-reconcile* on placement/spacing.
- **BRLA-safeguarding + "not a bank" — NOW BUILT.** `SafeguardingPanel` (§6.2) on the app home; the "not a bank" line lives in `AppFooter`. **Still open:** `pending-counsel-#16` provisional wording; *needs-figma-reconcile*.
- **Consent gate — NOW BUILT.** `CompanyDetailsForm` has a required consent checkbox (`companySchema.consentAccepted: z.literal(true)`); the backend stamps the versioned `consent.accepted` audit row once per org. **Still open:** the three document names are `text-gold-500` text, not yet real links (`pending-counsel`) — wire to the ToS/LGPD pages when they land.
- **Customer home / main-menu — NEW SCOPE, no Figma source.** `HomeTiles` + home shell + `App / Section` "Em breve" placeholder are built to `globals.css` tokens + this handover; all flagged *needs-figma-reconcile*. No money UI (gated on Avenia #1).
- **Hex mapping conflict** (Section 3 note): two ink/warm/gold mappings circulate; `globals.css` values are authoritative. Resolve before pixel-locking.
- **Divergences from the existing Lince DS v2** (resolve toward the shipped product): (a) **Language** — DS examples are EN/US-formatted; the app ships PT-BR with BR separators (`140.750,00`). Build PT-BR. (b) **EN/PT toggle** exists on the landing (default PT, `localStorage`, `data-i18n`) — not in the customer app; add a nav variant only if scope includes landing. (c) **Corridor scope** — DS says BRL/IDR/MXN deposits; product is LatAm-first (BRL live, MXN/COP soon) pay-in, USD/EUR/USDC/USDT pay-out; model live-vs-soon. (d) **Coverage gap** — onboarding progress, Clerk-themed auth, and the Tailwind v4 / shadcn-Base UI app are NOT in the DS v2 docs (which cover only the marketing landing + a cosmetic React dashboard mock); they are pure deltas spec'd from the customer codebase. Feed them back into the DS. (e) **"not a bank" disclaimer** appears in the landing footer; include in any footer mock.
- **Upstream-only tokens not shipped** (Section 3/5): `bone-200/300`, `emerald-400`, `clay-400`, all `*-tint` washes, the `shadow-sm/md/lg` ramp, the named `--s-*` spacing scale, and the `.theme-bone` light theme. Do not build these into the app library unless explicitly asked; they are design intent / landing-only.

---

## 12. Figma setup guide

### Pages to create
1. `00 Cover` — name, scope, this doc's link.
2. `01 Foundations` — color styles, text styles, radius/shadow swatches, spacing scale.
3. `02 Primitives` — Button, Card, Input, Label component sets.
4. `03 Components` — TopBar, AuthShell, CompanyDetailsForm, AdvanceButton, OnboardingProgress, Sidebar, Clerk UserButton + popover, help tooltip, flag row.
5. `04 Screens — Auth` — Sign In, Sign Up @1440 + @375.
6. `05 Screens — Onboarding` — 6 state frames @1440 + @375.
7. `06 Screens — App` — Shell, Home, Section placeholder @1440 + @375.
8. `07 Handoff notes` — accessibility, motion, Avenia/disclosure slot, open items.

### Color styles (namespaced)
`gold/300,400,500,600,700` · `ink/900,800,700,600,500` · `warm/100,300,400,500,600,700` · `bone/50,100` · `emerald/500` · `clay/500` · `sky/500`. Then **semantic aliases** mapping to the above: `bg`, `fg`, `card`, `card-fg`, `popover`, `primary`, `primary-fg`, `secondary`, `muted`, `muted-fg`, `accent`, `destructive`, `border`, `input`, `ring`, `sidebar*`, `chart-1…5`. Optional opacity styles used in code: `ink-900/80` (top-bar), `ink-900/85` + `/15` (scrim), `foreground/10` (card ring), `white/15` (flag ring), `muted/50` (card footer), `ring/50`, `destructive/20`.

### Text styles
The 11 `lince-*` styles in Section 4 (`display`, `h1`, `h2`, `h3`, `h4`, `body-lg`, `body`, `small`, `eyebrow`, `figure`, `mono`). Plus the literal in-app styles: `title/display-2xl` (Schibsted 700, 24px), `brand/lockup-lg` (Schibsted 700, 18px), `brand/lockup-4xl` (Schibsted 700, 36px), `eyebrow/auth` (mono-or-sans 600, 12px, uppercase, 0.25em), `step/11` (11px), `caption/xs` (12px). Map fonts: Schibsted Grotesk (400–800), Manrope (400–800), Space Mono (400/700).

### Component sets to build (variants)
- **Button** — Variant {default, outline, secondary, ghost, destructive, link} × Size {default, xs, sm, lg, icon, icon-xs, icon-sm, icon-lg} × State {default, hover, focus, active, disabled, invalid, expanded}. Heights 24/28/32/36; radius 8–12; gold = default.
- **Card** — Size {default(16px spacing, 16px title), sm(12px spacing, 14px title)}; slots Header/Title/Description/Action/Content/Footer; 12px radius; 1px 10%-foreground inset ring; footer = top border + muted/50.
- **Input** — single, 32px tall, 8px radius; State {default, focus(3px ring), disabled, invalid}.
- **Label** — single, 14px medium; State {default, disabled-group, disabled-peer} (both 50% opacity).
- **OnboardingProgress** — Step {1,2,3,terminal} × FillColor {gold, clay} × Caption {none, warm, clay+icon}.
- **Sidebar item** — State {active(ink-700/gold), inactive(warm-300), hover(ink-700/warm-100)}; build the 7-item nav as one component.
- **TopBar** — single (brand + UserButton); **UserButton** — State {avatar(36px gold), popover-open(ink-700 card)}.
- **CompanyDetailsForm fields** — CNPJ {default, loading, error}; Razão social {empty-readonly, filled-readonly}; Role select {default, focus, invalid}.
- **Help tooltip** — State {hidden(opacity 0), shown}.
- **Flag row** — 7-flag instance (br,mx,co,ar,pe,cl,uy); optional per-flag status {live, soon}.

### Recommended artboards per screen
Desktop **1440×1024** (the auth split and app shell are designed ≥`lg`=1024; right panel/sidebar only show here) and mobile **375×812** (below `lg`: auth = left column only; app/onboarding stack single-column). For each: Auth Sign In, Auth Sign Up, Onboarding 01–06, App Shell, App Home, App Section. Use the poster image behind the auth hero scrim. Center onboarding/app-empty content in a 448px max-width column.

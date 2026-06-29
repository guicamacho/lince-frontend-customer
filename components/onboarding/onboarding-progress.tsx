import { AlertTriangle } from "lucide-react";

/**
 * Onboarding progress indicator. Single prop: the server onboarding state string
 * (or null before an org exists). Maps internally to a linear step 1..3. KYB lives
 * inside step 2 (Verificação); `kyb_in_progress` keeps step 2 active and is surfaced
 * as an explicit text cue — no pulse, since globals.css has no reduced-motion reset.
 *
 * No "Concluído" step: approval is asynchronous (the user is notified by email and
 * lands straight in /app), so they never sit on a completion step during onboarding.
 * A Didit document re-request (`rfi_required`) loops back to Verificação.
 *
 * Pure presentational: no hooks, no "use client" — renders server-side in page.tsx.
 *
 * Known states: pending_lince_approval | kyb_in_progress | rfi_required | vendor_pending
 *               | active | declined | rejected  (null = no org yet)
 */
const STEPS = ["Empresa", "Verificação", "Análise"] as const;
const TOTAL = STEPS.length;

// state -> 1-based step the user is currently ON.
const STEP_BY_STATE: Record<string, number> = {
  pending_lince_approval: 2,
  kyb_in_progress: 2,
  rfi_required: 2, // Didit re-request → back to Verificação
  vendor_pending: 3,
  active: 3,
};

// Hard stops (not a normal step). rfi_required is intentionally NOT here — it loops back.
const TERMINAL: Record<string, string> = {
  declined: "Cadastro não aprovado",
  rejected: "Cadastro não aprovado",
};

// Extra caption for states that need an explicit cue beyond the step map.
const CAPTION: Record<string, string> = {
  kyb_in_progress: "Verificação em andamento",
  rfi_required: "Documentos adicionais necessários",
};

export function OnboardingProgress({ state }: { state?: string | null }) {
  const terminalMsg = state ? TERMINAL[state] : undefined;
  const isTerminal = Boolean(terminalMsg);
  // null (no org yet) => step 1; unknown => clamp to 1 (never NaN, never crash).
  const step = state ? STEP_BY_STATE[state] ?? 1 : 1;
  const pct = isTerminal ? 100 : Math.round((step / TOTAL) * 100);
  const label = STEPS[Math.min(step, TOTAL) - 1];

  const caption = terminalMsg ?? (state ? CAPTION[state] : undefined) ?? null;
  // Always-meaningful announcement for the progressbar (screen readers).
  const valueText = caption ?? `Etapa ${step} de ${TOTAL}: ${label}`;

  return (
    <div className="w-full max-w-md">
      {/* track + fill (color/width only — reduced-motion safe) */}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-valuetext={valueText}
        className="h-1.5 w-full overflow-hidden rounded-full bg-ink-500"
      >
        <div
          className={`h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none ${
            isTerminal ? "bg-clay-500" : "bg-gold-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* the map: all three step names, so users see where they are AND what's ahead */}
      <ol className="mt-2 flex justify-between text-[11px] leading-none">
        {STEPS.map((stepLabel, i) => {
          const n = i + 1;
          const isDone = !isTerminal && n < step;
          const isCurrent = !isTerminal && n === step;
          return (
            <li
              key={stepLabel}
              aria-current={isCurrent ? "step" : undefined}
              className={`whitespace-nowrap ${
                isCurrent
                  ? "font-semibold text-warm-100"
                  : isDone
                    ? "text-warm-300"
                    : "text-warm-400"
              }`}
            >
              {stepLabel}
            </li>
          );
        })}
      </ol>

      {/* caption: KYB cue, RFI cue, or terminal message (no plain step counter) */}
      {caption && (
        <p
          className={`mt-2 flex items-center gap-1.5 text-xs ${
            isTerminal ? "text-clay-500" : "text-warm-400"
          }`}
        >
          {isTerminal && <AlertTriangle className="size-3.5 shrink-0" aria-hidden />}
          {caption}
        </p>
      )}
    </div>
  );
}

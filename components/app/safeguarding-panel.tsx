import { ShieldCheck } from "lucide-react";

/**
 * BRLA-safeguarding disclosure. Onboarding-approved placement = the app home.
 * Presentational only, no money numbers.
 *
 * pending-counsel-#16 — provisional wording, counsel-gated; tipping-off-safe.
 * needs-figma-reconcile.
 */
export function SafeguardingPanel() {
  return (
    <section
      aria-label="Como seus fundos são mantidos"
      className="flex items-start gap-3 rounded-xl bg-ink-800 p-4 ring-1 ring-foreground/10"
    >
      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-warm-400" aria-hidden />
      <p className="text-sm leading-relaxed text-warm-300">
        Seus fundos são mantidos pela Avenia como um saldo em stablecoin. Não são um depósito
        bancário e não contam com garantia do FGC.
      </p>
    </section>
  );
}

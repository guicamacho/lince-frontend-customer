import { cn } from "@/lib/utils";

/**
 * "Powered by Avenia" disclosure slot (DESIGN_HANDOVER §11). Avenia is the regulated
 * provider of record. Presentational only; render in the auth footer + app footer.
 *
 * pending-counsel-#6/#17 — exact wording is counsel-gated; this is a neutral,
 * tipping-off-safe placeholder. needs-figma-reconcile.
 */
export function PoweredByAvenia({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs text-warm-400", className)}>
      Serviços de pagamento fornecidos pela Avenia.
    </p>
  );
}

import { PoweredByAvenia } from "@/components/powered-by-avenia";

/**
 * App-shell footer: Avenia disclosure + "not a bank" line (DESIGN_HANDOVER §11d/e).
 * Wired into app/app/layout.tsx active shell only (the hold screen stays bare).
 *
 * pending-counsel — see PoweredByAvenia; the "not a bank" line is provisional.
 * needs-figma-reconcile.
 */
export function AppFooter() {
  return (
    <footer className="border-t border-ink-500 px-8 py-4">
      <div className="flex flex-col gap-1">
        <PoweredByAvenia />
        <p className="text-xs text-warm-400">
          A Lince é uma plataforma de tecnologia, não um banco.
        </p>
      </div>
    </footer>
  );
}

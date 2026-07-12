/**
 * App-shell footer. "Not a bank" line (DESIGN_HANDOVER §11d/e).
 * Wired into app/app/layout.tsx active shell only (the hold screen stays bare).
 *
 * pending-counsel — the "not a bank" line is provisional; any provider attribution counsel
 * requires is re-added here. needs-figma-reconcile.
 */
export function AppFooter() {
  return (
    <footer className="border-t border-ink-500 px-8 py-4">
      <p className="text-xs text-warm-400">
        A Lince é uma plataforma de tecnologia, não um banco.
      </p>
    </footer>
  );
}

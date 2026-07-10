import Link from "next/link";
import { ShieldAlert } from "lucide-react";

/**
 * Persistent security notice: prompts the user to enable 2FA. Rendered by the app shell
 * on EVERY page whenever the logged-in user has no second factor enrolled (keyed on the
 * user, not the org — shows every login until they activate). Matches SampleBanner's gold
 * note language but is actionable (CTA to Configurações). Gold, not red: important, not alarming.
 */
export function MfaBanner() {
  return (
    <div
      role="note"
      className="mb-6 flex flex-col gap-3 rounded-[14px] bg-gold-500/10 px-4 py-3 text-[13px] leading-snug text-gold-400 ring-1 ring-gold-500/25 sm:flex-row sm:items-center"
    >
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-px size-4 shrink-0" aria-hidden />
        <p>
          <span className="font-semibold">Proteja sua conta</span> — ative a verificação em duas
          etapas. Ela é exigida para cadastrar beneficiários e pagar.
        </p>
      </div>
      <Link
        href="/app/settings"
        className="inline-flex min-h-9 shrink-0 cursor-pointer items-center justify-center rounded-[10px] bg-gold-500 px-3.5 text-[13px] font-bold text-ink-900 transition-colors hover:bg-gold-400 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:ml-auto"
      >
        Ativar agora
      </Link>
    </div>
  );
}

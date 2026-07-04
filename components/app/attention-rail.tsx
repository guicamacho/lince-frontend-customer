import { Clock } from "lucide-react";
import { pendingApprovals, fxRates } from "@/lib/sample-home";
import { cn } from "@/lib/utils";

/**
 * Right rail (mock AttentionRail): "Aguardando aprovação" (sample pending items
 * + Aprovar tudo / Revisar) and "Câmbio" (sample FX with ● AO VIVO). All SAMPLE.
 */
export function AttentionRail() {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[18px] bg-ink-800 p-[22px] ring-1 ring-foreground/10">
        <div className="mb-3.5 flex items-center justify-between">
          <div className="font-display text-base font-bold">Aguardando aprovação</div>
          <span className="rounded-full bg-gold-500/15 px-2.5 py-0.5 font-mono text-[11px] font-bold text-gold-400">
            {pendingApprovals.length}
          </span>
        </div>

        {pendingApprovals.map((a, i) => (
          <div
            key={a.title}
            className={cn(
              "flex items-center gap-3 py-[11px]",
              i < pendingApprovals.length - 1 && "border-b border-foreground/10",
            )}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink-700 text-gold-500">
              <Clock className="size-[15px]" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold">{a.title}</div>
              <div className="text-[11px] text-warm-500">{a.subtitle}</div>
            </div>
            <span className="font-display text-[13px] font-bold tabular-nums">{a.amount}</span>
          </div>
        ))}

        <div className="mt-3.5 flex gap-2">
          <button
            type="button"
            className="min-h-9 flex-1 cursor-pointer rounded-[10px] bg-gold-500 py-2 text-[13px] font-bold text-ink-900 transition-colors hover:bg-gold-400 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Aprovar tudo
          </button>
          <button
            type="button"
            className="min-h-9 flex-1 cursor-pointer rounded-[10px] border border-foreground/20 py-2 text-[13px] font-bold text-bone-100 transition-colors hover:bg-ink-700 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Revisar
          </button>
        </div>
      </div>

      <div className="rounded-[18px] bg-ink-800 p-[22px] ring-1 ring-foreground/10">
        <div className="mb-1.5 font-display text-base font-bold">Câmbio</div>
        {fxRates.map((r, i) => (
          <div
            key={r.pair}
            className={cn(
              "flex items-center justify-between py-2.5",
              i < fxRates.length - 1 && "border-b border-foreground/10",
            )}
          >
            <span className="text-[13px] font-semibold text-warm-300">{r.pair}</span>
            <span className="flex items-center gap-2">
              <span className="font-display text-[15px] font-bold tabular-nums">{r.rate}</span>
              <span className="font-mono text-[9px] text-emerald-500">● AO VIVO</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

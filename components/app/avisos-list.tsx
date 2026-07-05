import Link from "next/link";
import { Inbox, FileText } from "lucide-react";
import type { CustomerNotification, CustomerCaseSummary } from "@/lib/lince-api";
import { caseTypeLabel, caseStatusLabel, formatDay } from "@/lib/case-labels";
import { cn } from "@/lib/utils";

/**
 * Customer "Avisos" list — clones the AttentionRail panel idiom (rounded ring-1 panel, divided
 * rows, count pill). Rows are the customer's cases; each links to its thread. The unread dot is
 * derived from unread notifications (org-level read state, D4). Neutral pt-BR throughout.
 */
export function AvisosList({
  notifications,
  cases,
}: {
  notifications: CustomerNotification[];
  cases: CustomerCaseSummary[];
}) {
  const unreadCaseIds = new Set(
    notifications.filter((n) => !n.read_at && n.case_id).map((n) => n.case_id),
  );
  const unreadCount = unreadCaseIds.size;

  if (cases.length === 0) {
    return (
      <div className="rounded-[18px] bg-ink-800 p-10 text-center ring-1 ring-foreground/10">
        <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-ink-700 text-warm-400">
          <Inbox className="size-5" aria-hidden />
        </span>
        <p className="mt-3 text-warm-300">Nenhum aviso no momento.</p>
        <p className="mt-1 text-sm text-warm-500">
          Quando nossa equipe precisar de algo, você verá aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[18px] bg-ink-800 p-[22px] ring-1 ring-foreground/10">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-display text-base font-bold">Suas solicitações</div>
        {unreadCount > 0 && (
          <span
            className="rounded-full bg-gold-500/15 px-2.5 py-0.5 font-mono text-[11px] font-bold text-gold-400"
            aria-label={`${unreadCount} não lida${unreadCount === 1 ? "" : "s"}`}
          >
            {unreadCount}
          </span>
        )}
      </div>

      <ul>
        {cases.map((c, i) => {
          const unread = unreadCaseIds.has(c.id);
          return (
            <li key={c.id}>
              <Link
                href={`/app/avisos/${c.id}`}
                className={cn(
                  "-mx-2 flex items-center gap-3 rounded-lg px-2 py-[11px] transition-colors outline-none hover:bg-ink-700/60 focus-visible:ring-3 focus-visible:ring-ring/50",
                  i < cases.length - 1 && "border-b border-foreground/10",
                )}
              >
                <span className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-ink-700 text-gold-500">
                  <FileText className="size-[15px]" aria-hidden />
                  {unread && (
                    <span
                      className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-gold-500 ring-2 ring-ink-800"
                      aria-hidden
                    />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold">
                    {caseTypeLabel(c.type)}
                    {unread && <span className="sr-only"> (não lido)</span>}
                  </div>
                  <div className="text-[11px] text-warm-500">{caseStatusLabel(c.status)}</div>
                </div>
                <span className="shrink-0 text-[11px] tabular-nums text-warm-500">
                  {formatDay(c.last_message_at ?? c.opened_at)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

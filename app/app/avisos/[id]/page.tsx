import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCaseThread, listNotifications } from "@/lib/lince-api";
import { CaseReplyForm } from "@/components/app/case-reply-form";
import { MarkRead } from "@/components/app/mark-read";
import { caseTypeLabel, caseStatusLabel, formatDateTime } from "@/lib/case-labels";
import { cn } from "@/lib/utils";

export default async function AvisoThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [thread, { notifications }] = await Promise.all([getCaseThread(id), listNotifications()]);

  const backLink = (
    <Link
      href="/app/avisos"
      className="inline-flex min-h-11 items-center gap-1.5 rounded-lg py-1 text-sm text-warm-400 transition-colors outline-none hover:text-warm-100 focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <ArrowLeft className="size-4" aria-hidden />
      Voltar aos avisos
    </Link>
  );

  if (!thread) {
    return (
      <div className="max-w-2xl space-y-6">
        {backLink}
        <div className="rounded-[18px] bg-ink-800 p-10 text-center ring-1 ring-foreground/10">
          <p className="text-warm-300">Aviso não encontrado.</p>
          <p className="mt-1 text-sm text-warm-500">Este item pode não estar mais disponível.</p>
        </div>
      </div>
    );
  }

  const { case: c, messages } = thread;
  const closed = c.status === "closed";
  const unreadIds = notifications
    .filter((n) => !n.read_at && n.case_id === c.id)
    .map((n) => n.id);

  return (
    <div className="max-w-2xl space-y-6">
      <MarkRead ids={unreadIds} />
      {backLink}

      <div>
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="font-display text-2xl">{caseTypeLabel(c.type)}</h1>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
              closed ? "bg-ink-700 text-warm-400" : "bg-emerald-500/15 text-emerald-500",
            )}
          >
            {caseStatusLabel(c.status)}
          </span>
        </div>
        <p className="mt-1 text-sm text-warm-400">Aberto em {formatDateTime(c.opened_at)}</p>
      </div>

      <ol className="space-y-3">
        {messages.length === 0 && (
          <li className="rounded-[18px] bg-ink-800 p-6 text-center text-sm text-warm-500 ring-1 ring-foreground/10">
            Ainda não há mensagens nesta solicitação.
          </li>
        )}
        {messages.map((m) => {
          const mine = m.author_type === "customer";
          return (
            <li key={m.id} className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-[18px] px-4 py-3 text-[13.5px] leading-relaxed ring-1",
                  mine
                    ? "bg-gold-500/10 text-bone-100 ring-gold-500/25"
                    : "bg-ink-800 text-warm-100 ring-foreground/10",
                )}
              >
                <div className="mb-1 flex items-center gap-2 text-[11px] text-warm-500">
                  <span className="font-semibold">{mine ? "Você" : "Equipe Lince"}</span>
                  <span aria-hidden>·</span>
                  <time dateTime={m.created_at}>{formatDateTime(m.created_at)}</time>
                </div>
                {/* body is server-sanitized plain text (HTML/URLs stripped); React escapes it too. */}
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
              </div>
            </li>
          );
        })}
      </ol>

      {closed ? (
        <div className="rounded-[18px] bg-ink-800 p-4 text-sm text-warm-400 ring-1 ring-foreground/10">
          Esta solicitação foi encerrada. Se precisar de algo, entre em contato com nosso suporte.
        </div>
      ) : (
        <div className="rounded-[18px] bg-ink-800 p-[22px] ring-1 ring-foreground/10">
          <CaseReplyForm caseId={c.id} />
        </div>
      )}
    </div>
  );
}

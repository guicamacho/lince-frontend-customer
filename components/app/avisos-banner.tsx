"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox } from "lucide-react";

/**
 * Persistent unread-Avisos bar (product ask 2026-07-11): shown on every app page while the
 * business has unread avisos — these carry compliance/ops messages (RFI relays), so they must
 * not sit unnoticed behind a badge. Not dismissible by design: it reflects state and clears
 * when the avisos are read (the layout refetches `unread` on router.refresh(), same source as
 * the sidebar badge). Hidden on the Avisos page itself. Copy stays NEUTRAL (tipping-off-safe):
 * never the message subject or a compliance reason, only the count.
 */
export function AvisosBanner({ unread }: { unread: number }) {
  const pathname = usePathname();
  if (unread <= 0 || pathname.startsWith("/app/avisos")) return null;
  const plural = unread > 1;

  return (
    <div
      role="status"
      className="mb-6 flex flex-col gap-3 rounded-[14px] bg-sky-500/10 px-4 py-3 text-[13px] leading-snug text-sky-300 ring-1 ring-sky-500/25 sm:flex-row sm:items-center"
    >
      <div className="flex items-start gap-3">
        <Inbox className="mt-px size-4 shrink-0" aria-hidden />
        <p>
          <span className="font-semibold">
            {plural ? `Você tem ${unread} avisos não lidos` : "Você tem 1 aviso não lido"}
          </span>{" "}
          — pode haver uma solicitação aguardando resposta da sua empresa.
        </p>
      </div>
      <Link
        href="/app/avisos"
        className="inline-flex min-h-9 shrink-0 cursor-pointer items-center justify-center rounded-[10px] bg-sky-500 px-3.5 text-[13px] font-bold text-ink-900 transition-colors hover:bg-sky-400 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:ml-auto"
      >
        Ver avisos
      </Link>
    </div>
  );
}

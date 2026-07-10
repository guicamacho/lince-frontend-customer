"use client";

/**
 * RFI (EDD) thread on the onboarding "rfi_required" screen — the customer reads Avenia's
 * relayed info request and replies, all before the account is active. The staff message is
 * shown verbatim (already customer-visible + sanitized server-side); replies post to the
 * onboarding-accessible /onboarding/rfi/reply route.
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { replyRfiAction } from "@/app/onboarding/rfi-actions";
import { Button } from "@/components/ui/button";
import type { RfiMessage } from "@/lib/lince-api";

export function RfiThread({ messages, closed }: { messages: RfiMessage[]; closed: boolean }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await replyRfiAction(body);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setBody("");
      setSent(true);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4 text-left">
      <ul className="space-y-3">
        {messages.map((m) => (
          <li
            key={m.id}
            className={
              m.author_type === "customer"
                ? "ml-8 rounded-xl bg-gold-500/10 p-3.5 text-sm text-warm-100"
                : "mr-8 rounded-xl bg-ink-800 p-3.5 text-sm text-warm-200"
            }
          >
            <p className="mb-1 text-[11px] font-medium tracking-wide text-warm-500 uppercase">
              {m.author_type === "customer" ? "Você" : "Lince"}
            </p>
            <p className="whitespace-pre-wrap">{m.body}</p>
          </li>
        ))}
      </ul>

      {closed ? (
        <p className="text-sm text-warm-500">Esta solicitação foi encerrada.</p>
      ) : (
        <form onSubmit={submit} className="space-y-2">
          <label htmlFor="rfi-reply" className="text-xs font-medium tracking-wide text-warm-500 uppercase">
            Sua resposta
          </label>
          <textarea
            id="rfi-reply"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder="Escreva sua resposta ou descreva os documentos que vai enviar…"
            className="w-full rounded-lg border border-ink-500 bg-ink-800 px-3 py-2 text-sm text-warm-200 outline-none placeholder:text-warm-600 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={pending} className="cursor-pointer">
              {pending ? "Enviando…" : "Enviar resposta"}
            </Button>
            {sent && !error && <span className="text-sm text-emerald-500">Resposta enviada.</span>}
          </div>
          {error && <p className="text-sm text-clay-500">{error}</p>}
        </form>
      )}
    </div>
  );
}

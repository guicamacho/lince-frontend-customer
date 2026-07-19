"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { reportProblemAction } from "@/app/app/transactions/actions";

// "Reportar um problema" (PRD-04 §13.1): opens the org's dispute thread for this
// transaction. The complaint lands in Avisos, where the conversation continues.
export function ReportProblem({ transactionId }: { transactionId: string }) {
  const router = useRouter();
  const [openForm, setOpenForm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await reportProblemAction(transactionId, message);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      router.push(`/app/avisos/${res.caseId}`);
    });
  }

  if (!openForm) {
    return (
      <button
        type="button"
        onClick={() => setOpenForm(true)}
        className="cursor-pointer text-[13px] text-warm-400 underline-offset-2 transition-colors hover:text-warm-200 hover:underline"
      >
        Reportar um problema com esta transação
      </button>
    );
  }
  return (
    <div className="space-y-2">
      <label htmlFor={`dispute-${transactionId}`} className="block text-[11px] uppercase tracking-wide text-warm-500">
        Descreva o problema
      </label>
      <textarea
        id={`dispute-${transactionId}`}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        maxLength={4000}
        className="w-full rounded-lg border border-ink-500 bg-ink-900/60 p-2.5 text-sm text-warm-100"
        placeholder="Ex.: não reconheço este pagamento / o valor está incorreto…"
      />
      {error && <p role="alert" className="text-sm text-clay-500">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" className="cursor-pointer" onClick={submit} disabled={pending || !message.trim()}>
          {pending ? "Enviando…" : "Enviar"}
        </Button>
        <Button size="sm" variant="ghost" className="cursor-pointer" onClick={() => setOpenForm(false)} disabled={pending}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

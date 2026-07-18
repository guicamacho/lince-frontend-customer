"use client";

import { useState, useTransition } from "react";
import { useReverification } from "@clerk/nextjs";
import { isReverificationCancelledError } from "@clerk/nextjs/errors";
import { Button } from "@/components/ui/button";
import { closeAccountAction } from "@/app/app/settings/actions";

// Encerrar conta (PRD-01 §13.1 / Cluster 3). Owner-only (server-enforced; the card only
// renders for owners). Two-step confirm in place of a modal; the backend requires zero
// balance + nothing in flight and is step-up-gated — the wrapper re-auths and retries.
export function CloseAccount() {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const closeWithStepUp = useReverification(closeAccountAction);

  function onConfirm() {
    setError(null);
    startTransition(async () => {
      let res;
      try {
        res = await closeWithStepUp();
      } catch (e) {
        setError(
          isReverificationCancelledError(e)
            ? "Confirmação de identidade cancelada. Nada foi alterado."
            : "Não foi possível encerrar a conta. Tente novamente.",
        );
        return;
      }
      if (res && "error" in res) {
        setError(res.error);
        return;
      }
      // Closed: the /app gate no longer resolves this org — land on the closed screen.
      window.location.assign("/onboarding");
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm leading-relaxed text-warm-400">
        Encerra a conta da empresa de forma definitiva. O saldo precisa estar zerado e não pode
        haver transações em andamento. Os registros exigidos por lei permanecem guardados pelo
        prazo legal.
      </p>
      {error && (
        <p role="alert" className="text-sm text-clay-500">
          {error}
        </p>
      )}
      {confirming ? (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="destructive"
            className="cursor-pointer"
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? "Encerrando…" : "Confirmar encerramento"}
          </Button>
          <Button variant="outline" className="cursor-pointer" onClick={() => setConfirming(false)} disabled={pending}>
            Cancelar
          </Button>
        </div>
      ) : (
        <Button variant="outline" className="cursor-pointer border-clay-500/40 text-clay-500 hover:bg-clay-500/10" onClick={() => setConfirming(true)}>
          Encerrar conta
        </Button>
      )}
    </div>
  );
}

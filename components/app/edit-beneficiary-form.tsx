"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useReverification } from "@clerk/nextjs";
import { isReverificationCancelledError } from "@clerk/nextjs/errors";
import { Button } from "@/components/ui/button";
import { railByKey, CRYPTO_NETWORKS, type Rail } from "@/lib/rails";
import { updateBeneficiaryAction } from "@/app/app/beneficiaries/actions";
import type { Beneficiary } from "@/lib/lince-api";

// Editar beneficiário (PRD-03 §13.2). Two very different edits, made visually distinct:
// apelido/nome apply immediately; replacing the DESTINATION re-runs the full validation and
// pauses the payee ("em verificação") until our team re-verifies — the classic fraud vector
// is changing account identifiers on a trusted payee, so the pause is the protection.
// Destination fields start BLANK on purpose: this is a replacement, not a tweak.
export function EditBeneficiaryForm({ beneficiary }: { beneficiary: Beneficiary }) {
  const rail = (beneficiary.rail ?? "pix") as Rail;
  const meta = railByKey(rail);
  const [label, setLabel] = useState(beneficiary.label);
  const [payeeLegalName, setPayeeLegalName] = useState(beneficiary.payee_legal_name ?? "");
  const [replacing, setReplacing] = useState(false);
  const [dest, setDest] = useState<Record<string, string>>({});
  const [network, setNetwork] = useState(beneficiary.network ?? "");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<null | "saved" | "pending_verification">(null);
  const [pending, startTransition] = useTransition();
  const saveWithStepUp = useReverification(updateBeneficiaryAction);

  function submit() {
    setError(null);
    const input: Parameters<typeof updateBeneficiaryAction>[1] = {};
    if (label !== beneficiary.label) input.label = label;
    if (payeeLegalName !== (beneficiary.payee_legal_name ?? "")) input.payeeLegalName = payeeLegalName;
    if (replacing) {
      input.destination = dest;
      if (meta.needsNetwork && network) input.network = network;
    }
    if (Object.keys(input).length === 0) {
      setError("Nada para salvar.");
      return;
    }
    startTransition(async () => {
      let res;
      try {
        res = await saveWithStepUp(beneficiary.id, input);
      } catch (e) {
        setError(
          isReverificationCancelledError(e)
            ? "Confirmação de identidade cancelada. Nada foi alterado."
            : "Não foi possível salvar. Tente novamente.",
        );
        return;
      }
      if (res && "error" in res) {
        setError(res.error);
        return;
      }
      if (res && "ok" in res) {
        setDone(res.verificationStatus === "changed_pending" ? "pending_verification" : "saved");
      }
    });
  }

  if (done) {
    return (
      <div className="rounded-[22px] bg-ink-800 p-6 ring-1 ring-foreground/10">
        <h2 className="font-display text-lg font-bold">
          {done === "pending_verification" ? "Destino atualizado — em verificação" : "Alterações salvas"}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-warm-300">
          {done === "pending_verification"
            ? "Por segurança, este beneficiário fica indisponível para pagamentos até nossa equipe verificar o novo destino. Avisaremos quando estiver liberado."
            : "Os dados do beneficiário foram atualizados."}
        </p>
        <Link
          href="/app/beneficiaries"
          className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-gold-500 px-4 text-sm font-bold text-ink-900 transition-colors hover:bg-gold-400"
        >
          Voltar aos beneficiários
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <p role="alert" className="text-sm text-clay-500">{error}</p>
      )}

      <div className="space-y-4 rounded-[22px] bg-ink-800 p-6 ring-1 ring-foreground/10">
        <div>
          <label htmlFor="edit-label" className="text-xs text-warm-400">Apelido</label>
          <input
            id="edit-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={120}
            className="mt-1 w-full rounded-lg border border-ink-500 bg-ink-900/60 p-2.5 text-sm text-warm-100"
          />
        </div>
        <div>
          <label htmlFor="edit-name" className="text-xs text-warm-400">Nome do beneficiário</label>
          <input
            id="edit-name"
            value={payeeLegalName}
            onChange={(e) => setPayeeLegalName(e.target.value)}
            maxLength={200}
            className="mt-1 w-full rounded-lg border border-ink-500 bg-ink-900/60 p-2.5 text-sm text-warm-100"
          />
        </div>
        <p className="text-xs text-warm-500">
          Alterações de apelido e nome não afetam a verificação do beneficiário.
        </p>
      </div>

      <div className="space-y-4 rounded-[22px] bg-ink-800 p-6 ring-1 ring-foreground/10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-warm-200">Substituir destino ({meta.label})</h2>
            <p className="mt-1 text-xs leading-relaxed text-warm-500">
              Destino atual: <span className="font-mono">••{beneficiary.dest_hint ?? "—"}</span>. Ao substituir,
              o beneficiário fica <span className="text-warm-300">em verificação</span> e indisponível para
              pagamentos até nossa equipe confirmar o novo destino.
            </p>
          </div>
          <Button variant="outline" size="sm" className="shrink-0 cursor-pointer" onClick={() => setReplacing((v) => !v)}>
            {replacing ? "Cancelar substituição" : "Substituir"}
          </Button>
        </div>

        {replacing && (
          <div className="space-y-3 border-t border-ink-600 pt-4">
            {meta.needsNetwork && (
              <div>
                <label htmlFor="edit-network" className="text-xs text-warm-400">Rede</label>
                <select
                  id="edit-network"
                  value={network}
                  onChange={(e) => setNetwork(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-ink-500 bg-ink-900/60 p-2.5 text-sm text-warm-100"
                >
                  {(CRYPTO_NETWORKS[beneficiary.asset ?? ""] ?? []).map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            )}
            {meta.fields.map((f) => (
              <div key={f.name}>
                <label htmlFor={`edit-${f.name}`} className="text-xs text-warm-400">
                  {f.label}
                  {f.optional ? " (opcional)" : ""}
                </label>
                {f.kind === "select" ? (
                  <select
                    id={`edit-${f.name}`}
                    value={dest[f.name] ?? ""}
                    onChange={(e) => setDest((d) => ({ ...d, [f.name]: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-ink-500 bg-ink-900/60 p-2.5 text-sm text-warm-100"
                  >
                    <option value="">Selecione…</option>
                    {(f.options ?? []).map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={`edit-${f.name}`}
                    value={dest[f.name] ?? ""}
                    onChange={(e) => setDest((d) => ({ ...d, [f.name]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="mt-1 w-full rounded-lg border border-ink-500 bg-ink-900/60 p-2.5 text-sm text-warm-100"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button className="cursor-pointer" onClick={submit} disabled={pending}>
          {pending ? "Salvando…" : "Salvar alterações"}
        </Button>
        <Link href="/app/beneficiaries" className="text-sm text-warm-400 underline-offset-2 hover:underline">
          Cancelar
        </Link>
      </div>
    </div>
  );
}

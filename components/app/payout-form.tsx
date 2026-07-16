"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Send, CheckCircle2, TriangleAlert, KeyRound } from "lucide-react";
import type { Beneficiary } from "@/lib/lince-api";
import { payoutAction } from "@/app/app/payouts/payout-actions";
import { cn } from "@/lib/utils";

const fmtBrl = (n: number) =>
  `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function friendlyError(code: string): { message: string; action?: "mfa" } {
  switch (code) {
    case "insufficient_balance": return { message: "Saldo insuficiente para este pagamento." };
    case "mfa_required": return { message: "Ative a verificação em duas etapas (2FA) para enviar pagamentos.", action: "mfa" };
    case "invalid_amount": return { message: "Valor inválido." };
    case "beneficiary_not_found":
    case "beneficiary_disabled":
    case "unsupported_rail": return { message: "Beneficiário indisponível para pagamento. Verifique o cadastro." };
    case "money_out_held": return { message: "Por segurança, envios ficam temporariamente bloqueados após a recuperação da conta. Tente novamente mais tarde." };
    case "avenia_unavailable":
    case "mfa_check_unavailable": return { message: "Serviço indisponível no momento. Tente novamente." };
    default: return { message: "Não foi possível concluir o pagamento. Tente novamente." };
  }
}

export function PayoutForm({ balances, payees }: { balances: Record<string, number>; payees: Beneficiary[] }) {
  const [payeeId, setPayeeId] = useState<string | null>(payees.length === 1 ? payees[0]!.id : null);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<{ message: string; action?: "mfa" } | null>(null);
  const [done, setDone] = useState<{ status: "ok"; sent: number; payee: string } | { status: "pending" } | null>(null);

  // Stable idem key per intent; cleared on confirmed success, kept on an uncertain outcome.
  const idemRef = useRef<{ intent: string; key: string } | null>(null);
  function idemFor(intent: string): string {
    if (idemRef.current?.intent !== intent) idemRef.current = { intent, key: crypto.randomUUID() };
    return idemRef.current.key;
  }

  const available = (balances["BRLA"] ?? 0) / 100;
  const amountNum = Number(amount.replace(",", "."));
  const validAmount = Number.isFinite(amountNum) && amountNum > 0;
  const overBalance = validAmount && amountNum > available + 1e-9;
  const payee = useMemo(() => payees.find((p) => p.id === payeeId) ?? null, [payees, payeeId]);

  async function submit() {
    if (!payee || !validAmount || overBalance || submitting) return;
    setSubmitting(true);
    setError(null);
    const res = await payoutAction({
      beneficiaryId: payee.id,
      amount: amount.replace(",", "."),
      idemKey: idemFor(`${payee.id}:${amount}`),
    });
    setSubmitting(false);
    if (res.ok && res.data.state !== "created" && res.data.destAmount != null) {
      idemRef.current = null; // confirmed — next payout mints a fresh key
      setDone({ status: "ok", sent: res.data.destAmount / 100, payee: payee.label });
    } else if (res.ok || res.error === "payout_pending_reconcile") {
      setDone({ status: "pending" }); // keep the idem key: a retry replays, never double-pays
    } else {
      setError(friendlyError(res.error));
    }
  }

  if (done) {
    return (
      <div className="rounded-[22px] bg-ink-800 p-6 ring-1 ring-foreground/10">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="size-6 text-emerald-400" aria-hidden />
          <h2 className="font-display text-lg font-bold">Pagamento em processamento</h2>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-warm-300">
          {done.status === "ok" ? (
            <><strong className="text-warm-100">{done.payee}</strong> receberá{" "}
              <strong className="text-warm-100">{fmtBrl(done.sent)}</strong> via PIX (tarifa já deduzida). O
              saldo é atualizado assim que a operação é confirmada.</>
          ) : (
            <>Estamos confirmando seu pagamento. Acompanhe o resultado em Transações; o saldo é atualizado ao confirmar.</>
          )}
        </p>
        <div className="mt-5 flex gap-2.5">
          <Link href="/app/transactions" className="inline-flex min-h-11 items-center rounded-xl bg-ink-700 px-4 text-sm font-semibold text-bone-100 ring-1 ring-foreground/15 transition-colors hover:bg-ink-600">
            Ver transações
          </Link>
          <button type="button" onClick={() => { setAmount(""); setDone(null); idemRef.current = null; }}
            className="inline-flex min-h-11 cursor-pointer items-center rounded-xl bg-gold-500 px-4 text-sm font-bold text-ink-900 transition-colors hover:bg-gold-400">
            Novo pagamento
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[22px] bg-ink-800 p-5 ring-1 ring-foreground/10 sm:p-6">
      {/* Payee picker */}
      <fieldset>
        <legend className="text-xs text-warm-400">Beneficiário</legend>
        <div className="mt-2 space-y-2" role="radiogroup" aria-label="Escolha o beneficiário">
          {payees.map((p) => {
            const selected = p.id === payeeId;
            return (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => { setPayeeId(p.id); setError(null); }}
                className={cn(
                  "flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-2xl bg-ink-900 p-3.5 text-left ring-1 transition-colors",
                  selected ? "ring-gold-500/60" : "ring-foreground/10 hover:ring-foreground/25",
                )}
              >
                <span className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full",
                  selected ? "bg-gold-500 text-ink-900" : "bg-ink-700 text-warm-300",
                )}>
                  <KeyRound className="size-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-warm-100">{p.label}</span>
                  <span className="block truncate text-xs text-warm-400">
                    {p.payee_legal_name}{p.dest_hint ? ` · chave PIX …${p.dest_hint}` : ""}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Amount */}
      <div className="mt-4 rounded-2xl bg-ink-900 p-4 ring-1 ring-foreground/10 focus-within:ring-gold-500/40">
        <div className="flex items-center justify-between text-xs">
          <label htmlFor="payout-amount" className="text-warm-400">Você envia</label>
          <button type="button" onClick={() => { setAmount(available.toFixed(2)); setError(null); }}
            className="cursor-pointer font-semibold text-gold-500 transition-colors hover:text-gold-400">
            Máx · {fmtBrl(available)}
          </button>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <input
            id="payout-amount"
            inputMode="decimal"
            placeholder="0,00"
            value={amount}
            onChange={(e) => { setAmount(e.target.value.replace(/[^\d.,]/g, "")); setError(null); }}
            className="min-w-0 flex-1 bg-transparent font-display text-[28px] tabular-nums text-warm-100 outline-none placeholder:text-warm-600"
          />
          <span className="shrink-0 rounded-full bg-ink-700 px-3.5 py-1.5 text-sm font-bold text-warm-100 ring-1 ring-foreground/10">BRL</span>
        </div>
      </div>

      <p className="mt-3 text-xs text-warm-500">
        Transferência via PIX. A tarifa é deduzida do valor enviado e aparece no comprovante.
      </p>

      {overBalance && <p className="mt-2 text-xs text-clay-400">Valor acima do saldo disponível.</p>}

      {error && (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-clay-500/30 bg-clay-500/10 p-3.5 text-sm text-clay-200">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-clay-400" aria-hidden />
          <div>
            <span>{error.message}</span>
            {error.action === "mfa" && <Link href="/app/settings" className="ml-1 font-semibold text-gold-400 underline">Ativar 2FA</Link>}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={!payee || !validAmount || overBalance || submitting}
        className="mt-5 inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gold-500 px-4 text-sm font-bold text-ink-900 transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Send className="size-4" aria-hidden />
        {submitting ? "Enviando…" : "Enviar pagamento"}
      </button>
    </div>
  );
}

"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDownUp, Repeat, CheckCircle2, TriangleAlert } from "lucide-react";
import type { Rates } from "@/lib/lince-api";
import { convertAction } from "@/app/app/convert/convert-actions";
import { cn } from "@/lib/utils";

// UI currency <-> ledger currency. Convert is USD both ways for now (BRLA<->USDT); EUR is a follow-up.
type Dir = "brl2usd" | "usd2brl";
const LEG: Record<Dir, { fromCode: string; toCode: string; fromCcy: "BRL" | "USD"; toCcy: "BRL" | "USD" }> = {
  brl2usd: { fromCode: "BRLA", toCode: "USDT", fromCcy: "BRL", toCcy: "USD" },
  usd2brl: { fromCode: "USDT", toCode: "BRLA", fromCcy: "USD", toCcy: "BRL" },
};
const SYMBOL: Record<"BRL" | "USD", string> = { BRL: "R$", USD: "US$" };
const LEDGER_DP: Record<string, number> = { BRLA: 2, USDT: 6 };

function fmt(n: number, ccy: "BRL" | "USD"): string {
  return `${SYMBOL[ccy]} ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function friendlyError(code: string): { message: string; action?: "mfa" } {
  switch (code) {
    case "insufficient_balance": return { message: "Saldo insuficiente para esta conversão." };
    case "mfa_required": return { message: "Ative a verificação em duas etapas (2FA) para converter.", action: "mfa" };
    case "invalid_amount": return { message: "Valor inválido." };
    case "unsupported_pair": return { message: "Conversão indisponível para este par." };
    case "avenia_unavailable":
    case "mfa_check_unavailable": return { message: "Serviço indisponível no momento. Tente novamente." };
    default: return { message: "Não foi possível concluir a conversão. Tente novamente." };
  }
}

export function ConvertForm({ balances, rates }: { balances: Record<string, number>; rates: Rates | null }) {
  const [dir, setDir] = useState<Dir>("brl2usd");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<{ message: string; action?: "mfa" } | null>(null);
  const [done, setDone] = useState<{ status: "ok"; out: number; toCcy: "BRL" | "USD" } | { status: "pending" } | null>(null);

  // Stable idem key per intent (dir+amount): retries of the same convert replay on the backend;
  // changing the amount/direction mints a fresh key. A ref, so no re-render churn.
  const idemRef = useRef<{ intent: string; key: string } | null>(null);
  function idemFor(intent: string): string {
    if (idemRef.current?.intent !== intent) idemRef.current = { intent, key: crypto.randomUUID() };
    return idemRef.current.key;
  }

  const leg = LEG[dir];
  const availableMinor = balances[leg.fromCode] ?? 0;
  const available = availableMinor / 10 ** (LEDGER_DP[leg.fromCode] ?? 2);
  const amountNum = Number(amount.replace(",", "."));
  const validAmount = Number.isFinite(amountNum) && amountNum > 0;
  const overBalance = validAmount && amountNum > available + 1e-9;

  const estimate = useMemo(() => {
    if (!validAmount || !rates) return null;
    const { buy, sell, mid } = rates.brlUsd;
    if (dir === "brl2usd") {
      const rate = buy ?? mid;
      return rate ? amountNum / rate : null; // USD out
    }
    const rate = sell ?? mid;
    return rate ? amountNum * rate : null; // BRL out
  }, [validAmount, rates, dir, amountNum]);

  async function submit() {
    if (!validAmount || overBalance || submitting) return;
    setSubmitting(true);
    setError(null);
    const res = await convertAction({
      from: leg.fromCode, to: leg.toCode, amount: amount.replace(",", "."), idemKey: idemFor(`${dir}:${amount}`),
    });
    setSubmitting(false);
    if (res.ok && res.data.state !== "created" && res.data.destAmount != null) {
      // Confirmed: the swap was created. Clear the idem key so the next convert mints a fresh one.
      idemRef.current = null;
      setDone({ status: "ok", out: res.data.destAmount / 10 ** (LEDGER_DP[leg.toCode] ?? 2), toCcy: leg.toCcy });
    } else if (res.ok || res.error === "convert_pending_reconcile") {
      // Uncertain (a pending reservation, or a lost response the backend is reconciling). Do NOT
      // clear the idem key: a retry replays the same request and never double-swaps.
      setDone({ status: "pending" });
    } else {
      setError(friendlyError(res.error));
    }
  }

  if (done) {
    return (
      <div className="rounded-[20px] bg-ink-800 p-6 ring-1 ring-foreground/10">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="size-6 text-emerald-400" aria-hidden />
          <h2 className="font-display text-lg font-bold">Conversão em processamento</h2>
        </div>
        <p className="mt-3 text-sm text-warm-300">
          {done.status === "ok" ? (
            <>
              Você receberá aproximadamente <strong className="text-warm-100">{fmt(done.out, done.toCcy)}</strong>. O
              saldo é atualizado assim que a operação é confirmada (poucos segundos).
            </>
          ) : (
            <>Estamos confirmando sua conversão. Acompanhe o resultado em Transações; o saldo é atualizado ao confirmar.</>
          )}
        </p>
        <div className="mt-5 flex gap-2.5">
          <Link
            href="/app/transactions"
            className="inline-flex min-h-11 items-center rounded-xl bg-ink-700 px-4 text-sm font-semibold text-bone-100 ring-1 ring-foreground/15 transition-colors hover:bg-ink-600"
          >
            Ver transações
          </Link>
          <button
            type="button"
            onClick={() => { setAmount(""); setDone(null); idemRef.current = null; }}
            className="inline-flex min-h-11 cursor-pointer items-center rounded-xl bg-gold-500 px-4 text-sm font-bold text-ink-900 transition-colors hover:bg-gold-400"
          >
            Nova conversão
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[20px] bg-ink-800 p-6 ring-1 ring-foreground/10">
      {/* Direction */}
      <div className="flex overflow-hidden rounded-xl ring-1 ring-foreground/15" role="group" aria-label="Direção da conversão">
        {(["brl2usd", "usd2brl"] as const).map((d) => (
          <button
            key={d}
            type="button"
            aria-pressed={dir === d}
            onClick={() => { setDir(d); setAmount(""); setError(null); }}
            className={cn(
              "flex-1 cursor-pointer px-4 py-2.5 text-sm font-bold transition-colors",
              dir === d ? "bg-gold-500 text-ink-900" : "text-warm-300 hover:text-warm-100",
            )}
          >
            {LEG[d].fromCcy} → {LEG[d].toCcy}
          </button>
        ))}
      </div>

      {/* Amount */}
      <div className="mt-5">
        <label htmlFor="convert-amount" className="flex items-center justify-between text-sm text-warm-400">
          <span>Você converte</span>
          <span className="text-xs">
            Disponível:{" "}
            <button
              type="button"
              onClick={() => { setAmount(available.toFixed(LEDGER_DP[leg.fromCode] ?? 2)); setError(null); }}
              className="cursor-pointer font-semibold text-gold-500 hover:text-gold-400"
            >
              {fmt(available, leg.fromCcy)}
            </button>
          </span>
        </label>
        <div className="mt-1.5 flex items-center gap-2 rounded-xl bg-ink-900 px-4 ring-1 ring-foreground/15 focus-within:ring-gold-500/50">
          <span className="font-display text-lg text-warm-400">{SYMBOL[leg.fromCcy]}</span>
          <input
            id="convert-amount"
            inputMode="decimal"
            placeholder="0,00"
            value={amount}
            onChange={(e) => { setAmount(e.target.value.replace(/[^\d.,]/g, "")); setError(null); }}
            className="min-h-12 w-full bg-transparent py-2 font-display text-2xl tabular-nums text-warm-100 outline-none placeholder:text-warm-600"
          />
        </div>
        {overBalance && <p className="mt-1.5 text-xs text-clay-400">Acima do saldo disponível.</p>}
      </div>

      {/* Estimate */}
      <div className="mt-4 flex items-center gap-3 rounded-xl bg-ink-900/60 p-3.5">
        <ArrowDownUp className="size-4 shrink-0 text-warm-500" aria-hidden />
        <div className="text-sm">
          <span className="text-warm-400">Você recebe aprox. </span>
          <span className="font-semibold text-warm-100">
            {estimate !== null ? fmt(estimate, leg.toCcy) : "—"}
          </span>
          <p className="mt-0.5 text-[11px] text-warm-500">
            Estimativa pela taxa de referência. O valor final é confirmado no momento da operação.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-clay-500/30 bg-clay-500/10 p-3.5 text-sm text-clay-200">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-clay-400" aria-hidden />
          <div>
            <span>{error.message}</span>
            {error.action === "mfa" && (
              <Link href="/app/settings" className="ml-1 font-semibold text-gold-400 underline">
                Ativar 2FA
              </Link>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={!validAmount || overBalance || submitting}
        className="mt-5 inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gold-500 px-4 text-sm font-bold text-ink-900 transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Repeat className="size-4" aria-hidden />
        {submitting ? "Convertendo…" : "Converter"}
      </button>
    </div>
  );
}

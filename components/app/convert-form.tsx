"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpDown, Repeat, CheckCircle2, TriangleAlert } from "lucide-react";
import type { Rates } from "@/lib/lince-api";
import { fetchRatesAction } from "@/app/app/rates-actions";
import { convertAction } from "@/app/app/convert/convert-actions";
import { BrlFlag, UsdFlag } from "@/components/app/currency-marks";
import { cn } from "@/lib/utils";

// UI currency <-> ledger currency. USD both ways (BRLA<->USDT); EUR is a follow-up.
type Dir = "brl2usd" | "usd2brl";
const LEG: Record<Dir, { fromCode: string; toCode: string; fromCcy: "BRL" | "USD"; toCcy: "BRL" | "USD" }> = {
  brl2usd: { fromCode: "BRLA", toCode: "USDT", fromCcy: "BRL", toCcy: "USD" },
  usd2brl: { fromCode: "USDT", toCode: "BRLA", fromCcy: "USD", toCcy: "BRL" },
};
const SYMBOL: Record<"BRL" | "USD", string> = { BRL: "R$", USD: "US$" };
const LEDGER_DP: Record<string, number> = { BRLA: 2, USDT: 6 };
const REFRESH_MS = 15_000;

const fmtMoney = (n: number, ccy: "BRL" | "USD") =>
  `${SYMBOL[ccy]} ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtRate = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 4 });

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

function CurrencyChip({ ccy }: { ccy: "BRL" | "USD" }) {
  return (
    <div className="flex shrink-0 items-center gap-2 rounded-full bg-ink-700 py-1.5 pr-3.5 pl-1.5 ring-1 ring-foreground/10">
      {ccy === "BRL" ? <BrlFlag /> : <UsdFlag />}
      <span className="text-sm font-bold text-warm-100">{ccy}</span>
    </div>
  );
}

export function ConvertForm({ balances, rates: initialRates }: { balances: Record<string, number>; rates: Rates | null }) {
  const [dir, setDir] = useState<Dir>("brl2usd");
  const [amount, setAmount] = useState("");
  const [rates, setRates] = useState<Rates | null>(initialRates);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<{ message: string; action?: "mfa" } | null>(null);
  const [done, setDone] = useState<{ status: "ok"; out: number; toCcy: "BRL" | "USD" } | { status: "pending" } | null>(null);

  // Live rates: keep the estimate accurate while the form is open (task: refresh every X seconds).
  useEffect(() => {
    const iv = setInterval(() => { fetchRatesAction().then((r) => r && setRates(r)); }, REFRESH_MS);
    return () => clearInterval(iv);
  }, []);

  // Stable idem key per intent; cleared on confirmed success, kept on an uncertain outcome.
  const idemRef = useRef<{ intent: string; key: string } | null>(null);
  function idemFor(intent: string): string {
    if (idemRef.current?.intent !== intent) idemRef.current = { intent, key: crypto.randomUUID() };
    return idemRef.current.key;
  }

  const leg = LEG[dir];
  const available = (balances[leg.fromCode] ?? 0) / 10 ** (LEDGER_DP[leg.fromCode] ?? 2);
  const amountNum = Number(amount.replace(",", "."));
  const validAmount = Number.isFinite(amountNum) && amountNum > 0;
  const overBalance = validAmount && amountNum > available + 1e-9;

  // The rate used for this direction: buy when spending BRL for USD, sell when spending USD for BRL.
  const rate = dir === "brl2usd" ? (rates?.brlUsd.buy ?? rates?.brlUsd.mid ?? null) : (rates?.brlUsd.sell ?? rates?.brlUsd.mid ?? null);
  const estimate = useMemo(() => {
    if (!validAmount || !rate) return null;
    return dir === "brl2usd" ? amountNum / rate : amountNum * rate;
  }, [validAmount, rate, dir, amountNum]);

  function swap() {
    setDir((d) => (d === "brl2usd" ? "usd2brl" : "brl2usd"));
    setAmount("");
    setError(null);
  }

  async function submit() {
    if (!validAmount || overBalance || submitting) return;
    setSubmitting(true);
    setError(null);
    const res = await convertAction({
      from: leg.fromCode, to: leg.toCode, amount: amount.replace(",", "."), idemKey: idemFor(`${dir}:${amount}`),
    });
    setSubmitting(false);
    if (res.ok && res.data.state !== "created" && res.data.destAmount != null) {
      idemRef.current = null; // confirmed — next convert mints a fresh key
      setDone({ status: "ok", out: res.data.destAmount / 10 ** (LEDGER_DP[leg.toCode] ?? 2), toCcy: leg.toCcy });
    } else if (res.ok || res.error === "convert_pending_reconcile") {
      setDone({ status: "pending" }); // keep the idem key: a retry replays, never double-swaps
    } else {
      setError(friendlyError(res.error));
    }
  }

  if (done) {
    return (
      <div className="rounded-[22px] bg-ink-800 p-6 ring-1 ring-foreground/10">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="size-6 text-emerald-400" aria-hidden />
          <h2 className="font-display text-lg font-bold">Conversão em processamento</h2>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-warm-300">
          {done.status === "ok" ? (
            <>Você receberá aproximadamente <strong className="text-warm-100">{fmtMoney(done.out, done.toCcy)}</strong>. O
              saldo é atualizado assim que a operação é confirmada (poucos segundos).</>
          ) : (
            <>Estamos confirmando sua conversão. Acompanhe o resultado em Transações; o saldo é atualizado ao confirmar.</>
          )}
        </p>
        <div className="mt-5 flex gap-2.5">
          <Link href="/app/transactions" className="inline-flex min-h-11 items-center rounded-xl bg-ink-700 px-4 text-sm font-semibold text-bone-100 ring-1 ring-foreground/15 transition-colors hover:bg-ink-600">
            Ver transações
          </Link>
          <button type="button" onClick={() => { setAmount(""); setDone(null); idemRef.current = null; }}
            className="inline-flex min-h-11 cursor-pointer items-center rounded-xl bg-gold-500 px-4 text-sm font-bold text-ink-900 transition-colors hover:bg-gold-400">
            Nova conversão
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[22px] bg-ink-800 p-5 ring-1 ring-foreground/10 sm:p-6">
      {/* Paired panels with a center swap control */}
      <div className="relative">
        {/* From */}
        <div className="rounded-2xl bg-ink-900 p-4 ring-1 ring-foreground/10 focus-within:ring-gold-500/40">
          <div className="flex items-center justify-between text-xs">
            <span className="text-warm-400">Você converte</span>
            <button type="button" onClick={() => { setAmount(available.toFixed(LEDGER_DP[leg.fromCode] ?? 2)); setError(null); }}
              className="cursor-pointer font-semibold text-gold-500 transition-colors hover:text-gold-400">
              Máx · {fmtMoney(available, leg.fromCcy)}
            </button>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <input
              aria-label={`Valor em ${leg.fromCcy}`}
              inputMode="decimal"
              placeholder="0,00"
              value={amount}
              onChange={(e) => { setAmount(e.target.value.replace(/[^\d.,]/g, "")); setError(null); }}
              className="min-w-0 flex-1 bg-transparent font-display text-[28px] tabular-nums text-warm-100 outline-none placeholder:text-warm-600"
            />
            <CurrencyChip ccy={leg.fromCcy} />
          </div>
        </div>

        {/* Swap direction */}
        <div className="relative z-10 -my-3 flex justify-center">
          <button
            type="button"
            onClick={swap}
            aria-label="Inverter direção"
            className="flex size-10 cursor-pointer items-center justify-center rounded-full bg-gold-500 text-ink-900 ring-4 ring-ink-800 transition-transform hover:rotate-180 motion-reduce:hover:rotate-0"
          >
            <ArrowUpDown className="size-4" aria-hidden />
          </button>
        </div>

        {/* To (estimated) */}
        <div className="rounded-2xl bg-ink-900 p-4 ring-1 ring-foreground/10">
          <span className="text-xs text-warm-400">Você recebe · estimado</span>
          <div className="mt-2 flex items-center gap-3">
            <span className={cn("min-w-0 flex-1 truncate font-display text-[28px] tabular-nums", estimate !== null ? "text-warm-100" : "text-warm-600")}>
              {estimate !== null ? estimate.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0,00"}
            </span>
            <CurrencyChip ccy={leg.toCcy} />
          </div>
        </div>
      </div>

      {/* Live rate line */}
      <div className="mt-4 flex items-center justify-between rounded-xl bg-ink-900/50 px-3.5 py-2.5 text-xs">
        <span className="flex items-center gap-1.5 text-warm-300">
          <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" aria-hidden />
          {rate ? <>1 USD = <span className="font-mono tabular-nums text-warm-100">R$ {fmtRate(rate)}</span></> : "Taxa indisponível"}
        </span>
        <span className="text-warm-500">Atualiza a cada 15s · sem tarifas</span>
      </div>

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
        disabled={!validAmount || overBalance || submitting}
        className="mt-5 inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gold-500 px-4 text-sm font-bold text-ink-900 transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Repeat className="size-4" aria-hidden />
        {submitting ? "Convertendo…" : "Converter"}
      </button>
    </div>
  );
}

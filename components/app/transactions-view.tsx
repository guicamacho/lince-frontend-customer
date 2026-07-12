"use client";

import { Fragment, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowDownLeft,
  ArrowUp,
  ArrowUpDown,
  ArrowUpRight,
  ChevronDown,
  Download,
  ReceiptText,
  Repeat,
} from "lucide-react";
import type { Transaction, TxType } from "@/lib/lince-api";
import { cn } from "@/lib/utils";

/**
 * Customer Transações list + client-side CSV export (F3). Reuses the home tx-table visual contract
 * (icon chip + title, right-aligned font-display tabular-nums amount). Every number is a ledger minor
 * unit formatted locally — no sample-home figures ship. Fees are shown itemized (each Avenia
 * appliedFees[] line + the Lince rebate line); NEVER a blended FX rate (Modelo A). Status copy is
 * neutral/tipping-off-safe.
 */

const TYPE: Record<TxType, { label: string; icon: typeof Repeat }> = {
  deposit: { label: "Depósito", icon: ArrowDownLeft },
  convert_and_send: { label: "Conversão", icon: Repeat },
  payout: { label: "Pagamento", icon: ArrowUpRight },
};

// Neutral, tipping-off-safe status copy keyed on the Avenia ticket lifecycle. A held/failed ticket
// never surfaces an AML/screening reason. Color is a second signal only — the label always shows.
const STATUS: Record<string, { label: string; className: string }> = {
  UNPAID: { label: "Aguardando", className: "text-warm-400" },
  PROCESSING: { label: "Processando", className: "text-sky-500" },
  PAID: { label: "Concluída", className: "text-emerald-500" },
  FAILED: { label: "Não concluída — fale com o suporte", className: "text-clay-500" },
  PARTIAL_FAILED: { label: "Parcialmente concluída", className: "text-clay-500" },
};

function statusInfo(t: Transaction): { label: string; className: string } {
  const key = t.status?.toUpperCase().replace(/-/g, "_");
  return STATUS[key] ?? { label: t.statusLabel ?? "Em processamento", className: "text-warm-400" };
}

// Stablecoin / underlying leg vs the counter (usually R$). BRLA/USDC/USDT are "held"; the other side
// is the R$ column. Both legs always render so no data is hidden.
const STABLE = new Set(["USDC", "USDT", "BRLA"]);
interface Leg {
  amount: number;
  ccy: string;
}
function legs(t: Transaction): { held: Leg; counter: Leg } {
  const source: Leg = { amount: t.sourceAmount, ccy: t.sourceCurrency };
  const dest: Leg = { amount: t.destAmount, ccy: t.destCurrency };
  const held = STABLE.has(dest.ccy) && !STABLE.has(source.ccy) ? dest : source;
  const counter = held === source ? dest : source;
  return { held, counter };
}

function decimalsFor(ccy: string): number {
  return ccy === "USDC" || ccy === "USDT" ? 6 : 2;
}
// formatMinor: minor units -> pt-BR string. BRL/USD/BRLA 2dp, USDC/USDT 6dp (ties to the ledger).
// ponytail: number math is exact for display-scale amounts (< 2^53 minor units); BigInt only if
// balances ever exceed that.
function formatMinor(minor: number, ccy: string): string {
  const d = decimalsFor(ccy);
  return (minor / 10 ** d).toLocaleString("pt-BR", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
}
function formatAmount(minor: number, ccy: string): string {
  return `${formatMinor(minor, ccy)} ${ccy}`;
}

// Pinned to BRT so the server (UTC) and client renders agree — no hydration mismatch on this client
// component; matches ops timezone.
const DATE_FMT = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});
function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : DATE_FMT.format(d);
}

function heldValue(t: Transaction): number {
  const { held } = legs(t);
  return held.amount / 10 ** decimalsFor(held.ccy);
}

type SortKey = "date" | "held";
type SortDir = "asc" | "desc";

// compact = dashboard embed: drop the count + CSV-export bar (this is a dashboard, not the full page).
export function TransactionsView({ transactions, compact = false }: { transactions: Transaction[]; compact?: boolean }) {
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const sorted = useMemo(() => {
    const arr = [...transactions];
    arr.sort((a, b) => {
      // ponytail: held-value sort compares raw magnitudes across currencies — good enough for a v1
      // client sort; add per-currency grouping if users ask.
      const cmp =
        sortKey === "date"
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          : heldValue(a) - heldValue(b);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [transactions, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function toggleRow(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function ariaSort(key: SortKey): "ascending" | "descending" | "none" {
    if (key !== sortKey) return "none";
    return sortDir === "asc" ? "ascending" : "descending";
  }

  function exportCsv() {
    const header = [
      "Tipo",
      "Status",
      "Valor retido",
      "R$",
      "Taxas",
      "Tarifa Lince",
      "Beneficiário",
      "Data",
      "Ref.",
      "Cotação",
    ];
    const lines = sorted.map((t) => {
      const { held, counter } = legs(t);
      return [
        TYPE[t.type].label,
        statusInfo(t).label,
        formatAmount(held.amount, held.ccy),
        formatAmount(counter.amount, counter.ccy),
        t.fees.map((f) => `${f.label}: ${formatAmount(f.amount, f.currency)}`).join("; "),
        t.rebate ? `${t.rebate.label ?? "Tarifa Lince"}: ${formatAmount(t.rebate.amount, t.rebate.currency)}` : "",
        t.beneficiaryLabel ?? "",
        formatDate(t.createdAt),
        t.vendorRef ?? "",
        quoteText(t),
      ]
        .map(csvCell)
        .join(",");
    });
    const csv = [header.map(csvCell).join(","), ...lines].join("\r\n");
    // Prepend a BOM so Excel reads the pt-BR UTF-8 correctly.
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transacoes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-[18px] bg-ink-800 p-10 text-center ring-1 ring-foreground/10">
        <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-ink-700 text-warm-400">
          <ReceiptText className="size-5" aria-hidden />
        </span>
        <p className="mt-3 text-warm-300">Nenhuma transação ainda</p>
        <p className="mt-1 text-sm text-warm-500">Seus depósitos e pagamentos aparecerão aqui.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!compact && (
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-warm-400">
            {transactions.length} {transactions.length === 1 ? "transação" : "transações"}
          </div>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-[10px] bg-ink-700 px-4 text-[13px] font-semibold text-warm-100 outline-none transition-colors hover:bg-ink-600 focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Download className="size-4" aria-hidden />
            Exportar CSV
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-[18px] bg-ink-800 ring-1 ring-foreground/10">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-foreground/10 text-left text-[11px] uppercase tracking-wide text-warm-500">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">
                Tipo
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Status
              </th>
              <th scope="col" aria-sort={ariaSort("held")} className="px-4 py-3 text-right font-medium">
                <SortButton label="Valor retido" active={sortKey === "held"} dir={sortDir} align="right" onClick={() => toggleSort("held")} />
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                R$
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Beneficiário
              </th>
              <th scope="col" aria-sort={ariaSort("date")} className="px-4 py-3 font-medium">
                <SortButton label="Data" active={sortKey === "date"} dir={sortDir} onClick={() => toggleSort("date")} />
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Ref.
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-foreground/10">
            {sorted.map((t) => {
              const open = expanded.has(t.id);
              const { held, counter } = legs(t);
              const s = statusInfo(t);
              const Icon = TYPE[t.type].icon;
              const detailId = `tx-detail-${t.id}`;
              return (
                <Fragment key={t.id}>
                  <tr className="text-warm-200">
                    <td className="px-4 py-2.5">
                      <button
                        type="button"
                        onClick={() => toggleRow(t.id)}
                        aria-expanded={open}
                        aria-controls={detailId}
                        className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink-700 text-warm-300">
                          <Icon className="size-[15px]" aria-hidden />
                        </span>
                        <span className="text-[13.5px] font-semibold text-warm-100">{TYPE[t.type].label}</span>
                        <ChevronDown
                          className={cn(
                            "size-4 text-warm-500 motion-safe:transition-transform",
                            open && "rotate-180",
                          )}
                          aria-hidden
                        />
                      </button>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cn("text-[13px] font-medium", s.className)}>{s.label}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right font-display tabular-nums text-warm-100">
                      {formatAmount(held.amount, held.ccy)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right font-display tabular-nums text-warm-300">
                      {formatAmount(counter.amount, counter.ccy)}
                    </td>
                    <td className="px-4 py-2.5 text-warm-300">{t.beneficiaryLabel ?? "—"}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-warm-400">
                      {formatDate(t.createdAt)}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-warm-500">
                      <span className="block max-w-[120px] truncate" title={t.vendorRef ?? undefined}>
                        {t.vendorRef ?? "—"}
                      </span>
                    </td>
                  </tr>
                  {open && (
                    <tr id={detailId}>
                      <td colSpan={7} className="bg-ink-900/40 px-4 py-4">
                        <TxDetail t={t} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SortButton({
  label,
  active,
  dir,
  align,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  align?: "right";
  onClick: () => void;
}) {
  const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded uppercase outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        align === "right" && "flex-row-reverse",
        active ? "text-warm-100" : "hover:text-warm-300",
      )}
    >
      {label}
      <Icon className="size-3.5" aria-hidden />
    </button>
  );
}

function TxDetail({ t }: { t: Transaction }) {
  const q = t.quote;
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div>
        <div className="mb-2 text-[11px] uppercase tracking-wide text-warm-500">Taxas</div>
        <dl className="space-y-1.5">
          {t.fees.length === 0 && <div className="text-[13px] text-warm-500">Sem taxas.</div>}
          {t.fees.map((f, i) => (
            <div key={`${f.label}-${i}`} className="flex items-baseline justify-between gap-4">
              <dt className="text-[13px] text-warm-300">{f.label}</dt>
              <dd className="font-mono text-[12.5px] tabular-nums text-warm-200">
                {formatAmount(f.amount, f.currency)}
              </dd>
            </div>
          ))}
          {t.rebate && (
            <div className="flex items-baseline justify-between gap-4 border-t border-foreground/10 pt-1.5">
              <dt className="text-[13px] text-warm-300">{t.rebate.label ?? "Tarifa Lince"}</dt>
              <dd className="font-mono text-[12.5px] tabular-nums text-warm-200">
                {formatAmount(t.rebate.amount, t.rebate.currency)}
              </dd>
            </div>
          )}
        </dl>
      </div>
      {q && (
        <div>
          <div className="mb-2 text-[11px] uppercase tracking-wide text-warm-500">Cotação travada</div>
          <dl className="space-y-1.5">
            {q.pairName && <DetailRow label="Par" value={q.pairName} />}
            {q.basePrice && <DetailRow label="Cotação" value={q.basePrice} />}
            {q.sourceAmount != null && (
              <DetailRow label="Origem" value={formatAmount(q.sourceAmount, t.sourceCurrency)} />
            )}
            {q.destAmount != null && (
              <DetailRow label="Destino" value={formatAmount(q.destAmount, t.destCurrency)} />
            )}
          </dl>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-[13px] text-warm-300">{label}</dt>
      <dd className="font-mono text-[12.5px] tabular-nums text-warm-200">{value}</dd>
    </div>
  );
}

function csvCell(v: string): string {
  return `"${v.replace(/"/g, '""')}"`;
}

function quoteText(t: Transaction): string {
  const q = t.quote;
  if (!q) return "";
  const parts: string[] = [];
  if (q.pairName) parts.push(q.pairName);
  if (q.basePrice) parts.push(`cotação ${q.basePrice}`);
  if (q.sourceAmount != null) parts.push(`origem ${formatAmount(q.sourceAmount, t.sourceCurrency)}`);
  if (q.destAmount != null) parts.push(`destino ${formatAmount(q.destAmount, t.destCurrency)}`);
  return parts.join(" · ");
}

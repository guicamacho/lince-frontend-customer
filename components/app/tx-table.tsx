"use client";

import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Repeat } from "lucide-react";
import { transactions, type TxType } from "@/lib/sample-home";
import { cn } from "@/lib/utils";

/**
 * Recent transactions with Tudo / Stablecoin / Fiat tabs (mock TxTable).
 * SAMPLE rows come from lib/sample-home.
 */
const TX_ICON: Record<TxType, typeof Repeat> = {
  in: ArrowDownLeft,
  out: ArrowUpRight,
  convert: Repeat,
};

const TABS = [
  ["all", "Tudo"],
  ["crypto", "Stablecoin"],
  ["fiat", "Fiat"],
] as const;

export function TxTable() {
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("all");
  const rows = transactions.filter((t) => tab === "all" || t.category === tab);

  return (
    <div className="rounded-[18px] bg-ink-800 p-[22px] ring-1 ring-foreground/10">
      <div className="mb-4 flex items-center justify-between">
        <div className="font-display text-[19px] font-bold">Transações recentes</div>
        <div className="inline-flex gap-0.5 rounded-full bg-ink-700 p-1">
          {TABS.map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              aria-pressed={tab === k}
              className={cn(
                "cursor-pointer rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                tab === k ? "bg-ink-900 text-bone-100" : "text-warm-400 hover:text-warm-100",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        {rows.map((t, i) => {
          const Icon = TX_ICON[t.type];
          return (
            <div
              key={`${t.title}-${i}`}
              className={cn(
                "grid grid-cols-[34px_1fr_auto_auto] items-center gap-3.5 py-[13px]",
                i < rows.length - 1 && "border-b border-foreground/10",
              )}
            >
              <span className="flex size-[34px] items-center justify-center rounded-full bg-ink-700 text-warm-300">
                <Icon className="size-[15px]" aria-hidden />
              </span>
              <div className="min-w-0">
                <div className="truncate text-[13.5px] font-semibold">{t.title}</div>
                <div className="mt-0.5 font-mono text-[10.5px] text-warm-500">{t.meta}</div>
              </div>
              <span className="font-mono text-[11px] text-warm-500">{t.date}</span>
              <span
                className={cn(
                  "min-w-[130px] text-right font-display text-[14.5px] font-bold tabular-nums",
                  t.positive ? "text-emerald-500" : "text-bone-100",
                )}
              >
                {t.amount}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

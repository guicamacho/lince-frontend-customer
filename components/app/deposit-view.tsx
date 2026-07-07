"use client";

/**
 * Deposit details: PIX copia-e-cola + on-chain wallet addresses.
 * Data comes from GET /app/deposit-details (Avenia account-info for the org's
 * subaccount). Copy is the primary action — every value gets its own button.
 */
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { DepositDetails } from "@/lib/lince-api";

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      aria-label={label}
      className="cursor-pointer"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? <Check className="text-emerald-500" /> : <Copy />}
      {copied ? "Copiado" : "Copiar"}
    </Button>
  );
}

export function DepositView({ details }: { details: DepositDetails }) {
  return (
    <div className="space-y-6">
      <Card className="gap-4 p-6">
        <div>
          <h2 className="font-medium text-warm-200">Depósito via PIX</h2>
          <p className="mt-1 text-sm text-warm-400">
            Copie o código abaixo e pague no app do seu banco. O saldo entra como R$ (BRLA).
          </p>
        </div>
        {details.brCode ? (
          <>
            <div className="rounded-lg border border-ink-500 bg-ink-800 p-4">
              <p className="font-mono text-xs leading-relaxed break-all text-warm-300">{details.brCode}</p>
            </div>
            <div className="flex items-center justify-between gap-4">
              <CopyButton value={details.brCode} label="Copiar código PIX copia e cola" />
              {details.pixKey && (
                <div className="flex min-w-0 items-center gap-2 text-sm">
                  <span className="shrink-0 text-warm-500">Chave PIX:</span>
                  <span className="truncate font-mono text-xs text-warm-300">{details.pixKey}</span>
                  <CopyButton value={details.pixKey} label="Copiar chave PIX" />
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-warm-500">Dados de PIX indisponíveis no momento.</p>
        )}
      </Card>

      {details.wallets.length > 0 && (
        <Card className="gap-4 p-6">
          <div>
            <h2 className="font-medium text-warm-200">Depósito em stablecoin (on-chain)</h2>
            <p className="mt-1 text-sm text-warm-400">
              Envie apenas stablecoins suportadas, na rede correspondente ao endereço. Envios em
              outra rede podem ser perdidos.
            </p>
          </div>
          <ul className="divide-y divide-ink-500 rounded-lg border border-ink-500">
            {details.wallets.map((w) => (
              <li key={w.chain} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="text-xs font-medium tracking-wide text-warm-500 uppercase">{w.chain}</p>
                  <p className="mt-1 truncate font-mono text-xs text-warm-300">{w.address}</p>
                </div>
                <CopyButton value={w.address} label={`Copiar endereço ${w.chain}`} />
              </li>
            ))}
          </ul>
        </Card>
      )}

      <p className="text-xs text-warm-500">
        Conta custodiada pela Avenia. Os valores depositados ficam disponíveis assim que a
        transação for confirmada.
      </p>
    </div>
  );
}

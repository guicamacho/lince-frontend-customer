"use client";

/**
 * Amount-specific PIX deposit: valor -> quote+ticket -> brCode to pay.
 * The idemKey is generated per "session" of the form and rotated after each successful
 * ticket, so a double-click replays the SAME ticket instead of creating two.
 */
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createDepositAction } from "@/app/app/deposit/actions";
import type { DepositReceipt } from "@/lib/lince-api";

function centavos(minor: number): string {
  return (minor / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function DepositForm() {
  const [amount, setAmount] = useState("");
  const [idemKey, setIdemKey] = useState(() => crypto.randomUUID());
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<DepositReceipt | null>(null);
  const [copied, setCopied] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const result = await createDepositAction({ amountBrl: amount, idemKey });
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setReceipt(result.receipt);
    setIdemKey(crypto.randomUUID()); // next submission is a new deposit
  }

  if (receipt?.brCode) {
    return (
      <Card className="gap-4 p-6">
        <div>
          <h2 className="font-medium text-warm-200">Depósito gerado</h2>
          <p className="mt-1 text-sm text-warm-400">
            Pague {centavos(receipt.sourceAmount)} com o código abaixo.
            {receipt.destAmount !== null && <> Você recebe {centavos(receipt.destAmount)} após as taxas.</>}
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="self-center rounded-lg bg-white p-3 sm:self-start" aria-label="QR Code Pix">
            <QRCodeSVG value={receipt.brCode} size={164} marginSize={0} />
          </div>
          <div className="min-w-0 flex-1 rounded-lg border border-ink-500 bg-ink-800 p-4">
            <p className="font-mono text-xs leading-relaxed break-all text-warm-300">{receipt.brCode}</p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Copiar código PIX do depósito"
            className="cursor-pointer"
            onClick={async () => {
              await navigator.clipboard.writeText(receipt.brCode!);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? <Check className="text-emerald-500" /> : <Copy />}
            {copied ? "Copiado" : "Copiar código"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="cursor-pointer"
            onClick={() => {
              setReceipt(null);
              setAmount("");
            }}
          >
            Novo depósito
          </Button>
        </div>
        <p className="text-xs text-warm-500">
          Acompanhe a confirmação em Transações. O código expira; se passar do prazo, gere um novo.
        </p>
      </Card>
    );
  }

  return (
    <Card className="gap-4 p-6">
      <div>
        <h2 className="font-medium text-warm-200">Depositar um valor</h2>
        <p className="mt-1 text-sm text-warm-400">
          Informe quanto quer depositar e pague o PIX gerado. As taxas aparecem antes do pagamento.
        </p>
      </div>
      <form onSubmit={submit} className="flex items-end gap-3">
        <div className="flex-1">
          <label htmlFor="deposit-amount" className="text-xs font-medium tracking-wide text-warm-500 uppercase">
            Valor (R$)
          </label>
          <input
            id="deposit-amount"
            inputMode="decimal"
            placeholder="250,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-ink-500 bg-ink-800 px-3 py-2 text-sm text-warm-200 outline-none placeholder:text-warm-600 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
        <Button type="submit" disabled={pending} className="cursor-pointer">
          {pending ? "Gerando…" : "Gerar PIX"}
        </Button>
      </form>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </Card>
  );
}

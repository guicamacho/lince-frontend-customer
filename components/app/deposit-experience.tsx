"use client";

/**
 * Deposit flow — currency-first (competitor-standard IA: pick asset → pick network →
 * get address/QR + warnings). Product decisions 2026-07-10:
 *  - PIX leads with the AMOUNT-FREE static copia-e-cola (any value; per-company routing
 *    rides in the QR's txid). Amount-specific QR is the secondary, collapsed option.
 *  - The bare chave PIX is deliberately NOT shown: a key typed by hand carries no routing
 *    txid (attribution risk — pending Avenia confirmation).
 *  - Crypto: stablecoin → network → address, with wrong-network loss warning.
 * Icons: official marks from Simple Icons (Tether/Polygon/Ethereum); USDC/TRON/BRLA use
 * neutral monogram badges (no official vector available without a new dependency).
 */
import { useState } from "react";
import { Check, Copy, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DepositForm } from "@/components/app/deposit-form";
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

// --- currency identity (SVG marks; monogram badges where no official vector exists) ---

function BrazilFlag() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" role="img" aria-label="Brasil">
      <rect width="24" height="24" rx="12" fill="#009C3B" />
      <path d="M12 4.5 20.5 12 12 19.5 3.5 12Z" fill="#FFDF00" />
      <circle cx="12" cy="12" r="3.6" fill="#002776" />
    </svg>
  );
}

function TetherMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" role="img" aria-label="Tether">
      <circle cx="12" cy="12" r="12" fill="#50AF95" />
      <path
        fill="#fff"
        transform="translate(4.8 4.8) scale(0.6)"
        d="M18.7538 10.5176c0 .6251-2.2379 1.1483-5.2381 1.2812l.0028.0007c-.0848.0064-.5233.0325-1.5012.0325-.7778 0-1.33-.0233-1.5237-.0325-3.0059-.1322-5.2495-.6555-5.2495-1.2819s2.2436-1.149 5.2495-1.2834v2.0442c.1965.0142.7594.0474 1.5372.0474.9334 0 1.4008-.0389 1.4849-.0466V9.2356c2.9994.1337 5.2381.657 5.2381 1.282zm5.19.5466L12.1248 22.389a.1803.1803 0 0 1-.2496 0L.0562 11.0635a.1781.1781 0 0 1-.0382-.2079l4.3762-9.1921a.1767.1767 0 0 1 .1626-.1026h14.8878a.1768.1768 0 0 1 .1612.1032l4.3762 9.1922a.1782.1782 0 0 1-.0382.2079z"
      />
    </svg>
  );
}

function Monogram({ text, bg }: { text: string; bg: string }) {
  return (
    <span
      className="flex size-6 items-center justify-center rounded-full text-[9px] font-bold text-white"
      style={{ backgroundColor: bg }}
      aria-hidden
    >
      {text}
    </span>
  );
}

// --- catalog: what can be deposited, over which rails (Avenia supported-assets table) ---

type CurrencyId = "BRL" | "BRLA" | "USDT" | "USDC";

const CURRENCIES: Array<{
  id: CurrencyId;
  name: string;
  group: "fiat" | "crypto";
  icon: React.ReactNode;
  networks: Array<{ label: string; family: "TRON" | "EVM" }>;
}> = [
  { id: "BRL", name: "Real brasileiro · PIX", group: "fiat", icon: <BrazilFlag />, networks: [] },
  {
    id: "USDT",
    name: "Tether USD",
    group: "crypto",
    icon: <TetherMark />,
    // Protocol + human name (Binance/Bitso convention: users match the SOURCE platform's
    // network label, so both spellings must be visible).
    networks: [
      { label: "TRON (TRC-20)", family: "TRON" },
      { label: "Polygon", family: "EVM" },
      { label: "Ethereum (ERC-20)", family: "EVM" },
    ],
  },
  {
    id: "USDC",
    name: "USD Coin",
    group: "crypto",
    icon: <Monogram text="USDC" bg="#2775CA" />,
    networks: [
      { label: "Polygon", family: "EVM" },
      { label: "Ethereum (ERC-20)", family: "EVM" },
      { label: "Base", family: "EVM" },
    ],
  },
  {
    id: "BRLA",
    name: "BRLA (real digital)",
    group: "crypto",
    icon: <Monogram text="R$" bg="#f2a93c" />,
    networks: [
      { label: "Polygon", family: "EVM" },
      { label: "Ethereum", family: "EVM" },
    ],
  },
];

export function DepositExperience({ details }: { details: DepositDetails }) {
  const [currencyId, setCurrencyId] = useState<CurrencyId>("BRL");
  const currency = CURRENCIES.find((c) => c.id === currencyId)!;
  const [networkIdx, setNetworkIdx] = useState(0);
  const network = currency.networks[Math.min(networkIdx, Math.max(currency.networks.length - 1, 0))];
  const address = network ? (details.wallets.find((w) => w.chain === network.family)?.address ?? null) : null;

  return (
    <div className="space-y-6">
      <Card className="gap-4 p-6">
        <div>
          <h2 className="font-medium text-warm-200">O que você vai depositar?</h2>
          <p className="mt-1 text-sm text-warm-400">Escolha a moeda; mostramos o caminho certo.</p>
        </div>
        {(["fiat", "crypto"] as const).map((group) => (
          <div key={group}>
            <p className="mb-2 text-xs font-medium tracking-wide text-warm-500 uppercase">
              {group === "fiat" ? "Reais via PIX" : "Stablecoin (on-chain)"}
            </p>
            <div className="flex flex-wrap gap-2">
              {CURRENCIES.filter((c) => c.group === group).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setCurrencyId(c.id);
                    setNetworkIdx(0);
                  }}
                  aria-pressed={c.id === currencyId}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
                    c.id === currencyId
                      ? "border-gold-500 bg-ink-700 text-warm-100"
                      : "border-ink-500 bg-ink-800 text-warm-300 hover:border-ink-400"
                  }`}
                >
                  {c.icon}
                  <span className="font-semibold">{c.id}</span>
                  <span className="hidden text-warm-500 sm:inline">{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </Card>

      {currency.id === "BRL" ? (
        <Card className="gap-4 p-6">
          <div>
            <h2 className="font-medium text-warm-200">Pix Copia e Cola — qualquer valor</h2>
            <p className="mt-1 text-sm text-warm-400">
              Copie o código e pague no app do seu banco com o valor que quiser. Cai na hora, como
              R$ na sua conta.
            </p>
          </div>
          {details.brCode ? (
            <>
              <div className="rounded-lg border border-ink-500 bg-ink-800 p-4">
                <p className="font-mono text-xs leading-relaxed break-all text-warm-300">{details.brCode}</p>
              </div>
              <div>
                <CopyButton value={details.brCode} label="Copiar código Pix" />
              </div>
              <p className="text-xs text-warm-500">
                No seu banco, o recebedor aparece como <strong>Brla Digital Ltda</strong> — a
                custodiante da sua conta (Avenia).
              </p>
            </>
          ) : (
            <p className="text-sm text-warm-500">Dados de PIX indisponíveis no momento.</p>
          )}
          <details className="group rounded-lg border border-ink-500">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm text-warm-300 transition-colors hover:text-warm-100">
              Precisa de um QR com valor definido? <span className="text-warm-500">(ex.: cobrança exata)</span>
            </summary>
            <div className="border-t border-ink-500 p-4">
              <DepositForm />
            </div>
          </details>
        </Card>
      ) : (
        <Card className="gap-4 p-6">
          <div>
            <h2 className="font-medium text-warm-200">Depósito em {currency.id}</h2>
            <p className="mt-1 text-sm text-warm-400">Escolha a rede e envie para o endereço abaixo.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {currency.networks.map((n, i) => (
              <button
                key={n.label}
                type="button"
                onClick={() => setNetworkIdx(i)}
                aria-pressed={network?.label === n.label}
                className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
                  network?.label === n.label
                    ? "border-gold-500 bg-ink-700 text-warm-100"
                    : "border-ink-500 bg-ink-800 text-warm-400 hover:border-ink-400"
                }`}
              >
                {n.label}
              </button>
            ))}
          </div>
          {address ? (
            <>
              <div>
                <p className="text-xs font-medium tracking-wide text-warm-500 uppercase">
                  Endereço · rede {network!.label}
                </p>
                <div className="mt-1 flex items-center justify-between gap-4 rounded-lg border border-ink-500 bg-ink-800 p-4">
                  <p className="min-w-0 font-mono text-xs break-all text-warm-300">{address}</p>
                  <CopyButton value={address} label={`Copiar endereço ${currency.id} na rede ${network!.label}`} />
                </div>
              </div>
              <div className="flex gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-500" aria-hidden />
                <p className="text-warm-300">
                  Envie apenas <strong>{currency.id}</strong> pela rede <strong>{network!.label}</strong>.
                  Enviar outro token, ou por outra rede, resultará em <strong>perda permanente</strong> dos
                  fundos.
                </p>
              </div>
            </>
          ) : (
            <p className="text-sm text-warm-500">Endereço indisponível no momento.</p>
          )}
        </Card>
      )}

      <p className="text-xs text-warm-500">
        Conta custodiada pela Avenia. Depósitos aparecem em Transações e no seu saldo após a
        confirmação.
      </p>
    </div>
  );
}

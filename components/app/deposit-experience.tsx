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
import { QRCodeSVG } from "qrcode.react";
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

// Official marks (spothq/cryptocurrency-icons, MIT).
function TetherMark() {
  return (
    <svg viewBox="0 0 32 32" className="size-6" role="img" aria-label="Tether USD">
      <circle cx="16" cy="16" r="16" fill="#26A17B" />
      <path
        fill="#FFF"
        d="M17.922 17.383v-.002c-.11.008-.677.042-1.942.042-1.01 0-1.721-.03-1.971-.042v.003c-3.888-.171-6.79-.848-6.79-1.658 0-.809 2.902-1.486 6.79-1.66v2.644c.254.018.982.061 1.988.061 1.207 0 1.812-.05 1.925-.06v-2.643c3.88.173 6.775.85 6.775 1.658 0 .81-2.895 1.485-6.775 1.657m0-3.59v-2.366h5.414V7.819H8.595v3.608h5.414v2.365c-4.4.202-7.709 1.074-7.709 2.118 0 1.044 3.309 1.915 7.709 2.118v7.582h3.913v-7.584c4.393-.202 7.694-1.073 7.694-2.116 0-1.043-3.301-1.914-7.694-2.117"
      />
    </svg>
  );
}

function UsdcMark() {
  return (
    <svg viewBox="0 0 32 32" className="size-6" role="img" aria-label="USD Coin">
      <circle fill="#3E73C4" cx="16" cy="16" r="16" />
      <g fill="#FFF">
        <path d="M20.022 18.124c0-2.124-1.28-2.852-3.84-3.156-1.828-.243-2.193-.728-2.193-1.578 0-.85.61-1.396 1.828-1.396 1.097 0 1.707.364 2.011 1.275a.458.458 0 00.427.303h.975a.416.416 0 00.427-.425v-.06a3.04 3.04 0 00-2.743-2.489V9.142c0-.243-.183-.425-.487-.486h-.915c-.243 0-.426.182-.487.486v1.396c-1.829.242-2.986 1.456-2.986 2.974 0 2.002 1.218 2.791 3.778 3.095 1.707.303 2.255.668 2.255 1.639 0 .97-.853 1.638-2.011 1.638-1.585 0-2.133-.667-2.316-1.578-.06-.242-.244-.364-.427-.364h-1.036a.416.416 0 00-.426.425v.06c.243 1.518 1.219 2.61 3.23 2.914v1.457c0 .242.183.425.487.485h.915c.243 0 .426-.182.487-.485V21.34c1.829-.303 3.047-1.578 3.047-3.217z" />
        <path d="M12.892 24.497c-4.754-1.7-7.192-6.98-5.424-11.653.914-2.55 2.925-4.491 5.424-5.402.244-.121.365-.303.365-.607v-.85c0-.242-.121-.424-.365-.485-.061 0-.183 0-.244.06a10.895 10.895 0 00-7.13 13.717c1.096 3.4 3.717 6.01 7.13 7.102.244.121.488 0 .548-.243.061-.06.061-.122.061-.243v-.85c0-.182-.182-.424-.365-.546zm6.46-18.936c-.244-.122-.488 0-.548.242-.061.061-.061.122-.061.243v.85c0 .243.182.485.365.607 4.754 1.7 7.192 6.98 5.424 11.653-.914 2.55-2.925 4.491-5.424 5.402-.244.121-.365.303-.365.607v.85c0 .242.121.424.365.485.061 0 .183 0 .244-.06a10.895 10.895 0 007.13-13.717c-1.096-3.46-3.778-6.07-7.13-7.162z" />
      </g>
    </svg>
  );
}

// --- catalog: what can be deposited, over which rails (Avenia supported-assets table) ---

type CurrencyId = "BRL" | "USDT" | "USDC";

const CURRENCIES: Array<{
  id: CurrencyId;
  group: "fiat" | "crypto";
  icon: React.ReactNode;
  networks: Array<{ label: string; family: "TRON" | "EVM" }>;
}> = [
  { id: "BRL", group: "fiat", icon: <BrazilFlag />, networks: [] },
  {
    id: "USDT",
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
    group: "crypto",
    icon: <UsdcMark />,
    networks: [
      { label: "Polygon", family: "EVM" },
      { label: "Ethereum (ERC-20)", family: "EVM" },
      { label: "Base", family: "EVM" },
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
                  <span className="font-semibold">{c.id === "BRL" ? "PIX" : c.id}</span>
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
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="self-center rounded-lg bg-white p-3 sm:self-start" aria-label="QR Code Pix">
                  <QRCodeSVG value={details.brCode} size={164} marginSize={0} />
                </div>
                <div className="min-w-0 flex-1 rounded-lg border border-ink-500 bg-ink-800 p-4">
                  <p className="font-mono text-xs leading-relaxed break-all text-warm-300">{details.brCode}</p>
                </div>
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

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useReverification } from "@clerk/nextjs";
import { isReverificationCancelledError } from "@clerk/nextjs/errors";
import { Loader2 } from "lucide-react";
import { RAILS, CRYPTO_NETWORKS, railByKey, type Rail, type RailGroup } from "@/lib/rails";
import { assetMark } from "@/components/app/currency-marks";
import { createBeneficiaryAction } from "@/app/app/beneficiaries/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const selectClass =
  "h-9 w-full min-w-0 cursor-pointer rounded-lg border border-input bg-transparent px-2.5 text-sm text-warm-100 outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export function BeneficiaryForm() {
  const router = useRouter();
  const [group, setGroup] = useState<RailGroup | null>(null);
  const [rail, setRail] = useState<Rail | null>(null);
  const [asset, setAsset] = useState("");
  const [network, setNetwork] = useState("");
  const [dest, setDest] = useState<Record<string, string>>({});
  const [label, setLabel] = useState("");
  const [payeeLegalName, setPayeeLegalName] = useState("");
  const [payeeCountry, setPayeeCountry] = useState("");
  const [purposeOfPayment, setPurposeOfPayment] = useState("");
  const [sourceOfFunds, setSourceOfFunds] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  const meta = rail ? railByKey(rail) : null;

  function pickGroup(g: RailGroup) {
    setGroup(g);
    setRail(null);
    setAsset("");
    setNetwork("");
    setDest({});
    setError(null);
    setSaved(false);
  }
  function pickRail(r: Rail) {
    const m = railByKey(r);
    setRail(r);
    const a = m.asset ?? m.assetOptions![0];
    setAsset(a);
    setNetwork(m.needsNetwork ? CRYPTO_NETWORKS[a]![0] : "");
    setDest({});
    setError(null);
    setSaved(false);
  }
  function pickAsset(a: string) {
    setAsset(a);
    if (meta?.needsNetwork) setNetwork(CRYPTO_NETWORKS[a]![0]);
  }

  const networks = useMemo(() => (meta?.needsNetwork ? (CRYPTO_NETWORKS[asset] ?? []) : []), [meta, asset]);

  // Step-up recovery (F8): stale-session 403s become Clerk's re-auth modal + retry.
  const createWithStepUp = useReverification(createBeneficiaryAction);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!meta) return;
    setError(null);
    // Light client-side required check; the backend is the authoritative validator.
    const missing =
      !label.trim() ||
      !payeeLegalName.trim() ||
      !purposeOfPayment.trim() ||
      (meta.asksPayeeCountry && !payeeCountry.trim()) ||
      meta.fields.some((f) => !f.optional && !String(dest[f.name] ?? "").trim());
    if (missing) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }
    setPending(true);
    let res;
    try {
      res = await createWithStepUp({
        label: label.trim(),
        rail: meta.rail,
        asset: meta.asset ?? asset,
        network: meta.needsNetwork ? network : undefined,
        payeeLegalName: payeeLegalName.trim(),
        payeeCountry: meta.asksPayeeCountry ? payeeCountry.trim().toUpperCase() : undefined,
        purposeOfPayment: purposeOfPayment.trim(),
        sourceOfFunds: sourceOfFunds.trim() || undefined,
        destination: Object.fromEntries(
          meta.fields.map((f) => [f.name, String(dest[f.name] ?? "").trim()]).filter(([, v]) => v),
        ),
      });
    } catch (e2) {
      setPending(false);
      setError(
        isReverificationCancelledError(e2)
          ? "Confirmação de identidade cancelada. O beneficiário não foi salvo."
          : "Não foi possível salvar o beneficiário. Tente novamente.",
      );
      return;
    }
    setPending(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    setGroup(null);
    setRail(null);
    setLabel("");
    setPayeeLegalName("");
    setPayeeCountry("");
    setPurposeOfPayment("");
    setSourceOfFunds("");
    setDest({});
    setSaved(true);
    router.refresh();
  }

  return (
    <Card className="border-ink-500 bg-ink-700">
      <CardHeader>
        <CardTitle className="font-display text-xl">Novo beneficiário</CardTitle>
        <CardDescription className="text-warm-300">
          Um endereço na sua agenda de pagamentos — fiat ou cripto. Os dados são exigidos para
          conformidade (travel rule).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6" noValidate>
          <div className="space-y-2">
            <Label htmlFor="label">Apelido</Label>
            <Input id="label" placeholder="Ex.: Fornecedor X" value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>

          {/* 1 · fiat vs crypto */}
          <div className="space-y-2">
            <Label>Tipo de destino</Label>
            <div className="grid grid-cols-2 gap-2">
              {(["fiat", "crypto"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  aria-pressed={group === g}
                  onClick={() => pickGroup(g)}
                  className={cn(
                    "cursor-pointer rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                    group === g
                      ? "border-gold-400/40 bg-gold-400/10 text-gold-300"
                      : "border-ink-500 bg-ink-800 text-warm-300 hover:text-warm-100",
                  )}
                >
                  {g === "fiat" ? "Fiat (banco / PIX)" : "Cripto (stablecoin)"}
                </button>
              ))}
            </div>
          </div>

          {/* 2 · rail chips */}
          {group && (
            <div className="space-y-2">
              <Label>Rede / rail</Label>
              <div className="flex flex-wrap gap-2">
                {RAILS.filter((r) => r.group === group).map((r) => (
                  <button
                    key={r.rail}
                    type="button"
                    aria-pressed={rail === r.rail}
                    onClick={() => pickRail(r.rail)}
                    className={cn(
                      "flex min-w-[7rem] flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                      rail === r.rail
                        ? "border-gold-400/40 bg-gold-400/10"
                        : "border-ink-500 bg-ink-800 hover:border-ink-600",
                    )}
                  >
                    <span className={cn("text-sm font-semibold", rail === r.rail ? "text-gold-300" : "text-warm-200")}>
                      {r.label}
                    </span>
                    <span className="text-xs text-warm-500">{r.sub}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3 · asset / network + destination fields */}
          {meta && (
            <fieldset className="space-y-4 rounded-lg border border-ink-500 p-4">
              <legend className="flex items-center gap-2 px-1 text-xs font-medium tracking-wide text-warm-500 uppercase">
                Destinatário · {meta.label}
              </legend>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="asset">Moeda</Label>
                  {meta.asset ? (
                    <div className="flex h-9 items-center gap-2 rounded-lg border border-ink-500 bg-ink-800 px-2.5 text-sm text-warm-200">
                      {assetMark(meta.asset)} {meta.asset}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {assetMark(asset)}
                      <select id="asset" value={asset} onChange={(e) => pickAsset(e.target.value)} className={selectClass}>
                        {meta.assetOptions!.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                {meta.needsNetwork && (
                  <div className="space-y-2">
                    <Label htmlFor="network">Rede</Label>
                    <select id="network" value={network} onChange={(e) => setNetwork(e.target.value)} className={selectClass}>
                      {networks.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {meta.needsNetwork && (
                <p className="rounded-lg bg-clay-500/10 px-3 py-2 text-xs leading-snug text-clay-400">
                  Confira a rede. Enviar para a rede errada resulta em perda irreversível dos fundos.
                </p>
              )}

              <div className="space-y-2">
                <Label htmlFor="payeeLegalName">Nome legal completo</Label>
                <Input id="payeeLegalName" value={payeeLegalName} onChange={(e) => setPayeeLegalName(e.target.value)} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {meta.fields.map((f) => (
                  <div key={f.name} className="space-y-2">
                    <Label htmlFor={f.name}>
                      {f.label}
                      {f.optional && <span className="text-warm-500"> (opcional)</span>}
                    </Label>
                    {f.kind === "select" ? (
                      <select
                        id={f.name}
                        value={dest[f.name] ?? ""}
                        onChange={(e) => setDest((d) => ({ ...d, [f.name]: e.target.value }))}
                        className={selectClass}
                      >
                        <option value="" disabled>
                          Selecione…
                        </option>
                        {f.options!.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        id={f.name}
                        placeholder={f.placeholder}
                        value={dest[f.name] ?? ""}
                        onChange={(e) => setDest((d) => ({ ...d, [f.name]: e.target.value }))}
                      />
                    )}
                  </div>
                ))}
                {meta.asksPayeeCountry && (
                  <div className="space-y-2">
                    <Label htmlFor="payeeCountry">País do beneficiário</Label>
                    <Input id="payeeCountry" placeholder="Ex.: SG" value={payeeCountry} onChange={(e) => setPayeeCountry(e.target.value)} />
                  </div>
                )}
              </div>
            </fieldset>
          )}

          {/* 4 · shared travel-rule */}
          {meta && (
            <fieldset className="space-y-4 rounded-lg border border-ink-500 p-4">
              <legend className="px-1 text-xs font-medium tracking-wide text-warm-500 uppercase">Pagamento</legend>
              <div className="space-y-2">
                <Label htmlFor="purposeOfPayment">Finalidade do pagamento</Label>
                <Input id="purposeOfPayment" value={purposeOfPayment} onChange={(e) => setPurposeOfPayment(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sourceOfFunds">
                  Origem dos recursos <span className="text-warm-500">(opcional)</span>
                </Label>
                <Input id="sourceOfFunds" value={sourceOfFunds} onChange={(e) => setSourceOfFunds(e.target.value)} />
              </div>
            </fieldset>
          )}

          {error && (
            <p role="alert" className="text-sm text-clay-500">
              {error}
            </p>
          )}
          {saved && (
            <p aria-live="polite" className="text-sm text-emerald-500">
              Beneficiário adicionado.
            </p>
          )}

          <Button type="submit" className="w-full cursor-pointer" disabled={pending || !meta}>
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            Adicionar beneficiário
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

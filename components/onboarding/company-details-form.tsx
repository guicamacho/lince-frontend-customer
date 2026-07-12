"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { companySchema, OPERATOR_ROLES, CNPJ_ALREADY_REGISTERED_MSG, type CompanyInput } from "@/lib/schemas";
import { bootstrapAction, lookupCnpjAction } from "@/app/onboarding/actions";
import { CircleHelp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function CompanyDetailsForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [cnpjLookup, setCnpjLookup] = useState<{ loading: boolean; note: string | null }>({
    loading: false,
    note: null,
  });
  // Manual-entry fallback (PRD-01 G19): when the Receita lookup is UNAVAILABLE (outage /
  // timeout), razão social becomes editable so the outage can't block signup. Definitive
  // negatives (CNPJ inválido/não encontrado) keep the field locked — the CNPJ is the problem.
  // Bootstrap re-validates the CNPJ but does NOT cross-check razão social against it, so the
  // field must be cleared on any lookup failure (see handleCnpjBlur error branch).
  const [manualEntry, setManualEntry] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<CompanyInput>({
    resolver: zodResolver(companySchema),
    defaultValues: { cnpj: "", razaoSocial: "", role: "" },
  });
  const cnpjField = register("cnpj");

  async function handleCnpjBlur() {
    const digits = getValues("cnpj").replace(/\D/g, "");
    if (digits.length !== 14) return;
    setCnpjLookup({ loading: true, note: null });
    const res = await lookupCnpjAction(digits);
    if ("error" in res) {
      // Clear any stale razão social from a prior successful lookup FIRST: bootstrap does not
      // re-derive the name from the CNPJ, so a leftover value would let company A's name ship
      // with company B's CNPJ. Empty + min(1) blocks submit on a definitive-negative (locked
      // field); on the outage path it gives the user a blank field to type into.
      setValue("razaoSocial", "", { shouldValidate: true, shouldDirty: true });
      setManualEntry(!!res.unavailable);
      setCnpjLookup({ loading: false, note: res.error });
      return;
    }
    setManualEntry(false);
    setValue("razaoSocial", res.razaoSocial, { shouldValidate: true, shouldDirty: true });
    // Duplicate feedback beats the situação note; submit stays enabled — the backend re-checks.
    const note = res.alreadyRegistered
      ? CNPJ_ALREADY_REGISTERED_MSG
      : res.ativa
        ? null
        : "Situação cadastral não ativa na Receita.";
    setCnpjLookup({ loading: false, note });
  }

  async function onSubmit(values: CompanyInput) {
    setServerError(null);
    const res = await bootstrapAction(values);
    if ("error" in res) {
      setServerError(res.error);
      return;
    }
    router.refresh(); // re-read /onboarding/state -> advances the shell
  }

  return (
    <Card className="min-h-[30rem] w-full max-w-md justify-center border-ink-500 bg-ink-700">
      <CardHeader>
        <CardTitle className="font-display text-2xl">Dados da empresa</CardTitle>
        <CardDescription className="text-warm-300">
          Para começar, informe os dados da sua empresa.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input
              id="cnpj"
              inputMode="numeric"
              placeholder="00.000.000/0000-00"
              aria-invalid={!!errors.cnpj}
              {...cnpjField}
              onBlur={(e) => {
                cnpjField.onBlur(e);
                void handleCnpjBlur();
              }}
            />
            {errors.cnpj && <p className="text-sm text-clay-500">{errors.cnpj.message}</p>}
            {cnpjLookup.loading && <p className="text-sm text-warm-400">Buscando dados na Receita…</p>}
            {cnpjLookup.note && <p className="text-sm text-clay-500">{cnpjLookup.note}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="razaoSocial">Razão social</Label>
            <Input
              id="razaoSocial"
              placeholder={manualEntry ? "Digite a razão social" : "Preenchido pelo CNPJ"}
              readOnly={!manualEntry}
              aria-readonly={!manualEntry}
              className={manualEntry ? undefined : "cursor-default"}
              aria-invalid={!!errors.razaoSocial}
              {...register("razaoSocial")}
            />
            {errors.razaoSocial ? (
              <p className="text-sm text-clay-500">{errors.razaoSocial.message}</p>
            ) : manualEntry ? (
              <p className="text-xs text-warm-400">Consulta indisponível — digite a razão social como no CNPJ.</p>
            ) : (
              <p className="text-xs text-warm-400">Preenchido automaticamente pela busca do CNPJ.</p>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="role">Seu cargo</Label>
              <span className="group relative inline-flex">
                <button
                  type="button"
                  aria-label="Por que pedimos seu cargo?"
                  className="inline-flex cursor-help text-warm-400 transition-colors hover:text-warm-200 focus-visible:text-warm-200 focus-visible:outline-none"
                >
                  <CircleHelp className="size-4" aria-hidden />
                </button>
                <span
                  role="tooltip"
                  className="pointer-events-none absolute bottom-full left-0 z-10 mb-2 w-56 -translate-x-2 rounded-lg border border-ink-500 bg-ink-700 px-3 py-2 text-xs leading-snug text-warm-200 opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
                >
                  Você precisa ser um representante legal da empresa para se cadastrar.
                </span>
              </span>
            </div>
            <select
              id="role"
              aria-invalid={!!errors.role}
              className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base text-warm-100 transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30"
              {...register("role")}
            >
              <option value="" disabled>
                Selecione…
              </option>
              {OPERATOR_ROLES.map((r) => (
                <option key={r} value={r} className="bg-ink-700 text-warm-100">
                  {r}
                </option>
              ))}
            </select>
            {errors.role && <p className="text-sm text-clay-500">{errors.role.message}</p>}
          </div>
          <div className="space-y-2">
            {/* pending-counsel: the three document names become real links to the
                Avenia/Lince ToS + LGPD pages once counsel finalizes them. needs-figma-reconcile. */}
            <label htmlFor="consent" className="flex items-start gap-2.5 text-sm text-warm-300">
              <input
                id="consent"
                type="checkbox"
                className="mt-0.5 size-4 shrink-0 cursor-pointer accent-gold-500"
                aria-invalid={!!errors.consentAccepted}
                {...register("consentAccepted")}
              />
              <span className="leading-snug">
                Li e aceito os <span className="text-gold-500">Termos de Serviço</span> e o{" "}
                <span className="text-gold-500">Consentimento LGPD</span>.
              </span>
            </label>
            {errors.consentAccepted && (
              <p className="text-sm text-clay-500">{errors.consentAccepted.message}</p>
            )}
          </div>
          {serverError && <p className="text-sm text-clay-500">{serverError}</p>}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Enviando…" : "Continuar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

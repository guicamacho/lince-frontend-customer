"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { beneficiarySchema, type BeneficiaryInput } from "@/lib/schemas";
import { createBeneficiaryAction } from "@/app/app/beneficiaries/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function BeneficiaryForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BeneficiaryInput>({
    resolver: zodResolver(beneficiarySchema),
    defaultValues: {
      label: "",
      payeeLegalName: "",
      payeeCountry: "",
      payeeBankPsp: "",
      payeeAccount: "",
      payeeMemo: "",
      purposeOfPayment: "",
      sourceOfFunds: "",
    },
  });

  async function onSubmit(values: BeneficiaryInput) {
    setServerError(null);
    setSaved(false);
    const res = await createBeneficiaryAction(values);
    if ("error" in res) {
      setServerError(res.error);
      return;
    }
    reset();
    setSaved(true);
    router.refresh();
  }

  // Field with the a11y wiring (label + required input + announced error).
  function field(
    name: keyof BeneficiaryInput,
    label: string,
    opts: { required?: boolean; placeholder?: string } = {},
  ) {
    const err = errors[name];
    const errId = `${name}-error`;
    return (
      <div className="space-y-2">
        <Label htmlFor={name}>
          {label}
          {!opts.required && <span className="text-warm-500"> (opcional)</span>}
        </Label>
        <Input
          id={name}
          placeholder={opts.placeholder}
          aria-required={opts.required || undefined}
          aria-invalid={!!err}
          aria-describedby={err ? errId : undefined}
          {...register(name)}
        />
        {err && (
          <p id={errId} role="alert" className="text-sm text-clay-500">
            {err.message}
          </p>
        )}
      </div>
    );
  }

  return (
    <Card className="border-ink-500 bg-ink-700">
      <CardHeader>
        <CardTitle className="font-display text-xl">Novo beneficiário</CardTitle>
        <CardDescription className="text-warm-300">
          Dados exigidos para conformidade (travel rule). Um pagamento não pode ser iniciado contra
          um beneficiário com dados incompletos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {field("label", "Apelido", { required: true, placeholder: "Ex.: Fornecedor X" })}

          <fieldset className="space-y-4 rounded-lg border border-ink-500 p-4">
            <legend className="px-1 text-xs font-medium uppercase tracking-wide text-warm-500">
              Beneficiário (destinatário)
            </legend>
            {field("payeeLegalName", "Nome legal completo", { required: true })}
            <div className="grid gap-4 sm:grid-cols-2">
              {field("payeeCountry", "País", { required: true, placeholder: "Ex.: US" })}
              {field("payeeBankPsp", "Banco / PSP", { required: true })}
            </div>
            {field("payeeAccount", "Conta / IBAN / carteira", { required: true })}
            {field("payeeMemo", "Memo / tag de destino")}
          </fieldset>

          <fieldset className="space-y-4 rounded-lg border border-ink-500 p-4">
            <legend className="px-1 text-xs font-medium uppercase tracking-wide text-warm-500">
              Pagamento
            </legend>
            {field("purposeOfPayment", "Finalidade do pagamento", { required: true })}
            {field("sourceOfFunds", "Origem dos recursos")}
          </fieldset>

          {serverError && (
            <p role="alert" className="text-sm text-clay-500">
              {serverError}
            </p>
          )}
          {saved && (
            <p aria-live="polite" className="text-sm text-emerald-500">
              Beneficiário adicionado.
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Salvando…" : "Adicionar beneficiário"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

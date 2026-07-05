"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { caseReplySchema, type CaseReplyInput } from "@/lib/schemas";
import { createCaseReplyAction } from "@/app/app/avisos/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

// Textarea styling via the access-dialog inputClass idiom (no Textarea primitive in this app).
const inputClass =
  "w-full rounded-lg border border-input bg-input/30 px-3 py-2 text-sm text-warm-100 outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 disabled:cursor-not-allowed disabled:opacity-50";

export function CaseReplyForm({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CaseReplyInput>({
    resolver: zodResolver(caseReplySchema),
    defaultValues: { body: "" },
  });

  async function onSubmit(values: CaseReplyInput) {
    setServerError(null);
    const res = await createCaseReplyAction(caseId, values);
    if ("error" in res) {
      setServerError(res.error);
      return;
    }
    reset();
    router.refresh(); // re-fetches the thread → the new message appears in the list
  }

  const err = errors.body;
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
      <div className="space-y-2">
        <Label htmlFor="reply-body">Responder</Label>
        <textarea
          id="reply-body"
          rows={4}
          placeholder="Escreva sua mensagem…"
          aria-required
          aria-invalid={!!err}
          aria-describedby={err ? "reply-body-error" : undefined}
          disabled={isSubmitting}
          className={inputClass}
          {...register("body")}
        />
        {err && (
          <p id="reply-body-error" role="alert" className="text-sm text-clay-500">
            {err.message}
          </p>
        )}
      </div>

      {serverError && (
        <p role="alert" className="text-sm text-clay-500">
          {serverError}
        </p>
      )}

      <Button type="submit" className="min-h-11 px-5" disabled={isSubmitting}>
        {isSubmitting ? "Enviando…" : "Enviar resposta"}
      </Button>
    </form>
  );
}

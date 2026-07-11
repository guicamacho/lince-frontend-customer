"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Paperclip, FileText, Loader2, Info } from "lucide-react";
import type { DocumentRef } from "@/lib/lince-api";
import { uploadDocumentAction } from "@/app/app/avisos/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp";

function sizeLabel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

const STATUS: Record<DocumentRef["status"], { label: string; cls: string }> = {
  received: { label: "Recebido", cls: "text-emerald-400" },
  forwarded: { label: "Encaminhado", cls: "text-emerald-400" },
  failed: { label: "Falha no envio", cls: "text-rose-400" },
};

export function DocumentUpload({ caseId, documents }: { caseId: string; documents: DocumentRef[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError("Selecione um arquivo.");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    startTransition(async () => {
      const res = await uploadDocumentAction(caseId, formData);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setFileName(null);
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    });
  }

  return (
    <div className="rounded-[18px] bg-ink-800 p-[22px] ring-1 ring-foreground/10">
      <h2 className="font-medium text-warm-200">Documentos</h2>

      {/* preparation notice — documents are not yet forwarded automatically (Didit pending). Remove
          when DIDIT_DOCUMENTS_LIVE flips on. */}
      <p className="mt-2 flex items-start gap-2 rounded-lg bg-gold-500/10 px-3 py-2 text-xs leading-snug text-gold-300 ring-1 ring-gold-500/20">
        <Info className="mt-px size-3.5 shrink-0" aria-hidden />
        <span>
          Recurso em preparação. Você pode anexar documentos aqui, mas o envio para análise ainda é
          concluído pela nossa equipe — não envie documentos sensíveis até avisarmos que está ativo.
        </span>
      </p>

      {documents.length > 0 && (
        <ul className="mt-4 space-y-2">
          {documents.map((d) => (
            <li
              key={d.id}
              className="flex items-center gap-3 rounded-lg bg-ink-700 px-3 py-2 text-sm ring-1 ring-foreground/10"
            >
              <FileText className="size-4 shrink-0 text-warm-400" aria-hidden />
              <span className="min-w-0 flex-1 truncate text-warm-200">{d.filename}</span>
              <span className="shrink-0 text-xs text-warm-500">{sizeLabel(d.sizeBytes)}</span>
              <span className={cn("shrink-0 text-xs", STATUS[d.status].cls)}>{STATUS[d.status].label}</span>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-input bg-input/30 px-3.5 text-sm text-warm-200 transition-colors hover:text-warm-100 focus-within:ring-3 focus-within:ring-ring/50">
          <Paperclip className="size-4 shrink-0" aria-hidden />
          <span className="max-w-[16rem] truncate">{fileName ?? "Escolher arquivo"}</span>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            onChange={(e) => {
              setError(null);
              setFileName(e.target.files?.[0]?.name ?? null);
            }}
          />
        </label>
        <Button type="submit" disabled={pending || !fileName} className="cursor-pointer sm:ml-auto">
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Enviar documento
        </Button>
      </form>
      <p className="mt-2 text-xs text-warm-500">PDF, JPG, PNG ou WEBP · até 15 MB.</p>
      {error && (
        <p role="alert" className="mt-2 text-sm text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
}

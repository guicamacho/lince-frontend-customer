import { TriangleAlert } from "lucide-react";

/**
 * Always-visible notice that the dashboard below is SAMPLE data. Sits at the top
 * of the home content. Remove (or gate) once the Avenia feed is wired.
 */
export function SampleBanner() {
  return (
    <div
      role="note"
      className="flex items-start gap-3 rounded-[14px] bg-gold-500/10 px-4 py-3 text-[13px] leading-snug text-gold-400 ring-1 ring-gold-500/25"
    >
      <TriangleAlert className="mt-px size-4 shrink-0" aria-hidden />
      <p>
        <span className="font-semibold">Dados de exemplo</span> — os valores abaixo são ilustrativos.
        Seus saldos reais aparecerão quando sua conta for conectada.
      </p>
    </div>
  );
}

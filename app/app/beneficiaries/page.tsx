import Link from "next/link";
import { listBeneficiaries, getMe } from "@/lib/lince-api";
import { BeneficiaryGate } from "@/components/app/beneficiary-gate";
import { assetMark } from "@/components/app/currency-marks";
import { Card } from "@/components/ui/card";
import { Lock } from "lucide-react";

const RAIL_LABEL: Record<string, string> = {
  pix: "PIX",
  ach: "ACH",
  fedwire: "Fedwire",
  sepa: "SEPA",
  swift: "SWIFT",
  crypto: "Cripto",
};

export default async function BeneficiariesPage() {
  const beneficiaries = await listBeneficiaries();
  // PRD-03: manage_beneficiaries is owner|admin|finance (not viewer). Hide the form from viewers so
  // they don't discover the 403 after submitting; the list stays visible. Backend still enforces.
  const me = await getMe();
  const canManage =
    !me.ok || me.data.roles.some((r) => r === "owner" || r === "admin" || r === "finance");

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-2xl">Beneficiários</h1>
        <p className="mt-1 text-sm text-warm-400">
          Sua agenda de destinatários — fiat e cripto. Os dados são exigidos para conformidade
          (travel rule).
        </p>
      </div>

      {beneficiaries.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-ink-500">
          <table className="w-full text-sm">
            <thead className="bg-ink-800 text-left text-xs uppercase tracking-wide text-warm-500">
              <tr>
                <th className="px-4 py-3 font-medium">Apelido</th>
                <th className="px-4 py-3 font-medium">Beneficiário</th>
                <th className="px-4 py-3 font-medium">Rail</th>
                <th className="px-4 py-3 font-medium">Destino</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3"><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-500">
              {beneficiaries.map((b) => (
                <tr key={b.id} className="text-warm-200">
                  <td className="px-4 py-3">{b.label}</td>
                  <td className="px-4 py-3">
                    {b.payee_legal_name ?? "—"}
                    {b.payee_country && <span className="ml-1.5 text-xs text-warm-500">{b.payee_country}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      {b.asset && assetMark(b.asset)}
                      <span className="text-warm-300">{b.rail ? (RAIL_LABEL[b.rail] ?? b.rail) : "—"}</span>
                      {b.network && <span className="text-xs text-warm-500">· {b.network}</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-warm-400">
                    {b.dest_hint ? `••${b.dest_hint}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {b.verification_status === "verified" ? (
                      <span className="text-xs text-emerald-500">Verificado</span>
                    ) : b.verification_status === "changed_pending" ? (
                      <span className="text-xs text-gold-500">Em verificação</span>
                    ) : (
                      <span className="text-xs text-warm-400">Aguardando verificação</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canManage && (
                      <Link
                        href={`/app/beneficiaries/${b.id}`}
                        className="text-xs text-warm-400 underline-offset-2 hover:text-warm-200 hover:underline"
                      >
                        Editar
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canManage ? (
        <BeneficiaryGate />
      ) : (
        <Card className="gap-3 p-6">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 size-5 shrink-0 text-warm-500" aria-hidden />
            <div>
              <h2 className="font-medium text-warm-200">Apenas leitura</h2>
              <p className="mt-1 text-sm text-warm-400">
                Seu papel não permite cadastrar beneficiários. Fale com um administrador da conta.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

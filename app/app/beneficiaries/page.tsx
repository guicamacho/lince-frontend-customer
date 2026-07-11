import { listBeneficiaries, getMe } from "@/lib/lince-api";
import { BeneficiaryGate } from "@/components/app/beneficiary-gate";
import { Card } from "@/components/ui/card";
import { Lock } from "lucide-react";

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
          Cadastre os destinatários dos seus pagamentos internacionais. Os dados são exigidos para
          conformidade (travel rule).
        </p>
      </div>

      {beneficiaries.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-ink-500">
          <table className="w-full text-sm">
            <thead className="bg-ink-800 text-left text-xs uppercase tracking-wide text-warm-500">
              <tr>
                <th className="px-4 py-3 font-medium">Apelido</th>
                <th className="px-4 py-3 font-medium">Beneficiário</th>
                <th className="px-4 py-3 font-medium">País</th>
                <th className="px-4 py-3 font-medium">Conta</th>
                <th className="px-4 py-3 font-medium">Finalidade</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-500">
              {beneficiaries.map((b) => (
                <tr key={b.id} className="text-warm-200">
                  <td className="px-4 py-3">{b.label}</td>
                  <td className="px-4 py-3">{b.payee_legal_name ?? "—"}</td>
                  <td className="px-4 py-3 text-warm-400">{b.payee_country ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {b.payee_account ? `••${b.payee_account.slice(-4)}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-warm-400">{b.purpose_of_payment ?? "—"}</td>
                  <td className="px-4 py-3">
                    {b.avenia_beneficiary_id ? (
                      <span className="text-xs text-emerald-500">Verificado</span>
                    ) : (
                      <span className="text-xs text-warm-400">Aguardando verificação</span>
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

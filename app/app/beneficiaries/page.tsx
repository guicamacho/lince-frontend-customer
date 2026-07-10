import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { ShieldAlert } from "lucide-react";
import { listBeneficiaries } from "@/lib/lince-api";
import { BeneficiaryForm } from "@/components/app/beneficiary-form";
import { Card } from "@/components/ui/card";

export default async function BeneficiariesPage() {
  const [beneficiaries, user] = await Promise.all([listBeneficiaries(), currentUser()]);
  // Payees are the money-out surface: 2FA is required to add one (backend enforces it too).
  // The first payee is the enrollment trigger — gate the form, don't just fail on submit.
  const mfaEnrolled = user?.twoFactorEnabled ?? false;

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

      {mfaEnrolled ? (
        <BeneficiaryForm />
      ) : (
        <Card className="gap-3 p-6">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 size-5 shrink-0 text-gold-500" aria-hidden />
            <div>
              <h2 className="font-medium text-warm-200">Ative a verificação em duas etapas</h2>
              <p className="mt-1 text-sm text-warm-400">
                Para cadastrar um beneficiário (destinatário de pagamentos), é necessário ativar a
                verificação em duas etapas na sua conta. É rápido e protege seus pagamentos.
              </p>
              <Link
                href="/app/settings"
                className="mt-3 inline-flex min-h-9 cursor-pointer items-center rounded-[10px] bg-gold-500 px-3.5 text-[13px] font-bold text-ink-900 transition-colors hover:bg-gold-400 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                Ir para Configurações
              </Link>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

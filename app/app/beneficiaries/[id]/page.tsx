import { notFound, redirect } from "next/navigation";
import { listBeneficiaries, getMe } from "@/lib/lince-api";
import { EditBeneficiaryForm } from "@/components/app/edit-beneficiary-form";

// Editar beneficiário (PRD-03 §13.2). Viewer roles are read-only — bounce them back.
export default async function EditBeneficiaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [beneficiaries, me] = await Promise.all([listBeneficiaries(), getMe()]);
  const canManage =
    !me.ok || me.data.roles.some((r) => r === "owner" || r === "admin" || r === "finance");
  if (!canManage) redirect("/app/beneficiaries");
  const beneficiary = beneficiaries.find((b) => b.id === id);
  if (!beneficiary) notFound();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-display text-2xl">Editar beneficiário</h1>
        <p className="mt-1 text-sm text-warm-400">{beneficiary.label}</p>
      </div>
      <EditBeneficiaryForm beneficiary={beneficiary} />
    </div>
  );
}

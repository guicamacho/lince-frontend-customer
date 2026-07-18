"use server";

import { reverificationError } from "@clerk/nextjs/server";
import {
  inviteTeamMember,
  resendTeamInvitation,
  changeTeamMemberRole,
  removeTeamMember,
  transferTeamOwnership,
} from "@/lib/lince-api";

// Backend error codes -> pt-BR. Unknown codes fall back to a neutral line (the backend
// never sends raw internals — audit 2026-07-11).
const MESSAGES: Record<string, string> = {
  already_member: "Este e-mail já faz parte da equipe.",
  invalid_email: "Informe um e-mail válido.",
  role_not_assignable: "Esse papel não pode ser atribuído.",
  invite_delivery_failed: "Não foi possível enviar o convite. Tente novamente em instantes.",
  owner_protected: "O proprietário não pode ser alterado ou removido. Transfira a propriedade primeiro.",
  member_not_found: "Membro não encontrado.",
  forbidden: "Você não tem permissão para esta ação.",
  transfer_target_must_be_active_admin: "A propriedade só pode ser transferida para um administrador ativo.",
  cannot_transfer_to_self: "Você já é o proprietário.",
  not_owner: "Somente o proprietário pode transferir a propriedade.",
  step_up_required: "Confirme sua identidade novamente para concluir esta ação.",
  mfa_required: "Ative a verificação em duas etapas em Configurações para alterar papéis.",
  member_not_invited: "Este membro já aceitou o convite.",
  invite_cooldown: "Aguarde um momento antes de enviar outro convite para este e-mail.",
};
const msg = (code: string) => MESSAGES[code] ?? "Não foi possível concluir. Tente novamente.";

type ActionResult = { ok: true } | { error: string };

export async function inviteMemberAction(email: string, role: string): Promise<ActionResult> {
  const res = await inviteTeamMember({ email, role });
  return res.ok ? { ok: true } : { error: msg(res.error) };
}

/** Resend flags the cooldown case so the UI can start its countdown on both success and 429. */
export async function resendInvitationAction(
  personId: string,
): Promise<{ ok: true } | { error: string; cooldown?: boolean }> {
  const res = await resendTeamInvitation(personId);
  if (res.ok) return { ok: true };
  return { error: msg(res.error), cooldown: res.error === "invite_cooldown" };
}

/** Role changes are step-up-gated on the backend (Cluster 2): step_up_required -> Clerk
 *  reverification hint, so the manager's wrapper re-auths and retries. */
export async function changeRoleAction(
  personId: string,
  role: string,
): Promise<ActionResult | ReturnType<typeof reverificationError>> {
  const res = await changeTeamMemberRole(personId, role);
  if (!res.ok && res.error === "step_up_required") return reverificationError("strict");
  return res.ok ? { ok: true } : { error: msg(res.error) };
}

export async function removeMemberAction(personId: string): Promise<ActionResult> {
  const res = await removeTeamMember(personId);
  return res.ok ? { ok: true } : { error: msg(res.error) };
}

/** step_up_required -> Clerk reverification hint (see payout-actions): the manager's
 *  useReverification wrapper re-auths and retries instead of dead-ending on the copy above. */
export async function transferOwnershipAction(
  toPersonId: string,
): Promise<ActionResult | ReturnType<typeof reverificationError>> {
  const res = await transferTeamOwnership(toPersonId);
  if (!res.ok && res.error === "step_up_required") return reverificationError("strict");
  return res.ok ? { ok: true } : { error: msg(res.error) };
}

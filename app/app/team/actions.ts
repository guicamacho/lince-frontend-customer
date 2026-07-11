"use server";

import {
  inviteTeamMember,
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
};
const msg = (code: string) => MESSAGES[code] ?? "Não foi possível concluir. Tente novamente.";

type ActionResult = { ok: true } | { error: string };

export async function inviteMemberAction(email: string, role: string): Promise<ActionResult> {
  const res = await inviteTeamMember({ email, role });
  return res.ok ? { ok: true } : { error: msg(res.error) };
}

export async function changeRoleAction(personId: string, role: string): Promise<ActionResult> {
  const res = await changeTeamMemberRole(personId, role);
  return res.ok ? { ok: true } : { error: msg(res.error) };
}

export async function removeMemberAction(personId: string): Promise<ActionResult> {
  const res = await removeTeamMember(personId);
  return res.ok ? { ok: true } : { error: msg(res.error) };
}

export async function transferOwnershipAction(toPersonId: string): Promise<ActionResult> {
  const res = await transferTeamOwnership(toPersonId);
  return res.ok ? { ok: true } : { error: msg(res.error) };
}

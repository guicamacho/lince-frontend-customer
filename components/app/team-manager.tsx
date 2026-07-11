"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Crown, Loader2, Send } from "lucide-react";
import type { AccessRole, TeamMember } from "@/lib/lince-api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  inviteMemberAction,
  resendInvitationAction,
  changeRoleAction,
  removeMemberAction,
  transferOwnershipAction,
} from "@/app/app/team/actions";

// Seconds the resend button stays disabled after a send. Keep in sync with the backend
// INVITE_COOLDOWN_SECONDS (the server is the real gate; this is just the visual countdown).
const RESEND_COOLDOWN_SECONDS = 60;

const ROLE_LABEL: Record<AccessRole, string> = {
  owner: "Proprietário",
  admin: "Administrador",
  finance: "Financeiro",
  viewer: "Visualizador",
};
const ROLE_HINT: Record<AccessRole, string> = {
  owner: "Controle total, incluindo transferência de propriedade.",
  admin: "Equipe, configurações, e movimentação de dinheiro.",
  finance: "Movimenta dinheiro e gerencia beneficiários.",
  viewer: "Apenas leitura.",
};
// admin/finance/viewer are assignable; owner only via transfer (PRD-03 §1).
const ASSIGNABLE: AccessRole[] = ["admin", "finance", "viewer"];

const roleBadgeClass: Record<AccessRole, string> = {
  owner: "border-gold-400/30 bg-gold-400/10 text-gold-300",
  admin: "border-sky-400/25 bg-sky-400/10 text-sky-300",
  finance: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
  viewer: "border-ink-500 bg-ink-700 text-warm-400",
};

function RoleBadge({ role }: { role: AccessRole }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        roleBadgeClass[role],
      )}
    >
      {role === "owner" && <Crown className="size-3" aria-hidden />}
      {ROLE_LABEL[role]}
    </span>
  );
}

function StatusPill({ status }: { status: TeamMember["status"] }) {
  if (status === "active") return null; // active is the norm — no visual noise
  const map = {
    invited: { label: "Convite pendente", cls: "bg-amber-400/10 text-amber-300" },
    suspended: { label: "Suspenso", cls: "bg-rose-400/10 text-rose-300" },
  } as const;
  const s = map[status];
  return <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", s.cls)}>{s.label}</span>;
}

export function TeamManager({ members, myRoles }: { members: TeamMember[]; myRoles: AccessRole[] }) {
  const router = useRouter();
  const canManageTeam = myRoles.includes("owner") || myRoles.includes("admin");
  const canTransfer = myRoles.includes("owner");

  return (
    <div className="space-y-8">
      {canManageTeam && <InviteForm onDone={() => router.refresh()} />}

      <Card className="gap-0 p-0">
        <div className="border-b border-ink-500 px-6 py-4">
          <h2 className="font-medium text-warm-200">Membros</h2>
        </div>
        <ul className="divide-y divide-ink-500">
          {members.map((m) => (
            <MemberRow
              key={m.personId}
              member={m}
              canManageTeam={canManageTeam}
              canTransfer={canTransfer}
              onDone={() => router.refresh()}
            />
          ))}
        </ul>
      </Card>
    </div>
  );
}

function InviteForm({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AccessRole>("finance");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);
    startTransition(async () => {
      const res = await inviteMemberAction(email.trim(), role);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setEmail("");
      setOk(true);
      onDone();
    });
  }

  return (
    <Card className="gap-4 p-6">
      <div>
        <h2 className="font-medium text-warm-200">Convidar pessoa</h2>
        <p className="mt-1 text-sm text-warm-500">Enviamos um convite por e-mail para criar o acesso.</p>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <div className="space-y-2">
            <Label htmlFor="invite-email">E-mail</Label>
            <Input
              id="invite-email"
              type="email"
              required
              autoComplete="off"
              placeholder="pessoa@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-describedby={error ? "invite-error" : undefined}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-role">Papel</Label>
            <RoleSelect id="invite-role" value={role} onChange={setRole} />
          </div>
        </div>
        <p className="text-xs text-warm-500">{ROLE_HINT[role]}</p>
        {error && (
          <p id="invite-error" role="alert" className="text-sm text-rose-400">
            {error}
          </p>
        )}
        {ok && (
          <p role="status" className="text-sm text-emerald-400">
            Convite enviado.
          </p>
        )}
        <Button type="submit" disabled={pending} className="cursor-pointer">
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <UserPlus className="size-4" aria-hidden />}
          Enviar convite
        </Button>
      </form>
    </Card>
  );
}

function RoleSelect({
  id,
  value,
  onChange,
  disabled,
  ariaLabel,
}: {
  id: string;
  value: AccessRole;
  onChange: (r: AccessRole) => void;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  return (
    <select
      id={id}
      value={value}
      disabled={disabled}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value as AccessRole)}
      className="h-9 w-full min-w-[9rem] cursor-pointer rounded-md border border-ink-500 bg-ink-800 px-3 text-sm text-warm-200 transition-colors focus-visible:border-gold-400 focus-visible:ring-2 focus-visible:ring-gold-400/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
    >
      {ASSIGNABLE.map((r) => (
        <option key={r} value={r}>
          {ROLE_LABEL[r]}
        </option>
      ))}
    </select>
  );
}

function MemberRow({
  member,
  canManageTeam,
  canTransfer,
  onDone,
}: {
  member: TeamMember;
  canManageTeam: boolean;
  canTransfer: boolean;
  onDone: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<"remove" | "transfer" | null>(null);
  const [pending, startTransition] = useTransition();
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [now, setNow] = useState(0);
  const isOwner = member.roles.includes("owner");
  const primaryRole = (member.roles[0] ?? "viewer") as AccessRole;

  // Tick once a second only while a cooldown is active (no idle timer). `now` is seeded in
  // startCooldown so the countdown is correct immediately without a setState inside the effect.
  // When the window elapses, reset cooldownUntil to 0 so the effect tears the interval down —
  // otherwise it would keep firing (and re-rendering) at 1Hz forever.
  useEffect(() => {
    if (cooldownUntil === 0) return;
    const iv = setInterval(() => {
      if (Date.now() >= cooldownUntil) setCooldownUntil(0);
      else setNow(Date.now());
    }, 1000);
    return () => clearInterval(iv);
  }, [cooldownUntil]);
  const resendLeft = cooldownUntil > now ? Math.ceil((cooldownUntil - now) / 1000) : 0;

  function startCooldown(seconds = RESEND_COOLDOWN_SECONDS) {
    setNow(Date.now());
    setCooldownUntil(Date.now() + seconds * 1000);
  }

  // Seed the countdown from the server's remaining cooldown after mount, so the button greys with
  // a live countdown from page load (e.g. right after inviting), not only after a click. Must run
  // client-side (the wall clock differs from SSR, so it can't be derived during render without a
  // hydration mismatch) — the canonical use of a mount effect, hence the targeted suppressions.
  useEffect(() => {
    if (member.cooldownRemaining <= 0) return;
    const until = Date.now() + member.cooldownRemaining * 1000;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only clock sync on mount
    setNow(Date.now());
    setCooldownUntil(until);
  }, [member.cooldownRemaining]);

  function run(fn: () => Promise<{ ok: true } | { error: string }>) {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const res = await fn();
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setConfirm(null);
      onDone();
    });
  }

  function onResend() {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const res = await resendInvitationAction(member.personId);
      if ("error" in res) {
        setError(res.error);
        if (res.cooldown) startCooldown();
        return;
      }
      setInfo("Convite reenviado.");
      startCooldown();
    });
  }

  // Owner row is protected: no role change / remove. Transfer target is an active admin only.
  const showRoleControls = canManageTeam && !isOwner;
  const canTransferToThis = canTransfer && !isOwner && member.status === "active" && member.roles.includes("admin");

  return (
    <li className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-medium text-warm-200">{member.name}</span>
          <RoleBadge role={primaryRole} />
          <StatusPill status={member.status} />
        </div>
        <p className="mt-0.5 truncate text-sm text-warm-500">{member.email}</p>
        {error && (
          <p role="alert" className="mt-1 text-sm text-rose-400">
            {error}
          </p>
        )}
        {info && !error && (
          <p role="status" className="mt-1 text-sm text-emerald-400">
            {info}
          </p>
        )}
      </div>

      {showRoleControls && (
        <div className="flex shrink-0 items-center gap-2">
          {confirm === "remove" ? (
            <ConfirmInline
              label="Remover?"
              pending={pending}
              onConfirm={() => run(() => removeMemberAction(member.personId))}
              onCancel={() => setConfirm(null)}
            />
          ) : confirm === "transfer" ? (
            <ConfirmInline
              label="Transferir propriedade?"
              pending={pending}
              onConfirm={() => run(() => transferOwnershipAction(member.personId))}
              onCancel={() => setConfirm(null)}
            />
          ) : (
            <>
              <RoleSelect
                id={`role-${member.personId}`}
                value={primaryRole}
                disabled={pending || member.status !== "active"}
                ariaLabel={`Papel de ${member.name}`}
                onChange={(r) => run(() => changeRoleAction(member.personId, r))}
              />
              {member.status === "invited" && (
                <Button
                  variant="outline"
                  className="cursor-pointer"
                  onClick={onResend}
                  disabled={pending || resendLeft > 0}
                  aria-label={`Reenviar convite para ${member.name}`}
                >
                  {pending ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <Send className="size-4" aria-hidden />
                  )}
                  {resendLeft > 0 ? `Reenviar (${resendLeft}s)` : "Reenviar"}
                </Button>
              )}
              {canTransferToThis && (
                <Button
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => setConfirm("transfer")}
                  disabled={pending}
                >
                  Tornar proprietário
                </Button>
              )}
              <Button
                variant="outline"
                className="cursor-pointer text-rose-300 hover:text-rose-200"
                onClick={() => setConfirm("remove")}
                disabled={pending}
              >
                Remover
              </Button>
            </>
          )}
        </div>
      )}
    </li>
  );
}

function ConfirmInline({
  label,
  pending,
  onConfirm,
  onCancel,
}: {
  label: string;
  pending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-warm-300">{label}</span>
      <Button autoFocus className="cursor-pointer" onClick={onConfirm} disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : "Confirmar"}
      </Button>
      <Button variant="outline" className="cursor-pointer" onClick={onCancel} disabled={pending}>
        Cancelar
      </Button>
    </div>
  );
}

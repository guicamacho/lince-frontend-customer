"use client";

/**
 * Clerk account management, re-homed into Configurações (2026-07-10) — the UserButton
 * popover/modal is gone. What's here mirrors what Clerk's modal offered that matters
 * for this app (email-OTP B2B: no password, no social): profile name + active sessions.
 * E-mail change stays a support flow for now.
 */
import { useEffect, useState } from "react";
import { useUser, useSession } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

/** The slice of Clerk's SessionWithActivities we render (typed locally — @clerk/types
 *  isn't a direct dependency). */
interface SessionRow {
  id: string;
  latestActivity?: {
    browserName?: string;
    deviceType?: string;
    isMobile?: boolean;
    city?: string;
    country?: string;
  } | null;
  revoke: () => Promise<unknown>;
}

function Field({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="min-w-56 flex-1">
      <label htmlFor={id} className="text-xs font-medium tracking-wide text-warm-500 uppercase">
        {label}
      </label>
      <input
        id={id}
        type="password"
        autoComplete={id === "current-password" ? "current-password" : "new-password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-ink-500 bg-ink-800 px-3 py-2 text-sm text-warm-200 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
    </div>
  );
}

export function PasswordForm() {
  const { user } = useUser();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);
  if (!user) return null;
  const hasPassword = user.passwordEnabled;

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        if (next.length < 8) {
          setError("A nova senha precisa de pelo menos 8 caracteres.");
          return;
        }
        if (next !== confirm) {
          setError("A confirmação não confere com a nova senha.");
          return;
        }
        setStatus("saving");
        try {
          await user.updatePassword({
            newPassword: next,
            ...(hasPassword ? { currentPassword: current } : {}),
            signOutOfOtherSessions: true,
          });
          setStatus("saved");
          setCurrent("");
          setNext("");
          setConfirm("");
          setTimeout(() => setStatus("idle"), 2500);
        } catch (err) {
          setStatus("idle");
          const clerkMessage = (err as { errors?: Array<{ longMessage?: string; message?: string }> })
            ?.errors?.[0];
          setError(clerkMessage?.longMessage ?? clerkMessage?.message ?? "Não foi possível alterar a senha agora.");
        }
      }}
    >
      <div className="flex flex-wrap gap-3">
        {hasPassword && (
          <Field id="current-password" label="Senha atual" value={current} onChange={setCurrent} />
        )}
        <Field id="new-password" label="Nova senha" value={next} onChange={setNext} />
        <Field id="confirm-password" label="Confirmar nova senha" value={confirm} onChange={setConfirm} />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" variant="outline" disabled={status === "saving"} className="cursor-pointer">
          {status === "saving" ? "Salvando…" : status === "saved" ? "Senha alterada" : hasPassword ? "Alterar senha" : "Definir senha"}
        </Button>
        <span className="text-xs text-warm-500">
          Ao alterar, suas outras sessões são encerradas automaticamente.
        </span>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </form>
  );
}

export function ActiveSessions() {
  const { user } = useUser();
  const { session: current } = useSession();
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);

  useEffect(() => {
    user
      ?.getSessions()
      .then((s) => setSessions(s as unknown as SessionRow[]))
      .catch(() => setSessions([]));
  }, [user]);

  if (!sessions) return <p className="text-sm text-warm-500">Carregando sessões…</p>;

  return (
    <ul className="divide-y divide-ink-500 rounded-lg border border-ink-500">
      {sessions.map((s) => {
        const a = s.latestActivity;
        const isCurrent = s.id === current?.id;
        return (
          <li key={s.id} className="flex items-center justify-between gap-4 p-4 text-sm">
            <div className="min-w-0">
              <p className="text-warm-200">
                {[a?.browserName, a?.deviceType ?? (a?.isMobile ? "Mobile" : "Desktop")]
                  .filter(Boolean)
                  .join(" · ") || "Dispositivo"}
                {isCurrent && <span className="ml-2 text-xs text-emerald-500">esta sessão</span>}
              </p>
              <p className="mt-0.5 truncate text-xs text-warm-500">
                {[a?.city, a?.country].filter(Boolean).join(", ") || "Localização indisponível"}
              </p>
            </div>
            {!isCurrent && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={async () => {
                  await s.revoke();
                  setSessions((prev) => prev?.filter((x) => x.id !== s.id) ?? null);
                }}
              >
                Encerrar
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

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

export function ProfileNameForm() {
  const { user } = useUser();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? "");
      setLastName(user.lastName ?? "");
    }
  }, [user]);

  if (!user) return null;

  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setStatus("saving");
        try {
          await user.update({ firstName: firstName.trim(), lastName: lastName.trim() });
          setStatus("saved");
          setTimeout(() => setStatus("idle"), 2000);
        } catch {
          setStatus("error");
        }
      }}
    >
      {(
        [
          ["Nome", firstName, setFirstName],
          ["Sobrenome", lastName, setLastName],
        ] as const
      ).map(([label, value, set]) => (
        <div key={label} className="min-w-40 flex-1">
          <label
            htmlFor={`name-${label}`}
            className="text-xs font-medium tracking-wide text-warm-500 uppercase"
          >
            {label}
          </label>
          <input
            id={`name-${label}`}
            value={value}
            onChange={(e) => set(e.target.value)}
            className="mt-1 w-full rounded-lg border border-ink-500 bg-ink-800 px-3 py-2 text-sm text-warm-200 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
      ))}
      <Button type="submit" variant="outline" disabled={status === "saving"} className="cursor-pointer">
        {status === "saving" ? "Salvando…" : status === "saved" ? "Salvo" : "Salvar nome"}
      </Button>
      {status === "error" && <p className="w-full text-sm text-red-400">Não foi possível salvar agora.</p>}
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

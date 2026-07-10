"use client";

/**
 * Two-factor (MFA) enrollment — Clerk-managed TOTP (authenticator app) + passkeys.
 * PRD-02 F3. 2FA is required to add a payee (money-out surface), so this is the enrollment
 * surface the beneficiary flow points at. SMS is intentionally NOT offered (PRD-07 ruling).
 */
import { useState } from "react";
import { useUser, useReverification } from "@clerk/nextjs";
import { QRCodeSVG } from "qrcode.react";
import { Check, KeyRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Surface Clerk's real error (reverification needed, factor not enabled in the instance, …)
 *  instead of a generic message — the cause matters (dashboard config vs. user action). A few
 *  known codes get friendly pt-BR copy; everything else falls back to Clerk's longMessage. */
function clerkError(err: unknown, fallback: string): string {
  const first = (err as { errors?: Array<{ code?: string; longMessage?: string; message?: string }> })?.errors?.[0];
  if (first?.code === "passkey_registration_cancelled") return "Cadastro de passkey cancelado. Tente novamente.";
  return first?.longMessage ?? first?.message ?? (err as { message?: string })?.message ?? fallback;
}

export function MfaSettings() {
  const { user, isLoaded } = useUser();
  if (!isLoaded || !user) return <p className="text-sm text-warm-500">Carregando…</p>;
  // Satisfied by EITHER a second factor (TOTP) OR a passkey (ruling 2026-07-10).
  const hasMfa = user.twoFactorEnabled || (user.passkeys?.length ?? 0) > 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm">
        {hasMfa ? (
          <span className="inline-flex items-center gap-1.5 text-emerald-500">
            <ShieldCheck className="size-4" aria-hidden /> Verificação em duas etapas ativa
          </span>
        ) : (
          <span className="text-warm-400">Verificação em duas etapas não configurada</span>
        )}
      </div>
      <p className="text-xs text-warm-500">
        Basta um método: app autenticador <strong>ou</strong> passkey. É exigido para cadastrar
        beneficiários (destinatários de pagamentos).
      </p>
      <TotpEnroll />
      <PasskeyEnroll />
    </div>
  );
}

function TotpEnroll() {
  const { user } = useUser();
  // useReverification wraps sensitive actions: if Clerk needs a step-up (fresh re-auth) to
  // enroll a factor, it drives that challenge instead of the call just throwing.
  const createTOTP = useReverification(() => user!.createTOTP());
  const verifyTOTPWith = useReverification((code: string) => user!.verifyTOTP({ code }));
  const createBackupCode = useReverification(() => user!.createBackupCode());
  const [uri, setUri] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enrolled = user?.totpEnabled ?? false;

  async function begin() {
    setError(null);
    setPending(true);
    try {
      const totp = await createTOTP();
      setUri(totp.uri ?? null);
      setSecret(totp.secret ?? null);
    } catch (err) {
      setError(clerkError(err, "Não foi possível iniciar a configuração."));
    } finally {
      setPending(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await verifyTOTPWith(code.trim());
      const bc = await createBackupCode();
      setBackupCodes(bc.codes ?? []);
      setUri(null);
      setSecret(null);
      setCode("");
    } catch (err) {
      setError(clerkError(err, "Código inválido. Verifique o app autenticador e tente novamente."));
    } finally {
      setPending(false);
    }
  }

  if (enrolled && !backupCodes) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-ink-500 bg-ink-800 p-4 text-sm text-warm-300">
        <Check className="size-4 text-emerald-500" aria-hidden />
        App autenticador configurado.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-ink-500 bg-ink-800 p-4">
      <h3 className="text-sm font-medium text-warm-200">App autenticador (TOTP)</h3>
      {backupCodes ? (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-emerald-500">Verificação em duas etapas ativada.</p>
          <p className="text-xs text-warm-400">
            Guarde os códigos de backup abaixo em local seguro. Eles não serão mostrados novamente.
          </p>
          <ul className="grid grid-cols-2 gap-1 rounded-lg border border-ink-500 bg-ink-900 p-3 font-mono text-xs text-warm-200">
            {backupCodes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      ) : uri ? (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-warm-400">
            Escaneie o QR com seu app autenticador (Google Authenticator, 1Password, Authy…) e
            digite o código de 6 dígitos.
          </p>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="shrink-0 self-center rounded-xl bg-white p-3" aria-label="QR de configuração">
              <QRCodeSVG value={uri} size={156} marginSize={0} />
            </div>
            <div className="min-w-0 flex-1 space-y-4">
              {secret && (
                <div>
                  <p className="text-xs font-medium tracking-wide text-warm-500 uppercase">Chave manual</p>
                  <p className="mt-1 font-mono text-xs break-all text-warm-300">{secret}</p>
                </div>
              )}
              <form onSubmit={verify} className="flex items-end gap-2">
                <div>
                  <label htmlFor="totp-code" className="text-xs font-medium tracking-wide text-warm-500 uppercase">
                    Código
                  </label>
                  <input
                    id="totp-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="000000"
                    className="mt-1 w-32 rounded-lg border border-ink-500 bg-ink-900 px-3 py-2 font-mono text-sm text-warm-200 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  />
                </div>
                <Button type="submit" variant="outline" disabled={pending || code.trim().length < 6} className="cursor-pointer">
                  {pending ? "Verificando…" : "Ativar"}
                </Button>
              </form>
            </div>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-warm-400">Use um app autenticador para gerar códigos de 6 dígitos.</p>
          <Button type="button" variant="outline" onClick={begin} disabled={pending} className="cursor-pointer">
            {pending ? "Abrindo…" : "Configurar app autenticador"}
          </Button>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      )}
    </div>
  );
}

type PasskeyLike = { id: string; name?: string | null; delete: () => Promise<unknown> };

function PasskeyEnroll() {
  const { user } = useUser();
  const createPasskey = useReverification(() => user!.createPasskey());
  // Removing a credential is reverification-gated — Clerk challenges with the account's
  // password (required below), so replacing a passkey needs e-mail + password.
  const removePasskey = useReverification((pk: PasskeyLike) => pk.delete());
  const [pending, setPending] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;
  const hasPassword = user.passwordEnabled;
  const passkeys = (user.passkeys ?? []) as unknown as PasskeyLike[];
  const current = passkeys[0]; // one passkey per account (product rule 2026-07-10)

  async function add() {
    setError(null);
    setPending(true);
    try {
      await createPasskey();
    } catch (err) {
      setError(clerkError(err, "Não foi possível criar a passkey neste dispositivo."));
    } finally {
      setPending(false);
    }
  }

  async function remove(pk: PasskeyLike) {
    setError(null);
    setBusyId(pk.id);
    try {
      await removePasskey(pk);
    } catch (err) {
      setError(clerkError(err, "Não foi possível remover a passkey."));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="rounded-lg border border-ink-500 bg-ink-800 p-4">
      <h3 className="flex items-center gap-1.5 text-sm font-medium text-warm-200">
        <KeyRound className="size-4 text-warm-400" aria-hidden /> Passkey
      </h3>

      {!hasPassword ? (
        <p className="mt-2 text-sm text-warm-400">
          Para usar passkey, <span className="text-warm-200">configure uma senha primeiro</span> (seção
          Senha acima). A senha é exigida para adicionar ou substituir uma passkey.
        </p>
      ) : current ? (
        <div className="mt-2 space-y-3">
          <p className="text-sm text-warm-400">
            Uma passkey por conta. Para trocar, remova a atual e adicione outra — a remoção exige
            e-mail e senha.
          </p>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-ink-500 bg-ink-900 p-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <KeyRound className="size-4 shrink-0 text-gold-500" aria-hidden />
              <span className="truncate text-sm text-warm-200">{current.name || "Passkey deste dispositivo"}</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => remove(current)}
              disabled={busyId === current.id}
              className="cursor-pointer"
            >
              {busyId === current.id ? "Removendo…" : "Remover"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-2 space-y-2">
          <p className="text-sm text-warm-400">Use biometria ou o desbloqueio do dispositivo em vez de códigos.</p>
          <Button type="button" variant="outline" onClick={add} disabled={pending} className="cursor-pointer">
            {pending ? "Aguardando…" : "Adicionar passkey"}
          </Button>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}

import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { MailCheck } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { PoweredByAvenia } from "@/components/powered-by-avenia";

// Team-invite deep links arrive as /sign-up?invited=<email>&__clerk_ticket=... (the backend puts
// the email in the redirect URL — the ticket JWT doesn't carry it). Shown as a read-only
// reference only: Clerk binds the actual signup email to the ticket regardless of this param,
// so a tampered value can't change the account being created. Both params required + a shape
// check so a crafted ?invited= link without a real ticket shows nothing.
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const invited = typeof params.invited === "string" ? params.invited : undefined;
  const hasTicket = typeof params.__clerk_ticket === "string" && params.__clerk_ticket.length > 0;
  const invitedEmail = hasTicket && invited && EMAIL_SHAPE.test(invited) ? invited : null;

  return (
    <AuthShell
      footer={
        <>
          <p>
            Já tem uma conta?{" "}
            <Link href="/sign-in" className="font-medium text-gold-500 transition-colors hover:text-gold-400">
              Entrar
            </Link>
          </p>
          <PoweredByAvenia />
        </>
      }
    >
      {invitedEmail && (
        <p className="mb-4 flex items-center justify-center gap-2 rounded-full border border-gold-400/25 bg-gold-400/10 px-4 py-2 text-sm text-gold-300">
          <MailCheck className="size-4 shrink-0" aria-hidden />
          <span className="truncate">
            Convite para <span className="font-medium">{invitedEmail}</span>
          </span>
        </p>
      )}
      <SignUp />
    </AuthShell>
  );
}

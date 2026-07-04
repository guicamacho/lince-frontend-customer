import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth/auth-shell";
import { PoweredByAvenia } from "@/components/powered-by-avenia";

export default function SignUpPage() {
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
      <SignUp />
    </AuthShell>
  );
}

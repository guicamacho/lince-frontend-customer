import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth/auth-shell";

export default function SignUpPage() {
  return (
    <AuthShell
      footer={
        <>
          Já tem uma conta?{" "}
          <Link href="/sign-in" className="font-medium text-gold-500 transition-colors hover:text-gold-400">
            Entrar
          </Link>
        </>
      }
    >
      <SignUp />
    </AuthShell>
  );
}

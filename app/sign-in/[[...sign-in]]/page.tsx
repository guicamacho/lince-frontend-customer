import { SignIn } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth/auth-shell";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ expired?: string }>;
}) {
  const { expired } = await searchParams;
  return (
    <AuthShell>
      {expired && (
        <p className="mb-4 rounded-lg border border-ink-500 bg-ink-700 px-3 py-2 text-center text-sm text-warm-300">
          Sua sessão expirou por inatividade. Entre novamente.
        </p>
      )}
      <SignIn />
    </AuthShell>
  );
}

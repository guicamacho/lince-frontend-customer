import type { Metadata } from "next";
import { Schibsted_Grotesk, Manrope, Space_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ptBR } from "@clerk/localizations";
import "./globals.css";

const schibsted = Schibsted_Grotesk({
  subsets: ["latin"],
  variable: "--font-schibsted",
  weight: ["400", "500", "600", "700", "800"],
});
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700", "800"],
});
const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-space-mono",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Lince Finance",
  description: "Pagamentos internacionais para empresas brasileiras.",
};

// ptBR + brand overrides: the Clerk instance's application name renders as "Client" on the
// auth screens, so the titles are hardcoded to the business name here (PRD-02 branding).
const localization = {
  ...ptBR,
  signIn: {
    ...ptBR.signIn,
    start: {
      ...ptBR.signIn?.start,
      title: "Entrar na Lince Finance",
      subtitle: "Bem-vindo de volta! Entre para continuar.",
    },
  },
  signUp: {
    ...ptBR.signUp,
    start: {
      ...ptBR.signUp?.start,
      title: "Criar sua conta Lince Finance",
      subtitle: "Bem-vindo! Preencha os dados para começar.",
    },
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider
      localization={localization}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      // "/" routes by org state (active -> /app, else /onboarding) so approved
      // accounts never pass through the onboarding URL after sign-in.
      signInForceRedirectUrl="/"
      signUpForceRedirectUrl="/"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
      appearance={{
        variables: {
          colorPrimary: "#f2a93c",
          colorBackground: "#0e1411",
          colorNeutral: "#e8eae6",
          fontFamily: "var(--font-manrope), system-ui, sans-serif",
          borderRadius: "0.625rem",
        },
      }}
    >
      <html
        lang="pt-BR"
        className={`${schibsted.variable} ${manrope.variable} ${spaceMono.variable} h-full antialiased`}
      >
        <body className="min-h-full bg-ink-900 font-sans text-warm-100">{children}</body>
      </html>
    </ClerkProvider>
  );
}

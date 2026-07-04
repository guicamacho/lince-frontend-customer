"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wallet, Send, ArrowLeftRight, Users2, UserCog, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/app", label: "Início", icon: Home },
  { href: "/app/balances", label: "Saldos", icon: Wallet },
  { href: "/app/pay", label: "Pagar / Enviar", icon: Send },
  { href: "/app/transactions", label: "Transações", icon: ArrowLeftRight },
  { href: "/app/beneficiaries", label: "Beneficiários", icon: Users2 },
  { href: "/app/team", label: "Equipe", icon: UserCog },
  { href: "/app/settings", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <nav className="flex w-56 shrink-0 flex-col gap-1 border-r border-ink-500 bg-ink-800 p-3">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === "/app" ? pathname === "/app" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              active ? "bg-ink-700 text-gold-500" : "text-warm-300 hover:bg-ink-700 hover:text-warm-100",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

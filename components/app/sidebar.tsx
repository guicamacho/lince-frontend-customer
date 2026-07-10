"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Inbox,
  Wallet,
  ArrowDownToLine,
  Repeat,
  Send,
  BookUser,
  ReceiptText,
  Users,
  Gift,
  Settings,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Início/Depositar/Transações/Beneficiários/Avisos/Configurações are real pages; the rest
// are inert links to the /app/<section> "Em breve" placeholder until each feature lands.
// Order per product decision 2026-07-09: Avisos second-last, Configurações last.
const NAV = [
  { href: "/app", label: "Início", icon: LayoutGrid, exact: true },
  { href: "/app/accounts", label: "Carteira", icon: Wallet },
  { href: "/app/deposit", label: "Depositar", icon: ArrowDownToLine },
  { href: "/app/convert", label: "Converter", icon: Repeat },
  { href: "/app/payouts", label: "Pagamentos", icon: Send },
  { href: "/app/beneficiaries", label: "Beneficiários", icon: BookUser },
  { href: "/app/transactions", label: "Transações", icon: ReceiptText },
  { href: "/app/team", label: "Equipe", icon: Users },
  { href: "/app/rewards", label: "Recompensas", icon: Gift },
  { href: "/app/avisos", label: "Avisos", icon: Inbox },
  { href: "/app/settings", label: "Configurações", icon: Settings },
  // Cartão renders the shared /app/[section] "Em breve" placeholder; the entry carries
  // its own "Em breve" pill so nobody expects a live feature.
  { href: "/app/card", label: "Cartão", icon: CreditCard, comingSoon: true },
];

export function Sidebar({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-screen w-[268px] shrink-0 flex-col border-r border-ink-500 bg-gradient-to-b from-ink-800/70 via-ink-900 to-ink-900 px-4 py-[22px] lg:flex">
      <Link
        href="/app"
        className="mb-6 mt-1 flex items-center gap-2.5 px-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Image src="/lince-mark-light.svg" alt="Lince" width={30} height={30} priority />
        <span className="font-display text-[23px] font-bold tracking-[-0.025em] text-bone-100">lince</span>
      </Link>

      <nav className="flex flex-col gap-0.5">
        {NAV.map(({ href, label, icon: Icon, exact, comingSoon }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-xl px-3 py-[11px] text-[14.5px] transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                active
                  ? "bg-ink-700 font-bold text-bone-100 shadow-[inset_3px_0_0_var(--color-gold-500)]"
                  : "font-medium text-warm-400 hover:bg-ink-700/60 hover:text-warm-100",
              )}
            >
              <Icon className={cn("size-[19px]", active ? "text-gold-500" : "text-warm-400")} aria-hidden />
              {label}
              {comingSoon && (
                <span className="ml-auto rounded-full bg-ink-700 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wide text-warm-500 uppercase">
                  Em breve
                </span>
              )}
              {href === "/app/avisos" && unreadCount > 0 && (
                <span
                  className="ml-auto rounded-full bg-gold-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-gold-400"
                  aria-label={`${unreadCount} não lida${unreadCount === 1 ? "" : "s"}`}
                >
                  {unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Lince Business Card promo — decorative card art in the background, inert CTA. */}
      <div className="relative mt-auto overflow-hidden rounded-[18px] bg-ink-800 p-5 ring-1 ring-gold-500/30">
        <div
          aria-hidden
          className="absolute -right-7 -top-9 h-[104px] w-[164px] rotate-[18deg] rounded-xl bg-gradient-to-br from-gold-400/35 via-gold-500/15 to-transparent ring-1 ring-gold-500/25"
        >
          <span className="absolute left-3 top-3 block h-[14px] w-[19px] rounded-[3px] bg-gold-500/50" />
          <span className="absolute bottom-2.5 left-3 block font-display text-[10px] font-bold tracking-wide text-bone-100/40">
            lince
          </span>
        </div>
        <div className="relative">
          <div className="font-display text-base leading-tight font-bold text-bone-100">
            Lince Business Card
          </div>
          <p className="mt-1.5 text-[12.5px] text-warm-400">Sua empresa, sem fronteiras.</p>
          <span
            aria-disabled="true"
            className="mt-3.5 inline-flex min-h-9 cursor-default items-center rounded-[10px] bg-ink-700 px-3.5 text-[13px] font-bold text-warm-400 ring-1 ring-foreground/10 select-none"
          >
            Em breve
          </span>
        </div>
      </div>
    </aside>
  );
}

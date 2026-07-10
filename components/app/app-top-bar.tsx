"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Search, Bell } from "lucide-react";

/**
 * Dashboard top bar — ONLY for the active /app shell: greeting (the COMPANY name, from
 * /app/me via the layout) on the left; search / bell / divider / account lockup on the
 * right. The account lockup links to /app/settings — Clerk's UserButton popover is gone
 * (product decision 2026-07-10: account management lives in Configurações). Search is
 * inert for now.
 */
export function AppTopBar({ unreadCount = 0, companyName }: { unreadCount?: number; companyName?: string }) {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const initial = (companyName ?? user?.firstName ?? "L").charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-ink-500 bg-ink-900/80 px-5 py-5 backdrop-blur-md lg:px-9">
      <div>
        <div className="text-[13px] text-warm-400">Bem-vindo de volta</div>
        <div className="font-display text-xl font-bold tracking-[-0.015em]">
          {companyName ?? "Sua empresa"}
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2.5">
        <button
          type="button"
          aria-label="Buscar"
          className="flex size-[38px] cursor-pointer items-center justify-center rounded-[10px] bg-ink-800 text-warm-300 ring-1 ring-foreground/10 transition-colors hover:bg-ink-700 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Search className="size-4" aria-hidden />
        </button>
        <Link
          href="/app/avisos"
          aria-label={
            unreadCount > 0
              ? `Notificações (${unreadCount} não lida${unreadCount === 1 ? "" : "s"})`
              : "Notificações"
          }
          className="relative flex size-[38px] cursor-pointer items-center justify-center rounded-[10px] bg-ink-800 text-warm-300 ring-1 ring-foreground/10 transition-colors hover:bg-ink-700 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Bell className="size-4" aria-hidden />
          {unreadCount > 0 && (
            <span className="absolute right-2.5 top-2.5 size-[7px] rounded-full bg-gold-500" aria-hidden />
          )}
        </Link>

        <div className="mx-1.5 h-[26px] w-px bg-ink-500" />

        <Link
          href="/app/settings"
          aria-label="Configurações da conta"
          className="flex cursor-pointer items-center gap-2.5 rounded-[10px] px-1.5 py-1 transition-colors hover:bg-ink-800 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span
            className="flex size-9 items-center justify-center rounded-full bg-gold-500 font-display text-sm font-bold text-ink-900 ring-1 ring-ink-500"
            aria-hidden
          >
            {initial}
          </span>
          <span className="hidden leading-tight sm:block">
            <span className="block text-[13px] font-bold whitespace-nowrap">
              {user?.fullName ?? "Sua conta"}
            </span>
            <span className="block text-[11px] whitespace-nowrap text-warm-500">{email}</span>
          </span>
        </Link>
      </div>
    </header>
  );
}

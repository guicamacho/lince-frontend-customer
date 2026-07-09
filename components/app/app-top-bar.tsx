"use client";

import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { Search, Bell } from "lucide-react";

/**
 * Dashboard top bar (mock TopBar) — ONLY for the active /app shell: greeting + name
 * on the left; search / bell / divider / account lockup on the right. The simpler
 * branded <TopBar> (logo + account) is used on onboarding + the under-review hold
 * screen instead. Search / bell are inert for now.
 */
export function AppTopBar({ unreadCount = 0 }: { unreadCount?: number }) {
  const { user } = useUser();
  const firstName = user?.firstName ?? "Cliente";

  return (
    <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-ink-500 bg-ink-900/80 px-5 py-5 backdrop-blur-md lg:px-9">
      <div>
        <div className="text-[13px] text-warm-400">Bem-vindo de volta</div>
        <div className="font-display text-xl font-bold tracking-[-0.015em]">{firstName}</div>
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

        <div className="flex items-center gap-2.5">
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox: "size-9 isolate bg-gold-500 ring-1 ring-ink-500",
                // ponytail: luminosity-blend Clerk's default avatar over gold-500 so it matches
                // the brand gold. Ceiling: also gold-tints a real uploaded photo — fine here
                // (email-OTP B2B, no photos); drop if photo/social login is enabled.
                avatarImage: "mix-blend-luminosity",
                userButtonPopoverCard: "border border-ink-500 bg-ink-700 shadow-xl",
                userButtonPopoverFooter: "hidden",
                // Clerk's account-management modal is off (2026-07-09): settings live at
                // /app/settings. The popover keeps sign-out only.
                userButtonPopoverActionButton__manageAccount: "hidden",
              },
            }}
          />
          <div className="hidden leading-tight sm:block">
            <div className="text-[13px] font-bold whitespace-nowrap">{user?.fullName ?? "Sua conta"}</div>
            <div className="text-[11px] whitespace-nowrap text-warm-500">
              {user?.primaryEmailAddress?.emailAddress ?? ""}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

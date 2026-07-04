"use client";

import Image from "next/image";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

/**
 * Simple branded top bar (logo + account) — used on onboarding and the under-review
 * hold screen, where the dashboard greeting/search/bell would be out of place. The
 * dashboard shell uses <AppTopBar> instead.
 */
export function TopBar() {
  return (
    <header className="flex items-center justify-between border-b border-ink-500 bg-ink-900/80 px-5 py-3 backdrop-blur">
      <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold">
        <Image src="/lince-mark-light.svg" alt="" width={24} height={24} priority />
        Lince <span className="text-gold-500">Finance</span>
      </Link>
      <UserButton
        appearance={{
          elements: {
            userButtonAvatarBox: "size-9 isolate bg-gold-500 ring-1 ring-ink-500",
            // ponytail: luminosity-blend Clerk's default avatar over gold-500 so it matches the
            // brand gold. Ceiling: also gold-tints a real uploaded photo — fine here (email-OTP
            // B2B, no photos); drop if photo/social login is enabled.
            avatarImage: "mix-blend-luminosity",
            userButtonPopoverCard: "border border-ink-500 bg-ink-700 shadow-xl",
            userButtonPopoverFooter: "hidden",
          },
        }}
      />
    </header>
  );
}

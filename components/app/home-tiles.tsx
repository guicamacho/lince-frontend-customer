import Link from "next/link";
import { Wallet, Send, ArrowLeftRight, Users2, UserCog } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Home tile grid mirroring the sidebar sections, each with an honest status.
 * One array drives it: as features land, flip `available` + point `href` at the
 * real page (graceful degradation by construction). No money numbers.
 *
 * needs-figma-reconcile — no dashboard visual spec exists; built to DS tokens.
 */
const TILES = [
  {
    label: "Beneficiários",
    href: "/app/beneficiaries",
    icon: Users2,
    desc: "Cadastre os destinatários dos seus pagamentos internacionais.",
    available: true,
  },
  {
    label: "Saldos",
    href: "/app/balances",
    icon: Wallet,
    desc: "Acompanhe os saldos da sua conta.",
    available: false,
  },
  {
    label: "Pagar / Enviar",
    href: "/app/pay",
    icon: Send,
    desc: "Envie pagamentos para o exterior.",
    available: false,
  },
  {
    label: "Transações",
    href: "/app/transactions",
    icon: ArrowLeftRight,
    desc: "Veja o histórico das suas movimentações.",
    available: false,
  },
  {
    label: "Equipe",
    href: "/app/team",
    icon: UserCog,
    desc: "Gerencie os acessos da sua equipe.",
    available: false,
  },
] as const;

function TileBody({ tile }: { tile: (typeof TILES)[number] }) {
  const Icon = tile.icon;
  return (
    <>
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-lg bg-ink-800",
            tile.available ? "text-gold-500" : "text-warm-500",
          )}
        >
          <Icon className="size-4" aria-hidden />
        </span>
        {tile.available ? (
          <span className="text-xs font-medium text-emerald-500">Disponível</span>
        ) : (
          <span className="text-xs text-warm-500">Em breve</span>
        )}
      </div>
      <div className="space-y-1">
        <h2 className="font-heading text-base font-medium text-warm-100">{tile.label}</h2>
        <p className="text-sm text-warm-400">{tile.desc}</p>
      </div>
    </>
  );
}

export function HomeTiles() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {TILES.map((tile) =>
        tile.available ? (
          <li key={tile.label}>
            <Link
              href={tile.href}
              className="block rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Card className="h-full cursor-pointer gap-3 p-4 transition-colors hover:ring-gold-500/40">
                <TileBody tile={tile} />
              </Card>
            </Link>
          </li>
        ) : (
          <li key={tile.label}>
            {/* Reserved space, non-interactive — no layout shift, no dead link. */}
            <Card aria-disabled className="h-full gap-3 p-4">
              <TileBody tile={tile} />
            </Card>
          </li>
        ),
      )}
    </ul>
  );
}

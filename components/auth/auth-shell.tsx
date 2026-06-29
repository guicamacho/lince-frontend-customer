import Image from "next/image";
import Link from "next/link";

// ponytail: self-hosted SVGs in /public/flags (from flagcdn.com), no runtime CDN call
const LATAM = [
  { code: "br", name: "Brasil" },
  { code: "mx", name: "México" },
  { code: "co", name: "Colômbia" },
  { code: "ar", name: "Argentina" },
  { code: "pe", name: "Peru" },
  { code: "cl", name: "Chile" },
  { code: "uy", name: "Uruguai" },
];

/** Billr-style split-screen auth: brand + embedded form on the left, illustration on the right. */
export function AuthShell({ children, footer }: { children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left — brand + embedded Clerk form */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-10 flex items-center justify-center gap-4">
            <Image src="/lince-mark-light.svg" alt="Lince Finance" width={64} height={64} priority />
            <span className="font-display text-4xl font-bold">
              Lince <span className="text-gold-500">Finance</span>
            </span>
          </Link>
          {children}
          {footer && <p className="mt-8 text-sm text-warm-400">{footer}</p>}
        </div>
      </div>

      {/* Right — hero video panel (same asset as the landing page) */}
      <div className="relative hidden overflow-hidden lg:block">
        <div className="absolute inset-4 overflow-hidden rounded-3xl ring-1 ring-ink-500">
          <video
            className="absolute inset-0 size-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/hero-globe-poster.jpg"
          >
            <source src="/hero-globe.webm" type="video/webm" />
            <source src="/hero-globe.mp4" type="video/mp4" />
          </video>
          {/* scrim for legibility of the overlaid copy */}
          <div className="absolute inset-0 bg-gradient-to-b from-ink-900/85 via-ink-900/15 to-transparent" />
          <div className="absolute inset-x-0 top-0 p-10">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-gold-500">
              Pagamentos para a América Latina
            </p>
            <h2 className="font-display text-4xl font-bold leading-[1.05] text-warm-100 xl:text-5xl">
              Pague o mundo a partir do <span className="text-gold-500">Brasil.</span>
            </h2>
            <ul className="mt-6 flex flex-wrap items-center gap-2.5">
              {LATAM.map((c) => (
                <li key={c.code}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- decorative static flag, no layout/LCP concern */}
                  <img
                    src={`/flags/${c.code}.svg`}
                    alt={c.name}
                    title={c.name}
                    loading="lazy"
                    className="h-6 w-auto rounded-[3px] shadow-sm ring-1 ring-white/15"
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

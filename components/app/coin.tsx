import { cn } from "@/lib/utils";

/**
 * Round coin/flag chip, keyed by currency code (per the mock's Coin).
 * Stablecoins render as a brand-colored circle with the white glyph inlined
 * (the SVGs in public/coins are bare `currentColor` paths, so the disc color
 * comes from us, not the file). Fiat render the self-hosted flag cropped into a
 * circle. Overlappable via `overlap` for the wallet-card coin stacks.
 */
type Glyph = { color: string; viewBox: string; path: string; scale: number };

// Brand disc colors are content, not design tokens (no Tailwind class exists).
const GLYPHS: Record<string, Glyph> = {
  USDC: {
    color: "#2775CA",
    viewBox: "0 0 6.7 12.05",
    scale: 0.52,
    path: "M 6.7 7.8 C 6.7 6.05 5.65 5.45 3.55 5.2 C 2.05 5 1.75 4.6 1.75 3.9 C 1.75 3.2 2.25 2.75 3.25 2.75 C 4.15 2.75 4.65 3.05 4.9 3.8 C 4.95 3.95 5.1 4.05 5.25 4.05 L 6.05 4.05 C 6.25 4.05 6.4 3.9 6.4 3.7 L 6.4 3.65 C 6.2 2.55 5.3 1.7 4.15 1.6 L 4.15 0.4 C 4.15 0.2 4 0.05 3.75 0 L 3 0 C 2.8 0 2.65 0.15 2.6 0.4 L 2.6 1.55 C 1.1 1.75 0.15 2.75 0.15 4 C 0.15 5.65 1.15 6.3 3.25 6.55 C 4.65 6.8 5.1 7.1 5.1 7.9 C 5.1 8.7 4.4 9.25 3.45 9.25 C 2.15 9.25 1.7 8.7 1.55 7.95 C 1.5 7.75 1.35 7.65 1.2 7.65 L 0.35 7.65 C 0.15 7.65 0 7.8 0 8 L 0 8.05 C 0.2 9.3 1 10.2 2.65 10.45 L 2.65 11.65 C 2.65 11.85 2.8 12 3.05 12.05 L 3.8 12.05 C 4 12.05 4.15 11.9 4.2 11.65 L 4.2 10.45 C 5.7 10.2 6.7 9.15 6.7 7.8 Z",
  },
  USDT: {
    color: "#26A17B",
    viewBox: "0 0 14.49 13.345",
    scale: 0.6,
    path: "M 8.72 7.173 C 8.64 7.178 8.212 7.204 7.263 7.204 C 6.506 7.204 5.973 7.182 5.785 7.173 C 2.869 7.045 0.692 6.537 0.692 5.93 C 0.692 5.322 2.869 4.815 5.785 4.685 L 5.785 6.668 C 5.975 6.682 6.522 6.714 7.276 6.714 C 8.182 6.714 8.636 6.676 8.716 6.669 L 8.716 4.686 C 11.626 4.816 13.798 5.326 13.798 5.93 C 13.798 6.533 11.626 7.043 8.716 7.172 L 8.72 7.173 Z M 8.716 4.479 L 8.716 2.705 L 12.777 2.705 L 12.777 0 L 1.722 0 L 1.722 2.705 L 5.782 2.705 L 5.782 4.478 C 2.48 4.631 0 5.286 0 6.065 C 0 6.844 2.48 7.505 5.782 7.654 L 5.782 13.345 L 8.72 13.345 L 8.72 7.657 C 12.014 7.506 14.49 6.852 14.49 6.07 C 14.49 5.287 12.011 4.633 8.72 4.481",
  },
};

const FLAGS: Record<string, string> = {
  BRL: "/flags/br.svg",
  MXN: "/flags/mx.svg",
};

export function Coin({
  code,
  size = 30,
  overlap = false,
  ringClass = "border-ink-800",
}: {
  code: string;
  size?: number;
  overlap?: boolean;
  ringClass?: string;
}) {
  const glyph = GLYPHS[code];
  const flag = FLAGS[code];
  return (
    <span
      title={code}
      style={{ width: size, height: size, backgroundColor: glyph?.color }}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 text-white",
        ringClass,
        !glyph && "bg-ink-700",
        overlap && "-ml-[9px]",
      )}
    >
      {glyph ? (
        <svg
          role="img"
          aria-label={code}
          viewBox={glyph.viewBox}
          fill="currentColor"
          style={{ height: size * glyph.scale, width: "auto" }}
        >
          <path d={glyph.path} />
        </svg>
      ) : flag ? (
        // eslint-disable-next-line @next/next/no-img-element -- static self-hosted flag SVG, next/image adds no value
        <img src={flag} alt={code} className="size-full object-cover" />
      ) : (
        <span className="font-mono text-[9px] text-warm-300">{code}</span>
      )}
    </span>
  );
}

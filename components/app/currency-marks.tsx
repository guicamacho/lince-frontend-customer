/** Currency/asset marks for the beneficiary rails. Flags + stablecoin marks match the Depositar
 *  flow (spothq/cryptocurrency-icons, MIT). Rendered at size-5/6 next to rail + asset chips. */

export function BrlFlag() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" role="img" aria-label="Real (BRL)">
      <rect width="24" height="24" rx="12" fill="#009C3B" />
      <path d="M12 4.5 20.5 12 12 19.5 3.5 12Z" fill="#FFDF00" />
      <circle cx="12" cy="12" r="3.6" fill="#002776" />
    </svg>
  );
}

export function UsdFlag() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" role="img" aria-label="Dólar (USD)">
      <rect width="24" height="24" rx="12" fill="#0A3161" />
      <rect x="9" y="4.5" width="14" height="1.9" fill="#fff" transform="translate(-4)" />
      <g fill="#B31942">
        <rect y="7.3" width="24" height="1.9" />
        <rect y="11.1" width="24" height="1.9" />
        <rect y="14.9" width="24" height="1.9" />
      </g>
      <rect y="5.4" width="11" height="7.4" fill="#0A3161" />
    </svg>
  );
}

export function EurFlag() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" role="img" aria-label="Euro (EUR)">
      <rect width="24" height="24" rx="12" fill="#003399" />
      <g fill="#FFCC00">
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return <circle key={i} cx={12 + Math.sin(a) * 6.5} cy={12 - Math.cos(a) * 6.5} r="0.9" />;
        })}
      </g>
    </svg>
  );
}

export function TetherMark() {
  return (
    <svg viewBox="0 0 32 32" className="size-5" role="img" aria-label="Tether USD (USDT)">
      <circle cx="16" cy="16" r="16" fill="#26A17B" />
      <path
        fill="#FFF"
        d="M17.922 17.383v-.002c-.11.008-.677.042-1.942.042-1.01 0-1.721-.03-1.971-.042v.003c-3.888-.171-6.79-.848-6.79-1.658 0-.809 2.902-1.486 6.79-1.66v2.644c.254.018.982.061 1.988.061 1.207 0 1.812-.05 1.925-.06v-2.643c3.88.173 6.775.85 6.775 1.658 0 .81-2.895 1.485-6.775 1.657m0-3.59v-2.366h5.414V7.819H8.595v3.608h5.414v2.365c-4.4.202-7.709 1.074-7.709 2.118 0 1.044 3.309 1.915 7.709 2.118v7.582h3.913v-7.584c4.393-.202 7.694-1.073 7.694-2.116 0-1.043-3.301-1.914-7.694-2.117"
      />
    </svg>
  );
}

export function UsdcMark() {
  return (
    <svg viewBox="0 0 32 32" className="size-5" role="img" aria-label="USD Coin (USDC)">
      <circle fill="#3E73C4" cx="16" cy="16" r="16" />
      <g fill="#FFF">
        <path d="M20.022 18.124c0-2.124-1.28-2.852-3.84-3.156-1.828-.243-2.193-.728-2.193-1.578 0-.85.61-1.396 1.828-1.396 1.097 0 1.707.364 2.011 1.275a.458.458 0 00.427.303h.975a.416.416 0 00.427-.425v-.06a3.04 3.04 0 00-2.743-2.489V9.142c0-.243-.183-.425-.487-.486h-.915c-.243 0-.426.182-.487.486v1.396c-1.829.242-2.986 1.456-2.986 2.974 0 2.002 1.218 2.791 3.778 3.095 1.707.303 2.255.668 2.255 1.639 0 .97-.853 1.638-2.011 1.638-1.585 0-2.133-.667-2.316-1.578-.06-.242-.244-.364-.427-.364h-1.036a.416.416 0 00-.426.425v.06c.243 1.518 1.219 2.61 3.23 2.914v1.457c0 .242.183.425.487.485h.915c.243 0 .426-.182.487-.485V21.34c1.829-.303 3.047-1.578 3.047-3.217z" />
        <path d="M12.892 24.497c-4.754-1.7-7.192-6.98-5.424-11.653.914-2.55 2.925-4.491 5.424-5.402.244-.121.365-.303.365-.607v-.85c0-.242-.121-.424-.365-.485-.061 0-.183 0-.244.06a10.895 10.895 0 00-7.13 13.717c1.096 3.4 3.717 6.01 7.13 7.102.244.121.488 0 .548-.243.061-.06.061-.122.061-.243v-.85c0-.182-.182-.424-.365-.546zm6.46-18.936c-.244-.122-.488 0-.548.242-.061.061-.061.122-.061.243v.85c0 .243.182.485.365.607 4.754 1.7 7.192 6.98 5.424 11.653-.914 2.55-2.925 4.491-5.424 5.402-.244.121-.365.303-.365.607v.85c0 .242.121.424.365.485.061 0 .183 0 .244-.06a10.895 10.895 0 007.13-13.717c-1.096-3.46-3.778-6.07-7.13-7.162z" />
      </g>
    </svg>
  );
}

/** Neutral currency badge — correct label, no misleading flag (used for GBP + any unmapped code). */
function GenericMark({ code }: { code: string }) {
  return (
    <span
      role="img"
      aria-label={code}
      className="inline-flex size-5 items-center justify-center rounded-full bg-ink-600 text-[9px] font-bold text-warm-200"
    >
      {code.slice(0, 3)}
    </span>
  );
}

export function assetMark(asset: string) {
  switch (asset) {
    case "BRL":
      return <BrlFlag />;
    case "USD":
      return <UsdFlag />;
    case "EUR":
      return <EurFlag />;
    case "USDT":
      return <TetherMark />;
    case "USDC":
      return <UsdcMark />;
    default:
      return <GenericMark code={asset} />; // GBP + anything unmapped: labelled, not a wrong flag
  }
}

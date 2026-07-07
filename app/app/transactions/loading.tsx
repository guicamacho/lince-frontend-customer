// Streamed while the server component awaits GET /app/transactions — reserves height so the real
// table doesn't cause a layout jump. Motion gated by prefers-reduced-motion.
export default function Loading() {
  return (
    <div className="max-w-[1100px] space-y-8">
      <div>
        <div className="h-8 w-40 rounded bg-ink-700" />
        <div className="mt-2 h-4 w-80 max-w-full rounded bg-ink-800" />
      </div>
      <div className="rounded-[18px] bg-ink-800 ring-1 ring-foreground/10 motion-safe:animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={`sk-${i}`}
            className="flex items-center gap-4 border-b border-foreground/10 px-4 py-3.5 last:border-0"
          >
            <div className="size-8 shrink-0 rounded-full bg-ink-700" />
            <div className="h-4 flex-1 rounded bg-ink-700" />
            <div className="h-4 w-24 rounded bg-ink-700" />
            <div className="h-4 w-16 rounded bg-ink-700" />
          </div>
        ))}
      </div>
    </div>
  );
}

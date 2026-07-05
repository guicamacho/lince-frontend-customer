"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { markNotificationReadAction } from "@/app/app/avisos/actions";

/**
 * Marks the given notifications read once, on view of a thread, then refreshes so the bell +
 * sidebar badge (fetched in the layout) reflect it. Idempotent server-side (coalesce), and the
 * ref guards against re-running after refresh empties the list. Renders nothing.
 */
export function MarkRead({ ids }: { ids: string[] }) {
  const router = useRouter();
  const done = useRef(false);
  useEffect(() => {
    if (done.current || ids.length === 0) return;
    done.current = true;
    Promise.all(ids.map((id) => markNotificationReadAction(id))).then(() => router.refresh());
  }, [ids, router]);
  return null;
}

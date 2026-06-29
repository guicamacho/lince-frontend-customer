"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { advanceAction } from "@/app/onboarding/actions";
import { Button } from "@/components/ui/button";

export function AdvanceButton({
  step,
  label,
  pendingLabel,
}: {
  step: "launch-verification" | "mock-verify";
  label: string;
  pendingLabel: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onClick() {
    setError(null);
    start(async () => {
      const res = await advanceAction(step);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Button onClick={onClick} disabled={pending} className="min-w-48">
        {pending ? pendingLabel : label}
      </Button>
      {error && <p className="text-sm text-clay-500">{error}</p>}
    </div>
  );
}

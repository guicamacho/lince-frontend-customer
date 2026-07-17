"use server";

import { reverificationError } from "@clerk/nextjs/server";
import { createPayout, type PayoutReceipt } from "@/lib/lince-api";

type Result = { ok: true; data: PayoutReceipt } | { ok: false; error: string };

/** Execute a payout on the payee's rail. amount is a decimal string in the rail's source
 *  currency (R$ for PIX, US$ for USD/crypto rails); idemKey binds the request.
 *  A backend 403 step_up_required becomes Clerk's reverification hint: the form's
 *  useReverification wrapper opens the re-auth modal and RETRIES this action — the same
 *  idemKey makes the retry replay-safe (F8). */
export async function payoutAction(input: {
  beneficiaryId: string;
  amount: string;
  idemKey: string;
}): Promise<Result | ReturnType<typeof reverificationError>> {
  const res = await createPayout(input);
  if (!res.ok && res.error === "step_up_required") return reverificationError("strict");
  return res;
}

"use server";

import { reverificationError } from "@clerk/nextjs/server";
import { convertCurrency, type ConvertReceipt } from "@/lib/lince-api";

type Result = { ok: true; data: ConvertReceipt } | { ok: false; error: string };

/** Execute a convert. from/to are ledger codes (BRLA/USDT); amount is a decimal string.
 *  step_up_required -> Clerk reverification hint; the form's useReverification wrapper
 *  re-auths and retries with the same idemKey (replay-safe). */
export async function convertAction(input: {
  from: string;
  to: string;
  amount: string;
  idemKey: string;
}): Promise<Result | ReturnType<typeof reverificationError>> {
  const res = await convertCurrency(input);
  if (!res.ok && res.error === "step_up_required") return reverificationError("strict");
  return res;
}

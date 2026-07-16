"use server";

import { createPayout, type PayoutReceipt } from "@/lib/lince-api";

type Result = { ok: true; data: PayoutReceipt } | { ok: false; error: string };

/** Execute a payout on the payee's rail. amount is a decimal string in the rail's source
 *  currency (R$ for PIX, US$ for USD/crypto rails); idemKey binds the request. */
export async function payoutAction(input: {
  beneficiaryId: string;
  amount: string;
  idemKey: string;
}): Promise<Result> {
  return createPayout(input);
}

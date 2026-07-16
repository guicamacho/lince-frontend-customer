"use server";

import { createPixPayout, type PayoutReceipt } from "@/lib/lince-api";

type Result = { ok: true; data: PayoutReceipt } | { ok: false; error: string };

/** Execute a PIX payout. amount is a decimal string in BRL; idemKey binds the request. */
export async function payoutAction(input: {
  beneficiaryId: string;
  amount: string;
  idemKey: string;
}): Promise<Result> {
  return createPixPayout(input);
}

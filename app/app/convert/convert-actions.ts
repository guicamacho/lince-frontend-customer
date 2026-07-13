"use server";

import { convertCurrency, type ConvertReceipt } from "@/lib/lince-api";

type Result = { ok: true; data: ConvertReceipt } | { ok: false; error: string };

/** Execute a convert. from/to are ledger codes (BRLA/USDT); amount is a decimal string. */
export async function convertAction(input: {
  from: string;
  to: string;
  amount: string;
  idemKey: string;
}): Promise<Result> {
  return convertCurrency(input);
}

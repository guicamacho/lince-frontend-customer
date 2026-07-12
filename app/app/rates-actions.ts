"use server";

import { getRates, type Rates } from "@/lib/lince-api";

/** Client-callable rate poll for the Câmbio widget (~30s interval). Null on a backend blip. */
export async function fetchRatesAction(): Promise<Rates | null> {
  return getRates();
}

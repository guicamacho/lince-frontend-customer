/**
 * Money-path E2E — gated on E2E_MFA_TOTP_SECRET (an MFA-ENROLLED test user's TOTP secret,
 * stored in CI secrets; mint codes with otplib when implementing). Convert and payouts
 * require an enrolled second factor server-side, so these specs cannot run with the plain
 * test account. Until the secret exists this file documents the intended flow and skips.
 *
 * Planned flow (small amounts, shared sandbox balance):
 *   1. Convert R$1 BRLA -> USDT; expect the receipt panel; balance updates after settle.
 *   2. Add a PIX payee (requires MFA claim); pay R$1; Transações shows "Pagamento — {payee}".
 *   3. With STEP_UP_ENFORCED on: stale session -> Clerk reverification modal -> retry succeeds
 *      exactly once (idemKey replay-safety observed as a single Transações row).
 */
import { test } from "@playwright/test";

test.describe("money paths (MFA-enrolled account required)", () => {
  test.skip(!process.env.E2E_MFA_TOTP_SECRET, "E2E_MFA_TOTP_SECRET not set — see file header");

  test("convert R$1 and see the receipt", async () => {
    // Implement when the MFA-enrolled E2E account exists (gap register 2.7).
  });

  test("PIX payout R$1 appears in Transações", async () => {
    // Implement when the MFA-enrolled E2E account exists (gap register 2.7).
  });
});

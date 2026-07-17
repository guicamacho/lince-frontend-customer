/**
 * Signs in once as the Clerk test account and saves the session for every other spec.
 * +clerk_test emails skip real delivery and accept the fixed OTP 424242 (Clerk test mode).
 * clerkSetup/setupClerkTestingToken bypass bot protection when Clerk keys are available.
 */
import { clerkSetup } from "@clerk/testing/playwright";
import { setupClerkTestingToken } from "@clerk/testing/playwright";
import { test as setup, expect } from "@playwright/test";

const EMAIL = process.env.E2E_ACCOUNT_EMAIL ?? "guilherme+clerk_test@example.com";
const OTP = process.env.E2E_ACCOUNT_OTP ?? "424242";

const clerkKeys = {
  publishableKey: process.env.E2E_CLERK_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.E2E_CLERK_SECRET_KEY ?? process.env.CLERK_SECRET_KEY,
};

setup("authenticate as the test account", async ({ page }) => {
  if (clerkKeys.publishableKey && clerkKeys.secretKey) {
    await clerkSetup(clerkKeys);
    await setupClerkTestingToken({ page });
  }

  await page.goto("/sign-in");
  await page.getByRole("textbox", { name: /e-?mail/i }).fill(EMAIL);
  await page.getByRole("button", { name: /continuar|continue/i }).click();

  // Email verification code step (test mode: fixed OTP, no real email sent).
  const otpField = page.locator('input[name="code"], input[autocomplete="one-time-code"]').first();
  await otpField.waitFor({ state: "visible", timeout: 15_000 });
  await otpField.fill(OTP);

  // Clerk auto-submits a complete code; fall back to an explicit continue if still visible.
  const cont = page.getByRole("button", { name: /continuar|continue/i });
  if (await cont.isVisible().catch(() => false)) await cont.click().catch(() => {});

  // Signed in = we leave /sign-in for a gated surface (dashboard or onboarding, org-state dependent).
  await expect(page).not.toHaveURL(/sign-in/, { timeout: 20_000 });
  await page.context().storageState({ path: "e2e/.auth/state.json" });
});

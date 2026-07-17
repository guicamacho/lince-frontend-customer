import { defineConfig, devices } from "@playwright/test";

/**
 * Browser E2E against a DEPLOYED environment (default: dev). Auth = the Clerk test account
 * (+clerk_test email, fixed OTP 424242) via e2e/auth.setup.ts, whose storage state feeds the
 * authenticated project. Runtime env:
 *   E2E_BASE_URL              target app (default https://lince-customer.fly.dev)
 *   E2E_CLERK_PUBLISHABLE_KEY + E2E_CLERK_SECRET_KEY  for Clerk testing tokens (bot-protection
 *                             bypass); falls back to the app's own env names when present
 *   E2E_MFA_TOTP_SECRET       enables the money-path specs (MFA-enrolled test user required)
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // one shared dev env, one test account — serial keeps runs deterministic
  workers: 1,
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "https://lince-customer.fly.dev",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: "e2e/.auth/state.json" },
      dependencies: ["setup"],
    },
  ],
});

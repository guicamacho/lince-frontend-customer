/**
 * Smoke: the deployed app serves, authenticates, and every core surface renders without an
 * error state. Runs against a SHARED dev/test env, so assertions target legitimate states
 * (an org can be active or still onboarding) — they fail on error boundaries, 5xx, or the
 * "Não foi possível carregar" retry card, never on business state.
 */
import { test, expect, type Page } from "@playwright/test";

const LOAD_ERROR = /Não foi possível carregar/i;

async function expectNoLoadError(page: Page) {
  await expect(page.getByText(LOAD_ERROR)).toHaveCount(0);
}

test("health endpoint answers", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBeTruthy();
});

test("authenticated shell renders a legitimate gate", async ({ page }) => {
  await page.goto("/app");
  // Active org -> dashboard (sidebar). Pre-active -> onboarding screen. Held -> análise card.
  // All are legitimate; a retry card or error boundary is not.
  await expect(
    page.getByRole("link", { name: "Início" })
      .or(page.getByText(/verifica|análise|cadastro/i).first()),
  ).toBeVisible({ timeout: 20_000 });
  await expectNoLoadError(page);
});

test.describe("active-org surfaces", () => {
  // These need an ACTIVE org; skip cleanly when the test account is still pre-active.
  test.beforeEach(async ({ page }) => {
    await page.goto("/app");
    const active = await page.getByRole("link", { name: "Início" }).isVisible().catch(() => false);
    test.skip(!active, "test account's org is not active in this environment");
  });

  test("dashboard shows the balance hero and history chart", async ({ page }) => {
    await expect(page.getByText(/Saldo disponível/i)).toBeVisible();
    await expect(page.getByText(/Histórico de saldo/i)).toBeVisible();
    await expectNoLoadError(page);
  });

  test("Pagamentos renders the rail-aware payout surface", async ({ page }) => {
    await page.goto("/app/payouts");
    await expect(page.getByRole("heading", { name: "Pagamentos" })).toBeVisible();
    // Either the payee picker or the empty state — both legitimate, neither is an error.
    await expect(
      page.getByText("Beneficiário", { exact: false })
        .or(page.getByText(/Nenhum beneficiário/i))
        .first(),
    ).toBeVisible();
    await expectNoLoadError(page);
  });

  test("Transações and Beneficiários render", async ({ page }) => {
    await page.goto("/app/transactions");
    await expectNoLoadError(page);
    await page.goto("/app/beneficiaries");
    await expectNoLoadError(page);
  });

  test("Receber is announced but not navigable", async ({ page }) => {
    // The coming-soon sidebar row is one inert element: "Receber" + the "Em breve" pill.
    const receber = page.locator('[aria-disabled="true"]').filter({ hasText: "Receber" });
    await expect(receber).toBeVisible();
    await expect(receber).toContainText(/em breve/i);
  });
});

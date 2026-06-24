import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Bundle option visible to all users (no auth needed)
// ---------------------------------------------------------------------------

test.describe("Bundle payment option (unauthenticated)", () => {
  test("wall loads without errors on /us", async ({ page }) => {
    await page.goto("/us");
    await expect(page.locator(".wall, .wall-page-shell, main")).toBeVisible({ timeout: 12_000 });
  });
});

// ---------------------------------------------------------------------------
// Bundle option in composer – requires auth
// ---------------------------------------------------------------------------

test.describe("Bundle option in composer @auth", () => {
  test.use({ storageState: "tests/e2e/.auth/user.json" });

  async function openComposerToStep3(page: import("@playwright/test").Page) {
    await page.goto("/us");
    await page.locator(".compose-btn, button:has-text('Post'), [aria-label*='Post']").first().click();
    await expect(page.locator(".composer")).toBeVisible({ timeout: 8_000 });

    // Step 1 → Step 2
    await page.locator(".composer footer button[type='submit']").click();
    await expect(page.locator("input[name='name']")).toBeVisible();

    // Fill required fields
    await page.fill("input[name='name']", "Metro Coverage Biz");
    await page.selectOption("select >> nth=0", { label: "Services" });
    await page.selectOption("select >> nth=1", { index: 1 });
    await page.fill("textarea[name='line']", "We cover the whole metro area");
    await page.fill("input[name='phone']", "+1 555 900 1234");

    // Step 2 → Step 3
    await page.locator(".composer footer button[type='submit']").click();
    await expect(page.locator(".payment-options")).toBeVisible({ timeout: 15_000 });
  }

  test("Step 3 shows 5 payment options including bundle", async ({ page }) => {
    await openComposerToStep3(page);
    await expect(page.locator(".payment-option")).toHaveCount(5);
    await expect(page.locator(".payment-option.bundle")).toBeVisible();
  });

  test("bundle option shows Best value badge", async ({ page }) => {
    await openComposerToStep3(page);
    await expect(page.locator(".payment-badge")).toBeVisible();
    await expect(page.locator(".payment-badge")).toContainText(/best value/i);
  });

  test("selecting bundle reveals the 3-city picker", async ({ page }) => {
    await openComposerToStep3(page);
    await page.locator(".payment-option.bundle").click();
    await expect(page.locator(".bundle-picker")).toBeVisible({ timeout: 4_000 });
  });

  test("bundle picker shows 3 city slots", async ({ page }) => {
    await openComposerToStep3(page);
    await page.locator(".payment-option.bundle").click();
    await expect(page.locator(".bundle-city-slot")).toHaveCount(3);
  });

  test("bundle picker slot labels read City 1, City 2, City 3", async ({ page }) => {
    await openComposerToStep3(page);
    await page.locator(".payment-option.bundle").click();
    const labels = page.locator(".bundle-slot-label");
    await expect(labels.nth(0)).toContainText("City 1");
    await expect(labels.nth(1)).toContainText("City 2");
    await expect(labels.nth(2)).toContainText("City 3");
  });

  test("submitting bundle without all countries selected shows error", async ({ page }) => {
    await openComposerToStep3(page);
    await page.locator(".payment-option.bundle").click();
    await expect(page.locator(".bundle-picker")).toBeVisible({ timeout: 4_000 });

    // Clear slot 1 back to empty (it may be pre-filled)
    await page.locator(".bundle-city-slot >> nth=0 >> select >> nth=0").selectOption("");

    await page.locator(".composer footer button[type='submit']").click();
    await expect(page.locator(".field-error")).toBeVisible({ timeout: 4_000 });
    await expect(page.locator(".field-error")).toContainText(/country/i);
  });

  test("selecting bundle hides auto-renew toggle", async ({ page }) => {
    await openComposerToStep3(page);
    await page.locator(".payment-option.bundle").click();
    await expect(page.locator(".composer-auto-renew-row")).not.toBeVisible();
  });

  test("selecting bundle hides featured tier options", async ({ page }) => {
    await openComposerToStep3(page);
    await page.locator(".payment-option.bundle").click();
    await expect(page.locator(".featured-tier-fieldset")).not.toBeVisible();
  });

  test("switching away from bundle hides the city picker", async ({ page }) => {
    await openComposerToStep3(page);
    await page.locator(".payment-option.bundle").click();
    await expect(page.locator(".bundle-picker")).toBeVisible({ timeout: 4_000 });

    // Switch back to $7.99
    await page.locator(".payment-option").filter({ hasText: "$7.99" }).click();
    await expect(page.locator(".bundle-picker")).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Footer digest widget
// ---------------------------------------------------------------------------

test.describe("Footer digest widget", () => {
  test("footer renders on the wall page", async ({ page }) => {
    await page.goto("/us");
    await expect(page.locator(".app-footer")).toBeVisible({ timeout: 10_000 });
  });

  test("legal links are present in the footer", async ({ page }) => {
    await page.goto("/us");
    const footer = page.locator(".app-footer");
    await expect(footer.locator("a[href='/terms-and-conditions']")).toBeVisible({ timeout: 10_000 });
    await expect(footer.locator("a[href='/privacy-policy']")).toBeVisible();
  });

  test("digest widget appears on a connected wall when signed in @auth", async ({ page }) => {
    test.use({ storageState: "tests/e2e/.auth/user.json" });
    await page.goto("/us");
    await expect(page.locator(".footer-digest-widget, .footer-digest-success")).toBeVisible({ timeout: 12_000 });
  });
});

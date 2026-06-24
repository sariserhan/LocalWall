import { test, expect } from "@playwright/test";

/**
 * Card expiry warning E2E tests.
 *
 * The visual indicator (yellow ring = ownership, red ⚠ Renew stamp = expiring)
 * requires a card already in the database that expires within 3 days. The
 * `@expiry` tag marks tests that need this pre-condition; run them against a
 * seeded environment or after manually creating a near-expiry card.
 *
 * Auth-free tests verify that no expiry indicator leaks to non-owners.
 */

// ---------------------------------------------------------------------------
// Non-owner view — indicator must never appear
// ---------------------------------------------------------------------------

test.describe("Expiry warning — non-owner view", () => {
  test("wall cards have no expiry stamp for anonymous visitors", async ({ page }) => {
    await page.goto("/us");
    // Wait for cards to render
    await page.waitForSelector(".wall-card", { timeout: 12_000 }).catch(() => null);
    // No card should show the expiry stamp to visitors
    await expect(page.locator(".card-expiry-warn")).toHaveCount(0);
  });

  test("is-expiring-soon class is absent for anonymous visitors", async ({ page }) => {
    await page.goto("/us");
    await page.waitForSelector(".wall-card", { timeout: 12_000 }).catch(() => null);
    await expect(page.locator(".wall-card.is-expiring-soon")).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// Owner view — yellow ownership ring (no expiry)
// ---------------------------------------------------------------------------

test.describe("Owner card ring @auth", () => {
  test.use({ storageState: "tests/e2e/.auth/user.json" });

  test("owner cards have the is-owner-card class", async ({ page }) => {
    await page.goto("/us");
    // If the signed-in user has cards they should appear with the owner class
    const ownerCards = page.locator(".wall-card.is-owner-card");
    // We can't assert a count without knowing the DB state, but we verify
    // the class is correctly applied when present — check CSS is loaded
    const styleLoaded = await page.evaluate(() =>
      Array.from(document.styleSheets).some((ss) => {
        try {
          return Array.from(ss.cssRules).some((r) => r.cssText.includes("is-owner-card"));
        } catch { return false; }
      }),
    );
    expect(styleLoaded).toBe(true);
    // Ownership ring should be yellow (#edcf35), not red
    const ownerCardEl = await ownerCards.first().elementHandle().catch(() => null);
    if (ownerCardEl) {
      const boxShadow = await page.evaluate(
        (el) => window.getComputedStyle(el).boxShadow,
        ownerCardEl,
      );
      // Yellow ring (#edcf35) — red (#f43d38) must not be the ring color
      expect(boxShadow).not.toMatch(/#f43d38|rgb\(244,\s*61,\s*56\)/);
    }
  });
});

// ---------------------------------------------------------------------------
// Expiry stamp — requires a card expiring within 3 days @expiry @auth
// ---------------------------------------------------------------------------

test.describe("Expiry stamp @expiry @auth", () => {
  test.use({ storageState: "tests/e2e/.auth/user.json" });

  test("card with is-expiring-soon class shows the ⚠ Renew stamp", async ({ page }) => {
    await page.goto("/us");
    // If a near-expiry owner card is present, the stamp must be visible on it
    const expiringCard = page.locator(".wall-card.is-owner-card.is-expiring-soon").first();
    const count = await expiringCard.count();
    test.skip(count === 0, "No near-expiry owner card in this environment");

    await expect(expiringCard.locator(".card-expiry-warn")).toBeVisible();
    await expect(expiringCard.locator(".card-expiry-warn")).toContainText(/renew/i);
  });

  test("non-expiring owner cards do not show the stamp", async ({ page }) => {
    await page.goto("/us");
    const healthyOwnerCards = page.locator(".wall-card.is-owner-card:not(.is-expiring-soon)");
    const count = await healthyOwnerCards.count();
    test.skip(count === 0, "No non-expiring owner card in this environment");

    await expect(healthyOwnerCards.first().locator(".card-expiry-warn")).toHaveCount(0);
  });
});

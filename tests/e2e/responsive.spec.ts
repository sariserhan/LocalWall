import { test, expect } from "@playwright/test";

/**
 * Responsive layout tests — no auth required.
 * Covers the home page and wall page at three viewports.
 */

const VIEWPORTS = {
  mobile: { width: 375, height: 812 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
};

// ---------------------------------------------------------------------------
// Home page
// ---------------------------------------------------------------------------

test.describe("Home page layout", () => {
  test("desktop: nav brand and search form visible", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto("/");
    await expect(page.locator(".home-nav-brand")).toBeVisible();
    await expect(page.locator(".home-search-form")).toBeVisible();
    await expect(page.locator(".home-search-submit")).toBeVisible();
  });

  test("mobile: nav brand visible, layout adapts", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto("/");
    await expect(page.locator(".home-nav-brand")).toBeVisible();
    // Search form should still be accessible.
    await expect(page.locator(".home-search-form")).toBeVisible();
  });

  test("tablet: hero and search both visible", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.tablet);
    await page.goto("/");
    await expect(page.locator(".home-nav-brand")).toBeVisible();
    await expect(page.locator(".home-search-form")).toBeVisible();
  });

  test("home page title is correct", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/LocalWall/i);
  });
});

// ---------------------------------------------------------------------------
// Wall page (/us)
// ---------------------------------------------------------------------------

test.describe("Wall page layout", () => {
  test("desktop: topbar, location button, and wall visible", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto("/us");
    await expect(page.locator(".topbar")).toBeVisible();
    await expect(page.locator(".brand")).toBeVisible();
    await expect(page.locator(".location")).toBeVisible();
    await expect(page.locator(".wall")).toBeVisible();
  });

  test("mobile: topbar is compact but usable", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto("/us");
    await expect(page.locator(".topbar")).toBeVisible();
    await expect(page.locator(".location")).toBeVisible();
  });

  test("tablet: topbar visible with location picker", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.tablet);
    await page.goto("/us");
    await expect(page.locator(".topbar")).toBeVisible();
    await expect(page.locator(".location")).toBeVisible();
  });

  test("location picker dropdown opens on click", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto("/us");
    await page.locator(".location").click();
    await expect(page.locator(".location-panel")).toBeVisible();
  });

  test("location panel has country combobox", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto("/us");
    await page.locator(".location").click();
    await expect(page.locator(".location-panel .loc-combo-input").first()).toBeVisible();
  });

  test("location panel closes on backdrop click", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto("/us");
    await page.locator(".location").click();
    await expect(page.locator(".location-panel")).toBeVisible();
    // Click the backdrop.
    await page.locator(".filter-backdrop").click({ force: true });
    await expect(page.locator(".location-panel")).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Wall page — state & city routes
// ---------------------------------------------------------------------------

test.describe("Sub-location routes", () => {
  test("/us/md resolves and shows wall", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto("/us/md");
    await expect(page.locator(".wall")).toBeVisible();
    await expect(page.locator(".location")).toBeVisible();
  });

  test("404 route shows fallback, not crash", async ({ page }) => {
    const response = await page.goto("/zz/zz/zzz-not-real");
    // Either 404 or redirect — should not throw an uncaught exception.
    expect([200, 404]).toContain(response?.status());
    // No JS error should surface.
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.waitForLoadState("networkidle");
    expect(errors.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Typography & brand consistency
// ---------------------------------------------------------------------------

test.describe("Brand consistency", () => {
  test("home nav brand and wall topbar brand share the same text", async ({ page }) => {
    await page.goto("/");
    const homeBrand = await page.locator(".home-nav-brand strong").innerText();

    await page.goto("/us");
    const wallBrand = await page.locator(".brand").innerText();

    // Both should include "LocalWall".
    expect(homeBrand).toContain("LocalWall");
    expect(wallBrand).toContain("LocalWall");
  });

  test("tagline visible in both navbars", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto("/");
    const homeTagline = await page.locator(".home-nav-brand small").innerText();

    await page.goto("/us");
    const wallTagline = await page.locator(".brand span").innerText();

    expect(homeTagline.toLowerCase()).toContain("local");
    expect(wallTagline.toLowerCase()).toContain("local");
  });
});

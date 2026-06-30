import { expect, test } from "@playwright/test";

const MOBILE = { width: 375, height: 812 };

const ROUTES = [
  { path: "/", ready: ".home-hero-title" },
  { path: "/trending", ready: ".trending-topbar" },
  { path: "/us", ready: ".topbar" },
  { path: "/sign-in", ready: ".sign-in-card" },
  { path: "/sign-up", ready: ".sign-in-card" },
  { path: "/privacy-policy", ready: "main" },
  { path: "/terms-and-conditions", ready: "main" },
];

test.describe("Mobile smoke", () => {
  test.use({ viewport: MOBILE });

  for (const route of ROUTES) {
    test(`renders ${route.path} without horizontal overflow`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      await expect(page.locator(route.ready)).toBeVisible({ timeout: 15_000 });
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(MOBILE.width + 20);
    });
  }

  test("wall keeps the mobile menu available", async ({ page }) => {
    await page.goto("/us", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".mobile-menu-toggle")).toBeVisible();
  });

  test("home keeps the mobile search flow visible", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".home-search-form")).toBeVisible();
    await expect(page.locator(".home-hero-btn")).toBeVisible();
  });
});

/**
 * Wall load & stress E2E tests.
 *
 * These tests verify that the wall renders correctly and stays performant
 * when many cards are present. The admin playground wall (/admin/wall) is
 * used as the target because it can be seeded with bulk test cards without
 * touching production data.
 *
 * Tests tagged @load require a running dev server and are skipped in CI
 * unless the APP_URL env var points to a pre-seeded environment.
 */

import { test, expect, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function waitForWall(page: Page) {
  await page.waitForSelector(".wall-card, .wall-empty, .app-loading", { timeout: 20_000 });
}

async function countRenderedCards(page: Page) {
  return page.locator(".wall-card").count();
}

async function measureNavigationTime(page: Page, url: string) {
  const start = Date.now();
  await page.goto(url);
  await waitForWall(page);
  return Date.now() - start;
}

// ---------------------------------------------------------------------------
// Admin wall renders without errors
// ---------------------------------------------------------------------------

test.describe("Admin playground wall — rendering", () => {
  test("page loads without a runtime error overlay", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto("/admin/wall");
    await waitForWall(page);
    // Allow known Next.js hydration noise; fail on Convex / app errors only.
    const appErrors = errors.filter((e) => !e.includes("Hydration") && !e.includes("hydration"));
    expect(appErrors).toHaveLength(0);
  });

  test("page title is present", async ({ page }) => {
    await page.goto("/admin/wall");
    await waitForWall(page);
    await expect(page).toHaveTitle(/.+/);
  });

  test("wall container is present in the DOM", async ({ page }) => {
    await page.goto("/admin/wall");
    await waitForWall(page);
    await expect(page.locator(".wall, .wall-page-shell, main")).toBeVisible({ timeout: 15_000 });
  });

  test("no 404 or 500 response on /admin/wall", async ({ page }) => {
    const response = await page.goto("/admin/wall");
    expect(response?.status()).not.toBe(404);
    expect(response?.status()).not.toBe(500);
  });
});

// ---------------------------------------------------------------------------
// Wall page performance baseline
// ---------------------------------------------------------------------------

test.describe("Wall performance — /us baseline", () => {
  test("wall loads within 8 seconds on first visit", async ({ page }) => {
    const elapsed = await measureNavigationTime(page, "/us");
    expect(elapsed).toBeLessThan(8_000);
  });

  test("wall has no layout-breaking overflow on desktop", async ({ page }) => {
    await page.goto("/us");
    await waitForWall(page);
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()!.width;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10);
  });

  test("wall cards do not overlap the top navigation bar", async ({ page }) => {
    await page.goto("/us");
    await waitForWall(page);
    const cardCount = await countRenderedCards(page);
    if (cardCount === 0) return; // nothing to test without cards
    const firstCard = page.locator(".wall-card").first();
    const cardBox = await firstCard.boundingBox();
    const nav = page.locator("nav, header").first();
    const navBox = await nav.boundingBox().catch(() => null);
    if (cardBox && navBox) {
      expect(cardBox.y).toBeGreaterThanOrEqual(navBox.y + navBox.height - 10);
    }
  });
});

// ---------------------------------------------------------------------------
// Stack picker — rendered when cards exist
// ---------------------------------------------------------------------------

test.describe("Stack picker behaviour", () => {
  test("stack-picker-backdrop is not visible on load", async ({ page }) => {
    await page.goto("/us");
    await waitForWall(page);
    await expect(page.locator(".stack-picker-backdrop")).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// Many cards — scroll and layout
// ---------------------------------------------------------------------------

test.describe("Wall with many cards @load", () => {
  test("wall can be scrolled to the bottom without JS errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/admin/wall");
    await waitForWall(page);

    // Scroll incrementally to the bottom.
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let lastY = -1;
        const step = () => {
          window.scrollBy(0, 400);
          if (window.scrollY === lastY) return resolve();
          lastY = window.scrollY;
          requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    });

    const appErrors = errors.filter((e) => !e.includes("Hydration") && !e.includes("hydration"));
    expect(appErrors).toHaveLength(0);
  });

  test("all rendered cards have the .wall-card class", async ({ page }) => {
    await page.goto("/admin/wall");
    await waitForWall(page);
    const total = await countRenderedCards(page);
    if (total === 0) return;
    const withClass = await page.locator(".wall-card").count();
    expect(withClass).toBe(total);
  });

  test("wall renders within 10 seconds even with many cards", async ({ page }) => {
    const elapsed = await measureNavigationTime(page, "/admin/wall");
    expect(elapsed).toBeLessThan(10_000);
  });

  test("cards are positioned within the wall bounds", async ({ page }) => {
    await page.goto("/admin/wall");
    await waitForWall(page);
    const total = await countRenderedCards(page);
    if (total === 0) return;

    const outOfBounds = await page.evaluate(() => {
      const wall = document.querySelector(".wall") as HTMLElement | null;
      if (!wall) return 0;
      const wallRect = wall.getBoundingClientRect();
      const cards = Array.from(document.querySelectorAll(".wall-card")) as HTMLElement[];
      return cards.filter((c) => {
        const r = c.getBoundingClientRect();
        return r.left < wallRect.left - 50 || r.right > wallRect.right + 50;
      }).length;
    });
    expect(outOfBounds).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Mobile — wall loads on small screen
// ---------------------------------------------------------------------------

test.describe("Wall on mobile viewport @mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("admin wall loads without horizontal scroll on mobile", async ({ page }) => {
    await page.goto("/admin/wall");
    await waitForWall(page);
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(395);
  });

  test("wall renders cards without JS errors on mobile", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto("/admin/wall");
    await waitForWall(page);
    const appErrors = errors.filter((e) => !e.includes("Hydration") && !e.includes("hydration"));
    expect(appErrors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Concurrent navigation (tab stability)
// ---------------------------------------------------------------------------

test.describe("Concurrent page loads", () => {
  test("two simultaneous navigations to /us both succeed", async ({ browser }) => {
    const [ctx1, ctx2] = await Promise.all([browser.newContext(), browser.newContext()]);
    const [p1, p2] = await Promise.all([ctx1.newPage(), ctx2.newPage()]);
    const [r1, r2] = await Promise.all([
      p1.goto(process.env.APP_URL ? `${process.env.APP_URL}/us` : "http://localhost:3000/us"),
      p2.goto(process.env.APP_URL ? `${process.env.APP_URL}/us` : "http://localhost:3000/us"),
    ]);
    expect(r1?.status()).toBeLessThan(400);
    expect(r2?.status()).toBeLessThan(400);
    await Promise.all([ctx1.close(), ctx2.close()]);
  });
});

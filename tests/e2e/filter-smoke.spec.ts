import { expect, test, type Page } from "@playwright/test";

async function openFilters(page: Page, mobile = false) {
  if (mobile) {
    const menuToggle = page.locator(".mobile-menu-toggle");
    await menuToggle.click();
    await page.waitForTimeout(300);
  }

  const filterButton = page.locator(".filter-btn");
  await filterButton.click({ force: true });
  await expect(page.locator(".filter-panel")).toBeVisible();
}

test.describe("Wall filter smoke", () => {
  test("apply and reset category filters update the route and badge", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });

    await page.goto("/us");
    await expect(page.locator(".wall, .app-loading")).toBeVisible();
    await expect(page).toHaveURL(/\/us(?:\?|$)/);

    await openFilters(page);
    await page.locator(".filter-panel select").first().selectOption({ label: "Services" });
    await page.locator(".filter-panel .primary").click({ force: true });
    await expect.poll(() => page.url()).toMatch(/\/us\/services(?:\?|$)/);
    await expect(page.locator(".filter-badge")).toHaveText("1");

    await openFilters(page);
    await page.locator(".filter-panel .filter-clear-btn").last().click({ force: true });
    await expect.poll(() => page.url()).toMatch(/\/us(?:\?|$)/);
    await expect(page.locator(".filter-badge")).toHaveCount(0);

    const relevantErrors = errors.filter((entry) => !entry.includes("Hydration") && !entry.includes("hydration"));
    expect(relevantErrors).toHaveLength(0);
  });

  test("category filter remains usable on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/us");
    await expect(page.locator(".wall, .app-loading")).toBeVisible();

    await openFilters(page, true);
    await page.locator(".filter-panel select").first().selectOption({ label: "Services" });
    await page.locator(".filter-panel .primary").click({ force: true });
    await expect.poll(() => page.url()).toMatch(/\/us\/services(?:\?|$)/);
    await expect(page.locator(".filter-badge")).toHaveText("1");
  });
});

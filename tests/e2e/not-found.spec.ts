import { test, expect } from "@playwright/test";

test.describe("404 not-found page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/this-page-does-not-exist-at-all", { waitUntil: "domcontentloaded" });
  });

  test("renders the wall-card aesthetic", async ({ page }) => {
    await expect(page.locator(".nf-card")).toBeVisible({ timeout: 8_000 });
  });

  test("displays 404 in large type", async ({ page }) => {
    await expect(page.locator(".nf-code")).toContainText("404");
  });

  test("displays the empty-spot headline", async ({ page }) => {
    await expect(page.locator(".nf-headline")).toBeVisible();
  });

  test("shows REMOVED stamp", async ({ page }) => {
    await expect(page.locator(".nf-stamp")).toBeVisible();
  });

  test("Back to LocalWall button links to home", async ({ page }) => {
    const btn = page.locator(".nf-btn-primary");
    await expect(btn).toBeVisible();
    await expect(btn).toHaveAttribute("href", "/");
  });

  test("Browse listings button is present", async ({ page }) => {
    const btn = page.locator(".nf-btn-secondary");
    await expect(btn).toBeVisible();
    // href is either "/" or a country slug like "/us" — never empty
    const href = await btn.getAttribute("href");
    expect(href).toBeTruthy();
  });

  test("WALL brand label is visible", async ({ page }) => {
    await expect(page.locator(".nf-brand")).toBeVisible();
  });

  test("page title includes 404 or Not Found", async ({ page }) => {
    await expect(page).toHaveTitle(/404|not found/i);
  });
});

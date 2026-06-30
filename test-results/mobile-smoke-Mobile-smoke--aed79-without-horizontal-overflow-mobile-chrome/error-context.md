# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: mobile-smoke.spec.ts >> Mobile smoke >> renders /sign-up without horizontal overflow
- Location: tests/e2e/mobile-smoke.spec.ts:19:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
Call log:
  - navigating to "http://localhost:3000/sign-up", waiting until "domcontentloaded"

```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | 
  3  | const MOBILE = { width: 375, height: 812 };
  4  | 
  5  | const ROUTES = [
  6  |   { path: "/", ready: ".home-hero-title" },
  7  |   { path: "/trending", ready: ".trending-topbar" },
  8  |   { path: "/us", ready: ".topbar" },
  9  |   { path: "/sign-in", ready: ".sign-in-card" },
  10 |   { path: "/sign-up", ready: ".sign-in-card" },
  11 |   { path: "/privacy-policy", ready: "main" },
  12 |   { path: "/terms-and-conditions", ready: "main" },
  13 | ];
  14 | 
  15 | test.describe("Mobile smoke", () => {
  16 |   test.use({ viewport: MOBILE });
  17 | 
  18 |   for (const route of ROUTES) {
  19 |     test(`renders ${route.path} without horizontal overflow`, async ({ page }) => {
> 20 |       await page.goto(route.path, { waitUntil: "domcontentloaded" });
     |                  ^ Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
  21 |       await expect(page.locator(route.ready)).toBeVisible({ timeout: 15_000 });
  22 |       const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
  23 |       expect(bodyWidth).toBeLessThanOrEqual(MOBILE.width + 20);
  24 |     });
  25 |   }
  26 | 
  27 |   test("wall keeps the mobile menu available", async ({ page }) => {
  28 |     await page.goto("/us", { waitUntil: "domcontentloaded" });
  29 |     await expect(page.locator(".mobile-menu-toggle")).toBeVisible();
  30 |   });
  31 | 
  32 |   test("home keeps the mobile search flow visible", async ({ page }) => {
  33 |     await page.goto("/", { waitUntil: "domcontentloaded" });
  34 |     await expect(page.locator(".home-search-form")).toBeVisible();
  35 |     await expect(page.locator(".home-hero-btn")).toBeVisible();
  36 |   });
  37 | });
  38 | 
```
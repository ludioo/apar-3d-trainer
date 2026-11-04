import { expect, test } from '@playwright/test';

// U4: verify Playwright matrix wiring. Full smoke suite = U5.
test('toolchain serves FireDrill shell', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
  await expect(page).toHaveTitle(/FireDrill/i);
});

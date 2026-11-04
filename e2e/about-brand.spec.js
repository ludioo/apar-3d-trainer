import { expect, test } from '@playwright/test';
import { openConfigureReady, tap } from './helpers.js';

test('brand FireDrill and About CTA to CONTACT_URL', async ({ page }) => {
  await openConfigureReady(page);

  await expect(page).toHaveTitle(/FireDrill/i);
  await expect(page.locator('.topbar__name')).toHaveText(/FireDrill/i);

  await tap(page.locator('a.topbar__about[href="#about"]'));
  const about = page.locator('#about');
  await expect(about).toBeVisible();

  const cta = about.locator('[data-about="contact"]');
  await expect(cta).toBeVisible();
  await expect(cta).toHaveAttribute('href', 'https://barkahmauludi.com/contact');
  await expect(cta).toContainText(/Work with me|Kerja sama/i);
});

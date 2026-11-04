import { expect, test } from '@playwright/test';
import { ensureSheetRoom, seedOnboardingDone, tap, waitAppReady } from './helpers.js';

test('smoke Train: PASS start and Squeeze hold completes', async ({ page }) => {
  await seedOnboardingDone(page);
  await page.goto('/#train');
  await waitAppReady(page);
  await ensureSheetRoom(page);

  const start = page.locator('button[data-training="start"]');
  await expect(start).toBeEnabled({ timeout: 60_000 });
  await tap(start);

  // Pull + Aim → skip to Squeeze (hold).
  for (let i = 0; i < 2; i += 1) {
    await tap(page.locator('button[data-training="skip"]'));
    await tap(page.locator('button[data-training="next"]'));
  }

  const interact = page.locator('button[data-training="interact"]');
  await expect(interact).toHaveAttribute('data-interaction', 'hold');
  await expect(page.locator('.training__hold-ring')).toBeVisible();

  await interact.focus();
  await page.keyboard.down(' ');
  await expect
    .poll(async () => page.locator('button[data-training="next"]').isEnabled(), {
      timeout: 8_000,
    })
    .toBe(true);
  await page.keyboard.up(' ');

  await expect(page.locator('.training__status')).toContainText(/Interaction complete|Interaksi berhasil/i);
});

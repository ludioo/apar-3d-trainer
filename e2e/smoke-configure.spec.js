import { expect, test } from '@playwright/test';
import { openConfigureReady, tap } from './helpers.js';

test('smoke Configure: change options, Save, toast', async ({ page }) => {
  await openConfigureReady(page);

  await tap(page.locator('button.config-choice[data-agent="co2"]'));
  await tap(page.locator('button.config-choice[data-capacity="9kg"]'));
  await tap(page.locator('button.config-color[data-color="yellow"]'));

  const save = page.locator('button[data-action="save"]');
  await expect(save).toBeEnabled({ timeout: 60_000 });
  await tap(save);

  const dialog = page.locator('dialog.saved-dialog');
  await expect(dialog).toBeVisible();
  await dialog.locator('#saved-name').fill('U5 smoke');
  await tap(dialog.locator('button[type="submit"]'));

  const toast = page.locator('#toast');
  await expect(toast).toBeVisible();
  await expect(toast).toContainText(/saved|tersimpan/i);
});

import { expect, test } from '@playwright/test';
import { openConfigureReady, rectsOverlap, tap } from './helpers.js';

test('toast does not overlap sheet handle', async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name === 'desktop',
    'Sheet handle is hidden on desktop (≥1024px)',
  );

  await openConfigureReady(page);

  const save = page.locator('button[data-action="save"]');
  await expect(save).toBeEnabled({ timeout: 60_000 });
  await tap(save);
  await page.locator('dialog.saved-dialog #saved-name').fill('U5 toast');
  await tap(page.locator('dialog.saved-dialog button[type="submit"]'));

  const toast = page.locator('#toast');
  await expect(toast).toBeVisible();

  const boxes = await page.evaluate(() => {
    const t = document.getElementById('toast')?.getBoundingClientRect();
    const h = document.querySelector('.panel__handle')?.getBoundingClientRect();
    if (!t || !h) return null;
    return {
      toast: { left: t.left, right: t.right, top: t.top, bottom: t.bottom },
      handle: { left: h.left, right: h.right, top: h.top, bottom: h.bottom },
      handleVisible: (() => {
        const el = document.querySelector('.panel__handle');
        return el ? getComputedStyle(el).display !== 'none' : false;
      })(),
    };
  });

  expect(boxes).not.toBeNull();
  expect(boxes.handleVisible).toBe(true);
  expect(rectsOverlap(boxes.toast, boxes.handle)).toBe(false);
  // Toast sits above the sheet handle strip.
  expect(boxes.toast.bottom).toBeLessThanOrEqual(boxes.handle.top + 0.5);
});

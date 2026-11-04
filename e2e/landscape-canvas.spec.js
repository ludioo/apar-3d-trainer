import { expect, test } from '@playwright/test';
import { seedOnboardingDone, waitAppReady } from './helpers.js';

test('landscape canvas height is at least 40% of viewport', async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== 'mobile-landscape',
    'Landscape canvas assert only on mobile-landscape project',
  );

  // Keep default peek — do not expand sheet (ensureSheetRoom).
  await seedOnboardingDone(page);
  await page.goto('/#configure');
  await waitAppReady(page);

  const metrics = await page.evaluate(() => {
    const canvas =
      document.querySelector('#canvas-root canvas') || document.querySelector('canvas');
    const r = canvas?.getBoundingClientRect();
    return {
      canvasH: r?.height ?? 0,
      vh: window.innerHeight,
      snap: document.querySelector('#panel')?.dataset.snap || null,
      shortLandscape: document.documentElement.classList.contains('is-short-landscape'),
    };
  });

  expect(metrics.shortLandscape).toBe(true);
  expect(metrics.snap).toBe('peek');
  expect(metrics.canvasH / metrics.vh).toBeGreaterThanOrEqual(0.4);
});

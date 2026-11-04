import { expect, test } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openConfigureReady } from './helpers.js';

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../docs/_baselines/u5');

const CAPTURE = new Set(['mobile-iphone13', 'mobile-landscape', 'desktop']);

test('optional U5 baseline screenshot', async ({ page }, testInfo) => {
  test.skip(!CAPTURE.has(testInfo.project.name), 'Baseline only for selected projects');

  await openConfigureReady(page);
  await expect(page.locator('.topbar__name')).toBeVisible();

  const file = path.join(OUT, `${testInfo.project.name}.png`);
  await page.screenshot({ path: file, fullPage: false });
});

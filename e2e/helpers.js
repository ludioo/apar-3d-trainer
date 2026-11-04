import { expect } from '@playwright/test';

/** Skip driver.js tour so smoke tests stay deterministic. */
export async function seedOnboardingDone(page) {
  await page.addInitScript(() => {
    localStorage.setItem('apar3d:onboarding', 'true');
  });
}

/** Wait until splash finished and WebGL canvas is present. */
export async function waitAppReady(page) {
  await page.waitForFunction(
    () =>
      performance.getEntriesByName('apar:visible').length > 0 ||
      !document.getElementById('splash'),
    null,
    { timeout: 120_000 },
  );
  await expect(page.locator('#canvas-root canvas')).toBeVisible({ timeout: 60_000 });
}

/**
 * three.js RAF / ResizeObserver often blocks Playwright "stable" clicks on Windows
 * headless WebGL. Prefer a real click; fall back to force only after timeout.
 * Pair with ensureSheetRoom so peek does not cover panel controls.
 */
export async function tap(locator) {
  await expect(locator).toBeVisible();
  try {
    await locator.click({ timeout: 8_000 });
  } catch {
    await locator.click({ force: true });
  }
}

export function rectsOverlap(a, b) {
  return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
}

/** Short-landscape defaults to peek — expand once so panel controls are hittable. */
export async function ensureSheetRoom(page) {
  const short = await page.evaluate(() =>
    document.documentElement.classList.contains('is-short-landscape'),
  );
  if (!short) return;
  const panel = page.locator('#panel');
  if ((await panel.getAttribute('data-snap')) !== 'peek') return;
  await tap(page.locator('.panel__handle'));
  await expect.poll(async () => panel.getAttribute('data-snap')).not.toBe('peek');
}

export async function openConfigureReady(page) {
  await seedOnboardingDone(page);
  await page.goto('/#configure');
  await waitAppReady(page);
  await ensureSheetRoom(page);
}

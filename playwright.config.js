import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173';

/** Viewport/UA from device presets; always Chromium so Windows/CI need no WebKit binary. */
function chromiumDevice(device) {
  const { defaultBrowserType: _ignored, ...rest } = device;
  return { ...rest, browserName: 'chromium' };
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // WebGL + headless GPU stalls; keep concurrency low to avoid flaky "stable" waits.
  workers: process.env.CI ? 1 : 2,
  timeout: 120_000,
  expect: { timeout: 30_000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL,
    locale: 'en-US',
    trace: 'on-first-retry',
    video: 'on',
    actionTimeout: 45_000,
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        // Build then preview so e2e never hits missing/stale dist on :4173.
        command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
        url: baseURL,
        reuseExistingServer: false,
        timeout: 180_000,
      },
  projects: [
    {
      name: 'mobile-pixel7',
      use: chromiumDevice(devices['Pixel 7']),
    },
    {
      name: 'mobile-iphone13',
      use: chromiumDevice(devices['iPhone 13']),
    },
    {
      name: 'mobile-iphone-se',
      use: {
        ...chromiumDevice(devices['iPhone SE']),
        viewport: { width: 375, height: 667 },
      },
    },
    {
      name: 'mobile-landscape',
      use: {
        ...chromiumDevice(devices['iPhone 13']),
        viewport: { width: 844, height: 390 },
      },
    },
    {
      name: 'desktop',
      use: {
        ...chromiumDevice(devices['Desktop Chrome']),
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
});

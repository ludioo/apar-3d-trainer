import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'on-first-retry',
    video: 'on',
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
        url: baseURL,
        // Always start a fresh preview so e2e never asserts against a stale server on :4173.
        reuseExistingServer: false,
        timeout: 120_000,
      },
  projects: [
    {
      name: 'mobile-pixel7',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'mobile-iphone13',
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'mobile-iphone-se',
      use: {
        ...devices['iPhone SE'],
        viewport: { width: 375, height: 667 },
      },
    },
    {
      name: 'mobile-landscape',
      use: {
        ...devices['iPhone 13'],
        viewport: { width: 844, height: 390 },
      },
    },
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
});

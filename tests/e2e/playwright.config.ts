import { defineConfig, devices } from '@playwright/test';

// Target site. Default = production (read-only/non-destructive specs only).
// Override for the local parity site:  BASE_URL=http://localhost:8080 npm test
const BASE_URL = process.env.BASE_URL || 'https://gratis.superglobalsdevelopment.com';

export default defineConfig({
  testDir: './specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 4 : undefined, // local: Playwright picks ~half the cores
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  timeout: 30_000,
  expect: { timeout: 7_000 },
  use: {
    baseURL: BASE_URL,
    headless: true,
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});

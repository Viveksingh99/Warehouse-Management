import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.UI_BASE_URL || process.env.BASE_URL || 'http://127.0.0.1:5173';
const jsonOutputFile = process.env.PLAYWRIGHT_JSON_OUTPUT_FILE || 'test-results/playwright-report.json';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 30_000,
  expect: {
    timeout: 8_000,
  },
  reporter: [
    ['list'],
    ['json', { outputFile: jsonOutputFile }],
  ],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

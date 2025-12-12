import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  retries: 1,
  reporter: 'list',

  use: {
    baseURL: 'http://localhost:3003',
    headless: true,
    trace: 'on-first-retry',
  },
});

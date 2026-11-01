import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',

  fullyParallel: false,

  retries: 0,

  reporter: 'list',

  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    extraHTTPHeaders: {
      'x-forwarded-proto': 'http'
    }
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],

  webServer: {
    command: 'NODE_ENV=test PROTOCOL_HEADER=x-forwarded-proto HOST=127.0.0.1 PORT=4173 node build',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 30_000,
    stdout: 'pipe'
  }
});

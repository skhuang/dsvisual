const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  // Retry in CI so a transient timing flake (e.g. a nav interaction under parallel
  // load) doesn't fail the run and block the Pages deploy. A real regression still
  // fails all attempts. Traces are captured on-first-retry (see `use` below).
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

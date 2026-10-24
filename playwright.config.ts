import { defineConfig } from "@playwright/test";

// Tests run against their own dev server in local test mode (in-memory
// database, pretend sign-in), so they never touch real data.
const PORT = 3100;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [
    {
      // The design target from docs/DESIGN.md: a 390 x 844 phone.
      name: "phone",
      use: {
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: `npx next dev --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      EMPIRE_TEST_MODE: "1",
      NEXT_PUBLIC_EMPIRE_TEST_MODE: "1",
      EMPIRE_DIST_DIR: ".next-test",
    },
  },
});

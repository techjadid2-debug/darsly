import { defineConfig, devices } from '@playwright/test'

/**
 * The suite drives `/dev/game/[game]`, a harness that renders one game over one
 * starter template with no activity row, no account and no Supabase call — so a
 * game regression is caught without standing up a database. That route 404s
 * unless `DARSLY_E2E=1`, which no deployment sets and the server below does.
 *
 * Phones are the device these games are actually played on, so the one project
 * is a mobile viewport rather than a desktop one.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'mobile', use: { ...devices['Pixel 7'] } }],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { DARSLY_E2E: '1' },
  },
})

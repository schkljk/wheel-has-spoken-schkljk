import { defineConfig, devices } from '@playwright/test';

// PW_PORT lets two copies of the repo run their e2e suites side by side
const PORT = Number(process.env.PW_PORT) || 4173;

export default defineConfig({
  testDir: 'apps/game/e2e',
  fullyParallel: true,
  // the layout matrix walks every screen per size; CI machines are slower than laptops
  timeout: 120_000,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}/`,
    launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
  },
  projects: [{ name: 'phone', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } }],
  webServer: {
    command: `npm run build && npx vite preview apps/game --port ${PORT} --strictPort`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});

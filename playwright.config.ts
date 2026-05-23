import { defineConfig, devices } from "@playwright/test";

// Visual regression harness for @dreampak/design-system primitives.
//
// What this validates:
//   The package's primitives (Button, Pill, Card, Field, DataTable,
//   SectionRule, color tokens) render the same across versions. The harness
//   boots dp-app-template's /showcase route — a single page that exercises
//   every primitive variant — and screenshot-diffs against baselines under
//   tests/__screenshots__/.
//
// What it does NOT validate:
//   Consumer apps. Each consumer pins to a tagged version; if a consumer
//   wants its own visual harness it builds one against its own routes.
//
// Baselines live in tests/__screenshots__/. Intentional design changes
// regenerate baselines with `npm run test:visual:update`.
//
// CI: .github/workflows/visual-regression.yml runs `npm run test:visual` on
// every PR to main.

export default defineConfig({
  testDir: "./tests/visual",
  // Sequential — the dev server is shared and screenshots are layout-sensitive.
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "list",
  // Snapshots live next to the tests, under tests/__screenshots__/ via the
  // snapshotPathTemplate. Group by viewport (project name) so the desktop
  // baseline never collides with the mobile baseline.
  snapshotPathTemplate:
    "tests/__screenshots__/{projectName}/{testFilePath}/{arg}{ext}",
  use: {
    trace: "on-first-retry",
    screenshot: "on",
    baseURL: "http://localhost:3000",
  },
  // 4 viewports: 3 device sizes + a reduced-motion variant at desktop.
  // All projects use Chromium so CI only needs one browser engine
  // (`playwright install chromium`). Mobile + tablet viewports are
  // emulated via viewport/hasTouch/isMobile/userAgent rather than the
  // WebKit-backed `devices["iPad Pro 11"]` / `devices["iPhone 13"]`
  // presets — the design system's CSS doesn't render differently between
  // engines, so a single engine keeps the matrix simple.
  //
  // The reduced-motion project verifies the package's
  // `@media (prefers-reduced-motion: reduce)` rules in styles.css collapse
  // every transition to 0.01ms so screenshots are stable.
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: "tablet",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 768, height: 1024 },
        isMobile: false,
        hasTouch: true,
        deviceScaleFactor: 2,
      },
    },
    {
      name: "mobile",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 375, height: 812 },
        isMobile: false,
        hasTouch: true,
        deviceScaleFactor: 3,
      },
    },
    {
      name: "reduced-motion",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
        reducedMotion: "reduce",
      },
    },
  ],
  // Boot dp-app-template's dev server. CI installs deps in both repos before
  // running the harness — see .github/workflows/visual-regression.yml.
  webServer: {
    command: "cd ../dp-app-template && npm run dev",
    url: "http://localhost:3000/showcase",
    reuseExistingServer: !process.env.CI,
    stdout: "pipe",
    stderr: "pipe",
    timeout: 120_000,
  },
  // Pixel-diff tolerance. Font hinting drift on a fresh CI image can produce
  // single-digit-pixel diffs even when nothing visual changed; 0.01 (1%)
  // absorbs that without hiding real regressions on any primitive variant.
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      animations: "disabled",
    },
  },
});

import { test, expect } from "@playwright/test";

// Visual regression spec for the @dreampak/design-system primitives.
//
// Drives dp-app-template's /showcase route — a single page that exercises
// every primitive variant shipped by the package. Each section wrapper on
// /showcase has a `data-testid="section-<slug>"` attribute so we can take
// targeted screenshots in addition to the full page.

test.describe("showcase", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/showcase");
    // The page is a server component with no client-side data; once
    // networkidle fires every primitive is laid out.
    await page.waitForLoadState("networkidle");
  });

  test("full page", async ({ page }) => {
    // Disable caret blink animation on inputs so screenshots are stable
    // across runs. Also normalize font rendering — without this, sub-pixel
    // antialiasing differences across CI runners can produce false diffs.
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          caret-color: transparent !important;
          -webkit-font-smoothing: antialiased !important;
          -moz-osx-font-smoothing: grayscale !important;
        }
      `,
    });
    await expect(page).toHaveScreenshot("full-page.png", {
      fullPage: true,
    });
  });

  // Per-section screenshots. Each one isolates one primitive family so a
  // regression in (say) Buttons doesn't blow up every other primitive's
  // baseline at the same time.
  const sections = [
    "typography",
    "buttons",
    "pills",
    "fields",
    "data-tables",
    "cards",
    "section-rules",
    "motion",
    "color-tokens",
    "spinners",
    "toasts",
  ] as const;

  for (const slug of sections) {
    test(`section: ${slug}`, async ({ page }) => {
      const section = page.locator(`[data-testid="section-${slug}"]`);
      await section.scrollIntoViewIfNeeded();
      // Wait for any layout shift from scroll to settle.
      await page.waitForTimeout(150);
      await expect(section).toHaveScreenshot(`section-${slug}.png`);
    });
  }
});

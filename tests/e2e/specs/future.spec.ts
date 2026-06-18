import { test, expect } from '@playwright/test';

// Features implemented in code and VERIFIED on local (BASE_URL=http://localhost:8080).
// Against production (the default BASE_URL) these stay red until the plugin updates,
// the gratis-social post-type config, and a Reviews page are deployed (the deploy
// backlog). See ../../EXPECTATIONS.md and ../../docs/STATUS.md.
test.describe('pending-deploy features (green on local) @future', () => {
  test('comply: consent banner + Google Consent Mode v2 defaults in dataLayer', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#gratis-consent')).toBeVisible();
    const hasDefault = await page.evaluate(() => {
      const dl = (window as any).dataLayer;
      return Array.isArray(dl) && dl.some((e: any) => e && e[0] === 'consent' && e[1] === 'default');
    });
    expect(hasDefault, 'gtag consent default pushed').toBeTruthy();
  });

  test('reviews: AggregateRating JSON-LD on the Reviews page', async ({ page }) => {
    await page.goto('/reviews/', { waitUntil: 'domcontentloaded' });
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(blocks.some((b) => /AggregateRating/.test(b))).toBeTruthy();
  });

  test('social: share buttons render on singular content', async ({ page }) => {
    await page.goto('/docs/gratis-ai/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.gratis-share').first()).toBeVisible();
  });
});

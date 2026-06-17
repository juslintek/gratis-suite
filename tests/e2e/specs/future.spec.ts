import { test, expect } from '@playwright/test';

// Behavior implemented in code THIS session but NOT yet deployed to production.
// All are skipped (fixme) until the plugin update ships. See ../../EXPECTATIONS.md.
// Stateful/admin items belong on the LOCAL parity site (BASE_URL=http://localhost:8080).
test.describe('future / pending deploy @future', () => {
  test.fixme('comply: consent banner + Google Consent Mode v2 defaults in dataLayer', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.locator('[data-gratis-consent], .gratis-comply-banner, #gratis-comply').first()
    ).toBeVisible();
    const hasDefault = await page.evaluate(() => {
      const dl = (window as any).dataLayer;
      return Array.isArray(dl) && dl.some((e: any) => Array.isArray(e) && e[0] === 'consent' && e[1] === 'default');
    });
    expect(hasDefault).toBeTruthy();
  });

  test.fixme('reviews: AggregateRating JSON-LD emitted where testimonials exist', async ({ page }) => {
    await page.goto('/');
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(blocks.some((b) => /AggregateRating/.test(b))).toBeTruthy();
  });

  test.fixme('social: share buttons render on singular content', async ({ page }) => {
    await page.goto('/docs/gratis-ai/');
    await expect(
      page.locator('.gratis-social, [data-share], .share-buttons').first()
    ).toBeVisible();
  });
});

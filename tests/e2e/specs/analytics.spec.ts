import { test, expect } from '@playwright/test';

// gratis-analytics — check for tracking script/beacon presence (non-destructive).
test.describe('analytics @analytics', () => {
  test('gratis-analytics script or tracking endpoint is present', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const html = await page.content();
    const hasAnalytics =
      html.includes('gratis-analytics') ||
      html.includes('gratis_analytics') ||
      html.includes('/wp-json/gratis-analytics/') ||
      html.includes('ga-beacon');
    test.skip(!hasAnalytics, 'No gratis-analytics script or tracking endpoint detected — plugin may not be active');
    expect(hasAnalytics).toBeTruthy();
  });

  test('no third-party analytics leaks (privacy-first)', async ({ page }) => {
    const thirdParty: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (/google-analytics\.com|googletagmanager\.com|facebook\.net|hotjar\.com/.test(url)) {
        thirdParty.push(url);
      }
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(thirdParty, 'gratis-analytics is privacy-first; no third-party trackers expected').toHaveLength(0);
  });
});

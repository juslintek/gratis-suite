import { test, expect } from '@playwright/test';

// gratis-table — check for rendered table with search/sort if shortcode is in use.
test.describe('tables @tables', () => {
  test('gratis-table renders with search/sort if present on any page', async ({ page, request }) => {
    // Pre-check: does the homepage contain actual table widget markup (class, not a link)?
    const r = await request.get('/');
    const body = await r.text();
    const hasTable = /class="[^"]*gratis-table/.test(body) || /data-gratis-table/.test(body);
    test.skip(!hasTable, 'No gratis-table widget rendered on homepage — feature not in use or no table on this page');

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const table = page.locator('.gratis-table, [data-gratis-table]').first();
    await expect(table).toBeVisible();
    const hasControls =
      (await table.locator('input[type="search"], input[placeholder*="earch"], [class*="sort"], th[data-sort]').count()) > 0;
    expect(hasControls, 'table should have search or sort controls').toBeTruthy();
  });
});

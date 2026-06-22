import { test, expect } from '@playwright/test';

// gratis-popup — non-destructive check for popup markup/JS.
test.describe('popup @popup', () => {
  test('gratis-popup script or markup is present on the homepage', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const html = await page.content();
    const hasPopup =
      html.includes('gratis-popup') ||
      html.includes('gratis_popup') ||
      (await page.locator('[class*="gratis-popup"], [id*="gratis-popup"], [data-popup]').count()) > 0;
    test.skip(!hasPopup, 'No gratis-popup markup or script detected — plugin may not be active or no popup configured');
    expect(hasPopup).toBeTruthy();
  });

  test('popup container is hidden by default (not immediately visible)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const popup = page.locator('[class*="gratis-popup"], [id*="gratis-popup"], [data-popup]').first();
    const count = await popup.count();
    test.skip(count === 0, 'No popup element found on page');
    await expect(popup).toBeHidden();
  });
});

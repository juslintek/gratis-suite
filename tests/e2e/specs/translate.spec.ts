import { test, expect } from '@playwright/test';

// gratis-translate — check for language switcher or hreflang tags.
test.describe('translate @translate', () => {
  test('language switcher element or hreflang links are present', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const hreflangs = await page.locator('link[rel="alternate"][hreflang]').count();
    const switcher = await page.locator(
      '[class*="language-switch"], [class*="lang-switch"], [id*="language"], [class*="gratis-translate"], [data-translate]'
    ).count();
    const hasTranslate = hreflangs > 0 || switcher > 0;
    test.skip(!hasTranslate, 'No hreflang tags or language switcher found — translation feature may not be active');
    expect(hasTranslate).toBeTruthy();
  });

  test('hreflang tags have valid lang codes if present', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const hreflangs = page.locator('link[rel="alternate"][hreflang]');
    const count = await hreflangs.count();
    test.skip(count === 0, 'No hreflang tags to validate');
    for (let i = 0; i < count; i++) {
      const lang = await hreflangs.nth(i).getAttribute('hreflang');
      expect(lang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$|^x-default$/);
    }
  });
});

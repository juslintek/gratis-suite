import { test, expect } from '@playwright/test';

// Non-destructive verification for GRATIS Block Theme demo, navigation links,
// interactive style switcher, XSS-hardened REST search, and toast/bell notifications.
test.describe('gratis-theme demo & docs @demos', () => {
  test('/demo/ links to /demo/gratis-theme/', async ({ page }) => {
    const res = await page.goto('/demo/', { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBe(200);
    await expect(page.locator('a[href*="/demo/gratis-theme/"]').first()).toBeVisible();
  });

  test('/docs/gratis-theme/ returns 200 and links to /demo/gratis-theme/', async ({ page }) => {
    const res = await page.goto('/docs/gratis-theme/', { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('a[href*="/demo/gratis-theme/"]').first()).toBeVisible();
  });

  test('/demo/gratis-theme/ renders all showcase sections with 0 broken images and working interactive widgets', async ({ page }) => {
    const res = await page.goto('/demo/gratis-theme/', { waitUntil: 'load' });
    expect(res?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);

    for (const id of ['#tokens', '#variations', '#block-styles', '#patterns', '#interactive', '#templates']) {
      await expect(page.locator(id), `section ${id} visible`).toBeVisible();
    }

    // All visible/loaded images on the page must decode without error.
    const brokenImages = await page.evaluate(() =>
      Array.from(document.images)
        .filter((img) => !img.complete || img.naturalWidth === 0)
        .map((img) => img.src)
    );
    expect(brokenImages, `broken images: ${brokenImages.join(', ')}`).toEqual([]);

    // Interactive variation switcher updates aria-pressed state.
    const darkBtn = page.locator('.gt-var-btn[data-gt-var="dark"]');
    const lightBtn = page.locator('.gt-var-btn[data-gt-var="light"]');
    await expect(darkBtn).toHaveAttribute('aria-pressed', 'true');
    await lightBtn.click();
    await expect(lightBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(darkBtn).toHaveAttribute('aria-pressed', 'false');

    // Live REST search safely renders XSS payload as plain text without executing it.
    const searchInput = page.locator('.gratis-search-input').first();
    await expect(searchInput).toBeVisible();
    const xssPayload = 'zzznonexistent<img src=x onerror=window.__gratisXss=1>';
    await searchInput.fill(xssPayload);
    const searchResults = page.locator('.gratis-search-results').first();
    await expect(searchResults).toBeVisible({ timeout: 10_000 });
    await expect(searchResults).toContainText(xssPayload);
    await expect(searchResults.locator('img')).toHaveCount(0);
    const xssTriggered = await page.evaluate(() => (window as unknown as { __gratisXss?: unknown }).__gratisXss);
    expect(xssTriggered).toBeUndefined();

    // GRATIS.toast and GRATIS.notify render accessible toast & bell badge.
    await page.locator('[data-gt-toast="success"]').click();
    const toastRegion = page.locator('#gratis-toasts');
    await expect(toastRegion).toHaveAttribute('role', 'status');
    await expect(toastRegion).toHaveAttribute('aria-live', 'polite');
    await expect(toastRegion.locator('.gratis-toast--success')).toBeVisible();

    await page.locator('[data-gt-notify]').click();
    const bellBadge = page.locator('#interactive .gratis-bell-badge');
    await expect(bellBadge).toHaveClass(/gratis-bell-badge--active/);
    await expect(bellBadge).toHaveText('1');
  });
});

import { test, expect } from '@playwright/test';

// gratis-seo — metadata + structured data on the homepage.
test.describe('seo @seo', () => {
  test('home has non-empty title, meta description, self-canonical', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/\S/);
    const desc = await page.locator('meta[name="description"]').first().getAttribute('content');
    expect(desc?.trim()).toBeTruthy();
    const canonicals = page.locator('link[rel="canonical"]');
    expect(await canonicals.count(), 'has a canonical link').toBeGreaterThan(0);
    expect(await canonicals.first().getAttribute('href')).toContain('gratis.superglobalsdevelopment.com');
  });

  test('home emits at least one valid schema.org JSON-LD block', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(blocks.length).toBeGreaterThan(0);
    for (const raw of blocks) {
      const json = JSON.parse(raw); // invalid JSON throws → fails the test
      expect(JSON.stringify(json)).toMatch(/schema\.org/);
    }
  });

  test('Open Graph title is present', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const ogt = page.locator('meta[property="og:title"]');
    expect(await ogt.count()).toBeGreaterThan(0);
    expect((await ogt.first().getAttribute('content'))?.trim()).toBeTruthy();
  });

  // F-04: duplicate og:title tags on the homepage (theme + gratis-seo both emit). Should be exactly one.
  test.fixme('Open Graph title is not duplicated [F-04]', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(await page.locator('meta[property="og:title"]').count()).toBe(1);
  });

  // F-01: og:description is empty in production. Encodes the desired behavior; un-fixme when fixed.
  test.fixme('Open Graph description is non-empty [F-01]', async ({ page }) => {
    await page.goto('/');
    const ogd = await page.locator('meta[property="og:description"]').getAttribute('content');
    expect((ogd ?? '').trim().length).toBeGreaterThan(0);
  });
});

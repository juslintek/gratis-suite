import { test, expect } from '@playwright/test';

// Verifies the public /downloads/ catalog, direct ZIP delivery, /features/ catalog,
// and that footer/sections are never stuck invisible (opacity: 0) on tall pages.
test.describe('downloads catalog and visual visibility @downloads', () => {
  test('/downloads/ lists all 34 ZIP archives and serves valid ZIP files', async ({ page, request }) => {
    const res = await page.goto('/downloads/', { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBe(200);
    await expect(page.locator('h1')).toContainText(/Download Gratis Suite/i);

    const zipHrefs = await page.locator('a[href$=".zip"]').evaluateAll((els) =>
      Array.from(new Set(els.map((a) => (a as HTMLAnchorElement).getAttribute('href') || '')))
    );
    expect(zipHrefs.length).toBeGreaterThanOrEqual(34);

    // Spot-check 3 archives (plugin, multi-version plugin, theme) for HTTP 200 + PK ZIP header.
    const samples = zipHrefs.filter((h) =>
      /gratis-(cache|seo|theme)-.*\.zip$/.test(h)
    );
    expect(samples.length).toBe(3);
    for (const href of samples) {
      const r = await request.get(href);
      expect(r.status(), `${href} returned ${r.status()}`).toBe(200);
      const body = await r.body();
      expect(body.length).toBeGreaterThan(1000);
      expect(body[0]).toBe(0x50); // 'P'
      expect(body[1]).toBe(0x4b); // 'K'
    }
  });

  test('/features/ renders all 33 plugins without broken /pricing/ links', async ({ page }) => {
    const res = await page.goto('/features/', { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBe(200);
    expect(await page.locator('a[href*="/pricing/"]').count()).toBe(0);
    expect(await page.locator('.gratis-catalog-card').count()).toBeGreaterThanOrEqual(34);
  });

  test('footer and blog article cards are visible (not stuck at opacity 0)', async ({ page }) => {
    for (const path of ['/', '/blog/', '/reviews/', '/downloads/']) {
      await page.goto(path, { waitUntil: 'networkidle' });
      const footerOpacity = await page.locator('footer').first().evaluate((el) =>
        parseFloat(getComputedStyle(el).opacity)
      );
      expect(footerOpacity, `footer opacity on ${path}`).toBeGreaterThan(0.9);
      const hiddenHeadings = await page.locator('h1, h2').evaluateAll((els) =>
        els.filter((el) => parseFloat(getComputedStyle(el).opacity) === 0).length
      );
      expect(hiddenHeadings, `hidden headings on ${path}`).toBe(0);
    }
  });
});

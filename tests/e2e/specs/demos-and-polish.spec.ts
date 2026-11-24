import { test, expect } from '@playwright/test';

// Non-destructive regression checks for single posts, Open Graph imagery,
// Reviews contrast, and all live plugin demo pages.
test.describe('live site polish and interactive demos @demos', () => {
  test('home and single blog post emit valid HTTP 200 og:image and proper H1', async ({ page, request }) => {
    for (const path of ['/', '/wordpress-security-defense-in-depth-with-gratis/']) {
      const res = await page.goto(path, { waitUntil: 'domcontentloaded' });
      expect(res?.status()).toBe(200);
      expect(await page.locator('h1').count(), `H1 count on ${path}`).toBe(1);

      const ogImage = await page.locator('meta[property="og:image"]').first().getAttribute('content');
      expect(ogImage, `og:image present on ${path}`).toMatch(/^https?:\/\//);
      const imgRes = await request.get(ogImage!);
      expect(imgRes.status(), `og:image ${ogImage} returns 200`).toBe(200);

      // Single post must not have broken empty-url duplicate share links.
      const brokenShare = await page.locator('a[href$="?url="]').count();
      expect(brokenShare, `empty-url share links on ${path}`).toBe(0);
    }
  });

  test('/reviews/ aggregate rating text has readable light contrast on dark card', async ({ page }) => {
    await page.goto('/reviews/', { waitUntil: 'domcontentloaded' });
    const textEl = page.locator('.gratis-aggregate-rating-text').first();
    await expect(textEl).toBeVisible();
    const color = await textEl.evaluate((el) => getComputedStyle(el).color);
    const m = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    expect(m, `parsed RGB from ${color}`).not.toBeNull();
    // Light text on #131720 dark card: RGB channels well above 180.
    expect(Number(m![1])).toBeGreaterThan(180);
    expect(Number(m![2])).toBeGreaterThan(180);
    expect(Number(m![3])).toBeGreaterThan(180);
  });

  test('/demo/book/ renders interactive service selector and live REST time slots', async ({ page }) => {
    await page.goto('/demo/book/', { waitUntil: 'networkidle' });
    await expect(page.locator('.gratis-booking-service option').first()).toBeAttached();
    const serviceCount = await page.locator('.gratis-booking-service option').count();
    expect(serviceCount).toBeGreaterThanOrEqual(2);
    const slotCount = await page.locator('.gratis-booking-slot').count();
    expect(slotCount, 'live REST time slots populated').toBeGreaterThanOrEqual(4);
  });

  test('/demo/courses/, /demo/events/, /demo/community/, and /demo/project-board/ render populated, high-contrast widgets', async ({ page }) => {
    await page.goto('/demo/courses/', { waitUntil: 'domcontentloaded' });
    expect(await page.locator('.gratis-course-card').count()).toBeGreaterThanOrEqual(3);

    await page.goto('/demo/events/', { waitUntil: 'domcontentloaded' });
    const eventsBody = await page.locator('main').innerText();
    expect(eventsBody).not.toMatch(/No upcoming events\./i);

    await page.goto('/demo/community/', { waitUntil: 'domcontentloaded' });
    expect(await page.locator('.gratis-activity-item').count()).toBeGreaterThanOrEqual(3);

    await page.goto('/demo/project-board/', { waitUntil: 'domcontentloaded' });
    const colBg = await page.locator('.gratis-board-col').first().evaluate((el) => getComputedStyle(el).backgroundColor);
    const colFg = await page.locator('.gratis-board-col h3').first().evaluate((el) => getComputedStyle(el).color);
    expect(colBg).not.toBe(colFg);
    // All 4 feature cards in the grid row must align at the same vertical top position.
    const tops = await page.locator('.demo-feature-card').evaluateAll((els) =>
      els.map((el) => Math.round(el.getBoundingClientRect().top))
    );
    expect(new Set(tops).size, `aligned feature cards: ${tops.join(',')}`).toBe(1);
  });

  test('/demo/data-table/ renders GPL-2.0 data rows with working live search', async ({ page }) => {
    await page.goto('/demo/data-table/', { waitUntil: 'domcontentloaded' });
    const search = page.locator('.gratis-table-wrap input[type="search"], input[placeholder*="Search"]').first();
    await expect(search).toBeVisible();
    expect(await page.locator('main').innerText()).not.toContain('GPL-3.0');
    await search.fill('Booking');
    const visibleRows = await page.locator('table tbody tr').evaluateAll((rows) =>
      rows.filter((r) => getComputedStyle(r).display !== 'none').length
    );
    expect(visibleRows).toBe(1);
  });
});

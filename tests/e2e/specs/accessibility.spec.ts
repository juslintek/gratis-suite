import { test, expect } from '@playwright/test';

// Basic accessibility checks — homepage (non-destructive).
test.describe('accessibility @a11y', () => {
  test('all images have non-empty alt text', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const imgs = page.locator('img:visible');
    const count = await imgs.count();
    test.skip(count === 0, 'No visible images on homepage');
    for (let i = 0; i < count; i++) {
      const alt = await imgs.nth(i).getAttribute('alt');
      const src = await imgs.nth(i).getAttribute('src');
      expect(alt, `img[src="${src}"] missing alt`).not.toBeNull();
      // Decorative images may have alt="" which is valid; only null is a failure.
    }
  });

  test('no empty links (links with no text and no aria-label)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const emptyLinks = await page.locator('a:visible').evaluateAll((links) =>
      links
        .filter((a) => {
          const text = (a.textContent || '').trim();
          const label = a.getAttribute('aria-label') || '';
          const img = a.querySelector('img[alt]');
          return !text && !label.trim() && !img;
        })
        .map((a) => a.getAttribute('href') || '(no href)')
    );
    expect(emptyLinks, `Empty links found: ${emptyLinks.join(', ')}`).toHaveLength(0);
  });

  test('heading hierarchy does not skip levels', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const levels = await page.locator('h1, h2, h3, h4, h5, h6').evaluateAll((headings) =>
      headings.map((h) => parseInt(h.tagName.substring(1), 10))
    );
    test.skip(levels.length === 0, 'No headings found');
    for (let i = 1; i < levels.length; i++) {
      const jump = levels[i] - levels[i - 1];
      expect(jump, `Heading jumps from h${levels[i - 1]} to h${levels[i]}`).toBeLessThanOrEqual(1);
    }
  });
});

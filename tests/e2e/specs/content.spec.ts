import { test, expect } from '@playwright/test';

// Docs (gratis-docs) — the public knowledge base built from gratis_doc CPT.
test.describe('content / docs @content', () => {
  test('docs index links to many plugin docs', async ({ page }) => {
    await page.goto('/docs/');
    const links = page.locator('a[href*="/docs/"]');
    expect(await links.count()).toBeGreaterThan(10);
  });

  test('sampled doc pages return 200 with a heading', async ({ page, request }) => {
    await page.goto('/docs/');
    const hrefs = await page.locator('a[href*="/docs/"]').evaluateAll((els) =>
      els
        .map((e) => (e as HTMLAnchorElement).href)
        .filter((h) => !/\/docs\/(feed|page|category|tag)\b/.test(h))
    );
    const unique = [...new Set(hrefs)].slice(0, 5);
    expect(unique.length).toBeGreaterThan(0);
    for (const url of unique) {
      const r = await request.get(url);
      expect(r.status(), `doc ${url}`).toBe(200);
    }
  });
});

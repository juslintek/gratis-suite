import { test, expect } from '@playwright/test';

// CPT archives — non-destructive: assert known archive slugs return 200 or 404 gracefully.
test.describe('archives @archives', () => {
  const slugs = ['/events/', '/booking/', '/products/', '/portfolio/', '/testimonials/'];

  for (const slug of slugs) {
    test(`archive ${slug} returns 200 or graceful 404`, async ({ request }) => {
      const resp = await request.get(slug);
      const status = resp.status();
      expect([200, 404]).toContain(status);
    });
  }

  test('docs archive returns 200 (known public CPT)', async ({ request }) => {
    const resp = await request.get('/docs/');
    expect(resp.status()).toBe(200);
  });
});

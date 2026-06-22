import { test, expect } from '@playwright/test';

// Performance — basic load time assertions (non-destructive).
// Budget is 5s for remote prod (includes network RTT to VPS); locally should be <2s.
test.describe('performance @perf', () => {
  test('homepage loads in under 5 seconds (remote budget)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    const timing = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return nav ? nav.loadEventEnd - nav.startTime : -1;
    });
    expect(timing, 'navigation timing available').toBeGreaterThan(0);
    expect(timing, `Page load took ${timing}ms`).toBeLessThan(5000);
  });

  // Aspirational: tighten to 3s once CDN / prod caching is warm.
  test.fixme('homepage loads in under 3 seconds (aspirational)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    const timing = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return nav ? nav.loadEventEnd - nav.startTime : -1;
    });
    expect(timing).toBeLessThan(3000);
  });

  test('no excessive render-blocking resources', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const blocking = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      return resources
        .filter((r) => r.renderBlockingStatus === 'blocking')
        .map((r) => r.name);
    });
    if (blocking === null || blocking === undefined) {
      test.skip(true, 'renderBlockingStatus API not available');
      return;
    }
    expect(blocking.length, `Render-blocking resources: ${blocking.join(', ')}`).toBeLessThan(10);
  });
});

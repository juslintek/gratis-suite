import { test, expect } from '@playwright/test';

// Response headers — caching (gratis-cache) and hardening (gratis-security).
test.describe('headers / caching / hardening @headers', () => {
  test('home sends a public Cache-Control (gratis-cache)', async ({ request }) => {
    const r = await request.get('/');
    expect((r.headers()['cache-control'] ?? '')).toMatch(/public|max-age/);
  });

  // F-02: gratis-security advertises security headers, but production omits them.
  test('security headers present (X-Content-Type-Options + X-Frame-Options/CSP) [F-02]', async ({ request }) => {
    const h = (await request.get('/')).headers();
    expect(h['x-content-type-options']).toBe('nosniff');
    expect(h['x-frame-options'] || h['content-security-policy']).toBeTruthy();
  });

  // F-03: X-Powered-By exposes the PHP version; hardening should remove it.
  test('X-Powered-By is not exposed [F-03]', async ({ request }) => {
    const h = (await request.get('/')).headers();
    expect(h['x-powered-by']).toBeFalsy();
  });
});

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

  // Sensitive database/config/dotfile paths must never be downloadable over HTTP (Caddy ignores .htaccess).
  test('sensitive SQLite database, dotfiles, debug log, and config paths are blocked', async ({ request }) => {
    const sensitivePaths = [
      '/wp-content/database/.htaccess',
      '/wp-content/database/db-path.php',
      '/wp-content/database/.ht.sqlite',
      '/wp-content/debug.log',
      '/wp-config.php',
      '/xmlrpc.php',
    ];
    for (const p of sensitivePaths) {
      const r = await request.get(p);
      expect([403, 404], `${p} returned HTTP ${r.status()}`).toContain(r.status());
    }
  });

  // Private/internal CPTs (CRM contacts, client invoices, DMs, internal tasks/projects, quizzes, tables)
  // must never expose records unauthenticated via /wp-json/wp/v2/<cpt>.
  test('private CPT REST routes are not publicly exposed', async ({ request }) => {
    const privateRoutes = [
      '/wp-json/wp/v2/gratis_contact',
      '/wp-json/wp/v2/gratis_invoice',
      '/wp-json/wp/v2/gratis_message',
      '/wp-json/wp/v2/gratis_activity',
      '/wp-json/wp/v2/gratis_project',
      '/wp-json/wp/v2/gratis_task',
      '/wp-json/wp/v2/gratis_quiz',
      '/wp-json/wp/v2/gratis_table',
    ];
    for (const route of privateRoutes) {
      const r = await request.get(route);
      expect([401, 403, 404], `${route} leaked HTTP ${r.status()}`).toContain(r.status());
    }
  });
});

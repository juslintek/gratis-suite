import { test, expect } from '@playwright/test';

// Core availability — non-destructive, safe against production.
test.describe('smoke @smoke', () => {
  test('home returns 200 with a GRATIS title', async ({ page }) => {
    const resp = await page.goto('/');
    expect(resp?.status()).toBe(200);
    await expect(page).toHaveTitle(/GRATIS/i);
    await expect(page.locator('body')).toBeVisible();
  });

  test('docs index loads', async ({ page }) => {
    const resp = await page.goto('/docs/');
    expect(resp?.status()).toBe(200);
    await expect(page).toHaveTitle(/Docs/i);
  });

  test('a plugin doc page renders with a heading', async ({ page }) => {
    const resp = await page.goto('/docs/gratis-ai/');
    expect(resp?.status()).toBe(200);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('unknown URL returns 404', async ({ request }) => {
    const resp = await request.get('/no-such-page-xyz-9182/');
    expect(resp.status()).toBe(404);
  });

  test('robots.txt is served', async ({ request }) => {
    const resp = await request.get('/robots.txt');
    expect(resp.status()).toBe(200);
  });

  test('wp-login renders the login form', async ({ page }) => {
    const resp = await page.goto('/wp-login.php');
    expect(resp?.status()).toBe(200);
    await expect(page.locator('#loginform, form[name="loginform"]')).toBeVisible();
  });
});

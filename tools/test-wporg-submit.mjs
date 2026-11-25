#!/usr/bin/env node
/**
 * Self-check for tools/wporg-submit.mjs.
 *
 * Verifies:
 *  1. Pure page-state classification (open slot, 1-plugin lock, login, 2FA, CAPTCHA, unexpected state).
 *  2. Post-submit result classification (scan pass, update success, error notice overriding text,
 *     and NO false positive when the form heading "Upload updated 'X' plugin for review" is present).
 *  3. Queue selection guards (refuses needs-work and already awaiting-review slugs).
 *  4. ZIP magic/size validation.
 *  5. Live Playwright end-to-end form submission against a local HTTP server mimicking WordPress.org's
 *     open-slot new-plugin upload form (checkboxes + file upload + comment + Automated Plugin Scanning: Pass)
 *     and failed update-active form (error notice + static heading).
 *
 * Run: node gratis-suite/tools/test-wporg-submit.mjs
 */

import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import {
  INSPECT_PAGE_FN,
  classifyLivePage,
  classifySubmissionResult,
  loadQueue,
  runSubmissionInPage,
  selectNextEligible,
  summarizeQueue,
  verifyZipFile,
} from './wporg-submit.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SUITE_DIR = path.resolve(__dirname, '..');
const QUEUE_PATH = path.join(SUITE_DIR, 'docs', 'wporg-queue.json');

let passed = 0;
async function check(name, fn) {
  await fn();
  console.log(`  PASS  ${name}`);
  passed++;
}

async function main() {
  // 1. Queue manifest + selection guards
  const queue = loadQueue(QUEUE_PATH);
  await check('queue summary totals 33 plugins', () => {
    const s = summarizeQueue(queue);
    assert.equal(s.total, 33);
    assert.equal(s.productionReady + s.needsWork, 33);
    assert.ok(s.queued >= 20);
  });

  await check('selectNextEligible picks first queued production-ready plugin (gratis-backup)', () => {
    const next = selectNextEligible(queue, null);
    assert.equal(next.slug, 'gratis-backup');
  });

  await check('selectNextEligible refuses needs-work slugs (gratis-security, gratis-notify)', () => {
    assert.throws(() => selectNextEligible(queue, 'gratis-notify'), /not "production-ready"/);
    assert.throws(() => selectNextEligible(queue, 'gratis-security'), /not "production-ready"/);
  });

  await check('selectNextEligible refuses already awaiting-review slug (gratis-seo)', () => {
    assert.throws(() => selectNextEligible(queue, 'gratis-seo'), /already has status "awaiting-review"/);
  });

  await check('verifyZipFile validates real gratis-backup ZIP and rejects non-ZIP', () => {
    const ok = verifyZipFile('dist/gratis-backup-1.0.0.zip');
    assert.equal(ok.ok, true);
    assert.ok(ok.bytes > 1000);
    const bad = verifyZipFile('gratis-suite/docs/wporg-queue.json');
    assert.equal(bad.ok, false);
    assert.match(bad.reason, /Invalid ZIP header/);
  });

  // 2. Page state classification
  await check('classifyLivePage detects locked 1-pending-plugin state', () => {
    const state = classifyLivePage({
      url: 'https://wordpress.org/plugins/developers/add/',
      title: 'Add Your Plugin',
      text: 'You have 1 plugin that has been recently submitted but not yet reviewed. Current assigned slug: gratis-seo\nReview status: Awaiting Review\nUpload updated "Gratis SEO" plugin for review',
      forms: [{ hasFile: true, actionField: 'upload-additional', pluginId: '413649', checkboxes: [] }],
    });
    assert.equal(state.slotLocked, true);
    assert.equal(state.slotOpen, false);
    assert.equal(state.pendingPlugin.slug, 'gratis-seo');
    assert.equal(state.pendingPlugin.pluginId, '413649');
  });

  await check('classifyLivePage distinguishes unexpected state from slotLocked', () => {
    const state = classifyLivePage({
      url: 'https://wordpress.org/plugins/developers/add/',
      title: 'Maintenance',
      text: 'Service temporarily unavailable.',
      forms: [],
    });
    assert.equal(state.slotLocked, false);
    assert.equal(state.slotOpen, false);
  });

  await check('classifyLivePage detects login, 2FA, and CAPTCHA gates', () => {
    assert.equal(classifyLivePage({ url: 'https://login.wordpress.org/', text: '', forms: [] }).isLogin, true);
    assert.equal(classifyLivePage({ url: 'https://wordpress.org/plugins/developers/add/', text: 'Enter your authenticator app verification code', forms: [] }).has2fa, true);
    assert.equal(classifyLivePage({ url: 'https://wordpress.org/plugins/developers/add/', text: 'Confirm you are human', forms: [] }).hasCaptcha, true);
  });

  // 3. Post-submit result classification (regression for heading false positive & ignored errors)
  await check('classifySubmissionResult does NOT false-positive on static "Upload updated ... plugin for review" heading when upload errors', () => {
    const res = classifySubmissionResult({
      url: 'https://wordpress.org/plugins/developers/add/',
      bodyText: 'Upload updated "Gratis SEO" plugin for review\nThere was an error uploading your plugin.',
      notices: ['Error: Plugin Check found 2 errors.'],
      errorNotices: ['Error: Plugin Check found 2 errors.'],
    });
    assert.equal(res.hasError, true);
    assert.equal(res.updatedOk, false);
    assert.equal(res.scanPass, false);
  });

  await check('classifySubmissionResult accepts genuine update confirmation without errors', () => {
    const res = classifySubmissionResult({
      url: 'https://wordpress.org/plugins/developers/add/',
      bodyText: 'New version of Gratis SEO uploaded for review.',
      notices: ['New version of Gratis SEO uploaded for review.'],
      errorNotices: [],
    });
    assert.equal(res.hasError, false);
    assert.equal(res.updatedOk, true);
  });

  await check('classifySubmissionResult rejects scanPass if an error notice is also present', () => {
    const res = classifySubmissionResult({
      url: 'https://wordpress.org/plugins/developers/add/',
      bodyText: 'Results of Automated Plugin Scanning: Pass',
      notices: ['Error: Invalid ZIP archive'],
      errorNotices: ['Error: Invalid ZIP archive'],
    });
    assert.equal(res.hasError, true);
    assert.equal(res.scanPass, false);
  });

  // 4. Live Playwright end-to-end test against local HTTP fixture mimicking WP.org open-slot & error update forms
  const requireFromE2e = createRequire(path.join(SUITE_DIR, 'tests/e2e/package.json'));
  const { chromium } = requireFromE2e('@playwright/test');

  let receivedBody = '';
  const server = http.createServer((req, res) => {
    if (req.url === '/open' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<!doctype html><html><head><title>Add Your Plugin</title></head><body><main>
        <p>Currently there are 267 plugins awaiting their first review.</p>
        <form id="upload-form" method="post" action="/open-submit" enctype="multipart/form-data">
          <input type="file" name="zip_file" id="zip_file" required>
          <input type="checkbox" name="req1" id="req:1" required><label for="req:1">GPL compatible</label>
          <input type="checkbox" name="req2" required>
          <textarea name="comment"></textarea>
          <input type="submit" value="Upload">
        </form>
      </main></body></html>`);
      return;
    }
    if (req.url === '/open-submit' && req.method === 'POST') {
      const chunks = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => {
        receivedBody = Buffer.concat(chunks).toString('latin1');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<!doctype html><html><body><main>
          <div class="plugin-notice"><p>Thank you for uploading Gratis Backup to the WordPress Plugin Directory.</p></div>
          <h2>Results of Automated Plugin Scanning: Pass</h2>
        </main></body></html>`);
      });
      return;
    }
    if (req.url === '/update-fail' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<!doctype html><html><body><main>
        <h2>Upload updated "Gratis SEO" plugin for review</h2>
        <form method="post" action="/update-fail-submit" enctype="multipart/form-data">
          <input type="hidden" name="action" value="upload-additional">
          <input type="hidden" name="plugin_id" value="413649">
          <input type="file" name="zip_file" required>
          <textarea name="comment"></textarea>
          <input type="submit" value="Upload">
        </form>
      </main></body></html>`);
      return;
    }
    if (req.url === '/update-fail-submit' && req.method === 'POST') {
      req.resume();
      req.on('end', () => {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<!doctype html><html><body><main>
          <div class="notice notice-error"><p>Error: Automated checks failed.</p></div>
          <h2>Upload updated "Gratis SEO" plugin for review</h2>
        </main></body></html>`);
      });
      return;
    }
    res.writeHead(404);
    res.end('not found');
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();

    await check('INSPECT_PAGE_FN handles special CSS chars in input IDs (req:1) and detects open slot', async () => {
      await page.goto(`${baseUrl}/open`, { waitUntil: 'domcontentloaded' });
      const raw = await page.evaluate(`(${INSPECT_PAGE_FN})()`);
      const live = classifyLivePage(raw);
      assert.equal(live.slotOpen, true);
      assert.equal(live.slotLocked, false);
      assert.equal(live.newSubmitForm.checkboxes.length, 2);
      assert.equal(live.newSubmitForm.checkboxes[0].label, 'GPL compatible');
    });

    await check('runSubmissionInPage ticks all checkboxes, uploads ZIP, fills comment, and confirms Scan Pass', async () => {
      const zipPath = verifyZipFile('dist/gratis-backup-1.0.0.zip').path;
      const res = await runSubmissionInPage(page, {
        mode: 'submit-next',
        zipPath,
        comment: 'Public repo verified',
      });
      assert.equal(res.scanPass, true);
      assert.equal(res.hasError, false);
      assert.match(receivedBody, /name="req1"/);
      assert.match(receivedBody, /name="req2"/);
      assert.match(receivedBody, /Public repo verified/);
      assert.match(receivedBody, /gratis-backup-1\.0\.0\.zip/);
    });

    await check('runSubmissionInPage fails cleanly when update-active returns error notice + static heading', async () => {
      await page.goto(`${baseUrl}/update-fail`, { waitUntil: 'domcontentloaded' });
      const zipPath = verifyZipFile('dist/gratis-seo-1.0.0.zip').path;
      const res = await runSubmissionInPage(page, {
        mode: 'update-active',
        zipPath,
        comment: 'Retry update',
      });
      assert.equal(res.hasError, true);
      assert.equal(res.updatedOk, false);
      assert.equal(res.scanPass, false);
    });
  } finally {
    await browser.close();
    server.close();
  }

  console.log(`\nALL ${passed} CHECKS PASSED`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

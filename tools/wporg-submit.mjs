#!/usr/bin/env node
/**
 * WordPress.org Plugin Directory submission queue manager.
 *
 * Uses an already-authenticated `playwright-cli` browser session (default:
 * `-s=directadmin`) to inspect https://wordpress.org/plugins/developers/add/
 * and automate single-slot submissions from `gratis-suite/docs/wporg-queue.json`
 * without ever bypassing WordPress.org's 1-pending-plugin limit, login, 2FA,
 * or anti-bot checks.
 *
 * Usage:
 *   node gratis-suite/tools/wporg-submit.mjs --status [--json]
 *   node gratis-suite/tools/wporg-submit.mjs --submit-next [--dry-run] [--slug=<slug>] [--comment=<text>]
 *   node gratis-suite/tools/wporg-submit.mjs --update-active --slug=<slug> [--dry-run] [--comment=<text>]
 *
 * Options:
 *   --session=<name>   playwright-cli session name (default: directadmin)
 *   --queue=<path>     path to wporg-queue.json (default: ../docs/wporg-queue.json)
 *   --no-reload        inspect the existing WordPress.org tab without reloading
 *   --json             emit machine-readable JSON output
 *   -h, --help         show this help
 *
 * Exit codes:
 *   0  Success (or dry-run verified)
 *   1  Usage / config / verification error
 *   2  Auth / 2FA / CAPTCHA / detached session / unexpected page state (manual action required)
 *   3  Slot locked (1 pending plugin already awaiting review on WordPress.org)
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SUITE_DIR = path.resolve(__dirname, '..');
const WORKSPACE_DIR = path.resolve(SUITE_DIR, '..');
const DEFAULT_QUEUE_PATH = path.join(SUITE_DIR, 'docs', 'wporg-queue.json');
const WPORG_ADD_URL = 'https://wordpress.org/plugins/developers/add/';

class SessionUnavailableError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SessionUnavailableError';
  }
}

function printHelp() {
  const src = fs.readFileSync(__filename, 'utf8');
  const match = src.match(/\/\*\*([\s\S]*?)\*\//);
  if (match) {
    const lines = match[1]
      .split('\n')
      .map((l) => l.replace(/^\s*\*\s?/, ''))
      .join('\n')
      .trim();
    console.log(lines);
  }
}

export function parseArgs(argv) {
  const opts = {
    mode: null,
    dryRun: false,
    json: false,
    noReload: false,
    session: 'directadmin',
    queuePath: DEFAULT_QUEUE_PATH,
    slug: null,
    comment: '',
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '-h' || arg === '--help') {
      printHelp();
      process.exit(0);
    } else if (arg === '--status') {
      opts.mode = 'status';
    } else if (arg === '--submit-next') {
      opts.mode = 'submit-next';
    } else if (arg === '--update-active') {
      opts.mode = 'update-active';
    } else if (arg === '--dry-run') {
      opts.dryRun = true;
    } else if (arg === '--json') {
      opts.json = true;
    } else if (arg === '--no-reload') {
      opts.noReload = true;
    } else if (arg.startsWith('--session=')) {
      opts.session = arg.slice('--session='.length);
    } else if (arg.startsWith('--queue=')) {
      opts.queuePath = path.resolve(arg.slice('--queue='.length));
    } else if (arg.startsWith('--slug=')) {
      opts.slug = arg.slice('--slug='.length).trim();
    } else if (arg.startsWith('--comment=')) {
      opts.comment = arg.slice('--comment='.length);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!opts.mode) {
    throw new Error('Specify --status, --submit-next, or --update-active (see --help).');
  }
  if (opts.mode === 'update-active' && !opts.slug) {
    throw new Error('--update-active requires --slug=<plugin-slug>.');
  }
  return opts;
}

const attemptedAutoAttach = new Set();

export function resolveChromeDevToolsWsUrl(
  portFilePath = path.join(
    process.env.HOME || '',
    'Library',
    'Application Support',
    'Google',
    'Chrome',
    'DevToolsActivePort'
  )
) {
  if (!portFilePath || !fs.existsSync(portFilePath)) {
    return null;
  }
  const lines = fs.readFileSync(portFilePath, 'utf8')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2 || !/^\d+$/.test(lines[0]) || !lines[1].startsWith('/')) {
    return null;
  }
  return `ws://127.0.0.1:${lines[0]}${lines[1]}`;
}

function tryAutoAttachChrome(session) {
  if (process.env.WPORG_NO_AUTO_ATTACH === '1' || attemptedAutoAttach.has(session)) {
    return false;
  }
  attemptedAutoAttach.add(session);
  const wsUrl = resolveChromeDevToolsWsUrl();
  if (!wsUrl) {
    return false;
  }
  try {
    execFileSync('playwright-cli', [`-s=${session}`, 'attach', `--cdp=${wsUrl}`], {
      encoding: 'utf8',
      timeout: 30000,
      env: {
        ...process.env,
        PATH: `/opt/homebrew/bin:/usr/local/bin:${process.env.PATH || ''}`,
      },
    });
    return true;
  } catch {
    return false;
  }
}

function runPw(session, args, { raw = false, timeout = 30000 } = {}) {
  const cliArgs = [`-s=${session}`];
  if (raw) cliArgs.push('--raw');
  cliArgs.push(...args);
  try {
    return execFileSync('playwright-cli', cliArgs, {
      encoding: 'utf8',
      timeout,
      env: {
        ...process.env,
        PATH: `/opt/homebrew/bin:/usr/local/bin:${process.env.PATH || ''}`,
      },
    }).trim();
  } catch (err) {
    const stderr = (err.stderr || err.stdout || err.message || '').toString().trim();
    if (/is not open|please run open first|ECONNREFUSED|Target page, context or browser has been closed/i.test(stderr)) {
      if (tryAutoAttachChrome(session)) {
        return runPw(session, args, { raw, timeout });
      }
      const wsHint = resolveChromeDevToolsWsUrl() || 'ws://127.0.0.1:9222/devtools/browser/<id>';
      throw new SessionUnavailableError(
        `Browser session "${session}" is not attached/open. Ensure chrome://inspect/#remote-debugging is enabled, then attach via IPv4: playwright-cli -s=${session} attach --cdp=${wsHint}`
      );
    }
    throw new Error(`playwright-cli (${cliArgs.join(' ')}) failed: ${stderr}`);
  }
}

export function loadQueue(queuePath) {
  if (!fs.existsSync(queuePath)) {
    throw new Error(`Queue manifest not found: ${queuePath}`);
  }
  return JSON.parse(fs.readFileSync(queuePath, 'utf8'));
}

export function saveQueue(queuePath, data) {
  data.updatedAt = new Date().toISOString();
  fs.writeFileSync(queuePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

export function verifyZipFile(zipRelOrAbs, baseDir = WORKSPACE_DIR) {
  const absPath = path.isAbsolute(zipRelOrAbs)
    ? zipRelOrAbs
    : path.resolve(baseDir, zipRelOrAbs);
  if (!fs.existsSync(absPath)) {
    return { ok: false, path: absPath, reason: 'ZIP file does not exist' };
  }
  const stat = fs.statSync(absPath);
  if (stat.size < 100) {
    return { ok: false, path: absPath, reason: `ZIP file unexpectedly small (${stat.size} bytes)` };
  }
  if (stat.size > 10 * 1024 * 1024) {
    return { ok: false, path: absPath, reason: `ZIP exceeds WordPress.org 10 MB limit (${stat.size} bytes)` };
  }
  const fd = fs.openSync(absPath, 'r');
  const header = Buffer.alloc(4);
  fs.readSync(fd, header, 0, 4, 0);
  fs.closeSync(fd);
  const validMagic = header[0] === 0x50 && header[1] === 0x4b && header[2] === 0x03 && header[3] === 0x04;
  if (!validMagic) {
    return { ok: false, path: absPath, reason: 'Invalid ZIP header (expected PK\\x03\\x04)' };
  }
  return { ok: true, path: absPath, bytes: stat.size };
}

/**
 * Pure classification of inspected WordPress.org submission page DOM snapshot.
 */
export function classifyLivePage({ url = '', title = '', text = '', forms = [], hasLoginForm = false, hasCaptchaWidget = false }) {
  const isLogin = url.includes('login.wordpress.org')
    || url.includes('wp-login.php')
    || /you must be logged in|please log in to submit/i.test(text)
    || Boolean(hasLoginForm);

  const has2fa = /two-factor|authentication code|authenticator app|security key|verify your identity/i.test(text);
  const hasCaptcha = Boolean(hasCaptchaWidget)
    || /verify you are human|confirm you are human|complete the captcha/i.test(text);

  const pendingCountMatch = text.match(/Currently there are\s+([\d,]+)\s+plugins awaiting their first review/i);
  const initialEmailBeforeMatch = text.match(/All new submissions received before\s+(.+?)\s+have been sent/i);
  const lockMatch = text.match(/You have\s+(\d+)\s+plugin(?:s)?\s+that ha(?:s|ve) been recently submitted but not yet reviewed/i);
  const slugMatch = text.match(/Current assigned slug:\s*([a-z0-9-]+)/i);
  const submittedOnMatch = text.match(/Submitted on:\s*([^\n]+)/i);
  const reviewStatusMatch = text.match(/Review status:\s*([^\n]+)/i);
  const fileMatch = text.match(/File:\s*([^\s\n]+\.zip)/i);
  const versionMatch = text.match(/Version:\s*([^\s\n]+)/i);
  const uploadUpdatedHeading = text.match(/Upload updated\s+["\u201c]([^"\u201d]+)["\u201d]\s+plugin for review/i);
  const scanPass = /Results of Automated Plugin Scanning:\s*Pass/i.test(text);
  const scanFail = /Results of Automated Plugin Scanning:\s*Fail|Automated checks? failed|errors? were found/i.test(text);

  const newSubmitForm = forms.find((f) => f.hasFile && f.actionField !== 'upload-additional') || null;
  const updateForm = forms.find((f) => f.hasFile && f.actionField === 'upload-additional') || null;
  const slotLocked = Boolean(lockMatch) || (!newSubmitForm && Boolean(updateForm));
  const slotOpen = Boolean(newSubmitForm) && !lockMatch && !isLogin && !has2fa && !hasCaptcha;

  return {
    url,
    title,
    isLogin,
    has2fa,
    hasCaptcha,
    queueTotalAwaiting: pendingCountMatch ? Number(pendingCountMatch[1].replace(/,/g, '')) : null,
    initialEmailsBefore: initialEmailBeforeMatch ? initialEmailBeforeMatch[1].trim() : null,
    slotLocked,
    lockMessage: lockMatch ? lockMatch[0] : null,
    pendingPlugin: (slugMatch || uploadUpdatedHeading) ? {
      name: uploadUpdatedHeading ? uploadUpdatedHeading[1] : null,
      slug: slugMatch ? slugMatch[1] : null,
      pluginId: updateForm?.pluginId || null,
      submittedOn: submittedOnMatch ? submittedOnMatch[1].trim() : null,
      reviewStatus: reviewStatusMatch ? reviewStatusMatch[1].trim() : null,
      file: fileMatch ? fileMatch[1].trim() : null,
      version: versionMatch ? versionMatch[1].trim() : null,
    } : null,
    slotOpen,
    newSubmitForm,
    updateForm,
    scanPass,
    scanFail,
  };
}

/**
 * Pure classification of a post-submit response page.
 * Avoids false positives from the update form heading ("Upload updated ... plugin for review")
 * and treats any detected error/auth challenge as failure.
 */
export function classifySubmissionResult({ url = '', bodyText = '', notices = [], errorNotices = [] }) {
  const noticeText = notices.join('\n');
  const errText = errorNotices.join('\n');

  const authBlocked = url.includes('login.wordpress.org')
    || url.includes('wp-login.php')
    || /you must be logged in|two-factor|security key|verify you are human|confirm you are human/i.test(bodyText);

  const hasError = Boolean(errorNotices.length)
    || /Results of Automated Plugin Scanning:\s*Fail|Automated checks? failed|there was an error|plugin check found|cannot be uploaded|upload failed|error:\s*\S/i.test(noticeText || bodyText)
    || /error|failed/i.test(errText);

  const scanPass = !hasError && !authBlocked
    && /Results of Automated Plugin Scanning:\s*Pass/i.test(bodyText);

  // Match real upload confirmation messages (in notices or explicit confirmation prose),
  // NOT the static form heading "Upload updated 'X' plugin for review".
  const confirmPattern = /New version of .+ uploaded for review|has been uploaded|successfully uploaded|thank you for uploading|your plugin has been submitted/i;
  const updatedOk = !hasError && !authBlocked
    && (confirmPattern.test(noticeText) || confirmPattern.test(bodyText));

  return {
    url,
    authBlocked,
    hasError,
    scanPass,
    updatedOk,
    notices: notices.slice(0, 10),
    errorNotices: errorNotices.slice(0, 10),
    excerpt: bodyText.slice(0, 1800),
  };
}

function ensureWporgTab(session, reload) {
  const listOut = runPw(session, ['tab-list']);
  const lines = listOut.split('\n');
  let targetIdx = null;
  let isCurrent = false;

  for (const line of lines) {
    const m = line.match(/^\s*-\s*(\d+):\s*(\(current\)\s*)?\[.*?\]\((https?:\/\/[^\s)]+)\)/);
    if (!m) continue;
    const idx = Number(m[1]);
    const url = m[3];
    if (url.startsWith('https://wordpress.org/plugins/developers/add')) {
      targetIdx = idx;
      isCurrent = Boolean(m[2]);
      break;
    }
  }

  if (targetIdx !== null) {
    if (!isCurrent) {
      runPw(session, ['tab-select', String(targetIdx)]);
    }
    if (reload) {
      runPw(session, ['reload']);
    }
    return targetIdx;
  }

  runPw(session, ['tab-new', WPORG_ADD_URL]);
  return null;
}

export const INSPECT_PAGE_FN = `() => {
  const url = location.href;
  const title = document.title;
  const main = document.querySelector('main') || document.body;
  const text = (main?.innerText || '').trim();
  const forms = [...document.querySelectorAll('form')].map((f) => {
    const inputs = [...f.querySelectorAll('input, textarea, button, select')].map((el) => {
      let label = el.closest('label')?.innerText || '';
      if (!label && el.id) {
        try {
          const escaped = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(el.id) : el.id.replace(/"/g, '\\\\"');
          label = document.querySelector('label[for="' + escaped + '"]')?.innerText || '';
        } catch (_) {
          label = '';
        }
      }
      return {
        tag: el.tagName,
        type: (el.type || '').toLowerCase(),
        name: el.name || '',
        id: el.id || '',
        value: el.type === 'file' ? '' : String(el.value || '').slice(0, 120),
        required: Boolean(el.required),
        checked: Boolean(el.checked),
        label: label.trim().slice(0, 160),
      };
    });
    return {
      id: f.id || '',
      action: f.getAttribute('action') || '',
      method: (f.method || 'get').toLowerCase(),
      hasFile: inputs.some((i) => i.type === 'file' && i.name === 'zip_file'),
      actionField: inputs.find((i) => i.name === 'action')?.value || '',
      pluginId: inputs.find((i) => i.name === 'plugin_id')?.value || '',
      checkboxes: inputs.filter((i) => i.type === 'checkbox').map((i) => ({ name: i.name, id: i.id, label: i.label, checked: i.checked })),
      hasComment: inputs.some((i) => i.name === 'comment'),
      submitText: inputs.find((i) => i.type === 'submit')?.value || '',
    };
  });
  return {
    url,
    title,
    text,
    forms,
    hasLoginForm: Boolean(document.querySelector('form#loginform')),
    hasCaptchaWidget: Boolean(document.querySelector('iframe[src*="captcha"], iframe[src*="turnstile"], .g-recaptcha, .h-captcha, .cf-turnstile')),
  };
}`;

function inspectLivePage(session) {
  const expr = `JSON.stringify((${INSPECT_PAGE_FN})())`;
  const rawOut = runPw(session, ['eval', expr], { raw: true });
  let parsed = JSON.parse(rawOut);
  if (typeof parsed === 'string') {
    parsed = JSON.parse(parsed);
  }
  return classifyLivePage(parsed);
}

export function selectNextEligible(queue, requestedSlug) {
  const ready = queue.plugins.filter((p) => p.classification === 'production-ready');
  if (requestedSlug) {
    const found = queue.plugins.find((p) => p.slug === requestedSlug);
    if (!found) {
      throw new Error(`Slug "${requestedSlug}" not found in queue manifest.`);
    }
    if (found.classification !== 'production-ready') {
      throw new Error(`Slug "${requestedSlug}" is classified as "${found.classification}", not "production-ready". Refusing to submit.`);
    }
    if (found.status !== 'queued') {
      throw new Error(`Slug "${requestedSlug}" already has status "${found.status}", not "queued". Use --update-active to refresh an active submission.`);
    }
    return found;
  }
  return ready.find((p) => p.status === 'queued') || null;
}

export function summarizeQueue(queue) {
  const counts = {
    total: queue.plugins.length,
    productionReady: 0,
    needsWork: 0,
    submitted: 0,
    approved: 0,
    queued: 0,
    blocked: 0,
  };
  for (const p of queue.plugins) {
    if (p.classification === 'production-ready') counts.productionReady++;
    else counts.needsWork++;

    if (p.status === 'submitted' || p.status === 'awaiting-review') counts.submitted++;
    else if (p.status === 'approved') counts.approved++;
    else if (p.status === 'queued' && p.classification === 'production-ready') counts.queued++;
    else counts.blocked++;
  }
  return counts;
}

export function formatStatusReport(live, queue, nextPlugin, nextZip) {
  const counts = summarizeQueue(queue);
  const lines = [];
  lines.push('=== WordPress.org Plugin Directory Status ===');
  lines.push(`Page URL:          ${live.url}`);
  if (live.isLogin) {
    lines.push('Session State:     LOGIN REQUIRED (sign in to WordPress.org in Chrome first)');
  } else if (live.has2fa) {
    lines.push('Session State:     2FA CHALLENGE ACTIVE (complete 2FA in Chrome first)');
  } else if (live.hasCaptcha) {
    lines.push('Session State:     CAPTCHA / ANTI-BOT ACTIVE (complete manually in Chrome)');
  } else if (live.slotLocked) {
    lines.push('Slot Status:       LOCKED (1 pending plugin limit active)');
  } else if (live.slotOpen) {
    lines.push('Slot Status:       OPEN (ready for next submission)');
  } else {
    lines.push('Slot Status:       UNKNOWN (submission form not detected)');
  }

  if (live.queueTotalAwaiting !== null) {
    lines.push(`WP.org Queue:      ${live.queueTotalAwaiting} plugins awaiting first review (emails sent before ${live.initialEmailsBefore || 'unknown'})`);
  }

  if (live.pendingPlugin) {
    const pp = live.pendingPlugin;
    lines.push('');
    lines.push('Current Pending Submission:');
    lines.push(`  Plugin:          ${pp.name || pp.slug || 'unknown'} (slug: ${pp.slug || 'unknown'}, id: ${pp.pluginId || 'n/a'})`);
    lines.push(`  Submitted On:    ${pp.submittedOn || 'unknown'}`);
    lines.push(`  Review Status:   ${pp.reviewStatus || 'unknown'}`);
    lines.push(`  Latest File:     ${pp.file || 'unknown'} (v${pp.version || '?'})`);
    lines.push(`  Update Form:     ${live.updateForm ? 'available (action=upload-additional)' : 'not present'}`);
  }

  lines.push('');
  lines.push('Local Suite Queue Summary:');
  lines.push(`  Total Plugins:   ${counts.total} (${counts.productionReady} production-ready, ${counts.needsWork} needs-work)`);
  lines.push(`  Submitted:       ${counts.submitted} | Approved: ${counts.approved} | Queued Next: ${counts.queued}`);

  if (nextPlugin) {
    lines.push('');
    lines.push('Next Eligible Production-Ready Plugin:');
    lines.push(`  #${nextPlugin.priority} ${nextPlugin.name} (${nextPlugin.slug} v${nextPlugin.version})`);
    lines.push(`  ZIP:             ${nextZip.path} (${nextZip.ok ? `OK, ${(nextZip.bytes / 1024).toFixed(1)} KB` : `INVALID: ${nextZip.reason}`})`);
    lines.push(`  PCP Result:      ${nextPlugin.pcpErrors} errors, ${nextPlugin.pcpWarnings} warnings`);
  } else {
    lines.push('');
    lines.push('Next Eligible Plugin: None remaining in queue.');
  }

  return lines.join('\n');
}

export async function runSubmissionInPage(page, { mode, zipPath, comment }) {
  if (typeof page.bringToFront === 'function') {
    await page.bringToFront().catch(() => {});
  }
  const formSelector = mode === 'update-active'
    ? 'form:has(input[name="action"][value="upload-additional"])'
    : 'form:has(input[type="file"][name="zip_file"]):not(:has(input[name="action"][value="upload-additional"]))';
  const form = page.locator(formSelector).first();
  if (mode === 'update-active' && !(await form.isVisible())) {
    const toggle = page.locator('a.show-upload-additional, a, button').filter({ hasText: /Upload updated .* plugin for review/i }).first();
    if (await toggle.count()) {
      await toggle.scrollIntoViewIfNeeded().catch(() => {});
      await toggle.click();
    }
  }
  await form.waitFor({ state: 'visible', timeout: 10000 });

  const fileInput = form.locator('input[type="file"][name="zip_file"]');
  await fileInput.setInputFiles(zipPath);

  if (mode === 'submit-next') {
    const boxes = form.locator('input[type="checkbox"]');
    const count = await boxes.count();
    for (let i = 0; i < count; i++) {
      const box = boxes.nth(i);
      if (!(await box.isChecked())) {
        await box.check();
      }
    }
  }

  if (comment) {
    const textarea = form.locator('textarea[name="comment"]');
    if (await textarea.count()) {
      await textarea.fill(comment);
    }
  }

  const submitBtn = form.locator('input[type="submit"], button[type="submit"]').first();
  await Promise.all([
    page.waitForLoadState('domcontentloaded', { timeout: 60000 }),
    submitBtn.click(),
  ]);
  await page.waitForTimeout(1500);

  const snapshot = await page.evaluate(() => {
    const main = document.querySelector('main') || document.body;
    const notices = [...document.querySelectorAll('.notice, .plugin-notice, .wp-block-wporg-notice, [class*="notice"]')]
      .map((e) => e.innerText.trim())
      .filter(Boolean);
    const errorNotices = [...document.querySelectorAll('.notice-error, .plugin-notice-error, .is-error, [class*="notice-error"], [class*="error-notice"]')]
      .map((e) => e.innerText.trim())
      .filter(Boolean);
    return {
      url: location.href,
      bodyText: (main?.innerText || '').trim(),
      notices,
      errorNotices,
    };
  });

  return classifySubmissionResult(snapshot);
}

function submitViaForm(session, { mode, zipPath, comment, pluginId }) {
  const payload = JSON.stringify({ mode, zipPath, comment, pluginId });
  const code = `async (page) => {
    const cfg = ${payload};
    await page.bringToFront().catch(() => {});
    const formSelector = cfg.mode === 'update-active'
      ? 'form:has(input[name="action"][value="upload-additional"])'
      : 'form:has(input[type="file"][name="zip_file"]):not(:has(input[name="action"][value="upload-additional"]))';
    const form = page.locator(formSelector).first();
    if (cfg.mode === 'update-active' && !(await form.isVisible())) {
      const toggle = page.locator('a.show-upload-additional, a, button').filter({ hasText: /Upload updated .* plugin for review/i }).first();
      if (await toggle.count()) {
        await toggle.scrollIntoViewIfNeeded().catch(() => {});
        await toggle.click();
      }
    }
    await form.waitFor({ state: 'visible', timeout: 10000 });

    const fileInput = form.locator('input[type="file"][name="zip_file"]');
    await fileInput.setInputFiles(cfg.zipPath);

    if (cfg.mode === 'submit-next') {
      const boxes = form.locator('input[type="checkbox"]');
      const count = await boxes.count();
      for (let i = 0; i < count; i++) {
        const box = boxes.nth(i);
        if (!(await box.isChecked())) {
          await box.check();
        }
      }
    }

    if (cfg.comment) {
      const textarea = form.locator('textarea[name="comment"]');
      if (await textarea.count()) {
        await textarea.fill(cfg.comment);
      }
    }

    const submitBtn = form.locator('input[type="submit"], button[type="submit"]').first();
    await Promise.all([
      page.waitForLoadState('domcontentloaded', { timeout: 60000 }),
      submitBtn.click(),
    ]);
    await page.waitForTimeout(1500);

    const main = await page.evaluate(() => {
      const root = document.querySelector('main') || document.body;
      const notices = [...document.querySelectorAll('.notice, .plugin-notice, .wp-block-wporg-notice, [class*="notice"]')]
        .map((e) => e.innerText.trim())
        .filter(Boolean);
      const errorNotices = [...document.querySelectorAll('.notice-error, .plugin-notice-error, .is-error, [class*="notice-error"], [class*="error-notice"]')]
        .map((e) => e.innerText.trim())
        .filter(Boolean);
      return {
        url: location.href,
        bodyText: (root?.innerText || '').trim(),
        notices,
        errorNotices,
      };
    });
    return JSON.stringify(main);
  }`;

  const rawOut = runPw(session, ['run-code', code], { raw: true, timeout: 90000 });
  let parsed = JSON.parse(rawOut);
  if (typeof parsed === 'string') {
    parsed = JSON.parse(parsed);
  }
  return classifySubmissionResult(parsed);
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const queue = loadQueue(opts.queuePath);

  ensureWporgTab(opts.session, !opts.noReload);
  const live = inspectLivePage(opts.session);

  if (opts.mode === 'status') {
    const nextPlugin = selectNextEligible(queue, null);
    const nextZip = nextPlugin ? verifyZipFile(nextPlugin.zip) : null;
    if (opts.json) {
      console.log(JSON.stringify({ live, summary: summarizeQueue(queue), nextPlugin, nextZip }, null, 2));
    } else {
      console.log(formatStatusReport(live, queue, nextPlugin, nextZip));
    }
    if (live.isLogin || live.has2fa || live.hasCaptcha) process.exit(2);
    process.exit(0);
  }

  // Shared safety gates for submit-next and update-active: never bypass login, 2FA, or CAPTCHA.
  if (live.isLogin) {
    console.error('STOP: WordPress.org login is required. Sign in manually in Chrome and re-run.');
    process.exit(2);
  }
  if (live.has2fa) {
    console.error('STOP: Two-factor authentication challenge detected. Complete 2FA manually in Chrome.');
    process.exit(2);
  }
  if (live.hasCaptcha) {
    console.error('STOP: CAPTCHA / anti-bot challenge detected. Complete it manually in Chrome.');
    process.exit(2);
  }

  if (opts.mode === 'update-active') {
    const target = queue.plugins.find((p) => p.slug === opts.slug);
    if (!target) {
      console.error(`Error: slug "${opts.slug}" not found in ${opts.queuePath}`);
      process.exit(1);
    }
    const zipCheck = verifyZipFile(target.zip);
    if (!zipCheck.ok) {
      console.error(`Error: invalid ZIP for ${target.slug}: ${zipCheck.reason} (${zipCheck.path})`);
      process.exit(1);
    }
    if (!live.updateForm) {
      console.error('STOP: No active "Upload updated plugin for review" form found on WordPress.org.');
      process.exit(2);
    }
    if (live.pendingPlugin?.slug && live.pendingPlugin.slug !== target.slug) {
      console.error(`STOP: Active pending plugin is "${live.pendingPlugin.slug}", not "${target.slug}". Refusing mismatch.`);
      process.exit(1);
    }

    const comment = opts.comment || `Updated ${target.name} v${target.version} package (${path.basename(zipCheck.path)}).`;
    if (opts.dryRun) {
      const plan = {
        mode: 'update-active',
        dryRun: true,
        slug: target.slug,
        pluginId: live.updateForm.pluginId,
        zipPath: zipCheck.path,
        zipBytes: zipCheck.bytes,
        comment,
        formDetected: true,
      };
      console.log(opts.json ? JSON.stringify(plan, null, 2) : `DRY RUN (update-active): would upload ${zipCheck.path} (${(zipCheck.bytes / 1024).toFixed(1)} KB) to active submission "${live.pendingPlugin?.name || target.name}" (plugin_id=${live.updateForm.pluginId}).`);
      process.exit(0);
    }

    const res = submitViaForm(opts.session, {
      mode: 'update-active',
      zipPath: zipCheck.path,
      comment,
      pluginId: live.updateForm.pluginId,
    });

    const ok = !res.hasError && !res.authBlocked && (res.scanPass || res.updatedOk);
    if (ok) {
      target.lastUpdatedUploadAt = new Date().toISOString();
      target.lastUploadResult = res.scanPass ? 'scan-pass' : 'uploaded';
      target.lastUploadNotes = comment;
      saveQueue(opts.queuePath, queue);
    }

    if (opts.json) {
      console.log(JSON.stringify(res, null, 2));
    } else {
      console.log(`Updated ZIP attempt for ${target.slug}: ${zipCheck.path}`);
      console.log(`Scan Pass: ${res.scanPass ? 'YES' : 'NO'} | Upload Confirmation: ${res.updatedOk ? 'YES' : 'NO'} | Error: ${res.hasError ? 'YES' : 'NO'}`);
      if (res.notices.length) {
        console.log('Notices:\n  - ' + res.notices.join('\n  - '));
      }
    }
    if (res.authBlocked) process.exit(2);
    process.exit(ok ? 0 : 1);
  }

  // --submit-next flow
  const nextPlugin = selectNextEligible(queue, opts.slug);
  if (!nextPlugin) {
    console.log('No remaining queued production-ready plugins in wporg-queue.json.');
    process.exit(0);
  }

  const zipCheck = verifyZipFile(nextPlugin.zip);
  if (!zipCheck.ok) {
    console.error(`Error: next plugin "${nextPlugin.slug}" ZIP check failed: ${zipCheck.reason} (${zipCheck.path})`);
    process.exit(1);
  }

  if (live.slotLocked) {
    const payload = {
      mode: 'submit-next',
      dryRun: opts.dryRun,
      canSubmit: false,
      reason: 'slot-locked',
      lockMessage: live.lockMessage || '1-pending-plugin limit is active on WordPress.org',
      pendingPlugin: live.pendingPlugin,
      nextPlugin: {
        priority: nextPlugin.priority,
        slug: nextPlugin.slug,
        name: nextPlugin.name,
        version: nextPlugin.version,
        zipPath: zipCheck.path,
        zipBytes: zipCheck.bytes,
      },
    };
    if (opts.json) {
      console.log(JSON.stringify(payload, null, 2));
    } else {
      console.log(`SLOT LOCKED: ${payload.lockMessage}`);
      if (live.pendingPlugin) {
        console.log(`  Currently awaiting review: ${live.pendingPlugin.name || live.pendingPlugin.slug} (${live.pendingPlugin.reviewStatus || 'pending'})`);
      }
      console.log(`  Next queued plugin ready: #${nextPlugin.priority} ${nextPlugin.name} -> ${zipCheck.path} (${(zipCheck.bytes / 1024).toFixed(1)} KB, valid ZIP)`);
      console.log('  Re-run this command once WordPress.org approves the active review and unlocks the slot.');
    }
    process.exit(opts.dryRun ? 0 : 3);
  }

  if (!live.slotOpen) {
    const payload = {
      mode: 'submit-next',
      dryRun: opts.dryRun,
      canSubmit: false,
      reason: 'unexpected-page-state',
      url: live.url,
      title: live.title,
    };
    if (opts.json) {
      console.log(JSON.stringify(payload, null, 2));
    } else {
      console.error(`STOP: Unexpected WordPress.org page state at ${live.url} — neither new-plugin form nor 1-pending-plugin lock was detected.`);
    }
    process.exit(2);
  }

  const comment = opts.comment || `Public repository: ${nextPlugin.repoUrl} — GPL-2.0-or-later, verified with official Plugin Check (${nextPlugin.pcpErrors} errors, ${nextPlugin.pcpWarnings} warnings).`;

  if (opts.dryRun) {
    const payload = {
      mode: 'submit-next',
      dryRun: true,
      canSubmit: true,
      nextPlugin: {
        priority: nextPlugin.priority,
        slug: nextPlugin.slug,
        name: nextPlugin.name,
        version: nextPlugin.version,
        zipPath: zipCheck.path,
        zipBytes: zipCheck.bytes,
      },
      checkboxesToTick: live.newSubmitForm?.checkboxes?.length || 0,
      comment,
    };
    console.log(opts.json ? JSON.stringify(payload, null, 2) : `DRY RUN (slot OPEN): would submit #${nextPlugin.priority} ${nextPlugin.name} (${zipCheck.path}, ${(zipCheck.bytes / 1024).toFixed(1)} KB), tick ${payload.checkboxesToTick} guideline checkboxes, and confirm automated scan pass.`);
    process.exit(0);
  }

  const res = submitViaForm(opts.session, {
    mode: 'submit-next',
    zipPath: zipCheck.path,
    comment,
  });

  if (res.authBlocked) {
    console.error('STOP: Auth / 2FA / CAPTCHA challenge appeared during submission. Complete it manually in Chrome.');
    process.exit(2);
  }

  if (res.scanPass && !res.hasError) {
    nextPlugin.status = 'awaiting-review';
    nextPlugin.submittedAt = new Date().toISOString();
    nextPlugin.scanResult = 'Pass';
    saveQueue(opts.queuePath, queue);
    if (opts.json) {
      console.log(JSON.stringify({ submitted: true, slug: nextPlugin.slug, ...res }, null, 2));
    } else {
      console.log(`SUCCESS: Submitted ${nextPlugin.name} (${nextPlugin.slug}) — Results of Automated Plugin Scanning: Pass.`);
      console.log(`Updated ${opts.queuePath}.`);
    }
    process.exit(0);
  } else {
    console.error(`WARNING: Submission completed for ${nextPlugin.slug}, but "Results of Automated Plugin Scanning: Pass" was NOT confirmed cleanly.`);
    console.error(JSON.stringify(res, null, 2));
    process.exit(1);
  }
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isDirectRun) {
  try {
    main();
  } catch (err) {
    if (err instanceof SessionUnavailableError) {
      console.error(`STOP: ${err.message}`);
      process.exit(2);
    }
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

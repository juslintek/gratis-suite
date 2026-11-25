#!/usr/bin/env node
/**
 * WordPress.org Theme Directory upload helper (Ticket #301616).
 *
 * Verifies `/Volumes/Projects/gratis/dist/gratis-theme-1.0.2.zip` (PK\x03\x04
 * header, < 10 MB, top-level `gratis/` slug directory) and inspects
 * `https://wordpress.org/themes/upload/` through an already-authenticated
 * `playwright-cli` browser session (`-s=directadmin`). Stops immediately with
 * exit code 2 without touching anything if the browser session is closed or if
 * a login, 2FA, CAPTCHA, or anti-bot challenge is present.
 *
 * Usage:
 *   node gratis-suite/tools/wporg-theme-upload.mjs --status [--json]
 *   node gratis-suite/tools/wporg-theme-upload.mjs --upload [--dry-run] [--zip=<path>] [--json]
 *
 * Options:
 *   --session=<name>   playwright-cli session name (default: directadmin)
 *   --zip=<path>       path to theme ZIP (default: dist/gratis-theme-1.0.2.zip)
 *   --no-reload        inspect the existing WordPress.org tab without reloading
 *   --dry-run          verify ZIP and live upload form without submitting
 *   --json             emit machine-readable JSON output
 *   -h, --help         show this help
 *
 * Exit codes:
 *   0  Success (or dry-run verified)
 *   1  Usage / config / ZIP verification / upload error
 *   2  Auth / 2FA / CAPTCHA / detached session / unexpected page state (manual action required)
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SUITE_DIR = path.resolve(__dirname, '..');
const WORKSPACE_DIR = path.resolve(SUITE_DIR, '..');
const DEFAULT_ZIP_PATH = path.join(WORKSPACE_DIR, 'dist', 'gratis-theme-1.0.2.zip');
const WPORG_THEME_UPLOAD_URL = 'https://wordpress.org/themes/upload/';
const EXPECTED_SLUG = 'gratis';

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
    zipPath: DEFAULT_ZIP_PATH,
  };

  for (const arg of argv) {
    if (arg === '-h' || arg === '--help') {
      printHelp();
      process.exit(0);
    } else if (arg === '--status') {
      opts.mode = 'status';
    } else if (arg === '--upload') {
      opts.mode = 'upload';
    } else if (arg === '--dry-run') {
      opts.dryRun = true;
    } else if (arg === '--json') {
      opts.json = true;
    } else if (arg === '--no-reload') {
      opts.noReload = true;
    } else if (arg.startsWith('--session=')) {
      opts.session = arg.slice('--session='.length);
    } else if (arg.startsWith('--zip=')) {
      opts.zipPath = path.resolve(arg.slice('--zip='.length));
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!opts.mode) {
    throw new Error('Specify --status or --upload (see --help).');
  }
  return opts;
}

export function verifyThemeZip(zipRelOrAbs, baseDir = WORKSPACE_DIR) {
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
  if (stat.size >= 10 * 1024 * 1024) {
    return { ok: false, path: absPath, reason: `ZIP must be < 10 MB (${stat.size} bytes)` };
  }

  const fd = fs.openSync(absPath, 'r');
  const header = Buffer.alloc(4);
  fs.readSync(fd, header, 0, 4, 0);
  fs.closeSync(fd);
  const validMagic = header[0] === 0x50 && header[1] === 0x4b && header[2] === 0x03 && header[3] === 0x04;
  if (!validMagic) {
    return { ok: false, path: absPath, reason: 'Invalid ZIP header (expected PK\\x03\\x04)' };
  }

  let entries;
  try {
    const out = execFileSync('unzip', ['-Z1', absPath], { encoding: 'utf8', timeout: 15000 });
    entries = out.split('\n').map((s) => s.trim()).filter(Boolean);
  } catch (err) {
    return { ok: false, path: absPath, reason: `Failed to list ZIP entries: ${err.message}` };
  }

  if (!entries.length) {
    return { ok: false, path: absPath, reason: 'ZIP archive is empty' };
  }

  const expectedPrefix = `${EXPECTED_SLUG}/`;
  const badEntries = entries.filter((e) => !e.startsWith(expectedPrefix));
  if (badEntries.length) {
    return {
      ok: false,
      path: absPath,
      reason: `Expected top-level "${expectedPrefix}" slug directory, found: ${badEntries.slice(0, 3).join(', ')}`,
    };
  }
  if (!entries.includes(`${expectedPrefix}style.css`)) {
    return {
      ok: false,
      path: absPath,
      reason: `Missing ${expectedPrefix}style.css inside archive`,
    };
  }

  return {
    ok: true,
    path: absPath,
    bytes: stat.size,
    topLevelDir: EXPECTED_SLUG,
    fileCount: entries.length,
  };
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
    if (/is not open|please run open first|ECONNREFUSED|Target page, context or browser has been closed|daemon/i.test(stderr)) {
      throw new SessionUnavailableError(
        `Browser session "${session}" is not attached/open. Attach Chrome first: playwright-cli -s=${session} attach --cdp=chrome`
      );
    }
    throw new Error(`playwright-cli (${cliArgs.join(' ')}) failed: ${stderr}`);
  }
}

export function classifyLiveThemePage({ url = '', title = '', text = '', forms = [], hasLoginForm = false, hasCaptchaWidget = false }) {
  const isLogin = url.includes('login.wordpress.org')
    || url.includes('wp-login.php')
    || /you must be logged in|please log in|log in to wordpress\.org/i.test(text)
    || Boolean(hasLoginForm);

  const has2fa = /two-factor|authentication code|authenticator app|security key|verify your identity/i.test(text);
  const hasCaptcha = Boolean(hasCaptchaWidget)
    || /verify you are human|confirm you are human|complete the captcha|attention required|checking your browser/i.test(text);

  const uploadForm = forms.find((f) => f.hasFile) || null;
  const readyForUpload = Boolean(uploadForm) && !isLogin && !has2fa && !hasCaptcha;

  return {
    url,
    title,
    isLogin,
    has2fa,
    hasCaptcha,
    readyForUpload,
    uploadForm,
  };
}

export function classifyThemeUploadResult({ url = '', bodyText = '', notices = [], errorNotices = [] }) {
  const noticeText = notices.join('\n');
  const errText = errorNotices.join('\n');

  const authBlocked = url.includes('login.wordpress.org')
    || url.includes('wp-login.php')
    || /you must be logged in|two-factor|security key|verify you are human|confirm you are human/i.test(bodyText);

  const hasError = Boolean(errorNotices.length)
    || /Results of Automated Theme Scanning:\s*Fail|Theme Check failed|REQUIRED:|cannot be uploaded|upload failed|error:\s*\S/i.test(noticeText || bodyText)
    || /error|failed/i.test(errText);

  const scanPass = !hasError && !authBlocked
    && /Results of Automated Theme Scanning:\s*Pass/i.test(bodyText);

  const uploadedOk = !hasError && !authBlocked
    && /has been uploaded|thank you for uploading|new theme version|trac\.wordpress\.org\/ticket\/\d+/i.test(noticeText || bodyText);

  return {
    url,
    authBlocked,
    hasError,
    scanPass,
    uploadedOk,
    notices: notices.slice(0, 10),
    errorNotices: errorNotices.slice(0, 10),
    excerpt: bodyText.slice(0, 1800),
  };
}

function ensureThemeUploadTab(session, reload) {
  const listOut = runPw(session, ['tab-list']);
  const lines = listOut.split('\n');
  let targetIdx = null;
  let isCurrent = false;

  for (const line of lines) {
    const m = line.match(/^\s*-\s*(\d+):\s*(\(current\)\s*)?\[.*?\]\((https?:\/\/[^\s)]+)\)/);
    if (!m) continue;
    const idx = Number(m[1]);
    const url = m[3];
    if (url.startsWith(WPORG_THEME_UPLOAD_URL)) {
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

  runPw(session, ['tab-new', WPORG_THEME_UPLOAD_URL]);
  return null;
}

const INSPECT_THEME_PAGE_FN = `() => {
  const url = location.href;
  const title = document.title;
  const main = document.querySelector('main') || document.body;
  const text = (main?.innerText || '').trim();
  const forms = [...document.querySelectorAll('form')].map((f) => {
    const inputs = [...f.querySelectorAll('input, textarea, button, select')].map((el) => ({
      tag: el.tagName,
      type: (el.type || '').toLowerCase(),
      name: el.name || '',
      id: el.id || '',
      checked: Boolean(el.checked),
    }));
    const fileInput = inputs.find((i) => i.type === 'file');
    return {
      id: f.id || '',
      action: f.getAttribute('action') || '',
      hasFile: Boolean(fileInput),
      fileInputName: fileInput?.name || '',
      checkboxes: inputs.filter((i) => i.type === 'checkbox').map((i) => ({ name: i.name, id: i.id, checked: i.checked })),
      submitCount: inputs.filter((i) => i.type === 'submit' || (i.tag === 'BUTTON' && i.type !== 'button')).length,
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

function inspectLiveThemePage(session) {
  const expr = `JSON.stringify((${INSPECT_THEME_PAGE_FN})())`;
  const rawOut = runPw(session, ['eval', expr], { raw: true });
  let parsed = JSON.parse(rawOut);
  if (typeof parsed === 'string') {
    parsed = JSON.parse(parsed);
  }
  return classifyLiveThemePage(parsed);
}

function uploadThemeViaForm(session, zipPath, fileInputName) {
  const payload = JSON.stringify({ zipPath, fileInputName });
  const code = `async (page) => {
    const cfg = ${payload};
    const sel = cfg.fileInputName
      ? 'form:has(input[type="file"][name="' + cfg.fileInputName + '"])'
      : 'form:has(input[type="file"])';
    const form = page.locator(sel).first();
    await form.waitFor({ state: 'visible', timeout: 10000 });

    const fileInput = form.locator('input[type="file"]').first();
    await fileInput.setInputFiles(cfg.zipPath);

    const boxes = form.locator('input[type="checkbox"]');
    const count = await boxes.count();
    for (let i = 0; i < count; i++) {
      const box = boxes.nth(i);
      if (!(await box.isChecked())) {
        await box.check();
      }
    }

    const submitBtn = form.locator('input[type="submit"], button[type="submit"]').first();
    await Promise.all([
      page.waitForLoadState('domcontentloaded', { timeout: 60000 }),
      submitBtn.click(),
    ]);
    await page.waitForTimeout(1500);

    const result = await page.evaluate(() => {
      const root = document.querySelector('main') || document.body;
      const notices = [...document.querySelectorAll('.notice, .wp-block-wporg-notice, [class*="notice"]')]
        .map((e) => e.innerText.trim())
        .filter(Boolean);
      const errorNotices = [...document.querySelectorAll('.notice-error, .is-error, [class*="notice-error"], [class*="error-notice"]')]
        .map((e) => e.innerText.trim())
        .filter(Boolean);
      return {
        url: location.href,
        bodyText: (root?.innerText || '').trim(),
        notices,
        errorNotices,
      };
    });
    return JSON.stringify(result);
  }`;

  const rawOut = runPw(session, ['run-code', code], { raw: true, timeout: 90000 });
  let parsed = JSON.parse(rawOut);
  if (typeof parsed === 'string') {
    parsed = JSON.parse(parsed);
  }
  return classifyThemeUploadResult(parsed);
}

function formatStatus(zipCheck, live) {
  const lines = [];
  lines.push('=== WordPress.org Theme Upload Status (Ticket #301616) ===');
  lines.push(`ZIP Path:          ${zipCheck.path}`);
  lines.push(
    `ZIP Check:         ${zipCheck.ok ? `OK (${(zipCheck.bytes / 1024).toFixed(1)} KB, top-level "${zipCheck.topLevelDir}/", ${zipCheck.fileCount} entries)` : `INVALID (${zipCheck.reason})`}`
  );
  if (live) {
    lines.push(`Page URL:          ${live.url}`);
    if (live.isLogin) {
      lines.push('Session State:     LOGIN REQUIRED (sign in to WordPress.org in Chrome first)');
    } else if (live.has2fa) {
      lines.push('Session State:     2FA CHALLENGE ACTIVE (complete 2FA in Chrome first)');
    } else if (live.hasCaptcha) {
      lines.push('Session State:     CAPTCHA / ANTI-BOT ACTIVE (complete manually in Chrome)');
    } else if (live.readyForUpload) {
      lines.push(`Upload Form:       READY (file input "${live.uploadForm.fileInputName || 'zip'}")`);
    } else {
      lines.push('Upload Form:       NOT DETECTED (unexpected page state)');
    }
  }
  return lines.join('\n');
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const zipCheck = verifyThemeZip(opts.zipPath);

  ensureThemeUploadTab(opts.session, !opts.noReload);
  const live = inspectLiveThemePage(opts.session);

  if (opts.mode === 'status') {
    if (opts.json) {
      console.log(JSON.stringify({ zip: zipCheck, live }, null, 2));
    } else {
      console.log(formatStatus(zipCheck, live));
    }
    if (live.isLogin || live.has2fa || live.hasCaptcha || !live.readyForUpload) {
      process.exit(2);
    }
    if (!zipCheck.ok) {
      process.exit(1);
    }
    process.exit(0);
  }

  // Never bypass login, 2FA, or CAPTCHA challenges.
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
  if (!live.readyForUpload) {
    console.error(`STOP: Upload form not detected at ${live.url}.`);
    process.exit(2);
  }

  if (!zipCheck.ok) {
    console.error(`Error: Theme ZIP verification failed: ${zipCheck.reason} (${zipCheck.path})`);
    process.exit(1);
  }

  if (opts.dryRun) {
    const plan = {
      mode: 'upload',
      dryRun: true,
      url: live.url,
      zipPath: zipCheck.path,
      zipBytes: zipCheck.bytes,
      topLevelDir: zipCheck.topLevelDir,
      fileInputName: live.uploadForm.fileInputName,
    };
    console.log(
      opts.json
        ? JSON.stringify(plan, null, 2)
        : `DRY RUN: would upload ${zipCheck.path} (${(zipCheck.bytes / 1024).toFixed(1)} KB, top-level "${zipCheck.topLevelDir}/") to ${live.url}.`
    );
    process.exit(0);
  }

  const res = uploadThemeViaForm(opts.session, zipCheck.path, live.uploadForm.fileInputName);
  if (res.authBlocked) {
    console.error('STOP: Auth / 2FA / CAPTCHA challenge appeared during upload. Complete it manually.');
    process.exit(2);
  }

  const ok = !res.hasError && (res.scanPass || res.uploadedOk);
  if (opts.json) {
    console.log(JSON.stringify(res, null, 2));
  } else {
    console.log(`Theme upload attempt: ${zipCheck.path}`);
    console.log(`Scan Pass: ${res.scanPass ? 'YES' : 'NO'} | Uploaded: ${res.uploadedOk ? 'YES' : 'NO'} | Error: ${res.hasError ? 'YES' : 'NO'}`);
    if (res.notices.length) {
      console.log('Notices:\n  - ' + res.notices.join('\n  - '));
    }
  }
  process.exit(ok ? 0 : 1);
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
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

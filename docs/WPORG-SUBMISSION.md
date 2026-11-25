# WordPress.org Plugin Directory Submission Readiness & Queue

Updated: 2026-11-25

## Current WordPress.org status (`juslintek`)

- **Active submission:** `Gratis SEO` (`gratis-seo-1.0.0.zip`, `plugin_id=413649`, submitted 2026-11-24) — **Awaiting Review** (Automated Plugin Scanning: Pass).
- **1-pending-plugin limit:** WordPress.org allows only **1 unreviewed plugin per account at a time**. Do not attempt to bypass this limit or create secondary accounts. Once `Gratis SEO` is reviewed and approved, run `node gratis-suite/tools/wporg-submit.mjs --submit-next` to submit the next queued plugin.
- **Theme Directory:** `GRATIS` (`gratis-theme-1.0.1.zip`, packaged under `gratis/`) updated on `https://themes.trac.wordpress.org/ticket/301616` — **`Results of Automated Theme Scanning: Pass`** (0 REQUIRED, 0 WARNING; text domain cleanly detected as `gratis`).

## Verification & audit summary (2026-11-25)

1. **Official WordPress.org Plugin Check (`plugin-check 2.2.0`)** run across all 33 freshly rebuilt ZIPs inside a clean WordPress 7.1.5 + PHP 8.5 container:
   - **33/33 plugins: 0 PCP errors**
   - **29/33 plugins: 0 PCP errors and 0 PCP warnings** (up from 18/33)
   - Total suite warnings reduced from **92 -> 12** (only 4 informational WP 7.0 `AIProvider.DirectIntegration` advisories in `gratis-ai`, 6 `SAVEQUERIES`/`DISABLE_WP_CRON`/`AsyncQueue` hook notices in `gratis-cache`, and 1 `SAVEQUERIES` notice each in `gratis-db` and `gratis-devtools`).
2. **Manual-review compliance & security hardening completed across the suite:**
   - **`gratis-seo` (active submission):** removed `'sslverify' => false` and added `ABSPATH` guard in `SEOCommand`, moved MetaBox inline `<style>` to `wp_add_inline_style()`, upgraded REST post meta `auth_callback` to per-post `edit_post` and URL meta sanitization to `esc_url_raw`, fixed `Sitemap.php` (`status_header(200)`, `_gratis_seo_noindex` exclusion, plus PR #5 running `serve()` at `template_redirect` priority `1` and `pre_handle_404` bypass so `/sitemap.xml` serves Gratis SEO's XML instead of core's 301 redirect to `/wp-sitemap.xml`), and upgraded `uninstall.php` to clean up all 6 `_gratis_seo_*` post meta keys via core WP API.
   - **Suite-wide security & compliance fixes:** removed arbitrary file/option-write `mcp-for-page-builders/v1` endpoints and `set_time_limit(0)` from `gratis-cache/src/Admin/RestApi.php`, fixed arbitrary `do_action()` dispatch in `gratis-fleet/src/WebhookHub.php`, removed all remaining `'sslverify' => false` flags (`gratis-seo`, `gratis-fleet`, `gratis-cache`), migrated custom-table SQL queries to WP 6.2+ `%i` identifier placeholders (`gratis-analytics`, `gratis-forms`, `gratis-db`, `gratis-devtools`), added `defined('ABSPATH') || exit;` guards to 101 PHP files, added per-visitor rate limiting on `gratis-comply` `/data-request`, hardened `gratis-ai` `MCPServer` input sanitization, replaced `apply_filters('the_content', ...)` in `gratis-popup`, added `== Third-Party Services ==` disclosures (`gratis-commerce`, `gratis-forms`, `gratis-security`, `gratis-automation`, `gratis-fleet`, expanded `gratis-ai`), removed unimplemented feature claims (`gratis-access` drip/per-section, `gratis-invoice` estimates) and competitor pricing copy (`gratis-devtools`, `gratis-fleet`).
3. **All 36 Gratis GitHub repositories are PUBLIC** (including `juslintek/gratis-suite` after a full secret/history audit confirmed 0 secrets, keys, IPs, or prod credentials).
4. **Distribution ZIPs synced** across `/Volumes/Projects/gratis/dist/`, `/Volumes/Projects/gratis/site/downloads/`, and live `https://gratis.superglobalsdevelopment.com/downloads/`.

## 1-command queue automation (`tools/wporg-submit.mjs`)

The reusable queue script uses the already signed-in `playwright-cli -s=directadmin` Chrome session and reads/updates `gratis-suite/docs/wporg-queue.json`:

```sh
# Re-attach to your signed-in Chrome session if playwright-cli is not attached yet
playwright-cli -s=directadmin attach --cdp=chrome

# Check live WordPress.org slot state, active submission, and next eligible plugin
node gratis-suite/tools/wporg-submit.mjs --status

# Dry-run the next queued production-ready plugin (verifies ZIP + live form/lock without submitting)
node gratis-suite/tools/wporg-submit.mjs --submit-next --dry-run

# Upload a refreshed ZIP for an active awaiting-review submission (e.g. after PR #5)
node gratis-suite/tools/wporg-submit.mjs --update-active --slug=gratis-seo --comment="Run Sitemap::serve() at template_redirect priority 1 + pre_handle_404 bypass so /sitemap.xml serves HTTP 200 XML."

# Submit the next queued production-ready plugin once WordPress.org unlocks the slot
node gratis-suite/tools/wporg-submit.mjs --submit-next
```

Safety guarantees built into `wporg-submit.mjs`:
- Refuses to submit any plugin classified as `needs-work`.
- Verifies ZIP existence, size (< 10 MB), and `PK\x03\x04` header before touching the browser.
- Stops cleanly without bypassing anything if WordPress.org's 1-pending-plugin lock, login screen, 2FA prompt, or CAPTCHA challenge is active.
- Updates `gratis-suite/docs/wporg-queue.json` only after confirming `"Results of Automated Plugin Scanning: Pass"`.

## Honest 33-plugin classification

### Production-ready for WordPress.org (28 plugins)

| Priority | Slug | Version | PCP (E/W) | Queue Status | Notes |
|---:|---|---|---|---|---|
| 1 | `gratis-seo` | 1.0.0 | 0 / 0 | `awaiting-review` | Active submission (`plugin_id=413649`); hardened ZIP uploaded |
| 2 | `gratis-backup` | 1.0.0 | 0 / 0 | `queued` | Stream-first backup/restore + PathGuard + 17 self-checks |
| 3 | `gratis-mail` | 1.0.0 | 0 / 0 | `queued` | Encrypted SMTP credentials, test tool, delivery log |
| 4 | `gratis-social` | 1.0.0 | 0 / 0 | `queued` | Zero-tracking share buttons, no third-party JS SDK |
| 5 | `gratis-reviews` | 1.0.0 | 0 / 0 | `queued` | Accessible ratings, testimonials, AggregateRating schema |
| 6 | `gratis-analytics` | 1.0.0 | 0 / 0 | `queued` | Cookie-free analytics, salted hashes, `%i` SQL escaping |
| 7 | `gratis-comply` | 1.0.0 | 0 / 0 | `queued` | Consent banner, Consent Mode v2, rate-limited GDPR endpoint |
| 8 | `gratis-forms` | 1.0.0 | 0 / 0 | `queued` | Form builder, submissions table, `%i` SQL, reCAPTCHA disclosed |
| 9 | `gratis-popup` | 1.0.0 | 0 / 0 | `queued` | Accessible modal/slide-in popups, clean block/shortcode render |
| 10 | `gratis-security` | 2.0.0 | 0 / 0 | `queued` | WAF, FIM, malware scanner, TOTP 2FA, 4 self-check suites |
| 11 | `gratis-cdn` | 1.0.0 | 0 / 0 | `queued` | Asset rewriting, fingerprinting, CDN purge APIs disclosed |
| 12 | `gratis-commerce` | 1.0.0 | 0 / 0 | `queued` | Stripe Checkout + HMAC webhook + WooCommerce modules |
| 13 | `gratis-crm` | 1.0.0 | 0 / 0 | `queued` | Contacts, broadcasts, unsubscribe tokens, CSV export |
| 14 | `gratis-booking` | 1.0.0 | 0 / 0 | `queued` | Services, appointments, REST slots/booking, emails |
| 15 | `gratis-tables` | 1.0.0 | 0 / 0 | `queued` | CSV-backed sortable/searchable responsive tables |
| 16 | `gratis-invoice` | 1.0.0 | 0 / 0 | `queued` | Line-item invoices, auto-totals, printable output |
| 17 | `gratis-learn` | 1.0.0 | 0 / 0 | `queued` | Courses, lessons, quizzes, progress REST endpoint |
| 18 | `gratis-automation` | 1.0.0 | 0 / 0 | `queued` | Trigger-to-action workflow engine, webhooks disclosed |
| 19 | `gratis-affiliate` | 1.0.0 | 0 / 0 | `queued` | Referral links, hardened cookie, commissions, payouts |
| 20 | `gratis-community` | 1.0.0 | 0 / 0 | `queued` | Profiles, activity feed, groups, messaging REST |
| 21 | `gratis-events` | 1.0.0 | 0 / 0 | `queued` | Events, recurrence, RSVP, iCal export |
| 22 | `gratis-media` | 1.0.0 | 0 / 0 | `queued` | Media library folders, auto-organize, gallery shortcode |
| 23 | `gratis-builder` | 1.0.0 | 0 / 0 | `queued` | Pattern library, block editing & AI REST API |
| 24 | `gratis-access` | 1.0.0 | 0 / 0 | `queued` | Tiered content restriction (`readme.txt` aligned with `src/`) |
| 25 | `gratis-project` | 1.0.0 | 0 / 0 | `queued` | Projects, tasks, Kanban board shortcode |
| 26 | `gratis-translate` | 1.0.0 | 0 / 0 | `queued` | Language taxonomy, accessible switcher, hreflang |
| 27 | `gratis-fleet` | 1.0.0 | 0 / 0 | `queued` | Multi-site dashboard, hardened WebhookHub, TLS verified |
| 28 | `gratis-ai` | 2.0.0 | 0 / 4 | `queued` | BYOM AI router, MCP server, Abilities API (4 WP 7.0 AI advisories) |

### Needs work before WordPress.org submission (5 plugins — held out of queue)

| Slug | Version | PCP (E/W) | Why held back |
|---|---|---|---|
| `gratis-cache` | 3.0.0 | 0 / 6 | Needs full `vlt_*` -> `gratis_cache_*` prefix migration across 40+ options, `vlt-cache/v1` REST, and `vlt_async_worker` AJAX, plus review of `SAVEQUERIES`/`DISABLE_WP_CRON` runtime defines. (Backdoor endpoints, `sslverify=false`, `set_time_limit(0)`, and 39 PCP warnings already fixed.) |
| `gratis-db` | 1.0.0 | 0 / 1 | `DropinManager` writes/removes `wp-content/db.php` on disk and `SlowQueryLog` defines `SAVEQUERIES` at runtime. |
| `gratis-devtools` | 1.0.0 | 0 / 1 | `MigrationManager` writes and `require`s PHP files under `wp-content/gratis-migrations/`; `DebugBar` defines `SAVEQUERIES`. |
| `gratis-notify` | 1.0.0 | 0 / 0 | Thin stub (`PushNotifier.php`, 98 LOC): no real VAPID/Service Worker Web Push, front-end never polls `/latest` or renders notifications, unbounded subscriber option array. |
| `gratis-installer` | 1.0.0 | 0 / 0 | Internal suite activator listing 32 hardcoded `juslintek/gratis-*` plugins already on disk — unsuitable for the general WordPress.org Plugin Directory (Guidelines 1 & 10). |

## Post-approval SVN release checklist (per plugin)

Once WordPress.org approves a plugin and provisions its SVN repository:
1. Upload `{plugin}/.wordpress-org/*` (`banner-772x250.png`, `banner-1544x500.png`, `icon-128x128.png`, `icon-256x256.png`, `screenshot-*.png`) to SVN `assets/`.
2. Commit the clean plugin code (matching `dist/{slug}-{version}.zip`) to SVN `trunk/` and tag `tags/{version}/`.
3. Mark the plugin `"status": "approved"` in `gratis-suite/docs/wporg-queue.json` and run `node gratis-suite/tools/wporg-submit.mjs --submit-next`.

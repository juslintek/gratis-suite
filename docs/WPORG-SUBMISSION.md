# WordPress.org Plugin Directory Submission Readiness & Queue

Updated: 2026-11-25

## Current WordPress.org status (`juslintek`)

- **Active submission:** `Gratis SEO` (`gratis-seo-1.0.0.zip`, `plugin_id=413649`, submitted 2026-11-24) — **Awaiting Review** (Automated Plugin Scanning: Pass).
- **1-pending-plugin limit:** WordPress.org allows only **1 unreviewed plugin per account at a time**. Do not attempt to bypass this limit or create secondary accounts. Once `Gratis SEO` is reviewed and approved, run `node gratis-suite/tools/wporg-submit.mjs --submit-next` to submit the next queued plugin.
- **Theme Directory:** `GRATIS` (`gratis-theme-1.0.2.zip`, 592 KB, packaged under `gratis/`) ready for Ticket `#301616` (`https://themes.trac.wordpress.org/ticket/301616`) with `/demo/gratis-theme/`, `/docs/gratis-theme/`, `tools/wporg-theme-upload.mjs`, and `tools/upload-theme-wporg-wizard.sh` (`1.0.1` passed `Results of Automated Theme Scanning: Pass` with 0 REQUIRED, 0 WARNING; `1.0.2` passes `validate-theme.php` 42/42).

## Verification & audit summary (2026-11-25)

1. **Official WordPress.org Plugin Check (`plugin-check 2.2.0`):**
   - **33/33 plugins: 0 PCP errors**
   - **29/33 plugins: 0 PCP errors and 0 PCP warnings** (up from 18/33)
   - Total suite warnings reduced from **92 -> 12** (4 informational WP 7.0 `AIProvider.DirectIntegration` advisories in `gratis-ai`, 6 `SAVEQUERIES`/`DISABLE_WP_CRON`/`AsyncQueue` hook notices in `gratis-cache`, and 1 `SAVEQUERIES` notice each in `gratis-db` and `gratis-devtools`).
2. **Manual-review compliance & security hardening completed across the suite:**
   - **`gratis-seo` (active submission):** removed `'sslverify' => false` and added `ABSPATH` guard in `SEOCommand`, moved MetaBox inline `<style>` to `wp_add_inline_style()`, hardened REST post meta `auth_callback` (now strict_types-safe for string/int `$object_id`) and URL meta sanitization (`esc_url_raw`), guarded `MetaBox::enqueue_styles()` against non-string hook suffixes and skipped post revisions on save, fixed `Sitemap.php` (`status_header(200)`, `_gratis_seo_noindex` exclusion, `template_redirect` priority `1`, `pre_handle_404` bypass), upgraded `uninstall.php` to clean all 6 `_gratis_seo_*` keys, and added 12-assertion `tests/seo-selfcheck.php`.
   - **Closed unauthenticated private CPT REST data leaks across 6 plugins:** set `'show_in_rest' => false` on private CPTs (`gratis_contact`, `gratis_invoice`, `gratis_message`, `gratis_activity`, `gratis_project`, `gratis_task`, `gratis_quiz`, `gratis_table`) so `/wp-json/wp/v2/<cpt>` cannot dump CRM contacts, client invoices/PII, private user DMs, or internal tasks unauthenticated; guarded with non-destructive E2E regression assertions in `tests/e2e/specs/headers.spec.ts`.
   - **Closed privilege-escalation, spam/relay, SSRF, and prefixing defects:**
     - `gratis-backup`: moved MySQL password from CLI `--password` argv to `MYSQL_PWD` env with `try/finally` cleanup, added `DatabaseBackend::parseDbHost()` (`host:port`, Unix sockets, IPv6), and guarded `function_exists('exec')` (21-assertion `restore-selfcheck.php`).
     - `gratis-builder`: added per-post `current_user_can('edit_post', $post_id)` checks + `innerContent` sync in `update_block`/`batch_update`, prefixed `gratis_listing_category`/`gratis_listing_location`, hardened directory meta auth/sanitization, and wired up `Gratis_Builder_Directory::handleSubmission()`.
     - `gratis-booking`: rate-limited `POST /book` (5/hr per visitor hash), validated published service + date/time + slot availability to block open email relay spam and double-booking, and fixed minute stepping for non-60-minute durations.
     - `gratis-events`, `gratis-commerce`, `gratis-comply`, `gratis-community`: added per-visitor/per-user rate limits, published-status checks, Stripe webhook order idempotency & meta sanitization, and recipient/message validation.
     - `gratis-invoice`: enforced `current_user_can('edit_post', $invoice_id)` on `handle_print()`.
     - `gratis-access`: closed content-restriction bypass across REST API, RSS feeds, and `the_excerpt`, hardened `_access_level` user meta with `manage_options` `auth_callback`, prefixed taxonomy to `gratis_access_level`, and guarded term seeding.
     - `gratis-crm`, `gratis-media`, `gratis-translate`: prefixed taxonomies (`gratis_contact_tag`, `gratis_media_folder`, `gratis_language`), guarded `gratis-translate` term seeding, added CSV formula-injection neutralization + PHP 8.4+ `fputcsv()` escape arg.
     - `gratis-tables`: moved shortcode JS to `wp_add_inline_script()` and passed explicit `$escape` arg to `str_getcsv()`.
     - `gratis-ai`, `gratis-automation`, `gratis-fleet`: hardened `MCPServer` input sanitization/clamping, fixed duplicate automation IDs + orphaned cron cleanup, switched outgoing webhooks to `wp_safe_remote_post()`, and added missing `ABSPATH` guard to `WorkerEndpoint`.
     - `gratis-cache` (still `needs-work`): removed `mcp-for-page-builders/v1` backdoor routes, `set_time_limit(0)`, and `sslverify=false`.
3. **All 36 Gratis GitHub repositories are PUBLIC** (including `juslintek/gratis-suite` after a full secret/history audit confirmed 0 secrets, keys, IPs, or prod credentials).
4. **Distribution ZIPs synced** across `/Volumes/Projects/gratis/dist/`, `/Volumes/Projects/gratis/site/downloads/`, and live `https://gratis.superglobalsdevelopment.com/downloads/`.

## 1-command queue automation (`tools/wporg-submit.mjs`)

The reusable queue script uses the already signed-in `playwright-cli -s=directadmin` Chrome session and reads/updates `gratis-suite/docs/wporg-queue.json`:

```sh
# Check live WordPress.org slot state, active submission, and next eligible plugin
# (auto-attaches via IPv4 ws://127.0.0.1:<port><path> from Chrome's DevToolsActivePort)
node gratis-suite/tools/wporg-submit.mjs --status

# Dry-run the next queued production-ready plugin (verifies ZIP + live form/lock without submitting)
node gratis-suite/tools/wporg-submit.mjs --submit-next --dry-run

# Upload a refreshed ZIP for an active awaiting-review submission
node gratis-suite/tools/wporg-submit.mjs --update-active --slug=gratis-seo --comment="Summary of changes"

# Submit the next queued production-ready plugin once WordPress.org unlocks the slot
node gratis-suite/tools/wporg-submit.mjs --submit-next

# Run the local unit + Playwright fixture self-check for wporg-submit.mjs
node gratis-suite/tools/test-wporg-submit.mjs
```

Safety guarantees built into `wporg-submit.mjs`:
- Refuses to submit any plugin classified as `needs-work` or already `awaiting-review`/`approved`.
- Verifies ZIP existence, size (< 10 MB), and `PK\x03\x04` header before touching the browser.
- Stops cleanly (exit 2 or 3) without bypassing anything if WordPress.org's 1-pending-plugin lock, login screen, 2FA prompt, CAPTCHA challenge, detached Chrome session, or unexpected page state is detected.
- Rejects false-positive upload confirmations when error notices are present, and updates `gratis-suite/docs/wporg-queue.json` only after cleanly confirming `"Results of Automated Plugin Scanning: Pass"`.

## Theme upload automation & wizard (`tools/wporg-theme-upload.mjs`, `tools/upload-theme-wporg-wizard.sh`)

```sh
# Check ZIP integrity (PK\x03\x04, <10 MB, top-level gratis/ directory) + Chrome session
node gratis-suite/tools/wporg-theme-upload.mjs --status

# Dry-run or upload gratis-theme-1.0.2.zip using authenticated Chrome CDP session
node gratis-suite/tools/wporg-theme-upload.mjs --upload --dry-run

# Interactive browser walkthrough for Ticket #301616 when manual login/2FA is needed
bash gratis-suite/tools/upload-theme-wporg-wizard.sh
```

## Honest 33-plugin classification

### Production-ready for WordPress.org (27 plugins)

| Priority | Slug | Version | PCP (E/W) | Queue Status | Notes |
|---:|---|---|---|---|---|
| 1 | `gratis-seo` | 1.0.0 | 0 / 0 | `awaiting-review` | Active submission (`plugin_id=413649`); refreshed ZIP ready for `--update-active` |
| 2 | `gratis-backup` | 1.0.0 | 0 / 0 | `queued` | Stream-first backup/restore, `MYSQL_PWD`, `parseDbHost`, 21 self-checks |
| 3 | `gratis-mail` | 1.0.0 | 0 / 0 | `queued` | Encrypted SMTP credentials, test tool, delivery log |
| 4 | `gratis-social` | 1.0.0 | 0 / 0 | `queued` | Zero-tracking share buttons, no third-party JS SDK |
| 5 | `gratis-reviews` | 1.0.0 | 0 / 0 | `queued` | Accessible ratings, testimonials, AggregateRating schema |
| 6 | `gratis-analytics` | 1.0.0 | 0 / 0 | `queued` | Cookie-free analytics, salted hashes, `%i` SQL escaping |
| 7 | `gratis-comply` | 1.0.0 | 0 / 0 | `queued` | Consent banner, Consent Mode v2, rate-limited `/consent` & `/data-request` |
| 8 | `gratis-forms` | 1.0.0 | 0 / 0 | `queued` | Form builder, submissions table, `%i` SQL, reCAPTCHA disclosed |
| 9 | `gratis-popup` | 1.0.0 | 0 / 0 | `queued` | Accessible modal/slide-in popups, clean block/shortcode render |
| 10 | `gratis-cdn` | 1.0.0 | 0 / 0 | `queued` | Asset rewriting, fingerprinting, CDN purge APIs disclosed |
| 11 | `gratis-commerce` | 1.0.0 | 0 / 0 | `queued` | Stripe Checkout (rate-limited, idempotent HMAC webhook) + WooCommerce modules |
| 12 | `gratis-crm` | 1.0.0 | 0 / 0 | `queued` | Contacts (`show_in_rest=false`, `gratis_contact_tag`), broadcasts, safe CSV |
| 13 | `gratis-booking` | 1.0.0 | 0 / 0 | `queued` | Services, appointments, rate-limited & slot-validated REST booking |
| 14 | `gratis-tables` | 1.0.0 | 0 / 0 | `queued` | CSV-backed sortable/searchable tables (`wp_add_inline_script`, `show_in_rest=false`) |
| 15 | `gratis-invoice` | 1.0.0 | 0 / 0 | `queued` | Line-item invoices (`show_in_rest=false`), `edit_post`-gated print view |
| 16 | `gratis-learn` | 1.0.0 | 0 / 0 | `queued` | Courses, lessons, private quizzes (`show_in_rest=false`), progress REST |
| 17 | `gratis-automation` | 1.0.0 | 0 / 0 | `queued` | Trigger-to-action engine, monotonic IDs, cron cleanup, `wp_safe_remote_post` |
| 18 | `gratis-affiliate` | 1.0.0 | 0 / 0 | `queued` | Referral links, hardened cookie, commissions, payouts |
| 19 | `gratis-community` | 1.0.0 | 0 / 0 | `queued` | Profiles, activity feed, groups, private rate-limited DMs (`show_in_rest=false`) |
| 20 | `gratis-events` | 1.0.0 | 0 / 0 | `queued` | Events, recurrence, published-only rate-limited RSVP, iCal export |
| 21 | `gratis-media` | 1.0.0 | 0 / 0 | `queued` | Media library folders (`gratis_media_folder`), auto-organize, gallery shortcode |
| 22 | `gratis-builder` | 1.0.0 | 0 / 0 | `queued` | Pattern library, `edit_post`-gated block REST API, working directory submissions |
| 23 | `gratis-access` | 1.0.0 | 0 / 0 | `queued` | Tiered content restriction across views/excerpts/feeds/REST (`gratis_access_level`) |
| 24 | `gratis-project` | 1.0.0 | 0 / 0 | `queued` | Projects & tasks (`show_in_rest=false`), Kanban board shortcode |
| 25 | `gratis-translate` | 1.0.0 | 0 / 0 | `queued` | `gratis_language` taxonomy (no Polylang clash), accessible switcher, hreflang |
| 26 | `gratis-fleet` | 1.0.0 | 0 / 0 | `queued` | Multi-site dashboard, hardened WebhookHub (`wp_safe_remote_post`), TLS verified |
| 27 | `gratis-ai` | 2.0.0 | 0 / 4 | `queued` | BYOM AI router, hardened MCP server, Abilities API (4 WP 7.0 AI advisories) |

### Needs work before WordPress.org submission (6 plugins — held out of queue)

| Slug | Version | PCP (E/W) | Why held back |
|---|---|---|---|
| `gratis-security` | 2.0.0 | 0 / 0 | 7 admin/FIM files contain Lithuanian source strings (636 Lithuanian diacritic chars) instead of `en_US` strings required for WordPress.org GlotPress, plus 15+ `@shell_exec()` OS probes requiring review/gating. |
| `gratis-cache` | 3.0.0 | 0 / 6 | Needs full `vlt_*` -> `gratis_cache_*` prefix migration across 40+ options, `vlt-cache/v1` REST, and `vlt_async_worker` AJAX, English source strings across 17 admin files, plus review of `SAVEQUERIES`/`DISABLE_WP_CRON` defines. |
| `gratis-db` | 1.0.0 | 0 / 1 | `DropinManager` writes/removes `wp-content/db.php` on disk and `SlowQueryLog` defines `SAVEQUERIES` at runtime. |
| `gratis-devtools` | 1.0.0 | 0 / 1 | `MigrationManager` writes and `require`s PHP files under `wp-content/gratis-migrations/`; `DebugBar` defines `SAVEQUERIES`. |
| `gratis-notify` | 1.0.0 | 0 / 0 | Thin stub (`PushNotifier.php`, 98 LOC): no real VAPID/Service Worker Web Push, front-end never polls `/latest` or renders notifications, unbounded subscriber option array. |
| `gratis-installer` | 1.0.0 | 0 / 0 | Internal suite activator listing 32 hardcoded `juslintek/gratis-*` plugins already on disk — unsuitable for the general WordPress.org Plugin Directory (Guidelines 1 & 10). |

## Post-approval SVN release checklist (per plugin)

Once WordPress.org approves a plugin and provisions its SVN repository:
1. Upload `{plugin}/.wordpress-org/*` (`banner-772x250.png`, `banner-1544x500.png`, `icon-128x128.png`, `icon-256x256.png`, `screenshot-*.png`) to SVN `assets/`.
2. Commit the clean plugin code (matching `dist/{slug}-{version}.zip`) to SVN `trunk/` and tag `tags/{version}/`.
3. Mark the plugin `"status": "approved"` in `gratis-suite/docs/wporg-queue.json` and run `node gratis-suite/tools/wporg-submit.mjs --submit-next`.

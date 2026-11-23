# STATUS — Gratis suite (updated 2026-11-23)

One board for what was planned, what is done, and what remains before production cutover.

## Quick state
- **Lint/PHPCS (`./gratis-suite/tools/verify.sh --all` + `composer phpcs`):** **34/34 repos `ALL CLEAN` (exit 0)** and **`composer phpcs` exit 0** (0 errors, 0 warnings across all scanned PHP files including `gratis-docs` and `tests/`).
- **PHP 8.5 & 8.6 FrankenPHP + upgraded Docker/CI/deploy builds:**
  - `gratis-suite/Dockerfile.franken` (and prod `/opt/gratis/build/Dockerfile`) now support `--build-arg PHP_VERSION=8.5` (PHP **8.5.13**) and `--build-arg PHP_VERSION=8.6` (PHP **8.6.0**, default), with `expose_php=Off`, latest WP-CLI 2.12.0, WordPress 7.1.5, and `sqlite-database-integration` 3.1.3.
  - Upgraded older Docker/CI/deploy PHP builds: `gratis-suite/Dockerfile` (`wordpress:7-php8.5-apache`, PIE `phpredis` + `simdjson_plus` verified), `gratis-suite/Dockerfile.cli` (`wordpress:cli-php8.5`, `redis` verified), `gratis-cache/.github/workflows/ci.yml` (PHP 8.1-8.6, 6/6 green on GitHub Actions PR #5), root `.github/workflows/ci.yml` & `release.yml`, and `deploy/` defaults (PHP 8.5, guarded `opcache` package for PHP 8.5+).
  - 402/402 PHP files passed `php -l` under PHP 8.6.0; local parity runs passed on both PHP 8.5.13 and PHP 8.6.0 (dry-run against prod DB copy on PHP 8.6.0: **33 passed, 0 failed**, all wp-admin cache/security pages HTTP 200, 0 WP/plugin entries in `debug.log`).
- **Production cutover (`https://gratis.superglobalsdevelopment.com`, `linas-vps`) — COMPLETED 2026-11-23:**
  - All 34 plugin/theme repos committed, merged via GitHub PRs to `main` (including `juslintek/cache-manager#5`), and clean (`suite.sh status` 34/34 on `main`, 0 dirty).
  - Pre-cutover SQLite backup created via `SQLite3::backup()` at `/opt/gratis/backups/ht.sqlite.predeploy-20261123-212705` (1.4M, `PRAGMA integrity_check = ok`), rollback image tagged `gratis-franken:pre-upgrade-20261123`.
  - Synced all 33 plugins + `gratis-docs` + `gratis-theme` to `/opt/gratis/`, upgraded `gratis-franken` container to PHP **8.6.0** (with `gratis-franken:php8.5` also built on host), updated front page post ID 5 from `patterns/landing-product.php` with template `landing`, flushed cache & rewrites.
  - Post-cutover SQLite integrity verified (`PRAGMA integrity_check = ok`; `wp_posts` 126->127 [+1 revision], `wp_postmeta` 307->308 [+1 template meta], `wp_options` 167->168, `wp_users`=2, `wp_terms`=27, `wp_term_taxonomy`=27, `wp_term_relationships`=45).
  - **Live non-destructive Playwright E2E (`BASE_URL=https://gratis.superglobalsdevelopment.com npx playwright test`):** **33 passed, 0 failed** (5 skipped).
  - Live HTTP verification: `HTTP 200`, `Cache-Control: public, max-age=3600`, HSTS + `nosniff` + `SAMEORIGIN`, no `X-Powered-By`, single meta description & OG tags, `id="plugins"` & `id="compare"`, REST patterns `200`, `/docs/` `200`, `seed-docs.php` & `update_docs.php` `403`.
- **Root PHPUnit + Smoke (`composer phpunit` / `composer test:smoke`):** **9/9 tests, 5,786 assertions PASS** (`test:smoke`: **5/5 tests, 5,775 assertions PASS**).
- **Theme validator (`php gratis-theme/tests/validate-theme.php`):** **30/30 PASS**.
- **Security self-checks (`gratis-security/tests/check-*.php`):** **4/4 suites PASS**.
- **Static landing page + ZIPs (`site/` + `site/downloads/`):** Built locally (35 pages + 34 ZIPs). No static hosting target (`gratis.dev` DNS, nginx vhost, GitHub Pages, or Cloudflare Pages config) is configured yet.

## Completed work (2026-11-23)
### Round 3 — Production cutover & PHP 8.5 / 8.6 upgrades (2026-11-23)
- Parameterized `Dockerfile.franken` and prod `/opt/gratis/build/Dockerfile` with `ARG PHP_VERSION=8.6` supporting both PHP 8.5 (`8.5.13`) and PHP 8.6 (`8.6.0`), upgraded `Dockerfile` (`wordpress:7-php8.5-apache`), `Dockerfile.cli` (`wordpress:cli-php8.5`), CI matrices/jobs (`8.1`-`8.6`, single-version jobs `8.5`), and `deploy/` defaults (`8.5`).
- Merged all 34 plugin/theme repos to `main` via PRs over SSH (including `juslintek/cache-manager#5` with 6/6 PHP 8.1-8.6 GitHub Actions passing).
- Backed up prod SQLite DB, synced 34 plugins + `gratis-theme` to `linas-vps`, upgraded live `gratis-franken` to PHP 8.6.0, updated live homepage post ID 5 to `landing-product.php` with template `landing`, verified SQLite integrity/row counts, and passed live non-destructive prod Playwright E2E (33 passed, 0 failed).

### Round 2 hardening, parity verification & landing polish (2026-11-23)
- **`gratis-cache` (merged via PR #5 to `main`):**
  - Cleared all 269 PHPCS errors and 338 warnings across all files (including `unserialize(..., ['allowed_classes' => false])` on admin cache previews, replacing deprecated PHP 8.5 `imagedestroy()`, `wp_json_encode()`, `wp_parse_url()`, `gmdate()`, escaping admin HTML with `wp_kses()` allowlists, and narrow per-line `phpcs:ignore` annotations only for genuinely low-level OS/filesystem probes).
  - Fixed three PHP 8.5 / FrankenPHP fatal `DivisionByZeroError` crashes discovered when loading live admin pages (`DashboardPage.php`, `OpcacheExplorerPage.php`, `GCAnalyzer.php`), `NAN`-to-string warning in `OpcacheExplorerPage.php`, `/proc/stat` `array_sum()` string warning in `DashboardPage.php`, and undefined `stdClass::$publish` warning in `DashboardWidget.php`.
  - Restored PHP object round-tripping (`stdClass`, `WP_Post`, etc.) and fixed SQLite `LIKE ... ESCAPE '\'` prefix scanning in `SqliteWalStore.php`.
  - Made `DatabaseOptimizer::cleanTransients()` work cleanly on both SQLite and MySQL (chunked `DELETE ... WHERE option_name IN (...)` instead of MySQL-only multi-table `DELETE a, b`).
- **`gratis-security`:** Resolved all 660 remaining PHPCS warnings (without modifying `phpcs.xml.dist`), fixed WordPress 6.7+/7.0 `_load_textdomain_just_in_time` early notice in `gratis-security.php` (`cron_schedules`), and switched `ajax_signatures_save_feeds()` URL sanitization from `sanitize_text_field()` to `esc_url_raw()` so percent-encoded URLs are preserved. All 4 `check-*.php` test suites pass.
- **`gratis-seo`:** Integrated per-post/search/404 robots directives with WordPress core's `wp_robots` filter (`MetaTags::filter_robots()`) so pages emit a single canonical `<meta name="robots">` tag without duplicating or contradicting core robots output.
- **`gratis-docs`:** Made `ABSPATH` derivation portable (`dirname(__DIR__, 3)`) in `seed-docs.php` and `update_docs.php` for FrankenPHP parity and annotated CLI `fwrite(STDOUT, ...)` calls so `composer phpcs` exits 0.
- **`gratis-theme`:**
  - Updated `style.css` `Theme URI` and `Author URI` from `https://seo-seo.lt` to `https://github.com/juslintek/gratis-theme` and `https://github.com/juslintek`.
  - Replaced hardcoded `"ref":9` navigation post ID in `parts/header.html` with portable root-relative `wp:navigation-link` blocks (`/#plugins`, `/#compare`, `/docs/`, GitHub), added matching `id="plugins"` and `id="compare"` anchors in `patterns/landing-product.php` plus `[id]{scroll-margin-top:80px}` in `functions.php`, and verified live on fresh WordPress install + Site Editor.
  - Scoped `wp_robots` filter in `functions.php` strictly to accidental WooCommerce `wc_page_no_robots` `noindex` on front page while preserving `blog_public=0`, `_gratis_seo_noindex`, `_gratis_seo_nofollow`, and WooCommerce cart/checkout/account/endpoint pages.
  - Source-grounded the hero CLI terminal snippet in `patterns/landing-product.php` against real `wp gratis-cache status` and `wp gratis-security audit` output, unified hero outline button styling, and fixed Gutenberg block serialization in `patterns/landing-product.php`, `parts/header.html`, and `parts/footer.html` so Block Editor & Site Editor validate with 0 errors.
- **Static site (`bin/build-site.php` -> `site/` + `site/downloads/`):** Source-grounded hero CLI block, added CSS-only 57px collapsible mobile sticky header with `scroll-margin-top` and Escape/link-click close across all 35 pages, balanced mobile `.hero-actions` grid, cleaned `Free starter stacks` heading, fixed stretched bundle tags, fixed CTA WP-CLI install command to target plugin ZIPs only, fixed `.cta .btn.btn-outline` contrast, and fixed `**Bold:**` markdown rendering in plugin docs. Rebuilt `site/` and all 34 ZIPs.

### Round 1 core fixes (2026-11-23)
- **`gratis-seo`**, **`gratis-builder`**, **`gratis-theme`**, **`gratis-security`**, **`gratis-docs`**, **`bin/build-site.php`**, **`bin/build-zips.sh`**, **`tests/Suite/SuiteSmokeTest.php`**, **`gratis-suite/docker-compose.yml`**.

## Remaining optional follow-up
- Configure a static hosting target (e.g. Cloudflare Pages, GitHub Pages, or nginx vhost + DNS for `gratis.dev`) if publishing the static `site/` bundle separately from `gratis.superglobalsdevelopment.com`.

## Reproduce locally
```sh
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
./gratis-suite/tools/verify.sh --all
composer phpcs
composer phpunit
composer test:smoke
php gratis-theme/tests/validate-theme.php
for t in gratis-security/tests/check-*.php; do php "$t"; done
php bin/build-site.php && OUTPUT_DIR=site/downloads bash bin/build-zips.sh
```

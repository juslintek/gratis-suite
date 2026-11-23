# STATUS — Gratis suite (updated 2026-11-23)

One board for what was planned, what is done, and what remains before production cutover.

## Quick state
- **Lint/PHPCS (`./gratis-suite/tools/verify.sh --all` + `composer phpcs`):** **34/34 repos `ALL CLEAN` (exit 0)** and **`composer phpcs` exit 0** (0 errors, 0 warnings across all scanned PHP files including `gratis-docs` and `tests/`).
- **PHP 8.5 & 8.6 FrankenPHP + upgraded Docker/CI/deploy builds:**
  - `gratis-suite/Dockerfile.franken` is now multi-stage (`sqlite` default on `/app/public` with PHP **8.6.0** default, plus `perf` stage on `/app` with `mysqli` + `pdo_mysql` + `redis` on PHP **8.5.13** and `mysqli` + `pdo_mysql` on PHP **8.6.0** for `docker-compose.perf.yml`), with OPcache JIT `1255`, `expose_php=Off`, WP-CLI 2.12.0, WordPress 7.1.5, and `sqlite-database-integration` 3.1.3. All 4 stage×version images (`sqlite`/`perf` × `8.5`/`8.6`) were built and verified.
  - Hardened `gratis-suite/Caddyfile` and production `/opt/gratis/build/Caddyfile` using mutually-exclusive `handle` blocks to return `403` for `/wp-content/database/*`, dotfiles (except `/.well-known/*`), `/wp-content/debug.log`, `/wp-config*.php`, `/xmlrpc.php`, `/wp-content/uploads/*.php`, and `.sqlite`/`.db`/`.env`/`.bak`/`.log` extensions.
  - Fixed `gratis-suite/setup.sh` to invoke WP-CLI inside the FrankenPHP `wordpress` container (`docker compose exec -T wordpress wp --allow-root`), accept `200`/`301`/`302` readiness responses with a 60s timeout, and respect `PORT` (verified fresh + idempotent re-run live).
  - Upgraded older Docker/CI/deploy/runtime PHP builds: `gratis-suite/Dockerfile` (`wordpress:7-php8.5-apache`, PIE `phpredis` + `simdjson_plus`), `gratis-suite/Dockerfile.cli` (`wordpress:cli-php8.5`, `redis`), `gratis-suite/rawenv.toml` (`php = "8.5"`), root `rawenv.toml` (`frankenphp = "8.6"`), `gratis-cache/.github/workflows/ci.yml` (PHP 8.1-8.6, 6/6 green on GitHub Actions PR #5), root `.github/workflows/ci.yml` & `release.yml`, and `deploy/` defaults (`8.5` default + verified in a real `ubuntu:24.04` container with `ppa:ondrej/php` for both PHP `8.5.13` and `8.6.0`, cleanly skipping unpackaged `php8.6-redis`/`php8.6-imagick` and adjusting FPM session handler).
  - 402/402 PHP files passed `php -l` under PHP 8.6.0; `composer phpunit` (9/9, 5,786 assertions) and `composer phpcs` (404/404, 0 errors/warnings) also pass under PHP 8.6.0.
- **Production cutover (`https://gratis.superglobalsdevelopment.com`, `linas-vps`) — COMPLETED 2026-11-23:**
  - All 34 plugin/theme repos committed, merged via GitHub PRs to `main` (including `juslintek/cache-manager#5`), and clean (`suite.sh status` 34/34 on `main`, 0 dirty).
  - Pre-cutover SQLite backups created via `SQLite3::backup()` at `/opt/gratis/backups/ht.sqlite.predeploy-20261123-212705` and `/opt/gratis/backups/ht.sqlite.pre-harden-20261123` (1.4M, `PRAGMA integrity_check = ok`), rollback image tagged `gratis-franken:pre-upgrade-20261123`.
  - Synced all 33 plugins + `gratis-docs` + `gratis-theme` to `/opt/gratis/`, removed stale non-plugin `/opt/gratis/plugins/gratis-suite/` (backed up to `/opt/gratis/backups/gratis-suite-stale-dir-20261123.tar.gz`) and 799 macOS `._*` AppleDouble files, normalized ownership to `root:root`, upgraded `gratis-franken` container to PHP **8.6.0** with hardened `Caddyfile` (with `gratis-franken:php8.5` also built on host), updated front page post ID 5 from `patterns/landing-product.php` with template `landing`, flushed cache & rewrites.
  - Post-cutover SQLite integrity verified (`PRAGMA integrity_check = ok`; `wp_posts=127`, `wp_postmeta=308`, `wp_options=167`, `wp_users=2`, `wp_terms=27`, `wp_term_taxonomy=27`, `wp_term_relationships=45`).
  - **Live non-destructive Playwright E2E (`BASE_URL=https://gratis.superglobalsdevelopment.com npx playwright test`):** **34 passed, 0 failed** (5 skipped), including the new SQLite/dotfile/config HTTP-blocking security test.
  - Live HTTP verification: `HTTP 200` on `/`, `/docs/`, `/docs/gratis-ai/`, `/reviews/`, REST patterns, `/robots.txt`, `/wp-login.php`; `Cache-Control: public, max-age=3600`, HSTS + `nosniff` + `SAMEORIGIN`, no `X-Powered-By`, single meta description & OG tags, `id="plugins"` & `id="compare"`; `HTTP 403` on `/wp-content/database/*` (including live `.ht.sqlite` path, `.htaccess`, `db-path.php`), `/wp-content/debug.log`, `/wp-config.php`, `/xmlrpc.php`, `/wp-content/uploads/*.php`, `seed-docs.php`, and `update_docs.php`.
- **Root PHPUnit + Smoke (`composer phpunit` / `composer test:smoke`):** **9/9 tests, 5,786 assertions PASS** (`test:smoke`: **5/5 tests, 5,775 assertions PASS**).
- **Theme validator (`php gratis-theme/tests/validate-theme.php`):** **30/30 PASS**.
- **Security self-checks (`gratis-security/tests/check-*.php`):** **4/4 suites PASS**.
- **Static landing page + ZIPs (`site/` + `site/downloads/`):** Built locally (35 pages + 34 ZIPs). No static hosting target (`gratis.dev` DNS, nginx vhost, GitHub Pages, or Cloudflare Pages config) is configured yet.

## Completed work (2026-11-23)
### Round 3 — Production cutover, security hardening & PHP 8.5 / 8.6 upgrades (2026-11-23)
- Parameterized `Dockerfile.franken` (multi-stage `sqlite` default + `perf` target) and prod `/opt/gratis/build/Dockerfile` with `ARG PHP_VERSION=8.6` supporting both PHP 8.5 (`8.5.13`) and PHP 8.6 (`8.6.0`), upgraded `Dockerfile` (`wordpress:7-php8.5-apache`), `Dockerfile.cli` (`wordpress:cli-php8.5`), `rawenv.toml` files, CI matrices/jobs (`8.1`-`8.6`, single-version jobs `8.5`), and `deploy/` defaults (`8.5` default + `8.6` verified on Ubuntu 24.04).
- Hardened FrankenPHP `Caddyfile` (local + prod) so `/wp-content/database/*`, dotfiles, debug logs, config files, `xmlrpc.php`, and `/wp-content/uploads/*.php` return `403`, cleaned stale `/opt/gratis/plugins/gratis-suite/` and 799 `._*` AppleDouble files on `linas-vps`, fixed `gratis-suite/setup.sh`, and added E2E security regression assertions in `tests/e2e/specs/headers.spec.ts`.
- Merged all 34 plugin/theme repos to `main` via PRs over SSH (including `juslintek/cache-manager#5` with 6/6 PHP 8.1-8.6 GitHub Actions passing), backed up prod SQLite DB, synced 34 plugins + `gratis-theme` to `linas-vps`, upgraded live `gratis-franken` to PHP 8.6.0, updated live homepage post ID 5 to `landing-product.php` with template `landing`, verified SQLite integrity/row counts, and passed live non-destructive prod Playwright E2E (34 passed, 0 failed).

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

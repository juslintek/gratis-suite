# Gratis Suite — Competitive Comparison Checklist

> For every plugin: the direct competitor's **free vs paid** split, **how they implement it**, **what Gratis actually ships today (verified from source)**, the **paid-only gaps** we don't yet match, and concrete ways to make it **better / simpler / more advanced — for free**.

**Legend:** ✓ implemented · ◐ partial · ✗ not yet present
**Scope:** ~32 plugins. The "Gratis now" rows are grounded in the actual plugin source — not marketing claims. Where a header/readme advertises a feature the code does not implement, it is flagged.
**Companion docs:** `FEATURES.md` (high-level matrix) · `MONETIZATION_RESEARCH.md` (competitor pricing + strategy).
**Generated:** 2026-06-17.

## Groups
1. Performance, Security & Infrastructure — security, cache, cdn, backup, mail, db, devtools
2. SEO, Marketing & Conversion — seo, social, popup, forms, analytics, reviews
3. Commerce & Business — commerce, invoice, booking, crm, affiliate, comply
4. Content, Community & Multilingual — learn, access, community, events, tables, translate
5. Platform, Productivity & Builder — ai, automation, media, notify, project, builder, docs

# 1. Performance, Security & Infrastructure

# Gratis Suite — Competitive Comparison (Security / Performance / Infra)

> Grounded in the actual plugin source under `/Volumes/Projects/gratis/`. Competitor
> free/paid splits and prices are from general knowledge and shift year to year — treat
> exact figures as approximate; uncertainty is noted inline.

---

## gratis-security — vs Wordfence ($119/yr)

**What it does:** A web-application firewall, login rate-limiting, hardening response headers, core file-integrity monitoring, a pattern-based malware scanner, and TOTP scaffolding — all from one settings page, no upsell.

**Competitor — free vs paid:** Wordfence Free ships the WAF, the malware scanner, login security, and 2FA, but the firewall rules + malware signatures + IP blocklist are **delayed 30 days**; real-time rule/signature feeds, country blocking, scheduled scans and spam checks are Premium (~$119/yr; Care/Response tiers run far higher). Headline feature: a PHP WAF that can run *before* WordPress loads via `auto_prepend_file`, scoring requests against a cloud-updated signature/rule set and a shared threat-intelligence IP feed.

**Gratis now (from source):**
- ✓ WAF blocking SQLi, XSS, and path-traversal via regex, plus XML-RPC and `wp-config.php` access blocks, hooked on `init` priority -9999 (`WAF.php`)
- ✓ Per-IP login lockout using transients with configurable max-tries + lockout window (`LoginProtection.php`)
- ✓ Security headers: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, X-XSS-Protection, Permissions-Policy, optional CSP, HSTS when on SSL (`Headers.php`)
- ✓ File-integrity baseline (MD5 of every PHP file under `wp-admin/`+`wp-includes/`) with changed/missing report in admin (`FileIntegrity.php`)
- ✓ WAF block log (last 1000, capped) shown in admin + `wp gratis-security blocks`
- ◐ Malware scanner — works but is **WP-CLI-only** (`wp gratis-security scan`), 9 hard-coded patterns, no schedule, no admin UI (`MalwareScanner.php`)
- ◐ TOTP 2FA — secret generation/verification/base32 are implemented and a CLI setup exists, but enforcement is a **stub** (`checkRequired()` never redirects) and it reads option `gratis_security_2fa_enabled` while Settings writes `twofa_enabled` — so 2FA does not actually gate login yet (`TwoFactor.php`)
- ✗ No real-time/cloud rule or signature updates, no shared IP blocklist, no country blocking, no scheduled scans

**Gaps (their paid-only we don't match yet):**
- Real-time threat-intelligence feed (cloud-updated rules + malicious-IP blocklist)
- True pre-WordPress WAF execution (`auto_prepend_file` / `.user.ini`)
- Scheduled, signature-based malware scanning with email alerts
- Country/ASN blocking and live traffic view
- A genuinely enforced 2FA login flow

**Make it better / simpler / advanced — for free:**
1. *Simpler:* Finish the 2FA flow — align the option key, add a `wp-login.php` interstitial + QR/`otpauth://` URI on the user profile so admins can self-enroll without WP-CLI. The crypto is already done; only the wiring is missing.
2. *Simpler:* Add a one-click "harden now" preset (sensible CSP starter, disable XML-RPC, enable integrity baseline) so a non-expert gets a strong default in one button.
3. *Advanced:* Schedule the malware + integrity scan via WP-Cron with an admin-email digest, and crowd-source a free community signature/IP list shipped as a versioned JSON in the repo (updates without a paid feed).
4. *Advanced:* Persist the block log and lockouts to a real table (or the suite's SQLite WAL store) so high-traffic sites don't thrash a single autoloaded option, and add an optional `auth_prepend` bootstrap for pre-WP filtering.

---

## gratis-cache — vs WP Rocket ($59/yr)

**What it does:** Full-stack cache management (v3.0.0) that auto-detects the best object-cache backend, generates an object-cache drop-in, does full-page HTML caching, asset minification/critical-CSS/lazy-load, image optimization, server-cache purging (Nginx/OPcache/Redis/LiteSpeed), Cloudflare tracking, and per-request profiling with an Excimer tracer.

**Competitor — free vs paid:** WP Rocket has **no free tier** — it's premium-only (~$59/yr single site). It bundles page caching, GZIP/browser cache, lazy load, minify/combine, defer + delay JS, Remove Unused CSS, automatic critical CSS, DB optimization, CDN/Cloudflare add-ons, and heartbeat control. Headline feature: turnkey page caching plus *automatic* critical-CSS and Remove-Unused-CSS generation through WP Rocket's cloud service. (NitroPack = freemium cloud all-in-one; Perfmatters ~$25/yr is a script-manager/toggles add-on, not a cache.)

**Gratis now (from source):**
- ✓ Auto backend detection — Redis, Memcached, APCu, SQLite WAL, LMDB, file (`ServerDetector`, readme)
- ✓ Object-cache.php drop-in generator + installer (`Cache/DropinGenerator`, `DropinInstaller`)
- ✓ Full-page HTML cache (`Cache/PageCache::register`)
- ✓ Asset minification, critical CSS, resource hints, heartbeat control, lazy load, redirect manager (`Performance/*::register`)
- ✓ Image optimization with libvips/AVIF/WebP detection + conflicting-optimizer warnings (`Image/ImageOptimizer`)
- ✓ Multi-layer purge strategies: Nginx FastCGI, OPcache, Redis, Elementor, LiteSpeed (`Purge/Strategy/*`), plus admin-bar quick-purge and file-change auto-purge after deploys
- ✓ Database optimizer (`Performance/DatabaseOptimizer`)
- ✓ Cloudflare request tracking (CF-Ray logging, dedicated CF page) and native LiteSpeed cache-control headers
- ✓ Request tracer with Excimer sampling + JSONL audit logs with rotation (`Tracer/*`, `Log/Logger`)
- ✓ Async queue worker + WP-Cron→Redis offload + cron monitor (`Async/*`)
- ✓ WP-CLI: `status`, `purge`, `purge-url`, `debug-url`, `scan-files`, `history`, `bench`
- ◐ CDN: doesn't push to a CDN itself but bridges `gratis_cache_purge_all` to the sibling gratis-cdn plugin
- ✗ No Remove-Unused-CSS, no JS delay-until-interaction, no automatic cloud critical-CSS generation

**Gaps (their paid-only we don't match yet):**
- Remove Unused CSS (per-page CSS stripping) and "delay JavaScript execution until interaction"
- Automatic cloud-generated critical CSS per template (theirs is hands-off)
- Combine-and-defer JS with a polished, guided UI
- Self-host third-party scripts (Google Fonts/Analytics) toggle like Perfmatters

**Make it better / simpler / advanced — for free:**
1. *Simpler:* The plugin is feature-dense with a Lithuanian-labeled dashboard widget and many sub-pages — add a single "Recommended setup" wizard that enables page cache + object cache + minify with safe defaults and a measured before/after score, so users aren't lost among 10 menu items.
2. *Simpler:* Normalize the admin UX to one language (i18n strings exist; some hard-coded `Podėlio Valdymas` / notices are Lithuanian) for a clean .org release.
3. *Advanced:* Add local Remove-Unused-CSS (the tracer already records per-request data — reuse it to compute used selectors per template) and a "delay JS until interaction" wrapper — both are doable client-side with zero cloud dependency, directly closing WP Rocket's headline gap.
4. *Advanced:* Ship a self-hosted-fonts/third-party-script optimizer to neutralize the Perfmatters value-add for free.

---

## gratis-cdn — vs BunnyCDN / Cloudflare APO / generic CDN plugins ($10–50/mo)

**What it does:** Rewrites static-asset and upload URLs to a CDN host, adds content-hash cache-busting and preconnect hints, and provides one-click + REST + WP-CLI purge for Cloudflare, BunnyCDN, KeyCDN, or a generic webhook.

**Competitor — free vs paid:** BunnyCDN is a usage-priced edge network (~$0.01–0.06/GB) configured via its free WP plugin; Cloudflare APO is a **$5/mo** add-on that caches full HTML pages at the edge; "generic CDN plugins" (CDN Enabler, W3TC's CDN module) are free URL-rewriters. Headline feature: serving assets (and, for APO, whole HTML pages) from a global edge with automatic origin-pull and edge purge. Note: the bandwidth/edge network is the paid product — the WordPress plugins are mostly free connectors.

**Gratis now (from source):**
- ✓ Rewrites `style_loader_src`, `script_loader_src`, attachment URLs, and upload URLs in content to the CDN domain (`AssetRewriter`)
- ✓ Content-hash fingerprinting (`?v=<md5>`) on CSS/JS for cache busting (`AssetRewriter::fingerprint`)
- ✓ `preconnect` + `dns-prefetch` hints for the CDN host
- ✓ One-click "purge everything" for Cloudflare / BunnyCDN / KeyCDN / webhook, with masked credential storage (`PurgeManager`, `Settings`)
- ✓ Authenticated REST purge endpoint (`X-CDN-Purge-Key`, constant-time compare) + Cloudflare per-URL purge
- ✓ Bridges suite-wide `gratis_cache_purge_all` so clearing the page cache also flushes the edge
- ✓ WP-CLI: `setup`, `stats`, `purge`, `disable`
- ✗ No edge network of its own, no full-HTML edge caching (APO equivalent), no on-the-fly image resizing/optimization at edge

**Gaps (their paid-only we don't match yet):**
- Edge HTML caching with cache-everything + bypass-on-cookie rules (Cloudflare APO)
- Edge image transformation/optimization (Bunny Optimizer)
- Automatic origin-pull zone provisioning from inside WP

**Make it better / simpler / advanced — for free:**
1. *Simpler:* Auto-detect the active provider from the suite (if Cloudflare is already in front of the site, prefill zone hints) and add a "test purge" button that reports the API response inline, so credential mistakes are caught immediately.
2. *Simpler:* Validate the CDN URL against the origin (HEAD a known asset through the CDN) and show a green/red reachability badge before the user trusts it.
3. *Advanced:* Generate Cloudflare APO-style page rules / cache-rules via the API directly from the plugin (free with a user's own Cloudflare account) to give edge HTML caching without the $5/mo APO add-on.
4. *Advanced:* Add per-post/per-term selective purge (the per-URL Cloudflare path already exists — extend BunnyCDN/KeyCDN to per-file purge instead of falling back to full purge).

---

## gratis-backup — vs UpdraftPlus ($70/yr)

**What it does:** A stream-first backup engine that chunks and xxh3-hashes each file (never loading a full backup into memory), with scheduled DB/uploads/full backups, retention pruning, pre-update DB snapshots, and one-click SQL download.

**Competitor — free vs paid:** UpdraftPlus Free already does scheduled backups, restore, and upload to many remotes (Dropbox, Google Drive, S3, etc.). Premium (~$70/yr, 2 sites — pricing varies) adds incremental backups, more destinations, multisite, database encryption, automatic pre-update backups, and the **Migrator** (clone/move sites). Headline feature: scheduled backups pushed to cloud storage with in-dashboard restore. (BlogVault ~$89/yr stores incremental copies off-site on its own servers with staging + migration.)

**Gratis now (from source):**
- ✓ Stream-first chunked engine with per-file xxh3 hashing + JSON manifests (`BackupEngine`)
- ✓ Sources: database (via `mysqldump`), uploads, themes, plugins as directory sources (`Source/*`)
- ✓ Scheduled backups — hourly / twicedaily / daily / weekly via WP-Cron, reschedules on change (`ScheduledBackup`)
- ✓ Retention: keep last N, auto-prune older manifests (`ScheduledBackup::rotate`)
- ✓ Pre-update DB snapshot before plugin/theme updates (`PreUpdateSnapshot`)
- ✓ One-click DB download (path-traversal-guarded SQL stream) + backup list in admin (`Settings`)
- ✓ WP-CLI: `run`, `list`, `status`
- ✗ **No restore/import** anywhere — download only (no restore command, no UI restore)
- ✗ **Local filesystem destination only** — no Dropbox/Drive/S3/remote (`Destination/LocalFilesystem` is the sole destination)
- ✗ No incremental backups, no migration/clone, no encryption of the stored archive
- ◐ DB backup shells out to `mysqldump`, so it is **MySQL-only** — it will not capture the suite's own SQLite database (worth flagging given the suite ships on SQLite)

**Gaps (their paid-only we don't match yet):**
- Restore from a backup (the single biggest gap — a backup you can't restore in-app is half a product)
- Off-site/cloud destinations (S3, Backblaze B2, Dropbox, Drive)
- Incremental backups and site migration/clone
- At-rest encryption of the archive

**Make it better / simpler / advanced — for free:**
1. *Simpler:* Ship a **restore** path (`wp gratis-backup restore <id>` + an admin "Restore" button) — the manifest + hashes already exist to verify integrity; this is the must-have to be credible.
2. *Simpler:* Surface a clear "what's covered" line on the settings screen (e.g. "DB engine: SQLite — DB backup requires mysqldump/MySQL") so users aren't surprised by an empty DB backup.
3. *Advanced:* Add a SQLite-aware DB source (copy the SQLite file or use `VACUUM INTO`) so the suite can back up its own default stack; abstract a `BackupSource` for MySQL vs SQLite.
4. *Advanced:* Add a free remote destination using WordPress's own HTTP/S3-compatible APIs (Backblaze B2 / any S3 endpoint) — the streaming `Generator` writer makes a chunked multipart upload destination a natural extension of the existing `BackupDestinationInterface`.

---

## gratis-mail — vs WP Mail SMTP ($49/yr)

**What it does:** Routes `wp_mail()` through a configured SMTP server (TLS/SSL/none), stores the password encrypted at rest, sends a test email, and logs every transactional send.

**Competitor — free vs paid:** WP Mail SMTP Free does SMTP plus several mailers (Sendinblue/Brevo, Mailgun, SendGrid, Amazon SES, Google free) and a test. Pro (~$49/yr) adds **email logging**, open/click tracking + weekly reports, more mailers (Microsoft 365/Outlook, Zoho), smart routing, and a backup connection. Headline feature: rerouting WordPress mail through an authenticated SMTP/API mailer to fix deliverability. (FluentSMTP is a strong **100% free** competitor — many API providers, logging, routing.)

**Gratis now (from source):**
- ✓ SMTP via `phpmailer_init` with TLS/SSL/none, auth, custom From name/email (`SMTPConfig`)
- ✓ Credentials encrypted at rest — AES-256-CBC, key derived from `AUTH_KEY`+`AUTH_SALT` with a stored fallback, masked in the UI (`Crypto`, `Settings`)
- ✓ Send-a-test-email from admin and CLI
- ✓ Transactional log of success/failure with subject/recipient/error, capped at 200, plus sent/failed stats (`Logger`)
- ✓ WP-CLI: `log`, `test`, `configure`, `stats`
- ✓ `gratis_mail_configured` filter for advanced overrides (OAuth, timeouts)
- ✗ No API mailers (SendGrid/Mailgun/SES/Brevo/Gmail OAuth/Microsoft 365) — generic SMTP only
- ✗ No open/click tracking, no email reports, no smart routing, no backup connection

**Gaps (their paid-only we don't match yet):**
- API-based mailers and OAuth providers (Gmail, Microsoft 365) for hosts that block SMTP ports
- Email open/click tracking + scheduled delivery reports
- Smart routing and an automatic backup/failover connection

**Make it better / simpler / advanced — for free:**
1. *Simpler:* Add a guided "pick your provider" dropdown that prefills host/port/encryption for common providers (Gmail, Brevo, Mailgun SMTP, SES SMTP) — most of FluentSMTP's free appeal is just not having to look up SMTP settings.
2. *Simpler:* Encrypted credentials are a genuine edge over rivals that store SMTP passwords in plaintext `wp_options` — surface that in the UI ("password encrypted at rest") as a trust signal.
3. *Advanced:* Add at least one free API mailer (Amazon SES or Brevo via REST) using `wp_remote_post` to serve hosts that block outbound SMTP — the `gratis_mail_configured` hook shows the architecture already anticipates this.
4. *Advanced:* Move the log from a capped autoloaded option to a dedicated table for retention + open-tracking pixels, and add a backup-connection fallback (retry via a second mailer on failure).

---

## gratis-db — extends the free official SQLite Database Integration (no direct paid competitor)

**What it does:** A companion for running WordPress on SQLite — reports drop-in/extension readiness, scans active plugins/themes for MySQL-only SQL that would break under SQLite, optimizes MySQL tables, and logs slow queries. Positioned as a niche advantage rather than a paid-feature replacement.

**Competitor — free vs paid:** There is no paid equivalent. The baseline is WordPress's own **SQLite Database Integration** feature plugin (free, official), which installs a `db.php` drop-in to run WP on SQLite but offers no migration safety tooling, no compatibility scan, and no query diagnostics. gratis-db's niche is the *guardrails and diagnostics* around that.

**Gratis now (from source):**
- ✓ SQLite readiness panel — `ext-sqlite3` presence + which `db.php` drop-in is active (none/gratis-db/sqlite-unknown/third-party) (`Settings`, `DropinManager`)
- ✓ Compatibility scanner over active plugins+theme for FULLTEXT, SPATIAL, ON DUPLICATE KEY, FOUND_ROWS, GROUP_CONCAT, REGEXP, REPLACE INTO; FULLTEXT flagged critical (`CompatibilityScanner`)
- ✓ Table optimizer — `SHOW TABLE STATUS` size/overhead report + `OPTIMIZE TABLE` with reclaim estimate (`TableOptimizer`)
- ✓ Slow query log — configurable threshold, capped at 100, uses `SAVEQUERIES` (`SlowQueryLog`)
- ✓ WP-CLI: `status`, `scan`, `plan`
- ✗ **No actual migration/drop-in install** — `DropinManager` only *detects*; there's no `install()`, and `wp gratis-db plan` explicitly states "Migration is not yet implemented. Use the official SQLite Database Integration plugin for now."
- ◐ Table optimizer + slow-query overhead reporting are **MySQL-oriented** (`SHOW TABLE STATUS`/`OPTIMIZE TABLE` don't apply to SQLite), so on a SQLite site those panels add little

**Gaps (their paid-only we don't match yet):**
- N/A (no paid competitor). The functional gap is internal: it scans and plans a SQLite migration it cannot yet perform.

**Make it better / simpler / advanced — for free:**
1. *Simpler:* Make the value obvious by leaning into the unique strength — run the compatibility scan automatically and show a single "SQLite-ready / not ready" verdict with the exact offending files, so it's the *pre-flight check* nobody else offers.
2. *Simpler:* Detect the engine and hide the MySQL-only optimizer on SQLite sites (or swap in SQLite `VACUUM`/`ANALYZE`), so the UI never shows inapplicable tools.
3. *Advanced:* Implement the actual guided migration on top of the official integration — export MySQL → import to SQLite, install the drop-in, and (the real differentiator) a **one-click rollback** restoring the previous `db.php`, since the plan/backup steps are already scripted in `wp gratis-db plan`.
4. *Advanced:* Add a SQLite-native slow-query + size dashboard (query plan via `EXPLAIN QUERY PLAN`, DB file size, WAL checkpoint status) to make it genuinely useful *after* migration, not just before.

---

## gratis-devtools — vs WP Migrate DB Pro ($49+/yr) / WP Engine staging (~$240/yr) / Local (free)

**What it does:** Developer utilities in one plugin — an admin-bar debug bar, a grouped environment-info page, table-prefix staging environments, and a file-based DB migration runner, all with WP-CLI commands.

**Competitor — free vs paid:** WP Migrate (Lite) is free; **WP Migrate Pro** (~$49+/yr, now under WP Engine) does push/pull of the database between environments with find-and-replace plus media/theme/plugin transfer. WP Engine/Kinsta **staging** is bundled with hosting (effectively ~$20–35/mo → ~$240+/yr) and gives a true isolated copy with one-click push-to-live. **Local** (by WP Engine) is a free desktop dev environment. Headline feature (WP Migrate): serialized-data-safe DB push/pull with search-replace across environments.

**Gratis now (from source):**
- ✓ Debug bar — admin-bar node with SQL query count + time, peak memory, PHP/WP versions, hooked-filter count (admins only, toggleable) (`DebugBar`)
- ✓ Environment info page + `wp gratis-dev env` — grouped WordPress/PHP/Server/Database facts (`EnvInfo`)
- ✓ Staging create/delete/list — copies all prefixed tables to a `stg_<name>_` prefix in the same DB and repoints the copy's `siteurl`/`home` to `/staging/`, with SQL identifiers whitelisted (`StagingManager`)
- ✓ File-based DB migrations — scaffold, `up`/`down`, run pending, rollback last, status (`MigrationManager`)
- ✓ WP-CLI: `staging-create/-delete/-list`, `migrate-create`, `migrate`, `rollback`, `migrate-status`, `env`
- ◐ "Staging" is a **same-database table-prefix snapshot** with a repointed URL — there's no filesystem isolation and no routing layer that actually serves the staging tables, so it's closer to a DB checkpoint than a browsable staging site
- ✗ No database push/pull between environments and no serialized-safe find-and-replace (WP Migrate's headline)

**Gaps (their paid-only we don't match yet):**
- Push/pull DB (and media/plugins/themes) between local↔staging↔production with serialized-data-safe search-replace
- A truly isolated, browsable staging site with one-click "push to live"
- Multi-environment connection management

**Make it better / simpler / advanced — for free:**
1. *Simpler:* The debug bar and env page are real wins over nothing — add a "copy environment report to clipboard" button (and `wp gratis-dev env --format=json`) so support requests get clean, complete info in one click.
2. *Simpler:* Clarify the staging feature's scope in-UI ("DB snapshot, same site") so users don't expect an isolated URL it doesn't provide; offer a one-click "promote staging tables back to live" with an automatic pre-promote backup (via gratis-backup).
3. *Advanced:* Implement serialized-safe search-replace across the DB (the hard, valuable part of WP Migrate) as a `wp gratis-dev search-replace` that correctly re-serializes PHP arrays/objects — fully doable for free and immediately useful for domain moves.
4. *Advanced:* Add export/import of a staging environment to a portable file (pairing with gratis-backup) to approximate WP Migrate's push/pull between machines without a paid service.

---

### Cross-cutting notes

- **Consistent strengths across the suite:** no upsell/no "Pro" lock, no phone-home (confirmed in each readme), encrypted secrets where relevant (mail, CDN credentials masked), nonce + capability gating on every admin action, and a full WP-CLI surface on every plugin — a coherent, automatable, privacy-respecting story the commercial rivals don't match for free.
- **Recurring ceiling:** several features persist data in capped autoloaded `wp_options` (security block log, mail log, slow-query log). Fine at small scale; moving the high-volume logs to a table (or the suite's SQLite WAL store) is the shared upgrade path.
- **Biggest individual gaps to credibility:** gratis-backup has no restore and no remote destination; gratis-db can't yet perform the migration it scans for; gratis-security's 2FA isn't enforced. Closing those three would most improve the suite's standing versus the paid anchors.

# 2. SEO, Marketing & Conversion

# Gratis Suite — Competitive Comparison (SEO / Marketing / Conversion)

> Each "Gratis now" section is grounded in the actual plugin source read on 2026-06-17
> (`gratis-<slug>/gratis-<slug>.php`, `src/Settings.php`, and feature classes). Competitor
> free-vs-paid splits and prices were verified via vendor pricing pages the same day.
> Legend: ✓ done · ◐ partial · ✗ not present.

---

## gratis-seo — vs Yoast SEO / Rank Math ($59–$119/yr)

**What it does:** A front-end SEO toolkit — per-post meta (title/description/canonical/robots/OG image), Open Graph + Twitter Card output, a JSON-LD `@graph`, breadcrumbs, and a flat XML sitemap at `/sitemap.xml`.

**Competitor — free vs paid:** Yoast free does meta editing, readability + one focus keyphrase, and XML sitemaps; **Yoast Premium ($118.80/yr; AI+ bundle $358.80/yr)** unlocks the redirect manager, internal-linking suggestions, multiple keyphrases, social preview editor and AI Optimize. Rank Math's free tier is unusually generous (schema, redirects, 40+ on-page checks); **Rank Math PRO (~$59/yr, renews higher)** adds Content AI, rank tracking and analytics. Headline feature: a real-time in-editor content analysis that scores focus-keyword usage and readability on a traffic-light system.

**Gratis now (from source):**
- ✓ Per-post SEO title, meta description, canonical, `noindex`/`nofollow`, social-image override — stored as REST-exposed post meta (`MetaBox.php`).
- ✓ Open Graph (`og:type/title/description/url/site_name/locale/image`), `article:published/modified_time`, Twitter Card (`summary`/`summary_large_image`) (`MetaTags.php`).
- ✓ JSON-LD `@graph`: Organization/Person publisher with `sameAs`, WebSite + `SearchAction` (sitelinks search box), `BreadcrumbList`, and Article/WebPage primary entity (`Schema.php`).
- ✓ `[gratis_breadcrumbs]` accessible breadcrumb nav + matching `BreadcrumbList` schema (`Breadcrumbs.php`).
- ✓ Document-title rewriting (separator + parts), home title/description, org type/name/logo, default OG image, Twitter handle, `sameAs` profiles; toggles for schema/breadcrumbs/sitemap.
- ✓ Filters `gratis_seo_settings`, `gratis_seo_robots`, `gratis_seo_schema_graph`; WP-CLI command `gratis-seo`.
- ◐ XML sitemap is a single flat file (homepage + pages + posts capped 1000 + public CPTs capped 500), regenerated per request — no sitemap index, pagination, image/news/video sitemaps, or caching (`Sitemap.php`).
- ✗ No content/SEO/readability analysis or focus-keyword scoring (the Yoast/Rank Math headline).
- ✗ No redirect manager, 404 monitor, internal-linking suggestions, social-snippet preview, or `robots.txt`/`.htaccess` editor.

**Gaps (their paid-only we don't match yet):**
- In-editor content analysis (keyphrase + readability traffic lights).
- Redirect manager with automatic 404→redirect prompts on slug change.
- Internal-linking suggestions; orphaned-content detection.
- Social preview snippet editor; multiple keyphrases; AI title/meta generation.
- Local/WooCommerce/news/video schema breadth.

**Make it better / simpler / advanced — for free:**
1. **Simpler:** add a live character-count + Google-snippet preview directly in the existing SEO meta box (pure JS, no API) so users see truncation as they type.
2. **Advanced, free:** ship a lightweight redirect manager backed by one option/table + a `template_redirect` hook, and auto-offer a redirect when a published post's slug changes (`post_updated`). This is Yoast Premium's headline and is cheap to do natively.
3. **Advanced, free:** add a basic readability/keyphrase pass server-side (word count, keyphrase-in-title/H1/first-paragraph/URL checks) — no ML needed, just string checks rendered in the meta box.
4. **Simpler:** split the sitemap into a cached index (`sitemap_index.xml` + per-type files) so large sites don't rebuild 1500 URLs on every hit.

---

## gratis-social — vs Social Warfare ($29/yr) / Novashare (~$19.95/yr)

**What it does:** Lightweight share buttons (Facebook, X, LinkedIn, Pinterest, Email) rendered with inline SVG icons and share-intent URLs only — no third-party JS SDK and no tracking — shown inline, as a floating sidebar, or via shortcode.

**Competitor — free vs paid:** Social Warfare has a free core; **Pro ($29/yr single site)** adds share-count recovery, custom tweet/share text, more networks and analytics. Novashare (~$19.95/yr entry) is the speed-focused rival with the same recovery feature. Headline feature: **share-count recovery** — server-side fetching of share counts and re-association of those counts after a permalink/URL/domain migration so the social-proof numbers survive.

**Gratis now (from source):**
- ✓ Five networks via public share-intent URLs + inline `currentColor` SVG icons, no SDK, no tracking (`ShareButtons.php`).
- ✓ Display modes: inline (auto-append to `the_content`), floating sidebar, both, or shortcode-only.
- ✓ `[gratis_share]` shortcode with `url/title/networks/label/counts` attributes.
- ✓ Per-post-type targeting; styling controls: icon style (solid/outline), size (small/medium/large), color (brand/monochrome + accent hex), optional label.
- ✓ Optional share counts via the `gratis_social_share_count` filter (no automatic outbound calls), cached 1 h in a transient, with `k`/`M` formatting (`ShareCount.php`).
- ✗ No *automatic* share counts — a site owner must wire their own provider/token through the filter; nothing is fetched out of the box.
- ✗ No share-count recovery across URL/domain changes (the Social Warfare / Novashare headline).
- ✗ No "click-to-tweet" / quotable-highlight block, no per-post custom share text/image, no Gutenberg block (shortcode + auto-append only).
- ✗ Network set limited to 5 (no WhatsApp, Reddit, Telegram, Tumblr, etc.).

**Gaps (their paid-only we don't match yet):**
- Built-in share-count fetching + count recovery on migration.
- Per-post custom share title/description/image (social override).
- Click-to-tweet / inline highlight sharing.
- Wider network list and a native block.

**Make it better / simpler / advanced — for free:**
1. **Advanced, free:** ship an optional, self-hosted count provider (a cron job hitting each network's public count endpoint with the site's own keys) wired into the existing filter — turning the count hook from "bring your own" into "works out of the box."
2. **Advanced, free:** add share-count recovery via a per-post "previous URL(s)" meta field that the count resolver also queries, then sums — directly matching the competitor headline at zero cost.
3. **Simpler:** register a `gratis/share` Gutenberg block wrapping the existing `render()` so editors place buttons without remembering the shortcode.
4. **Better:** add a couple of high-demand networks (WhatsApp, Reddit, Telegram) — they are just more entries in the existing `intentUrl()`/`icon()` maps and `NETWORKS` whitelist.

---

## gratis-popup — vs OptinMonster (paid-only, ~$7–$49/mo billed annually)

**What it does:** A conversion-popup engine built on a `gratis_popup` CPT (popup body authored in the block editor) with time/scroll/exit-intent/click triggers, page targeting, a cookie frequency cap, and an accessible modal.

**Competitor — free vs paid:** OptinMonster is **paid-only**; Basic (~$7/mo annual) covers campaigns + basic targeting, Plus (~$19/mo) adds A/B testing + device targeting, and **Pro (~$29/mo ≈ $348/yr) unlocks Exit-Intent® technology** + revenue attribution + integrations (the legacy "$108/yr" anchor maps to its old Basic tier). Headline feature: a patented/trademarked **Exit-Intent®** that tracks the cursor leaving the viewport to fire the campaign — plus A/B testing and 30+ email-service-provider integrations.

**Gratis now (from source):**
- ✓ Four triggers — time delay, scroll %, **exit-intent** (`mouseleave` with `clientY <= 0`), and element click by CSS selector (`assets/popup.js`, confirmed).
- ✓ Page targeting: entire site / front page / all posts / all pages / specific post-page IDs (`Renderer::matchesTarget`).
- ✓ Cookie frequency cap in days (0 = once per session) + global default frequency.
- ✓ Genuinely accessible modal: `role="dialog"`, `aria-modal`, a real **focus trap** (Tab/Shift-Tab cycling), Escape-to-close, focus restore on close, overlay click-to-close, positions (center/top/bottom-right/bottom-left) and animations (fade/slide/scale/none) (`popup.js` + `Renderer.php`).
- ✓ Master on/off switch, show-to-logged-in toggle; WP-CLI command.
- ✗ No A/B testing (OptinMonster Plus/Pro).
- ✗ No built-in opt-in form fields or email-service-provider integrations — the popup body is freeform block content, so **lead capture is not wired** (you'd embed a `gratis-forms` form or a newsletter block manually).
- ✗ No analytics / conversion tracking, no template library, no Yes/No two-step or spin-to-win, no campaign scheduling (start/end dates), no advanced display rules (referrer/geo/device/new-vs-returning/AdBlock/category targeting).

**Gaps (their paid-only we don't match yet):**
- A/B testing with a winner metric.
- Conversion/impression analytics per campaign.
- Native opt-in fields + ESP integrations (Mailchimp/etc.) or a one-click "insert email field".
- Scheduling and richer display rules (referrer, device, returning-visitor).

**Make it better / simpler / advanced — for free:**
1. **Simpler:** add a "starter content" picker (a few pre-built block layouts: email opt-in, announcement bar, discount) so a new popup isn't a blank editor.
2. **Advanced, free:** record impressions/closes/conversions into a tiny option or table and show a per-popup conversion-rate column — the analytics gap closed with no SaaS.
3. **Advanced, free:** add campaign scheduling (`_gp_start`/`_gp_end` meta gating in `activePopups()`) and a returning-visitor rule from the existing cookie — both are small additions to current logic.
4. **Better:** offer a one-click "insert opt-in form" that drops a `[gratis_form]` shortcode into the body, turning popups into real lead capture using the sibling plugin.

---

## gratis-forms — vs WPForms ($49.50/yr) / Gravity Forms (~$59–$259/yr)

**What it does:** A form builder on a `gratis_form` CPT with a drag-and-drop field UI (7 field types), honeypot + optional reCAPTCHA v3 anti-spam, submissions stored in a dedicated DB table, admin notifications, an admin list table with CSV export, and a read-only REST entries endpoint.

**Competitor — free vs paid:** WPForms Lite is free (basic contact forms); **Basic $49.50/yr** and **Pro $199.50/yr** add fields, integrations and entry storage. Gravity Forms has **no free version** — Basic (~$59/yr), Pro (~$159/yr), Elite (~$259/yr). Headline feature: a polished drag-and-drop builder with **Smart Conditional Logic** (show/hide fields, pages and notifications based on prior answers); Gravity Forms also leans on a large add-on ecosystem (payments, CRMs, multi-page, calculations).

**Gratis now (from source):**
- ✓ Drag-and-drop builder with native HTML5 reorder (`assets/builder.js`) and 7 field types: text, email, textarea, select, checkbox, radio, file (`FormPostType::FIELD_TYPES`).
- ✓ Anti-spam: always-on honeypot (`gf_hp`) + optional per-form reCAPTCHA v3 with a configurable score threshold (`Submission.php`, `Settings.php`).
- ✓ Submissions in a custom `{prefix}gratis_form_submissions` table (JSON data, salted SHA-256 IP hash, UA, read/unread status, timestamp) (`Storage/Submissions.php`).
- ✓ Admin notification email (per-form comma-separated recipients, defaults to admin email); `do_action('gratis_form_submitted')` hook for automations.
- ✓ Admin submissions UI: `WP_List_Table` (list / view / delete / bulk-delete / read-unread) + single-entry view + **CSV export** streamed from `php://output` (`Admin/SubmissionsPage.php`, `SubmissionsListTable.php`).
- ✓ AJAX submit (logged-in + `nopriv`) + admin-only read-only REST entries endpoint (`API.php`); file upload via `wp_handle_upload`; `[gratis_form id="X"]` shortcode (+ `gratis-form` alias); WP-CLI.
- ✗ **Conditional logic is NOT implemented** — the plugin header description says "conditional fields," but the builder, `sanitize_fields()` and the renderer only persist `type/label/placeholder/required/options`; there are no conditional rules anywhere. (Header copy overstates the code.)
- ✗ No multi-page/step forms, payment fields (Stripe/PayPal), email-marketing/CRM integrations, calculations, signature/rich fields, save-and-resume, or form templates.
- ✗ Anti-spam limited to honeypot + reCAPTCHA v3 (no hCaptcha, Turnstile, or Akismet).

**Gaps (their paid-only we don't match yet):**
- Conditional logic (the WPForms/Gravity headline) — and we even claim it without shipping it.
- Multi-page forms, payments, ESP/CRM integrations, calculations.
- Form templates and richer field types.
- Entry notes/print, spam-service choice.

**Make it better / simpler / advanced — for free:**
1. **Fix the claim first:** either implement conditional logic or remove "conditional fields" from the plugin header so the listing matches the code.
2. **Advanced, free:** add real conditional logic — extend each field's saved model with a `conditions` array (field/operator/value), evaluate it client-side in `forms.js` to show/hide, and re-validate server-side in `read_field()`. This is the single highest-leverage feature and needs no paid service.
3. **Simpler:** ship 2–3 starter templates (Contact, Newsletter, Feedback) as pre-seeded field JSON so a new form isn't empty.
4. **Advanced, free:** add a Gutenberg block + multi-step support (group fields into pages with a progress bar) — both build directly on the existing field-model + renderer.

---

## gratis-analytics — vs MonsterInsights ($99.50/yr) / Google Analytics; privacy angle vs Plausible / Fathom (paid SaaS)

**What it does:** Cookie-free, self-hosted page-view analytics. A tiny inline beacon posts path/referrer/screen-width/language to a REST collector that stores rows in a custom table behind a **daily-rotating salted hash** — raw IPs and User-Agents are never stored — with a dashboard and automatic data retention.

**Competitor — free vs paid:** MonsterInsights Lite (free) connects WordPress to **Google Analytics 4** and shows core reports in wp-admin; **Plus (~$99.50/yr) / Pro (~$199.50/yr)** add eCommerce, form-conversion, custom-dimension and author tracking. Plausible (from ~$9/mo; free self-hosted CE) and Fathom (from ~$15/mo) are the privacy-first paid SaaS rivals. Headline feature: MonsterInsights pipes data into GA4 and surfaces Google's reports inside WordPress; Plausible/Fathom deliver a cookieless hosted dashboard with goals, custom events, UTM campaigns and coarse country, priced by monthly pageviews.

**Gratis now (from source):**
- ✓ Cookie-free, self-hosted store in `{prefix}gratis_analytics_events` (`Store.php`); no Google, no external libraries, no phone-home.
- ✓ Daily-rotating salted SHA-256 visitor hash (IP + UA + `home_url` + `wp_salt('nonce')` + UTC date) — neither IP nor UA is persisted (`Collector::visitorHash`).
- ✓ Inline beacon honours Do Not Track client *and* server side; bot filtering (regex), self-referral drop, referrer reduced to host only, coarse browser/OS/device buckets (`Tracker.php`, `Collector.php`, `UserAgent.php`).
- ✓ Dashboard: pageviews + unique-visitor cards, daily CSS bar chart, top pages/referrers/browsers/devices, 7/30/90/365-day ranges (`Dashboard.php`).
- ✓ Settings: enable, track-logged-in (off by default), respect-DNT, retention days (default 365, max 3650); daily cron prune; suggested privacy-policy text with no PII exporter needed (`Privacy.php`); WP-CLI.
- ✗ No Google/GA integration — by design it's a standalone store (the opposite of MonsterInsights, which *is* a GA front-end).
- ✗ Page views only — no custom events, goals/conversions, outbound-link/file-download/scroll tracking.
- ✗ No eCommerce/WooCommerce revenue tracking (MonsterInsights headline), no form-conversion tracking, no UTM campaign reports (referrer host only).
- ✗ No country/geo (deliberate — no IP is stored, whereas Plausible/Fathom derive coarse country at request time), no real-time view, no sessions/bounce/time-on-page/entry-exit, no author/post-type dimensions, no scheduled email reports, no public API.

**Gaps (their paid-only we don't match yet):**
- Goals / custom events / conversions (Plausible & MonsterInsights core value).
- eCommerce / revenue tracking.
- UTM campaign reporting and coarse country.
- Real-time view and an export/API.

**Make it better / simpler / advanced — for free:**
1. **Advanced, free:** add a goals/events endpoint — extend the beacon with an optional `event` name and store it in the same table; render a "Top events" panel. This closes the biggest gap versus Plausible at near-zero cost.
2. **Advanced, free:** capture UTM params (`utm_source/medium/campaign`) from the landing URL into new columns and add a Campaigns table reusing the existing `topBy()` aggregator.
3. **Better, privacy-safe:** derive coarse **country** server-side from the IP *before* it's discarded (it's already in scope in `visitorHash()`), store only the 2-letter code — geo insight with zero IP retention.
4. **Simpler:** add a "last 30 min" real-time count and a CSV export of the current range (the dashboard already has all the queries — it's one more button).

---

## gratis-reviews — vs WP Review Pro ($67/yr)

**What it does:** Star ratings + admin-curated testimonials with Schema.org markup, via a `gratis_testimonial` CPT, two shortcodes (`[gratis-rating]`, `[gratis-testimonials]`) and a JSON-LD Review block on singular content carrying a rating.

**Competitor — free vs paid:** MyThemeShop ships a free "WP Review" on wordpress.org; **WP Review Pro ($67/yr)** adds 19 rich-snippet types, multiple rating systems, visitor reviews, and review imports. Headline feature: the admin picks one of **19 rich-snippet types** and a **star / percentage / point** rating box, the plugin emits `AggregateRating` for star results in search, and **visitors can leave their own comment ratings** that roll into the aggregate.

**Gratis now (from source):**
- ✓ `gratis_testimonial` CPT (REST-exposed) with a meta box for rating (1–5), author name, author role (`Reviews.php`, `MetaBox.php`).
- ✓ `[gratis-rating value max label]` — accessible star display with an `aria-label` (e.g. "Rated 4.5 out of 5").
- ✓ `[gratis-testimonials count columns]` — responsive grid using semantic `figure`/`blockquote` markup.
- ✓ Schema.org `Review` JSON-LD on singular content carrying a `_rating` (`schemaMarkup()` on `wp_head`), with `reviewRating`, `itemReviewed` (`Thing`) and `author` (`Person`).
- ✓ Settings: schema on/off, default columns (1–6), default count (1–50); WP-CLI command.
- ◐ Schema emits a **single `Review` node, not `AggregateRating`** (the method docblock says "aggregate," but the code outputs one Review). Google's star rich-results usually want `AggregateRating`/`Product`, so this nuance matters for SERP stars.
- ✗ No visitor/user-submitted reviews — testimonials are admin-entered only (WP Review's headline is user comment ratings).
- ✗ Only a star system (no percentage or point rating boxes), single overall rating (no multi-criteria), no pros/cons lists.
- ✗ One schema type only (Review) — not the 19 snippet types (Product/Recipe/Book/Movie/Software, etc.); no import from Google/Facebook reviews; no WooCommerce product-review enhancement.

**Gaps (their paid-only we don't match yet):**
- Front-end visitor reviews feeding an `AggregateRating`.
- Multiple rating systems (stars/percentage/points) and multi-criteria ratings.
- Multiple rich-snippet types beyond `Review`.
- Pros/cons; review imports (Google/Facebook).

**Make it better / simpler / advanced — for free:**
1. **Fix for SERP impact:** emit `AggregateRating` (and a typed `itemReviewed`, e.g. `Product`/`Thing`) computed from all testimonials, instead of a lone `Review` — this is what actually earns star snippets and is a small change to `schemaMarkup()`.
2. **Advanced, free:** add an opt-in front-end review form (reuse WordPress comments or a tiny submit handler with moderation) so visitors leave ratings — the headline WP Review Pro feature, doable natively.
3. **Better:** support a `type` attribute mapping to a few common schema types (Product/Book/Recipe) so one plugin covers more than testimonials.
4. **Simpler:** add a `gratis/rating` + `gratis/testimonials` block pair so editors insert ratings visually instead of typing shortcodes.

---

### Cross-cutting note

Every plugin's source confirms the suite's stated model: **fully free, no "Pro" tier, no locked features, no nag screens** (optional managed cloud services may cover infrastructure). The strongest free wins available are the ones that match a competitor's *headline paywalled* feature with native code and no SaaS dependency: a redirect manager (vs Yoast), share-count recovery (vs Social Warfare), conditional logic (vs WPForms/Gravity — and currently mis-claimed), goals/events (vs Plausible/MonsterInsights), and `AggregateRating` + visitor reviews (vs WP Review Pro).

# 3. Commerce & Business

# Gratis Suite — Competitive Comparison (Commerce / Business)

> Gratis facts below are taken **only** from the plugin source under `/Volumes/Projects/gratis/<plugin>/` (main file, `src/Settings.php`, and `src/` skim for CPTs / shortcodes / REST routes / settings). Competitor facts are from current vendor pricing/feature pages (mid‑2026). ✓ = implemented · ◐ = partial · ✗ = not present.

---

## gratis-commerce — vs WooCommerce (free core + $29–$299/yr extensions)

**What it does:** A lightweight Stripe Checkout store (own `gratis_product` / `gratis_order` CPTs) plus an opt‑in WooCommerce enhancement layer — product quick view, wishlist, side‑by‑side compare and AJAX attribute filtering — with "no cart bloat."

**Competitor — free vs paid:** WooCommerce core (cart, checkout, products, orders, Stripe/PayPal) is free and open‑source; revenue comes from paid extensions ($29–$299/yr each — Subscriptions, Bookings, Memberships, advanced gateways) and a fully‑kitted store easily runs $500–$2,000/yr. Easy Digital Downloads = free core + paid pass for digital goods; SureCart (100k+ installs) = generous free tier + paid plans on a hosted/headless‑checkout model. *Headline feature:* WooCommerce checkout is **on‑site and session/cart‑based** (server‑rendered cart object, order CPT, gateway plugins), so the whole flow lives in WP.

**Gratis now (from source):**
- ✓ `gratis_product` CPT (public, REST, `/products` archive) with `_price`, `_sale_price`, `_downloadable`, `_download_url` meta; `gratis_order` CPT (private).
- ✓ Stripe Checkout via REST `POST /gratis-commerce/v1/checkout/{product_id}` → creates a hosted Stripe session with `wp_remote_post` to the Stripe API; `POST /gratis-commerce/v1/webhook` records the order on `checkout.session.completed` and fires `gratis_commerce_order_completed`.
- ✓ WooCommerce layer boots only when Woo is active, else a graceful admin notice: QuickView (AJAX modal), Wishlist (`[gratis_wishlist]`, user‑meta for logged‑in + guest cookie, merge on login), Compare (`[gratis_compare]`, up to 4, cookie‑based attribute table), Filters (`[gratis_product_filter]`, AJAX `pa_*` taxonomy + in‑stock query).
- ◐ Single hosted gateway only (Stripe Checkout); checkout currency is hard‑coded `usd` in `Checkout::createSession`.
- ✗ No on‑site cart/multi‑item basket, no tax/shipping/coupons, no variations for the native store.
- ✗ No admin settings screen for the native store — the Stripe secret lives in option `gratis_commerce_stripe_secret` (set via WP‑CLI/code), and there is no Stripe signature verification on the webhook.

**Gaps (their paid‑only we don't match yet):**
- Multi‑item cart, taxes, shipping zones, coupons/discounts, product variations.
- Subscriptions / recurring billing, multiple gateways, refunds and full order management.
- Currency selection / multi‑currency; webhook signature validation.

**Make it better / simpler / advanced — for free:**
- *Simpler:* ship a real Settings screen for the Stripe key + currency (right now it's option‑only), and read store currency from `get_option('woocommerce_currency')`/a setting instead of hard‑coded `usd`.
- *Security:* verify the Stripe `Stripe-Signature` header in `handleWebhook` (a constant‑time HMAC check) — closes a free, real correctness/abuse gap WooCommerce gateways already handle.
- *Advanced, still free:* let the existing quick‑view/compare/wishlist build a one‑page multi‑item Stripe Checkout (Stripe supports multiple `line_items` natively) — a "tiny cart" no extension tax, purely client‑side selection → one session.

---

## gratis-invoice — vs Sprout Invoices (~$199/yr; free "lite" on wp.org)

**What it does:** Invoices with line items, auto‑recalculated totals, a printable (PDF‑ready) HTML view and multi‑currency support; business name / currency / due‑days defaults.

**Competitor — free vs paid:** Sprout Invoices ships a free "Client Invoicing by Sprout Invoices" lite plugin (invoices + estimates only). Pro (~$199/yr) adds recurring invoices/payments, **client dashboard/portal**, payment gateways (PayPal free, plus Stripe, Authorize.net, Square, 2Checkout, eWay, NMI…), pre‑defined line items, advanced reporting and 100s of integrations (Zapier). *Headline feature:* the estimate→invoice→**get‑paid** workflow — invoices carry a pay button wired to real gateways and a logged‑in client portal; the client dashboard is explicitly a paid feature.

**Gratis now (from source):**
- ✓ `gratis_invoice` CPT (private, REST) with `_client_name/_email`, `_items` (JSON), `_status`, `_due_date`, `_currency`, `_total`; statuses draft/sent/paid/overdue.
- ✓ `create()` helper auto‑numbers `INV‑YYYYMMDD‑NNN` and computes totals; MetaBox edits client/items/status/due/currency and **recalculates total on save**.
- ✓ Printable invoice: `generateHTML()` + `admin-post` `gratis_invoice_print` streams a styled HTML doc and triggers `window.print()` (nonce + `edit_posts` gated).
- ✓ Multi‑currency per invoice + a default; Settings screen for business name / default currency / due days.
- ◐ "PDF‑ready" = browser print‑to‑PDF only (no PDF library / attachable file).
- ✗ No payment collection, no client portal, no estimates type (status set is invoice‑only despite the readme line), no recurring invoices, no email delivery of the invoice.

**Gaps (their paid‑only we don't match yet):**
- Pay‑online button + gateways; client login/portal to view & pay.
- Recurring/auto‑billed invoices; estimate→invoice conversion with accept/decline.
- Emailing the invoice (with a real PDF attachment); reporting.

**Make it better / simpler / advanced — for free:**
- *Advanced, still free:* reuse `gratis-commerce`'s Stripe Checkout to add a "Pay this invoice" link (a hosted session keyed to `_total`/`_currency`) — payment collection with zero gateway licensing.
- *Simpler:* replace the raw `_items` JSON textarea with a small repeater UI (rows of desc/qty/price) — the storage stays JSON, but non‑technical users stop hand‑editing JSON.
- *Free parity win:* email the invoice via `wp_mail` with the existing HTML as the body, and generate a true PDF using the bundled `Dompdf`‑style approach or the browser print stylesheet saved server‑side — closes the most‑felt Pro gap (delivery + PDF) at no cost.
- *Add estimates for real:* introduce an `estimate` status + accept token, so the readme's "estimates" claim is actually backed by code.

---

## gratis-booking — vs Amelia (from ~$59/yr) and Bookly (~$89 one‑time)

**What it does:** Appointment scheduling — `gratis_service` + `gratis_appointment` CPTs, configurable business hours / slot interval, a REST slot+booking flow and admin/customer confirmation emails.

**Competitor — free vs paid:** Amelia has a free **Amelia Lite** (wp.org) + 4 paid tiers (Starter ~$59/yr and up); paid unlocks employees/locations at scale, SMS + custom notifications, recurring appointments, deposit payments, packages, group bookings, coupons, taxes, invoices and REST/cart. Bookly base is free (**1 staff member, ≤5 services**); Bookly Pro (~$89 one‑time) unlocks unlimited staff + online payments, then **40+ individually‑paid add‑ons** (payments, Google Calendar sync, recurring, group, coupons). *Headline feature:* both model **employees × services × locations** with per‑staff calendars, deposits/payments and 2‑way Google/Outlook/Apple calendar sync.

**Gratis now (from source):**
- ✓ `gratis_service` CPT (public, REST) with `_duration` + `_price`; `gratis_appointment` CPT (private) with `_service_id/_date/_time/_name/_email/_status`.
- ✓ REST `GET /gratis-booking/v1/slots/{service_id}` computes open slots from business hours minus already‑booked times; `POST /gratis-booking/v1/book` validates email, creates the appointment, emails customer + admin, fires `gratis_booking_created`.
- ✓ `[gratis-booking]` / `[gratis_booking]` shortcode renders a service‑scoped widget container; Settings for start/end hour, slot interval, notification email.
- ◐ One global business‑hours window for every day (no per‑weekday schedule, no days‑off/holidays, no buffer time).
- ✗ No staff/employees, no locations, no payments/deposits, no calendar (Google/Outlook) sync, no recurring/group bookings, no SMS, no timezone handling beyond server time.

**Gaps (their paid‑only we don't match yet):**
- Multiple staff/resources with individual availability; per‑day schedules & day‑offs.
- Online payment / deposit at booking; Google/Outlook 2‑way sync; SMS reminders.
- Group appointments, packages, recurring slots, coupons.

**Make it better / simpler / advanced — for free:**
- *Advanced, still free:* add an **`.ics` download + email attachment** on `gratis_booking_created` (no API keys) — gives Amelia/Bookly‑style calendar capture for $0; pair with a feed URL for one‑way subscribe.
- *Free parity win:* per‑weekday business hours + a buffer/lead‑time setting and a simple staff taxonomy (one extra `meta_query` clause in `getAvailableSlots`) — turns a single‑resource toy into a real small‑team scheduler.
- *Anti‑double‑book:* the slot list currently reads booked rows but doesn't lock on write — add a uniqueness guard (service+date+time) in `restBook` so two simultaneous POSTs can't grab the same slot.
- *Simpler:* paid deposits via the suite's Stripe Checkout, reusing `_price` — booking + payment without an add‑on marketplace.

---

## gratis-crm — vs FluentCRM ($103/yr) + Mailchimp (from $13/mo)

**What it does:** Lightweight contact storage — `gratis_contact` CPT with name/email/phone/company/notes, tag taxonomy, list‑table columns + search/sort, auto‑capture from `gratis-forms` and WP registration, and CSV export.

**Competitor — free vs paid:** FluentCRM is free (wp.org: unlimited contacts, broadcast campaigns, simple automations, sends via your SMTP/SES); Pro $103/yr unlocks **visual automation funnels, email sequences, advanced segmentation/reporting, recurring campaigns**. Mailchimp is SaaS — free up to ~500 contacts with capped sends, Essentials from $13/mo (and it bills for unsubscribed/duplicate contacts). *Headline feature:* both center on **outbound email + visual marketing automation** (event‑triggered sequences from WooCommerce/LMS/forms); FluentCRM keeps it self‑hosted, Mailchimp includes the sending infrastructure.

**Gratis now (from source):**
- ✓ `gratis_contact` CPT (private, REST) + `contact_tag` taxonomy; typed meta `_email/_name/_phone/_company/_notes/_source/_form_id` with sanitisers + auth.
- ✓ De‑duplicating `create()` (by email); `ContactSync` makes a contact tagged `subscriber` on `user_register` and tagged `lead` on `gratis_form_submitted` (label‑matching email/name/phone/company).
- ✓ Admin list table: email/phone/company columns, sortable email+company, tag‑filter dropdown, and search widened to email/phone/company/name via `posts_clauses`.
- ✓ CSV export (`admin-post`, optional tag filter) streaming all contact fields + tags.
- ✗ **No email at all** — no campaigns, broadcasts, sequences, automations, segmentation beyond tags, open/click tracking, double opt‑in or forms builder (capture relies on `gratis-forms`).

**Gaps (their paid‑only we don't match yet):**
- Broadcast email campaigns + a visual automation/sequence builder (the core of both rivals — Gratis does none).
- Advanced segmentation, open/click analytics, contact activity timeline.
- Double opt‑in, list/segment management, native WooCommerce/LMS triggers.

**Make it better / simpler / advanced — for free:**
- *Biggest free win:* add broadcast email over `wp_mail` (batched via WP‑Cron) to a tag/segment — even basic "email this tag" closes the single largest gap vs FluentCRM's free tier without a sending bill.
- *Advanced, still free:* a tiny rule engine (`event → wait → email`) built on Action Scheduler/WP‑Cron, reusing the existing `gratis_form_submitted`/`user_register` hooks — automation funnels at $0.
- *Simpler:* a real contact detail panel (activity log of form submissions / sources) instead of bare meta boxes; you already store `_source` and `_form_id` — surface them as a timeline.
- *Trust:* double opt‑in + an unsubscribe token before any sending ships (do it first, so the free email feature is compliant by design).

---

## gratis-affiliate — vs AffiliateWP ($149.50–$299.50/yr intro; no free tier)

**What it does:** Affiliate program management — `gratis_affiliate` + `gratis_referral` CPTs, `?ref=` cookie attribution, commission recording on order completion, and a "mark pending as paid" payout tool.

**Competitor — free vs paid:** AffiliateWP is premium‑only (no wp.org version): Personal $149.50/yr intro ($299 regular, 1 site), Plus $199.50 ($399, 2 sites), Pro $299.50 ($599, 5 sites). Even the entry tier includes AdBlock‑proof tracking, a self‑service affiliate dashboard, tracked coupons and **1‑click Stripe & PayPal payouts**; higher tiers add fraud prevention, recurring/lifetime/tiered commissions, affiliate portal & landing pages. *Headline feature:* deep integrations (WooCommerce/EDD/MemberPress/etc.) feed referrals automatically, and real money goes out via **Stripe/PayPal Payouts** with payout logs.

**Gratis now (from source):**
- ✓ `gratis_affiliate` CPT with `_user_id/_ref_code/_commission_rate/_total_earned/_status`; `gratis_referral` CPT with `_affiliate_id/_amount/_product_id/_status`.
- ✓ `trackClick` drops a `gratis_ref` cookie (configurable days) when `?ref=` matches an affiliate; `recordCommission` hooks `gratis_commerce_order_completed`, creates a `pending` referral and increments `_total_earned`.
- ✓ `createAffiliate()` mints an 8‑char ref code (`md5(email+rand)`); Settings for default rate (0–1 fraction), cookie days, payout threshold.
- ◐ "Payout" only flips all pending referrals to `paid` in bulk — no money movement, no per‑affiliate payout, no logs/export.
- ✗ Tracking is wired **only** to `gratis_commerce_order_completed` (not WooCommerce/EDD). No affiliate registration form or self‑service dashboard, no coupon tracking, no tiered/recurring/lifetime rates, no fraud checks. `createAffiliate()` isn't reachable from the admin UI (CLI/code only).

**Gaps (their paid‑only we don't match yet):**
- Real payouts (Stripe/PayPal) with payout logs; per‑affiliate processing + threshold enforcement.
- Affiliate‑facing registration + dashboard (stats, referral link, creatives).
- WooCommerce/EDD attribution, coupon‑code tracking, tiered/recurring/lifetime commissions, AdBlock‑proof + fraud prevention.

**Make it better / simpler / advanced — for free:**
- *Free parity win:* a WooCommerce hook (`woocommerce_order_status_completed`) alongside the existing `gratis_commerce_order_completed` — instantly works with the most common store, not just the native one.
- *Advanced, still free:* reuse Stripe Checkout's API for **Stripe Transfers/Payouts** so "Process payouts" actually pays affiliates and writes a log row — turns the bulk status‑flip into a real payout.
- *Simpler + self‑serve:* a `[gratis_affiliate_dashboard]` shortcode (register, see ref link, earnings, referral count) backed by the meta you already store — removes the CLI‑only `createAffiliate` bottleneck.
- *Honesty/threshold:* enforce `payoutThreshold()` when marking paid (it's stored but unused), and respect threshold per‑affiliate.

---

## gratis-comply — vs Complianz ($59–$399/yr; free on wp.org)

**What it does:** GDPR/CCPA basics — an accessible accept/reject cookie banner, a one‑click privacy‑policy page generator, consent logging via a daily‑rotating salted visitor hash, and REST data export/erasure requests.

**Competitor — free vs paid:** Complianz has a strong free wp.org plugin (banner + a cookie scan covering the first ~50 pages + a setup wizard); Premium runs $59/yr (1 site) up to $399/yr (25 sites) — the task's "$149/yr" sits around its mid multi‑site tier. Premium adds full multi‑page cookie scanning and **region‑specific consent** (per‑region banners, script‑handling and legal docs), A/B and more. *Headline feature:* a built‑in **cookie scanner** auto‑categorizes scripts, and the banner does **conditional script‑blocking before consent**, configured per region (GDPR/ePrivacy/CCPA/LGPD/POPIA…) through a wizard.

**Gratis now (from source):**
- ✓ Footer consent banner (`CookieConsent::render`) — accessible (`role=region`, aria‑label), Accept/Reject, choice stored in `localStorage` (cache‑friendly) and POSTed to REST.
- ✓ REST `POST /gratis-comply/v1/consent` logs choice + a **daily‑rotating `sha256(wp_salt|date|IP)` visitor hash** (never the raw IP), capped at 10,000 entries; `POST /gratis-comply/v1/data-request` creates a native WP export/erase request via `wp_create_user_request`.
- ✓ One‑click privacy‑policy generator (creates/reuses a draft page, sets `wp_page_for_privacy_policy`); Settings for banner on/off, banner text, privacy URL; admin consent‑log summary (accept/reject/total).
- ◐ Consent is **notice‑only** — a single global banner; no granular categories (necessary/statistics/marketing) and no per‑service toggles.
- ✗ No script‑blocking before consent (analytics/marketing tags still load), no cookie scanner, no region/geo‑targeting, no consent‑record export, no Google Consent Mode / IAB TCF, no multilingual banner.

**Gaps (their paid‑only we don't match yet):**
- Automatic cookie/script scanning and categorization.
- Conditional script‑blocking until consent; granular per‑category consent.
- Region‑aware behavior (opt‑in EU vs notice US), Consent Mode/TCF signaling, consent‑log export for audits.

**Make it better / simpler / advanced — for free:**
- *Biggest free win:* add **category toggles + before‑consent script‑blocking** (gate `<script type="text/plain" data-category>` and only activate on accept) — this is Complianz's core value and is fully doable client‑side for free.
- *Advanced, still free:* a lightweight same‑origin "scan" that lists enqueued scripts/known third‑party hosts so admins can map them to categories — a no‑API approximation of the paid scanner.
- *Compliance depth:* emit **Google Consent Mode v2** default/again signals from the existing banner JS (a few `gtag('consent', …)` lines) — meaningful ad‑platform compliance at $0.
- *Simpler + auditable:* a "Download consent log (CSV)" button (you already store the hashed log) and an optional region check (`accept` vs `notice` by a geo/header hint) so EU visitors get opt‑in and others a lighter notice.

# 4. Content, Community & Multilingual

# Gratis Suite — Competitive Comparison (Group D: content types / community / i18n)

> Every "Gratis now" bullet below is grounded in the actual plugin source under
> `/Volumes/Projects/gratis/<plugin>/` (main file, `src/Settings.php`, and the `src/`
> CPT/taxonomy/shortcode/block/REST classes). Where a plugin's readme or header
> *claims* a feature that the code does not implement, it is flagged explicitly.
> Competitor pricing/feature splits are from vendor + comparison sources (mid-2025/2026).
> Legend: ✓ done · ◐ partial · ✗ not present.

---

## gratis-learn — vs LearnDash ($199/yr)

**What it does:** Registers course / lesson / quiz post types with per-user lesson-completion tracking (REST + user meta) and a `[gratis_course]` outline shortcode that shows ✓ ticks for completed lessons.

**Competitor — free vs paid:** LearnDash is **premium-only** (no free tier) at $199 / $399 / $799 per year (1 / 10 / unlimited sites); the course builder, quizzes, drip, certificates, Focus Mode and ProPanel reporting all sit behind the license. Headline feature — its **quiz engine** offers 8 question types, timed quizzes, question banks and pass/fail logic that gates lesson/topic progression, built on dedicated quiz tables and a drag-and-drop builder.

**Gratis now (from source):**
- ✓ Course + Lesson CPTs (public, `/courses` archive); lesson→course assignment + manual ordering via meta box (`_course_id`, `_order`).
- ✓ Per-user progress in `_gratis_learn_progress` user meta, set via `POST /gratis-learn/v1/progress/{lesson_id}` (login required), firing `gratis_learn_lesson_completed`.
- ✓ `[gratis_course]` outline with ✓ completion badges; `require_login` + `pass_mark` settings; WP-CLI `courses` / `progress`.
- ◐ Quiz CPT (`gratis_quiz`) is registered but carries only title/editor/custom-fields — **no question types, no grading**, and the `pass_mark` setting is stored yet never enforced anywhere in code.
- ✗ No drip/scheduling, certificates, prerequisites, Focus Mode, gradebook, or any front-end course player beyond the outline list.

**Gaps (their paid-only we don't match yet):**
- A real quiz engine (question types, grading, pass-to-progress gating, timers, question banks).
- Drip / scheduled lesson release, prerequisites, linear progression locking.
- Certificates, gradebook/reporting, course groups & cohorts.
- Front-end course player / Focus Mode.

**Make it better / simpler / advanced — for free:**
- Ship the quiz engine the CPT + `pass_mark` already imply: store questions as post meta (multiple-choice / true-false first), grade inside the existing REST controller, and only fire `gratis_learn_lesson_completed` when score ≥ `pass_mark`. This closes the biggest "claimed-but-missing" gap with scaffolding you already have.
- Add a "next lesson" link + progress bar to `[gratis_course]` (completion is already computed) — a near-free Focus-Mode-lite.
- Generate certificates on 100% completion as printable HTML (browser print-to-PDF) — no add-on, no service.
- Add optional drip with one `_available_after` lesson meta + a date check in the outline/REST guard — the paid "scheduled release" in a few lines.

---

## gratis-access — vs MemberPress ($179/yr)

**What it does:** Gates singular content by a hierarchical `access_level` taxonomy (Free/Premium/VIP) compared against a per-user `_access_level` meta, swapping restricted content for a configurable login/upgrade notice.

**Competitor — free vs paid:** MemberPress is **premium-only** — from $179/yr (Basic), with Plus/Pro tiers rising to ~$799+/yr; no free version. Payments/checkout, the Rules engine, drip & expiration, coupons, subscription/order management, the built-in LMS and integrations are all paid. Headline feature — the **Rules engine**: reusable rules target content by post, category, tag, custom taxonomy, or "all of a type" and attach memberships; protection plus the Drip/Expiration option live on each *rule*, not on the post.

**Gratis now (from source):**
- ✓ Hierarchical `access_level` taxonomy (`free`=0 < `premium`=1 < `vip`=2) on post/page/course/lesson; seeds Free/Premium/VIP terms; `_access_level` user meta.
- ✓ `the_content` filter compares the user's rank against the highest required term and renders a configurable login/upgrade notice.
- ✓ Settings for default level + both messages; nonce-gated "grant access to a user ID" tool; WP-CLI `grant` / `users`.
- ✗ **Drip / time-delayed release** — named in the readme and plugin header but **not implemented** anywhere; only level comparison exists.
- ✗ No payments, checkout, subscriptions, coupons, signup form, or expirations; restriction blanks the *entire* `the_content` (no teaser/more-tag) and applies only to singular post content (not menus, widgets, or REST).

**Gaps (their paid-only we don't match yet):**
- Payments + recurring subscriptions (the whole monetization layer).
- A reusable Rules engine (bulk-protect by category/tag/CPT/taxonomy) instead of tagging each post.
- Drip + access expiration (membership end dates).
- Coupons, member dashboard, partial/teaser protection.

**Make it better / simpler / advanced — for free:**
- Deliver the drip you already advertise: add `_drip_days` meta + a "user joined" date check in `restrictContent` — small, and it removes a false claim.
- Add a teaser mode (show the excerpt or up to `<!--more-->`, then the notice) — strictly better UX than blanking the page, and free.
- Add a "restrict an entire category/CPT to level X" rule via one settings table + a content/`pre_get_posts` hook — MemberPress-style Rules without a billing system.
- Expose level through a `current_user_can`-style helper + a block-editor "minimum level" panel so themes gate menus/blocks, not just `the_content`.

---

## gratis-community — vs PeepSo ($299/yr) / BuddyPress (free)

**What it does:** Adds extended user profiles (bio / avatar URL / social URL), a settings-gated activity feed, and group/message CPTs, surfaced via `[gratis-profile]` + `[gratis-activity-feed]` shortcodes and a small REST API.

**Competitor — free vs paid:** **BuddyPress** is 100% free/GPL (profiles, activity streams, groups, friends, private messaging, notifications). **PeepSo** ships a free Foundation plus paid bundles (Ultimate roughly $199–$399/yr by site count; ~$299 mid-anchor) that unlock media sharing, live chat, friends, groups, email digests and a mobile app. Headline feature — a real-time **activity stream** with posting, comments, reactions, @mentions and notifications, backed by custom activity tables and AJAX.

**Gratis now (from source):**
- ✓ Profile fields (`_gratis_bio`, `_gratis_avatar_url`, `_gratis_social`) editable on the WP user screen; `[gratis-profile]` card (name, bio, "member since").
- ✓ Activity CPT + logger (gated by a setting) hooked to `publish_post` and `gratis_form_submitted`; `[gratis-activity-feed]` + `GET /gratis-community/v1/activity`; feed-length setting.
- ◐ Messaging: `POST /v1/messages` and CLI `message` *create* a `gratis_message` with `_recipient` meta — but there is **no inbox, thread, or read endpoint** anywhere.
- ◐ Groups: `gratis_group` CPT (public, `/groups` archive) exists, but with **no join/membership, roles, or group feed**.
- ✗ No comments/reactions/@mentions on activity, no friends/follows, no notifications, no avatar *upload* (URL field only), no front-end profile editing or registration.

**Gaps (their paid-only we don't match yet):**
- Conversational private messaging (inbox + threads + read state).
- Friends/follows plus a notification system.
- Group membership, privacy (open/closed/secret) and per-group activity.
- Reactions, comments, @mentions, media sharing, front-end profile/registration.

**Make it better / simpler / advanced — for free:**
- Finish messaging cheaply: add `GET /v1/messages` (filter by `_recipient` + author) and a `[gratis-messages]` inbox shortcode — the write side already exists, so this is the highest-leverage fix.
- Make groups real with a `_group_members` post-meta array + join/leave REST routes and a member count on the archive — small code that earns the headline "groups" word.
- Let the feed take comments/reactions by storing them as child posts/meta and rendering inline — a free path to an engaging stream.
- Swap the avatar **URL** field for the WP media picker (with a Gravatar fallback) so profiles look complete without external hosting.

---

## gratis-events — vs The Events Calendar Pro ($99/yr)

**What it does:** An `gratis_event` CPT with start/end, venue, capacity, a recurrence label and an RSVP counter; a `[gratis_events]` upcoming/past list shortcode and single-event iCal export.

**Competitor — free vs paid:** The Events Calendar **core is free** (single events, month/list views, basic widgets). **Pro (~$99/yr, 1 site)** adds recurring events, extra views (week/day/photo/map/summary), location/venue search and premium widgets; RSVPs/ticketing live in the separate free **Event Tickets** plugin (Plus is paid). Headline feature — **recurring events**: Pro generates and manages real recurring *instances* (edit one vs the whole series, with exclusions) rather than a single post.

**Gratis now (from source):**
- ✓ Event CPT + `event_category` taxonomy; meta box for start/end (datetime-local), venue, capacity (0 = unlimited) and a recurrence select.
- ✓ `[gratis_events]` list (limit / category / past, ordered by `_start_date`); per-site archive `per_page` + `hide_past` settings; WP-CLI `list`.
- ✓ RSVP via `POST /v1/rsvp/{event_id}` enforcing capacity + a `gratis_event_rsvp` action; single-event `?gratis_ical=` download and CLI bulk `.ics` export.
- ◐ "Recurring": `_recurring` is stored as a label only (none/daily/weekly/monthly) — **no recurring instances are generated**; the event stays one post.
- ✗ No calendar/month grid view (list shortcode only); RSVP is an anonymous public counter (no per-attendee records, spammable, no cancellation); no maps, ticketing/payments, or subscribe-by-URL feed.

**Gaps (their paid-only we don't match yet):**
- Real recurring-event instances (series editing + exclusions).
- Calendar grid views (month/week/day) and map/photo views.
- Attendee-level RSVP (names/emails, per-user limits, cancellation).
- Venue/organizer entities + location search.

**Make it better / simpler / advanced — for free:**
- Make the recurrence label real: on save, materialize child event posts (or compute virtual occurrences from `_start_date` + the rule) so the stored field stops being cosmetic — the data model is already there.
- Add a free month-grid view (server-rendered table or a small block) reading the same `_start_date` meta — closes the most visible gap vs the *free* competitor.
- Make RSVP authenticated and per-user (store user IDs in meta) for real attendee lists, dedupe and cancellation — and rate-limit the public endpoint to stop counter spam.
- Emit a whole-calendar `.ics`/webcal feed (you already build VEVENTs) so visitors can "subscribe," not just download one event.

---

## gratis-tables — vs TablePress (Pro $49/yr)

**What it does:** A `gratis_table` CPT whose data is edited as CSV in a meta box and rendered by `[gratis-table]` with client-side search and column sorting.

**Competitor — free vs paid:** TablePress's **free** version is unusually complete — unlimited tables, DataTables-powered sorting/search/pagination, and import/export to **CSV, Excel, HTML and JSON** (plus a block and an Elementor widget). **Premium modules (paid, tiered)** add responsive layouts, automatic periodic import (URL/Google Sheets), server-side processing for huge tables, row filtering and cell-highlight styling. Headline feature — its **DataTables** integration gives sortable/searchable/paginated tables from stored rows with no coding.

**Gratis now (from source):**
- ✓ Table CPT + CSV textarea editor (first row = header) with `parseCSV` / `saveData` / `importCSV` helpers and a copy-paste shortcode box.
- ✓ `[gratis-table id search sort]` renders an accessible table — sortable headers (`tabindex`, Enter/Space, numeric-aware) and a live text filter via inline JS; default search/sort settings; WP-CLI `list` + CSV `import`.
- ✗ It is a **shortcode + CPT, not a real Gutenberg block**, despite the `TableBlock` class name and the readme's "block" wording (no `register_block_type` / `block.json`).
- ✗ No pagination (all rows go to the DOM), no Excel/HTML/JSON import (CSV only), no responsive modes, no per-cell formatting, no charts, no export/print buttons, no Google-Sheets/URL auto-sync.

**Gaps (their paid-only we don't match yet):**
- Pagination / server-side processing for large datasets.
- Excel + JSON + HTML import (and export).
- Responsive table modes (stack / scroll / modal).
- Scheduled import from a URL or Google Sheet; per-cell styling.

**Make it better / simpler / advanced — for free:**
- Add client-side pagination to the existing inline JS (chunk `tbody` rows) — a few lines that fix the one real scalability problem, no library needed.
- Ship a true block: register a thin block that wraps the existing render/shortcode so editors get a native insert + preview (closing the "block" naming gap cheaply).
- Add JSON (and `.html` table) import beside CSV in `parseCSV`'s sibling, and accept browser-side `.xlsx`→CSV, to match TablePress's import breadth without a heavy dependency.
- Add a CSS-only "responsive: stack on mobile" toggle (styles are already inlined) — one of the most-requested premium features, for free.

---

## gratis-translate — vs WPML ($39/yr) & Polylang Pro ($99/yr)

**What it does:** A `language` taxonomy plus `_translation_of` post meta link translated posts/pages together, with a `[gratis-language-switcher]` and toggleable `hreflang` tags.

**Competitor — free vs paid:** **WPML** is **premium-only** — from $39/yr (Multilingual Blog), $99 (CMS), ~$199 (Agency) — covering content **and string translation**, a translation editor, WooCommerce and machine translation (DeepL/Google). **Polylang** has a strong **free** tier (link translations, language switcher, free theme-string translation) with **Pro (~$99/yr)** adding slug translation, language-aware REST, duplication and more. Headline feature — full **string translation**: both scan theme/plugin gettext strings and store translations (WPML in custom tables + an editor; Polylang via its Strings UI), so the whole UI translates, not just posts.

**Gratis now (from source):**
- ✓ `language` taxonomy on post/page (seeds en/lt/es/fr/de); `_translation_of` meta + meta box (language select + "translation of ID"); WP-CLI `languages` / `link`.
- ✓ `[gratis-language-switcher]` (accessible: `hreflang` + `aria-current`) and `wp_head` `hreflang` alternate tags (toggle); default-language setting.
- ◐ Same manual "link existing translations" model as Polylang-free — but you must create each translated post yourself and link it by ID (no duplicate-to-translate helper).
- ✗ No **string/gettext translation** (theme/plugin UI stays one language), no `.po/.mo` or translation editor, no machine/auto translation, no slug/URL translation, no language URL routing (prefix/subdomain), no menu/widget/term translation; switcher + hreflang only fire on `is_singular` for post + page (not CPTs).

**Gaps (their paid-only we don't match yet):**
- String (gettext) translation of the theme/plugin UI — the headline both competitors lead with.
- Machine/auto-translation (DeepL/Google) and a side-by-side translation editor.
- Slug/URL translation + per-language URL structure (prefix/subdomain) and SEO routing.
- CPT / taxonomy-term / menu translation and a "duplicate to new language" workflow.

**Make it better / simpler / advanced — for free:**
- Add a "Create translation" button on the meta box that duplicates the post and pre-fills `_translation_of` + language — removes the most tedious manual step and matches Polylang-free's core flow.
- Extend the taxonomy + switcher to **all public post types** (not just post/page) with one `get_post_types(['public'=>true])` loop — a near one-line reach improvement.
- Offer free string translation via a tiny gettext layer: let admins map `original→translated` per language and hook `gettext` / `gettext_with_context` — covers the headline feature with no external service.
- Add optional `?lang=` (or pretty `/lt/`) routing + set `<html lang>` per language so SEO/hreflang point at distinct, crawlable URLs.

# 5. Platform, Productivity & Builder

# Gratis Suite — Competitive Comparison (Group E: Platform / Productivity / Builder)

> **Method:** "Gratis now" bullets are grounded only in the real source under
> `/Volumes/Projects/gratis/<plugin>/` (main file, `Settings`, and `src/`/`includes/`
> classes — REST routes, CPTs, taxonomies, shortcodes, blocks, CLI). Nothing is invented;
> features mentioned in marketing/headers but absent from code are marked `✗` and noted.
> Competitor prices are public list prices (USD) at time of research and may change.
> Legend: ✓ done · ◐ partial · ✗ not present.

---

## gratis-ai — vs AI Engine ($49–199/yr) · Jetpack AI ($25/mo) · CodeWP

**What it does:** AI assistant for WordPress with bring-your-own-model (any OpenAI-compatible
endpoint), automatic free-provider fallback, an MCP server, and a WP 7.0 Abilities API
integration — with API keys encrypted at rest (v2.0.0).

**Competitor — free vs paid:** AI Engine's free build (wp.org) already connects WP directly to
OpenAI/Claude/Gemini with a chatbot, content generator, function calling and MCP support; Pro
(~$49 single → Standard $79/5 sites → Professional $149/20 sites) adds chatbot themes, AI forms,
embeddings/RAG, fine-tuning, image generation and per-user usage/cost tracking. Jetpack AI is a
paid add-on (~$20–25/mo) and CodeWP sells AI code/snippet generation on monthly tiers. *Headline
(chatbot/AI framework):* AI Engine acts as a unified provider layer — one internal API in front of
many LLMs with built-in token/cost tracking, which other plugins can call.

**Gratis now (from source):**
- ✓ BYOM — any OpenAI-compatible endpoint/model (`OpenAICompatible`, `ModelRouter::resolve`).
- ✓ Free-provider fallback chain: Groq → Cerebras → Together.ai → OpenRouter → local Ollama (`ModelRouter::FREE_PROVIDERS`).
- ✓ Encrypted key storage at rest — AES-256-CBC keyed off `AUTH_KEY` (`KeyVault`), with export/import.
- ✓ MCP server: REST `/mcp/tools`, `/mcp/execute`, `/mcp/resources`, Bearer/X-API-Key auth; tools = get_posts, create_post, get_site_info, search, purge_cache, get_analytics, ai_generate (`MCPServer`).
- ✓ WP 7.0 Abilities API: `generate-content`, `analyze-seo`, `cache-recommendations` (`AbilitiesIntegration`, guarded by `function_exists`).
- ✓ Content-generation REST `/gratis-ai/v1/generate` for the builder; WP-CLI (`status`, `ask`, `configure`, `generate-post`, `providers`, `free-guide`, `key`, `mcp-info`).
- ◐ Streaming — `stream()` exists but just yields the full `complete()` result (no real SSE token streaming).
- ◐ SEO analysis — fetches a URL and prompts the model, but returns a hardcoded `score => 75`.
- ✗ No front-end chatbot widget, AI forms, embeddings/RAG over site content, image generation, fine-tuning, or usage/cost-tracking dashboard.

**Gaps (their paid-only we don't match yet):**
- Front-end conversational chatbot UI (themed, embeddable).
- Embeddings/RAG so answers are grounded in the site's own posts/docs.
- AI forms, image generation, and real streaming responses.
- Per-user usage limits + token/cost tracking dashboard.

**Make it better / simpler / advanced — for free:**
- *Simpler:* one-click "Test connection" + "auto-pick a free provider" button on the settings screen so a non-technical user is generating in under a minute (the router already knows the free endpoints).
- *Advanced (free):* add a lightweight RAG tool to the MCP server that embeds posts/docs into a local table and grounds `ai_generate`/the chatbot — turning BYOM into a site-aware assistant without a SaaS.
- *Advanced (free):* implement real SSE streaming in `OpenAICompatible::stream()` and surface it through a simple shortcode/block chatbot.
- *Better:* compute the SEO score from actual signals (title/meta/heading/length checks) instead of the fixed `75`.

---

## gratis-automation — vs Zapier/Make ($20–50/mo) · Uncanny Automator (Pro)

**What it does:** WordPress-native workflow automation — trigger → action chains stored in an
option and registered on the matching WP hook, with email/webhook/cache/post/meta actions
(v1.0.0).

**Competitor — free vs paid:** Zapier/Make are metered cloud platforms ($20–50/mo, priced per
task/operation). Uncanny Automator's free plugin ships limited triggers/actions plus unlimited
outgoing webhooks and 250 trial credits for premium app integrations; Pro adds many more
triggers/actions, scheduled/delayed/conditional logic, and unlimited recipe runs with no
per-task fee. *Headline (1-click integrations):* Automator's recipe builder wires WP plugins to
each other and to SaaS apps (Google Sheets, Slack, X, Zoom…) through pre-built per-app
trigger/action connectors.

**Gratis now (from source):**
- ✓ Trigger → action engine with active/inactive toggle, persisted in `gratis_automations` (`Engine`).
- ✓ Built-in triggers mapped to core hooks: post_published, user_registered, form_submitted, comment_posted, scheduled (cron); unknown triggers pass through as a custom hook name.
- ✓ Actions: `send_email`, `webhook` (POST JSON), `purge_cache`, `create_post`, `update_meta` (`Engine::executeAction`).
- ✓ Admin UI to add/list/enable/disable/delete; WP-CLI `list`, `run`, `add`.
- ◐ Multi-step chains — the engine runs an `actions[]` array, but the admin UI only attaches one action per automation (CLI can do the same).
- ◐ `create_post`/`update_meta` actions exist in the engine but aren't selectable in the admin form (CLI/programmatic only).
- ◐ Scheduling — only a fixed hourly cron option; no delays or custom intervals.
- ✗ No conditional logic/filters, no token/field mapping from trigger data into actions, no run history/logs, no per-app SaaS connectors (only a generic webhook).

**Gaps (their paid-only we don't match yet):**
- 1-click app connectors (Slack/Sheets/CRM/etc.) beyond a raw webhook.
- Conditional branching + delayed/scheduled-at actions.
- Multi-step visual recipe builder with data passed between steps.
- Run logs/history and retry on failure.

**Make it better / simpler / advanced — for free:**
- *Simpler:* expose the existing `create_post`/`update_meta` actions in the admin form and allow adding multiple actions to one automation — the engine already supports it, so this is UI-only.
- *Advanced (free):* add a token system (`{{post.title}}`, `{{user.email}}`) so trigger context flows into email/webhook bodies — huge capability jump at near-zero cost.
- *Advanced (free):* add a tiny `gratis_automation_runs` log (last N runs + success/error) for debuggability.
- *Better:* add a simple "Condition" row (meta/field equals/contains) before actions fire.

---

## gratis-media — vs FileBird ($39/yr) + Envira Gallery ($49/yr)

**What it does:** Adds a hierarchical folder taxonomy to the media library (with optional
auto-filing by file type) plus a responsive `[gratis-gallery]` shortcode (v1.0.0).

**Competitor — free vs paid:** FileBird's free build gives unlimited folders/subfolders with a
drag-drop tree; Pro ($39/yr) adds folder access/sharing, cloud sync, smart folders and bulk
multi-select. Envira Gallery Lite is free; Pro (from ~$49/yr) adds albums, lightbox, video/audio
galleries, masonry/mosaic layouts, watermarking, proofing and WooCommerce sales. *Headline
(folders):* FileBird stores folders as a custom taxonomy and renders a Vue/jQuery sidebar tree that
reassigns attachments over AJAX with drag-and-drop.

**Gratis now (from source):**
- ✓ Folders as a hierarchical `media_folder` taxonomy on attachments, shown in REST + admin column (`Folders::register`).
- ✓ Library filter dropdown above the media list table (`renderFilter`).
- ✓ Optional auto-organise on upload by MIME → Images/Videos/Audio/Documents/Other (`maybeAutoAssign`).
- ✓ Bulk "Organise existing media" sweep (`organizeAll`) + WP-CLI `organize`, `cleanup` (unused report), `folders`.
- ✓ `[gratis-gallery]` responsive grid: `folder`/`ids`/`columns`/`size`/`limit`, lazy-loaded, links to full image, mobile-responsive CSS (`Gallery`).
- ◐ Gallery is a CSS-grid with plain `<a>` links — no JS lightbox, albums or layout variants.
- ✗ No drag-and-drop folder tree UI (relies on WP's standard taxonomy UI + the dropdown filter).
- ✗ No folder permissions/sharing, cloud sync, smart/dynamic folders, watermarking, video galleries, proofing or e-commerce.

**Gaps (their paid-only we don't match yet):**
- Drag-and-drop folder sidebar in the media modal/grid.
- Lightbox + album / masonry / mosaic gallery layouts.
- Watermarking, image proofing, and WooCommerce image sales (Envira Pro).
- Folder-level access control and cloud sync (FileBird Pro).

**Make it better / simpler / advanced — for free:**
- *Simpler:* render the folder tree as a sidebar in the media modal (taxonomy already exists) so users file images where they upload them — closing most of the FileBird "feel" gap with no paid backend.
- *Advanced (free):* add an opt-in JS lightbox + a `layout="masonry"` option to `[gratis-gallery]` (CSS columns), matching Envira's most-used free-tier feature.
- *Advanced (free):* "smart folder" virtual views driven by the existing MIME mapping (e.g. an auto "PDFs" view) without moving files.
- *Better:* add bulk multi-select → assign-to-folder on the media list screen.

---

## gratis-notify — vs OneSignal · PushEngage ($9–29/mo)

**What it does:** Self-hosted "new post" notifications: a footer opt-in prompt, a subscribe/latest
REST pair, and a polling fallback that records the most recent published post (v1.0.0).

**Competitor — free vs paid:** PushEngage free = 1 site, ≤200 subscribers, 30 campaigns; paid tiers
(~$9–29/mo entry) scale subscribers and add segmentation, scheduling, drip and analytics. OneSignal
free allows large web-push subscriber lists but caps reach/branding; paid adds segmentation,
automation, A/B testing and white-labelling. *Headline (web push):* both register a service worker
and call `PushManager.subscribe` with VAPID keys, store the push endpoint, then deliver
notifications from hosted infrastructure even when the tab is closed.

**Gratis now (from source):**
- ✓ Footer opt-in prompt with configurable delay + copy; requests `Notification` permission (`PushNotifier::serviceWorkerScript`, `Settings`).
- ✓ Subscribe REST `/gratis-notify/v1/subscribe` (stores endpoint in an option) and `/latest` polling route.
- ✓ Records the latest published post (title/excerpt/url/time) on `publish_post` (`onPublish`).
- ✓ Admin shows subscriber count + latest notification; enable toggle.
- ◐ "Push" is really a Notification-permission prompt + polling: on allow it stores a synthetic `poll://<timestamp>` endpoint — useful for in-session alerts only.
- ✗ No real Web Push — no service worker registration, no `PushManager.subscribe`, no VAPID keys, so no background delivery to closed tabs (despite the `serviceWorkerScript` method name).
- ✗ No segmentation, scheduling, drip/autoresponders, A/B tests, or click analytics.

**Gaps (their paid-only we don't match yet):**
- Genuine VAPID Web Push (service worker + `PushManager`) for closed-tab delivery.
- Subscriber segmentation and targeted/scheduled campaigns.
- Drip/automated sequences and RSS-to-push.
- Delivery + click-through analytics.

**Make it better / simpler / advanced — for free:**
- *Advanced (free):* ship a real service worker + `PushManager.subscribe` and self-host VAPID delivery via the Web Push protocol (PHP can sign/send) — this is the one change that turns the plugin into a true OneSignal alternative with no SaaS fee.
- *Simpler:* a one-click "Send test notification" button in admin to validate the flow.
- *Advanced (free):* add a manual "broadcast" composer (title/body/url) instead of post-publish only, stored in the same option.
- *Better:* record allow/deny + click counts in an option for basic free analytics.

---

## gratis-project — vs Trello/Asana (SaaS) · FluentBoards · WP Project Manager Pro

**What it does:** WordPress-native project management: Project + Task CPTs, a task-status
taxonomy, task meta (project/assignee/priority/due date), and a read-only `[gratis_board]` Kanban
shortcode (v1.0.0).

**Competitor — free vs paid:** Trello/Asana are per-user SaaS subscriptions. FluentBoards' free
plugin gives unlimited WP-native projects/tasks/boards with drag-drop Kanban, comments and
attachments; Pro ($74–149/yr single site) adds automation, time tracking, custom fields, recurring
tasks and reporting. WP Project Manager Pro is similar. *Headline (Kanban):* FluentBoards renders an
in-dashboard SPA (REST + JS) with drag-and-drop cards that update status/order live.

**Gratis now (from source):**
- ✓ `gratis_project` + `gratis_task` CPTs, `task_status` taxonomy seeded with todo / in-progress / review / done (`ProjectSystem`).
- ✓ Task meta: `_project_id`, `_assignee`, `_due_date`, `_priority` (REST-exposed, auth-gated).
- ✓ Task-editing meta box (project, assignee, priority, due date) in the post editor (`MetaBox`).
- ✓ `[gratis_board]` / `[gratis-board]` Kanban columns grouped by status, optional `project` scope (`Board`).
- ✓ Settings (default priority) + WP-CLI `tasks`, `add`.
- ◐ Kanban board is **read-only** — cards are rendered server-side with inline styles; no drag-and-drop or status change from the board.
- ✗ "Milestones" appears in the plugin header description but is **not implemented** in source.
- ✗ No comments/activity, attachments, time tracking, recurring tasks, automation, reports, calendar/Gantt, or front-end task creation.

**Gaps (their paid-only we don't match yet):**
- Drag-and-drop board that updates status/order.
- Comments, attachments and activity log per task.
- Time tracking, recurring tasks, and milestones.
- Reporting/dashboards and a front-end (non-admin) UI.

**Make it better / simpler / advanced — for free:**
- *Advanced (free):* make the board interactive — a small JS layer that PATCHes the `task_status` term on drop via the existing REST-exposed CPT; biggest perceived-value jump and fully free.
- *Simpler:* add a "+ Add task" inline control per column on the board (the CLI `add` logic already exists server-side).
- *Advanced (free):* implement the advertised milestones as a lightweight `gratis_milestone` term/meta with a due date and progress roll-up.
- *Better:* enable WP core comments on the task CPT for free per-task discussion.

---

## gratis-builder — vs Elementor Pro ($59–399/yr) [also Bricks, Spectra Pro]

**What it does:** AI-ready page builder that *extends Gutenberg* — a curated pattern library with
sandboxed previews, custom pattern categories, a programmatic block-editing REST API, an
AI-layout-generation endpoint, and a directory/listing CPT (v1.0.0).

**Competitor — free vs paid:** Elementor free ships ~32 core widgets and the drag-drop editor; Pro
(Essential $59/yr → Advanced $99 → Expert $199 → agency up to ~$399+) adds the Theme Builder, 86+
pro widgets, popup builder, form builder, WooCommerce builder, dynamic content/custom-field binding
and AI. Bricks (~$79–199/yr, no free tier) and Spectra Pro (Gutenberg-based, free + paid) compete on
the same axis. *Headline (Theme Builder):* Elementor renders on its own canvas (not Gutenberg) and
applies header/footer/single/archive templates site-wide via display-condition rules.

**Gratis now (from source):**
- ✓ Pattern library: 8 block patterns (hero-dark-centered, cta-banner, features-grid, pricing-table, team-section, testimonials, contact-section, faq-section) auto-registered from `patterns/` (`Gratis_Builder_Patterns`).
- ✓ Admin pattern browser with **sandboxed iframe previews** + custom pattern-category management (`Gratis_Builder_Admin`).
- ✓ Programmatic block-editing REST API: `parse-blocks`, `serialize-blocks`, `update-block` (by path), `batch-update`, `validate-blocks` — the standout "AI-ready" surface (`Gratis_Builder_REST_API`).
- ✓ AI layout generation REST `/generate` routed through gratis-ai's `ModelRouter`, with a deterministic pattern-assembly fallback and configurable per-user rate limiting (`Gratis_Builder_AI_Generator`).
- ✓ Directory/marketplace basics: `gratis_listing` CPT + category/location taxonomies + address/lat/lng/rating/website/phone meta, submission shortcode, search REST (`Gratis_Builder_Directory`).
- ✓ Cache-manager integration (namespace purges on block save/delete).
- ◐ "Builder" = Gutenberg-native by design — no separate visual drag-drop canvas.
- ✗ No Theme Builder (header/footer/single/archive via conditions), popup builder, form widget, WooCommerce builder, or dynamic-content/custom-field binding.

**Gaps (their paid-only we don't match yet):**
- Theme Builder: site-wide header/footer/archive/single templates with display conditions.
- Popup builder and a form-builder widget.
- WooCommerce product/cart/checkout building.
- Dynamic content / custom-field binding into blocks.

**Make it better / simpler / advanced — for free:**
- *Advanced (free):* lean into the unique strength — expose the block REST API as MCP tools (it pairs perfectly with gratis-ai's MCP server) so agents can edit live pages programmatically; this is something Elementor Pro can't do.
- *Simpler:* add an "Insert pattern" button from the pattern browser straight into a new draft, so the library is one click from a page.
- *Advanced (free):* use FSE template parts for header/footer "theme building" (the block-native equivalent of Elementor's Theme Builder) rather than a proprietary canvas.
- *Better:* add a dynamic-content block that binds to post meta/`gratis_listing` fields for the directory use case.

---

## gratis-docs — vs BetterDocs ($49/yr) [also Heroic KB, weDocs, Echo KB]

**What it does:** Documentation system for the Gratis suite: a `gratis_doc` CPT with categories
and an order meta, a category-grouped sidebar nav shortcode, an archive grid shortcode, and a
JS heading-TOC with scroll-spy (v1.0.1).

**Competitor — free vs paid:** BetterDocs free (wp.org) gives a docs CPT, categories/tags, live
search, a TOC and several layouts via shortcodes/blocks; Pro ($49/yr+) adds advanced/instant search,
the floating "Instant Answer" widget, analytics, multiple knowledge bases, role-based access and AI
write/summarize/chatbot. Heroic KB ($49+/yr), weDocs (free + pro) and Echo KB (free + add-ons) sit
in the same range. *Headline (knowledge base):* BetterDocs renders a docs CPT with an AJAX live
search box and an "Instant Answer" floating widget that searches articles without a page load.

**Gratis now (from source):**
- ✓ `gratis_doc` public CPT (archive, `/docs/` slug) + `doc_category` taxonomy + `_doc_order` meta (`gratis_docs_register`).
- ✓ `[gratis_docs_nav]` — sidebar grouped by category, ordered by `_doc_order`, with active-item highlight.
- ✓ `[gratis_docs_grid]` — archive grid of doc cards (title + excerpt).
- ✓ Heading TOC (h2/h3) **with scroll-spy** built in JS (`templates/docs.js`); scoped styles in `docs.css`.
- ✓ `wpautop` fix so shortcodes render cleanly; activation flushes rewrite rules.
- ◐ TOC depends on the theme template providing `.gratis-docs-main-col` / `#doc-toc` containers (hides itself otherwise).
- ✗ No live/instant search (no AJAX search route in the plugin).
- ✗ No analytics, article feedback/voting, "Instant Answer" widget, multiple knowledge bases, role-based access, or AI write/summarize.

**Gaps (their paid-only we don't match yet):**
- Live AJAX article search + a floating "Instant Answer"-style widget.
- Article analytics (views, search terms) and helpful/not-helpful voting.
- Multiple/segregated knowledge bases and role-based (private) docs.
- AI assist (write/summarize) — which gratis-ai could supply for free.

**Make it better / simpler / advanced — for free:**
- *Advanced (free):* add an AJAX search shortcode over the `gratis_doc` CPT (WP core search + REST) — the single biggest free feature BetterDocs uses to sell upgrades.
- *Better:* add a tiny "Was this helpful? 👍/👎" control storing counts in post meta — free analytics signal.
- *Advanced (free):* wire an "Ask AI" box to gratis-ai's `/generate` or MCP RAG tool for instant answers grounded in the docs, with zero SaaS cost.
- *Simpler:* register a default block template (or fallback containers) so the TOC works out-of-the-box without a custom theme template.

---

### Cross-cutting takeaways for Group E
- **Biggest unique moat:** gratis-builder's programmatic block REST API + gratis-ai's MCP server — together they enable agent-driven page editing that paid builders (Elementor/Bricks) don't offer.
- **Highest-leverage free upgrades:** make three read-only/stub surfaces real — interactive drag-drop Kanban (gratis-project), genuine VAPID Web Push (gratis-notify), and AJAX docs search (gratis-docs). Each closes the headline gap against a paid competitor with no recurring cost.
- **Honesty fixes:** "milestones" (gratis-project header) and `serviceWorkerScript`/"push" (gratis-notify) over-promise vs. the code — either implement or soften the wording.

# Highest-Leverage Free Wins (cross-cutting)

Ranked changes that close the biggest real paid-feature gaps — or fix claims the code doesn't yet back:

1. **gratis-backup — add Restore + cloud destinations.** There is currently *no* restore path, backups are local-filesystem only, and the DB dump shells to `mysqldump` (MySQL-only → won't capture the suite's own SQLite). Restore is the #1 credibility gap vs UpdraftPlus.
2. **gratis-security — make 2FA actually enforce.** `TwoFactor::checkRequired()` is a stub and reads option `gratis_security_2fa_enabled` while Settings saves `twofa_enabled`, so TOTP never triggers. Wire verification into the login flow.
3. **gratis-db — implement the migration it only scans for.** The compatibility scanner + readiness panel exist, but `wp gratis-db plan` reports "not yet implemented." A real MySQL→SQLite migration is the headline value.
4. **gratis-forms — implement conditional logic (or drop the claim).** The plugin header advertises conditional fields; the builder/renderer only persist type/label/placeholder/required/options.
5. **gratis-reviews — emit AggregateRating.** `schemaMarkup()` emits a single Review node, not AggregateRating, so star rich-results won't trigger; add aggregate + visitor-submitted reviews.
6. **gratis-crm — add broadcast email.** It captures/segments contacts but sends no email at all; a queued `wp_mail` broadcast closes the core gap vs FluentCRM/Mailchimp.
7. **gratis-commerce — add a Settings screen + Stripe webhook signature verification + currency option** (secret currently in a bare option; currency hard-coded `usd`; webhook unverified).
8. **gratis-comply — block scripts before consent + Google Consent Mode v2.** The banner is notice-only today; real compliance needs pre-consent script gating + category toggles.
9. **Suite-wide — move high-volume logs out of autoloaded `wp_options`** (analytics, blocks, traces, consent, mail) into dedicated tables to avoid bloating every request.

See each plugin's "Make it better / simpler / advanced — for free" block above for the full per-plugin list.

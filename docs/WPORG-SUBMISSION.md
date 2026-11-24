# WordPress.org Plugin Directory Submission Readiness

Updated: 2026-11-24

## Pre-submission checks completed

1. **All 33 plugin slugs verified available** on `api.wordpress.org/plugins/info/1.2/` (0 conflicts).
2. **Official WordPress.org Plugin Check (PCP 2.2.0) run on all 33 built ZIPs** inside a clean WordPress 7.1.5 + PHP 8.5 container: **33/33 plugins have 0 PCP errors** (19/33 also have 0 warnings).
3. **Distribution ZIPs built and verified** (single top-level `{slug}/` directory, no `.git`, `tests/`, `.github/`, `.wordpress-org/`, or dev configs; all < 300 KB, well under the 10 MB WordPress.org limit):
   - Local release bundles: `/Volumes/Projects/gratis/dist/` and `/Volumes/Projects/gratis/site/downloads/`
   - Live direct downloads: `https://gratis.superglobalsdevelopment.com/downloads/`
4. **WordPress.org directory assets generated** in `{plugin}/.wordpress-org/` (`banner-772x250.png`, `banner-1544x500.png`, `icon-128x128.png`, `icon-256x256.png`, `screenshot-1.png`, `screenshot-2.png`) ready for SVN `/assets/` upload after each plugin's SVN repository is provisioned.
5. **All 34 plugin/theme GitHub repositories are PUBLIC** with passing PHP 8.1–8.6 GitHub Actions CI pipelines.

## Why the final click is manual in Chrome

`https://wordpress.org/plugins/developers/add/` is already opened in your signed-in Chrome window (`juslintek`). Because Chrome does not expose CDP or AppleScript JS execution (and WordPress.org submission requires interactive file selection, guideline attestations, and possible anti-bot checks), complete the upload click directly in Chrome.

## Recommended submission order

Start with clean, 0-error / 0-warning flagship plugins first so initial reviews move quickly:

| Priority | Plugin | ZIP file (`dist/`) | PCP Result | Repo |
|---:|---|---|---|---|
| 1 | Gratis SEO | `gratis-seo-1.0.0.zip` | 0 errors, 0 warnings | `juslintek/gratis-seo` |
| 2 | Gratis Backup | `gratis-backup-1.0.0.zip` | 0 errors, 0 warnings | `juslintek/gratis-backup` |
| 3 | Gratis Comply | `gratis-comply-1.0.0.zip` | 0 errors, 0 warnings | `juslintek/gratis-comply` |
| 4 | Gratis Mail | `gratis-mail-1.0.0.zip` | 0 errors, 0 warnings | `juslintek/gratis-mail` |
| 5 | Gratis Social | `gratis-social-1.0.0.zip` | 0 errors, 0 warnings | `juslintek/gratis-social` |
| 6 | Gratis Reviews | `gratis-reviews-1.0.0.zip` | 0 errors, 0 warnings | `juslintek/gratis-reviews` |
| 7 | Gratis Installer | `gratis-installer-1.0.0.zip` | 0 errors, 0 warnings | `juslintek/gratis-installer` |
| 8 | Gratis Security | `gratis-security-2.0.0.zip` | 0 errors, 2 warnings | `juslintek/gratis-security` |
| 9 | Gratis Builder | `gratis-builder-1.0.0.zip` | 0 errors, 1 warning | `juslintek/gratis-builder` |
| 10 | Gratis Cache | `gratis-cache-3.0.0.zip` | 0 errors, 45 warnings | `juslintek/cache-manager` |

Remaining 23 plugins (all 0 PCP errors, ZIPs ready in `/Volumes/Projects/gratis/dist/`):
`gratis-access`, `gratis-affiliate`, `gratis-ai`, `gratis-analytics`, `gratis-automation`, `gratis-booking`, `gratis-cdn`, `gratis-commerce`, `gratis-community`, `gratis-crm`, `gratis-db`, `gratis-devtools`, `gratis-events`, `gratis-fleet`, `gratis-forms`, `gratis-invoice`, `gratis-learn`, `gratis-media`, `gratis-notify`, `gratis-popup`, `gratis-project`, `gratis-tables`, `gratis-translate`.

## Steps in Chrome (per plugin)

1. Go to `https://wordpress.org/plugins/developers/add/` (already open in Chrome).
2. Choose `/Volumes/Projects/gratis/dist/gratis-seo-1.0.0.zip` (first submission).
3. Tick the WordPress.org plugin guideline confirmations and click **Upload**.
4. Confirm the automated server-side Plugin Check passes on WordPress.org, then watch your `juslintek` WordPress.org email for reviewer feedback or SVN approval.
5. After SVN approval, push `{plugin}/.wordpress-org/*` to SVN `assets/` and tag `tags/{version}/`.

> Note on WordPress.org Theme Directory: `gratis-theme-1.0.0.zip` is submitted separately via `https://wordpress.org/themes/upload/` after running Theme Check.

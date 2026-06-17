# EXPECTATIONS — behavior contract for the Gratis suite

The E2E suite (`tests/e2e/`) asserts this contract. When an expectation and reality
disagree, that's a **finding** (`docs/FINDINGS.md`). Legend:

- ✓ **verified** — asserted by a passing spec against production.
- ✗ **gap/finding** — should hold but doesn't (encoded as a skipped `test.fixme` + finding).
- ⏳ **pending deploy** — implemented in code this session, not yet on prod (skipped `@future`).
- ▢ **roadmap** — expected in the future; spec to be written by the implement loop.

Target: `https://gratis.superglobalsdevelopment.com` (prod, non-destructive) /
`http://localhost:8080` (local parity, for stateful/admin/destructive specs).

## Current — verified on production (asserted green)
- ✓ Home `/` returns 200 with a non-empty `<title>` matching `GRATIS`.
- ✓ `/docs/` returns 200 and links to >10 plugin docs; sampled doc pages return 200 with a heading.
- ✓ Unknown URLs return HTTP 404; `robots.txt` returns 200; `wp-login.php` renders the login form.
- ✓ SEO (gratis-seo): non-empty title, meta description, self-referencing canonical,
  ≥1 valid `application/ld+json` block referencing schema.org, non-empty `og:title`.
- ✓ Caching (gratis-cache): home sends a public `Cache-Control` (`max-age` + stale-while-revalidate).

## Known gaps / findings (encoded as skipped specs until fixed)
- ✗ **F-01** `og:description` is empty on the homepage (OpenGraph incomplete).
- ✗ **F-02** No security response headers (`X-Content-Type-Options`, `X-Frame-Options`/CSP, HSTS)
  even though gratis-security advertises "Security response headers (with optional CSP and HSTS)".
- ✗ **F-03** `X-Powered-By: PHP/8.5.7` is exposed (version disclosure; hardening should remove it).

## Pending deploy — implemented this session, not yet live (⏳ `@future`)
These are committed locally in the plugin repos but not pushed/deployed. The spec flips
from `fixme` to active when the plugin update ships.
- ⏳ **gratis-comply**: consent banner visible + Google Consent Mode v2 defaults pushed to `dataLayer`;
  category toggles; scripts gated before consent.
- ⏳ **gratis-reviews**: `AggregateRating` JSON-LD emitted where testimonials exist; `[gratis-review-form]`.
- ⏳ **gratis-social**: share buttons render on singular content.
- ⏳ **gratis-security**: TOTP 2FA enforced at login for admins with a secret (test on local).
- ⏳ **gratis-commerce**: settings screen; Stripe webhook rejects unsigned requests (test on local).
- ⏳ **gratis-forms**: conditional fields show/hide by rule (test on local).
- ⏳ **gratis-crm**: broadcast email queue + signed unsubscribe (test on local).
- ⏳ **gratis-backup** / **gratis-db**: restore + MySQL→SQLite migration (CLI, test on local).

## Roadmap — expected behavior the loop should add coverage for (▢)
Per-plugin observable expectations to grow toward "test everything":
- ▢ gratis-popup: popup triggers (exit-intent/scroll/delay) appear once, dismiss persists.
- ▢ gratis-seo: XML sitemap valid; per-page canonical/robots; breadcrumbs schema.
- ▢ gratis-analytics: privacy-first pageview beacon fires without cookies pre-consent.
- ▢ gratis-tables: `[gratis-table]` renders, search/sort work.
- ▢ gratis-translate: language switcher + `hreflang` alternates.
- ▢ gratis-events / booking / commerce / learn / community / invoice / affiliate / access:
  public archives render, single items render, gated content blocks for anon users.
- ▢ Accessibility budget (axe): no critical violations on home, docs, a post (mcp ui_quality_audit).
- ▢ Performance budget: Lighthouse ≥ 90 perf/SEO/best-practices on home (mcp ui_quality_audit).

> "Test everything" is reached incrementally: each loop iteration converts ▢/⏳ items into
> active specs as features deploy, and resolves ✗ findings. The suite is the source of truth.

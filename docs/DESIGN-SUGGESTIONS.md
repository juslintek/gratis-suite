# DESIGN-SUGGESTIONS — architectural improvements

Higher-level than `ADVICE.md` (which is tactical). These are structural ideas surfaced by
testing the suite; weigh against the "completely free / minimal" ethos (ponytail).

## 1. Single owner for `<head>` SEO/social output
F-01/F-04 (empty `og:description`, duplicate `og:title`) come from the **theme and
gratis-seo both writing OG tags**. Make gratis-seo the single source of truth for
title/canonical/OG/Twitter/JSON-LD; have `gratis-theme` emit nothing when gratis-seo is
active (detect + defer via a filter/constant). Prevents a whole class of duplicate-tag bugs.

## 2. Shared "platform" module for cross-cutting concerns
Several plugins need the same primitives (security headers, consent state, nonce/cap
helpers, a logger). Today each reimplements or omits them (F-02). Consider a tiny shared
`gratis-core` (or a Composer library) providing: response-header manager, consent API
(read the comply choice), structured logger (also fixes the autoloaded-options bead
`gratis-bi0`), and REST/security helpers. Keep it dependency-light.

## 3. Consent as a first-class dependency
gratis-comply now exposes Consent Mode v2 + a script-gating helper. Make
analytics/social/marketing plugins **consume** that consent state (a documented JS event +
PHP API) instead of loading trackers unconditionally. One consent source, many consumers.

## 4. Deployment pipeline with a test gate
Prod runs old code while fixes sit local (F-05). Define a pipeline: push plugin → CI runs
`verify.sh` + the relevant E2E against a disposable instance → on green, deploy. Removes the
"implemented but never shipped" gap and makes RULES #8 enforceable, not manual.

## 5. Testability hooks
Add stable, theme-independent hooks for E2E: predictable CSS classes / `data-` attributes on
plugin output (share buttons, popups, consent banner, forms), and a read-only health/version
REST endpoint per plugin (`/wp-json/gratis-x/v1/health`) so tests can assert the deployed
version. Cheap, makes "test everything" tractable.

## 6. Performance & a11y budgets in the contract
Encode Lighthouse (≥90 perf/SEO/best-practices) and axe (no critical violations) budgets in
`EXPECTATIONS.md` and assert them via `mcp-for-page-builders ui_quality_audit` on home/docs/
post. The suite advertises "100/100 PageSpeed" — make that a tested guarantee, not a claim.

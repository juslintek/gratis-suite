# FINDINGS — issues found by testing the Gratis production site

Flow: **test/recon → finding → bead → fix (local) → flip the spec green → resolve**.
Each finding has an ID (`F-NN`), a severity, evidence, the expected behavior, and a
status. Findings are encoded in `tests/e2e/` as skipped `test.fixme(... [F-NN])` so the
backlog is visible; the implement loop removes the `fixme` when fixed.

Target tested: `https://gratis.superglobalsdevelopment.com` (prod, **non-destructive**),
2026-06-17. Baseline: WordPress 7.0, PHP 8.5.7, nginx; home 200 in ~0.78s.

| ID | Sev | Area / plugin | Finding | Status |
|----|-----|---------------|---------|--------|
| F-01 | Med | SEO (gratis-seo) | Homepage `og:description` is empty | ✅ fixed on local; ⏳ prod deploy |
| F-02 | High | Security (gratis-security) | No security response headers served, though the plugin advertises "Security response headers (with optional CSP and HSTS)" | ✅ fixed on local (code OK; was inactive/cold-worker); ⏳ prod deploy + activate |
| F-03 | Low | Hardening | `X-Powered-By: PHP/8.5.7` exposed (version disclosure) | ✅ fixed on local; ⏳ prod deploy |
| F-04 | Low | SEO (gratis-seo / theme) | Duplicate `og:title` on the homepage (two tags) | ✅ fixed on local; ⏳ prod deploy |
| F-05 | Info | Suite-wide | 8 features implemented locally last session are **not deployed** to prod (see beads `gratis-cbd/mzc/dac/8tb/4qe/6m0/dx3/1yy`) | pending deploy |

## Detail

### F-02 — Missing security headers (HIGH, claim/code drift)
Evidence: `curl -D - https://gratis.superglobalsdevelopment.com/` returns `Server`,
`Cache-Control`, `Link`, `X-Powered-By` — but **no** `X-Content-Type-Options`,
`X-Frame-Options`, `Content-Security-Policy`, or `Strict-Transport-Security`.
gratis-security's readme lists "Security response headers (with optional CSP and HSTS)".
Expected: at least `X-Content-Type-Options: nosniff` and `X-Frame-Options`/CSP; HSTS over
TLS. Either the feature isn't enabled by default, isn't deployed, or doesn't emit on this
stack (FrankenPHP/nginx). Verify on local, enable sane defaults, then deploy. Spec:
`headers.spec.ts [F-02]`.

### F-01 / F-04 — OpenGraph: empty description + duplicate title (SEO)
Evidence: `og:description content=""`; two `og:title` meta tags (Playwright strict-mode
caught the duplicate). Likely the block theme and gratis-seo both emit OG tags. Expected:
gratis-seo owns OG output; description derived from excerpt/meta; exactly one of each tag.
Specs: `seo.spec.ts [F-01]`, `[F-04]`.

### F-03 — X-Powered-By disclosure (hardening)
Expected: `header_remove('X-Powered-By')` / `expose_php = Off`. Cheap win; fits
gratis-security hardening. Spec: `headers.spec.ts [F-03]`.

### F-05 — Local fixes not deployed (informational)
Last session implemented + committed locally (not pushed): security 2FA enforcement,
reviews AggregateRating, commerce settings + webhook verify, forms conditional logic,
comply Consent Mode v2 + script gating, crm broadcast, backup restore, db migration. These
are encoded as `@future` specs and will flip from `fixme` to active once deployed and
verified on local.

## Not-yet-covered (turn into findings as explored)
Popup triggers, analytics beacon, tables shortcode, translate switcher/hreflang, events/
booking/commerce/learn/community/invoice/affiliate/access public + gated flows, axe a11y
budget, Lighthouse budget. See `EXPECTATIONS.md` roadmap (▢).

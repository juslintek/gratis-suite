# ADVICE — prioritized, actionable recommendations

Derived from `FINDINGS.md` + the test run. Ordered by leverage (impact ÷ effort).
"Effort" is rough: S < 1h, M a few hours, L a day+.

## Do now (high leverage)
1. **Ship security headers (F-02, High, M).** gratis-security advertises them but prod
   serves none. Add safe defaults (`X-Content-Type-Options: nosniff`, `X-Frame-Options:
   SAMEORIGIN`, `Referrer-Policy`, opt-in CSP, HSTS over TLS). Verify the headers actually
   reach the client on the FrankenPHP/nginx stack (nginx may need to pass them through).
2. **Remove `X-Powered-By` (F-03, Low, S).** `header_remove('X-Powered-By')` early, or
   `expose_php=Off`. One-liner; reduces version disclosure.
3. **Fix OpenGraph (F-01 + F-04, Med, S–M).** Make gratis-seo the single owner of OG
   tags; have the theme defer. Populate `og:description` from the excerpt/meta. De-dup
   `og:title`.

## Do next (deploy the work already done)
4. **Deploy last session's 8 fixes — but test on local first (M).** Activate the updated
   plugins on `localhost:8080`, run the suite with `BASE_URL=http://localhost:8080`
   (incl. `ALLOW_DESTRUCTIVE=1` for admin/stateful), confirm the `@future` specs pass,
   THEN push to prod with approval (RULES #8). Especially exercise: 2FA browser login,
   commerce webhook rejection, backup restore (SQLite), db migrate (needs a MySQL source).
5. **Wire the suite into CI (S–M).** Run `tests/e2e/` (prod-safe subset) on a schedule and
   on suite changes; run `tools/verify.sh --all` on plugin pushes. Pin actions to SHAs.

## Process
6. **Adopt the loop.** Use `goals/TEST.prompt.md` to expand findings and
   `goals/IMPLEMENT-LOOP.prompt.md` to burn them down (see DESIGN.md §B). Keep the baseline
   green; every fix flips a `fixme` spec to active.
7. **Run `feature-audit.sh` across all plugins** and reconcile each advertised claim with
   `src/` — last session found several advertised-but-unimplemented features. Treat each
   mismatch as a finding.
8. **Always `tools/verify.sh` before commit; never push prod features without a green E2E
   + approval** (RULES #7, #8).

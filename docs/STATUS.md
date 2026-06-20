# STATUS — Gratis suite (updated 2026-06-18)

One board for **what was planned, what's done, and what's left**, with links to the
source-of-truth docs. Produced during the implement-loop run against local.

## Quick state
- E2E (Playwright, `tests/e2e/`): **LOCAL 19/19 · PROD 19/19 green** (deployed 2026-06-20).
- Findings **F-01–F-04: fixed, deployed, and verified on prod**.
- All 10 plugin/theme repos pushed; fixes live on gratis.superglobalsdevelopment.com.

## Done ✅
### Workflow system — committed + pushed to gratis-suite (`5e451ab`)
LESSONS / RULES / DESIGN / EXPECTATIONS; `tools/` (verify, suite, feature-audit, loop);
Playwright E2E suite; `goals/` (TEST, IMPLEMENT-LOOP); `docs/` (FINDINGS, ADVICE, DESIGN-SUGGESTIONS).

### Findings burned down this run (verified on local — 19/19 green)
| ID | Fix | Where | Evidence (local) |
|----|-----|-------|------------------|
| F-01 | og:description filled from tagline fallback | gratis-seo `MetaTags.php` | og:description = "Free WordPress Performance Suite" |
| F-04 | gratis-seo is sole owner of OG/canonical; theme defers; core `rel_canonical` removed | gratis-seo + gratis-theme | og:title ×1, canonical ×1 |
| F-02 | code already correct (headers emit when active); earlier gap was cold-worker transient | gratis-security `Headers.php` | X-Frame-Options 5/5 stable |
| F-03 | `header_remove('X-Powered-By')` | gratis-security `Headers.php` | header gone |

### Features verified on local (from prior session)
- **comply**: consent banner `#gratis-consent` + Google Consent Mode v2 default in `dataLayer` ✅
- **reviews**: `AggregateRating` JSON-LD on `/reviews/` (seeded page id 130, 3 testimonials) ✅
- **social**: `.gratis-share` buttons on docs (after `post_types` config) ✅
- **security 2FA, commerce settings/webhook, forms conditional, crm broadcast, backup restore, db migration**: implemented + lint-clean last session (CLI/admin paths; not in the public E2E yet).

## Left ▢
1. ✅ **Deploy to prod — DONE 2026-06-20**: code rsynced to the bind-mount + 10 repos pushed;
   gratis-security activated, gratis-social post types set, Reviews page (id 123) created; container
   restarted. **Prod E2E 19/19.** Rollback: `/opt/gratis/backups/ht.sqlite.predeploy-20260620-153557`.
2. **gratis-theme PHPCS debt**: 16 pre-existing violations in `functions.php` (NOT from this change —
   my lines 24–32 are clean). Tracked as a bead.
3. **Roadmap coverage** (`EXPECTATIONS.md` ▢): popups, analytics beacon, tables, translate,
   events/booking/commerce/learn archives, axe + Lighthouse budgets — grown by the loop.

## Where to read what
| Question | File |
|----------|------|
| Expected behavior (the contract) | `EXPECTATIONS.md` |
| Issues + status | `docs/FINDINGS.md` |
| Recommendations / structural ideas | `docs/ADVICE.md`, `docs/DESIGN-SUGGESTIONS.md` |
| How to test / run the loop | `goals/TEST.prompt.md`, `goals/IMPLEMENT-LOOP.prompt.md` |
| Rules / architecture / lessons | `RULES.md`, `DESIGN.md`, `LESSONS.md` |
| Task tracking | `bd list` (free-win + finding beads) |
| Screenshots | `docs/screenshots/` |

## Reproduce
```sh
cd gratis-suite/tests/e2e
BASE_URL=http://localhost:8080 npm test   # 19/19 green
npm test                                   # prod: 12/19 (7 = deploy backlog)
```

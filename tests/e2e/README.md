# Gratis E2E (Playwright)

Fast, headless, parallel end-to-end + smoke tests for the Gratis suite.

## Run
```sh
npm install                 # or: npm ci
npm run install:browser     # one-time: download chromium
npm test                    # against production (default BASE_URL), non-destructive only
BASE_URL=http://localhost:8080 npm test    # against the local parity site
ALLOW_DESTRUCTIVE=1 BASE_URL=http://localhost:8080 npm test   # include @destructive specs (LOCAL only)
```

## Env
- `BASE_URL` — target site. Default: `https://gratis.superglobalsdevelopment.com`.
- `ALLOW_DESTRUCTIVE=1` — enable specs tagged `@destructive` (writes data) — **local only, never prod**.

## Conventions
- `specs/*.spec.ts` — one file per concern (smoke, seo, content, …).
- `@future` — asserts behavior that is implemented in code but **not yet deployed**.
  Skipped by default; flip on as features ship. Tracked in `../../EXPECTATIONS.md`.
- `@destructive` — mutates data; only runs with `ALLOW_DESTRUCTIVE=1`, only against local.
- **Production runs MUST be non-destructive** (see `../../RULES.md` #14).

## Output
- `playwright-report/` (HTML, `npm run report`), `test-results/results.json`.

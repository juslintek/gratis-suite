# DESIGN — architecture, workflows & tooling for the Gratis suite

Pair with `RULES.md` (hard rules) and `LESSONS.md` (retrospective).

## Architecture (one screen)
- **~35 independent plugin repos** + `gratis-theme` (block theme) live under one
  workspace. **`gratis-suite` is the META repo** (this one): cross-suite docs, `tools/`,
  `tests/e2e/`, `goals/`, `docs/`, and Docker/infra. The **workspace root is not a git
  repo** — each plugin and the suite are separate repos.
- **Bundle is completely free** — no pricing page, no "Pro" tier, no locked features.
- **Production landing:** https://gratis.superglobalsdevelopment.com — FrankenPHP
  (PHP 8.6; image supports PHP 8.5 & 8.6 via `PHP_VERSION`) + **SQLite** in a Docker
  container behind system **nginx** (TLS). WP core is baked into the image; plugins +
  theme are bind-mounted; SQLite DB + uploads in volumes.
- **Local dev:** http://localhost:8080 — the **same** FrankenPHP+SQLite stack (parity),
  started via `start.sh`. **This is the safe target for destructive tests.**
- Infra/env specifics live in `~/.kiro/steering/gratis-local-env.md`.

## Tooling — what it is, when to use it, how
### `tools/verify.sh` — lint/verify gate (php -l + PHPCS)
- **When:** before every commit; after any code change; inside the implement loop.
- **How:** `tools/verify.sh` (changed repos) · `--all` · `gratis-security gratis-forms`
  (named). Exit nonzero on any failure.

### `tools/suite.sh` — multi-repo operations (34 plugins)
- **When:** surveying state, or running one command everywhere.
- **How:** `suite.sh status` · `list` · `foreach '<cmd>'` (`$REPO` is set) · `lint`.

### `tools/feature-audit.sh` — advertised-claim extractor
- **When:** auditing claim/code drift (start of a QA/competitive pass) before trusting a
  README.
- **How:** `feature-audit.sh [gratis-x …]`. It **lists** claims; you verify them in `src/`.
  (ceiling: extraction only — not a verifier.)

### Browser tooling — pick the fastest fit
| Need | Use | Why |
|---|---|---|
| Durable, repeatable assertions (regression net) | **Playwright** (`tests/e2e/`) | Headless chromium + parallel workers = fastest repeatable runs; CI-able |
| Agent-driven exploration, one-off flows, login w/ profile | **PinchTab** (MCP) | Token-efficient, stable refs (`e5`), low-lag interactive |
| Visual parity, a11y, Lighthouse | **mcp-for-page-builders** (MCP) | `screenshot`/`visual_diff`/`ui_quality_audit` |

Rule of thumb: **durable check → Playwright; exploratory/visual → PinchTab/mcp.**

## Workflows
### A. Subagent fan-out (cross-suite changes)
One subagent **per repo/concern**. Each: read source → minimal WP-idiomatic patch →
verify (php -l + PHPCS) → **do not commit** → report files + caveats. Then **you**
re-verify with `tools/verify.sh` and commit. (8 plugins were implemented this way in one
pass.)

### B. Test → findings → implement feedback loop
1. **TEST** (`goals/TEST.prompt.md`): run `tests/e2e/` + exploratory PinchTab/mcp against
   the target; append structured results to `docs/FINDINGS.md` (+ `docs/ADVICE.md`,
   `docs/DESIGN-SUGGESTIONS.md`).
2. **`EXPECTATIONS.md`** is the behavior contract (current + future). A failing
   expectation becomes a finding.
3. **IMPLEMENT** (`goals/IMPLEMENT-LOOP.prompt.md`): pick the top finding → file/claim a
   bead → fix on a branch (local) → `verify.sh` → re-run the relevant E2E → update
   docs/beads → repeat. **Never auto-push to prod** (RULES #8); surface for approval.
4. `tools/loop.sh` drives this safely (bounded iterations). **ralph-tui** is the
   recommended driver for an indefinite loop.

### C. Data migration / infra
DB-level copy + verify counts (RULES #10); confirm target first (RULES #3); back up first
(RULES #4); explain risk + get approval for production changes.

## Docs map
- `RULES.md` — hard rules · `LESSONS.md` — retrospective · `DESIGN.md` — this file.
- `EXPECTATIONS.md` — behavior contract the E2E suite asserts.
- `docs/FINDINGS.md` · `docs/ADVICE.md` · `docs/DESIGN-SUGGESTIONS.md` — feedback-loop outputs.
- `COMPETITION.md` · `FEATURES.md` · `MONETIZATION_RESEARCH.md` · `ARCHITECTURE.md` — product/strategy.
- `goals/TEST.prompt.md` · `goals/IMPLEMENT-LOOP.prompt.md` — reusable goal prompts.

# LESSONS — Working notes for agents/devs on the Gratis suite

Distilled from real sessions. Pair with `RULES.md` (hard rules) and `DESIGN.md`
(architecture + workflows + when to use each tool). Append new lessons; do not
rewrite history.

## What works (keep doing)

- **Subagent fan-out, one repo per agent.** Large cross-suite work (competitive
  analysis, multi-plugin fixes) parallelizes cleanly when each agent owns exactly
  one repo/concern and returns a verified, uncommitted patch. 8 plugins were
  implemented in one pass this way, each `php -l` + PHPCS clean.
- **Source-grounding beats trusting docs.** Reading actual source caught features
  that READMEs/headers advertised but the code did not deliver (see below). Never
  describe or compare a feature from its marketing copy — verify against source.
- **Independent re-verification before commit.** Re-run `php -l` + PHPCS yourself
  (via `tools/verify.sh`) even when a subagent claims clean. Trust, but verify.
- **Hold risky pushes.** Production plugins carry a deploy workflow. Commit locally
  to preserve work; do not push feature changes to `main` without a test pass and
  explicit approval.
- **Faithful data handling.** Back up before changes; for content migration use a
  DB-level row copy and verify row counts.

## What went wrong (and the rule it produced)

| Incident | Lesson → Rule |
|---|---|
| Created a DNS record on the **wrong host** (t.zelkai.com) before confirming target | Confirm exact target (host/repo/branch/env) before any infra/destructive op. (RULES #2) |
| **WXR import was lossy** — silently dropped `public=false` CPTs; redo as PDO copy | For content fidelity, copy at the DB level and verify counts; WXR is lossy. (RULES #7) |
| **Coupled generation with `rm -f` cleanup** in one command; a cancel nearly lost output | Never couple producing output with destructive cleanup; clean up only after verifying output landed. (RULES #5) |
| Suite shipped **advertised-but-unimplemented** features + a silent 2FA option-name mismatch | No regression net → build the E2E suite + `feature-audit.sh`; treat advertised features as a test contract. (RULES #6) |
| **Retyped multi-repo loops** (status/lint/commit) repeatedly | Codify as `tools/suite.sh` + `tools/verify.sh`. |

## Claim/code drift found in the suite (verified from source — fix tracked as beads)

- gratis-security: 2FA was a stub **and** read the wrong option name (`gratis_security_2fa_enabled` vs saved `twofa_enabled`) — silently disabled.
- gratis-backup: no restore at all; DB dump was `mysqldump`-only (couldn't capture the suite's own SQLite backend).
- gratis-forms: conditional-logic was advertised, not implemented.
- gratis-reviews: emitted a single `Review` node (no `AggregateRating` → no star rich-results).
- gratis-crm: captured contacts but sent no email.
- gratis-commerce: no settings screen, no Stripe webhook signature verification, currency hard-coded `usd`.
- gratis-comply: notice-only banner (no real script gating / Consent Mode).
- gratis-db: compatibility scanner present but migration was a stub.

These were addressed in a follow-up session (committed locally, pending real-WP
test + push). The point for the future: **a feature is not done until a test
asserts it.** That is what `tests/e2e/` + `EXPECTATIONS.md` enforce going forward.

## Improvements implemented from these lessons

1. `tools/verify.sh` — one-command `php -l` + PHPCS gate (changed repos / `--all` / named).
2. `tools/suite.sh` — multi-repo status / foreach / lint.
3. `tools/feature-audit.sh` — extract advertised claims per plugin for source cross-check.
4. `RULES.md` — hard rules; `DESIGN.md` — workflows + tool usage/when.
5. `tests/e2e/` Playwright suite + `EXPECTATIONS.md` — regression net & behavior contract.
6. `goals/TEST.prompt.md` + `goals/IMPLEMENT-LOOP.prompt.md` — the test→findings→implement feedback loop.

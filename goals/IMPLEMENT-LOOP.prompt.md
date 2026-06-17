# GOAL PROMPT — Implement findings with a feedback loop

Drive open findings/expectations to DONE by implementing fixes, one at a time, with a test
feedback loop. Designed to run repeatedly (indefinitely) until nothing is open.

## Read first
- `gratis-suite/RULES.md` — esp. #7 (verify before commit), #8 (never push prod features
  without a green E2E + approval), #14 (non-destructive prod).
- `gratis-suite/DESIGN.md` — § B feedback loop, § A subagent fan-out.
- `gratis-suite/docs/FINDINGS.md` + `EXPECTATIONS.md` — the work queue.

## One iteration
1. **SELECT** the highest-priority open item: a finding (`F-NN`, by severity), a `@future`/
   `fixme` spec, or an open bead (e.g. the `free-win` set). If none remain → DONE.
2. **CLAIM:** `bd update <id> --status=in_progress` (file a bead if none exists).
3. **IMPLEMENT** the minimal, WP-idiomatic fix in the plugin repo (nonce + capability +
   sanitize + escape). For independent multi-plugin work, fan out one subagent per repo
   (DESIGN §A). Confirm the branch first (RULES #9).
4. **VERIFY:** `tools/verify.sh <repo>` (php -l + PHPCS) — must be clean. Keep a self-check
   for non-trivial logic.
5. **PROVE on LOCAL:** deploy to `localhost:8080` (activate/restart), flip the matching spec
   from `test.fixme` to active, run `BASE_URL=http://localhost:8080 npm test`
   (`ALLOW_DESTRUCTIVE=1` for stateful specs). The spec must pass; the whole suite stays green.
6. **RECORD:** mark the finding resolved in `docs/FINDINGS.md`, update `EXPECTATIONS.md`
   (✗/⏳ → ✓), `bd close <id>`, commit locally with a clear message.
7. **STOP at the deploy gate:** do NOT push to prod/main. When a batch is green on local,
   present it for approval + deploy (RULES #8). Then loop to the next item.

## Guardrails (hard)
- Never push feature changes to prod/main without a green local E2E AND explicit approval.
- Never run destructive specs against prod; `localhost:8080` only.
- Never bypass hooks or mask a failing gate — fix the cause.
- If blocked (needs a secret, prod access, a human decision) → record it in
  `docs/FINDINGS.md`, surface it, and move to the next item.

## Success criteria (done when ALL hold)
- Every open finding is resolved (spec active + green on local) or explicitly blocked with a reason.
- No `test.fixme` remains except items documented as blocked/pending-approval.
- `tools/verify.sh --all` clean; full suite green on local.
- A summary lists fixed / awaiting-prod-approval / blocked.

## Running it indefinitely
- **Manual:** re-invoke this goal; the completion contract re-prompts until the criteria hold.
- **Unattended:** drive with **ralph-tui** (see the `ralph-tui` skill) using this file as the
  prompt and the finding/`free-win` beads as the task source; or use `tools/loop.sh` as a
  bounded gate between iterations. The loop ALWAYS stops at the prod-deploy approval gate.

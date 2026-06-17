# RULES — hard rules for the Gratis suite

Non-negotiable. These encode real incidents (see `LESSONS.md`). General code-review
rules also apply (`~/.kiro/steering/code-review-lessons.md`); shell safety
(`~/.kiro/steering/shell-tool-safety.md`); git-over-SSH (`~/.kiro/steering/git-ssh.md`);
lazy/minimal authoring (`~/.kiro/steering/ponytail.md`).

## Truth & honesty
1. **Source-ground every claim.** Never describe, compare, or document a feature from
   its plugin header or README — verify it against `src/`. Use `tools/feature-audit.sh`
   to list advertised claims, then read the code to confirm each.
2. **A feature isn't done until a test asserts it** — an `tests/e2e/` spec or a
   self-check. Advertised-but-unimplemented behavior is a bug, not a feature.

## Targets & destructive operations
3. **Confirm the exact target before any infra/destructive op** — host, repo, branch,
   environment. (A DNS record was once created on the wrong host.)
4. **Back up before changing data; verify after** (row counts / integrity). Production
   data loss is the worst outcome — never trade it for speed.
5. **Never couple producing output with destructive cleanup in one command** (e.g.
   build a file then `rm` its sources). Clean up only after verifying the output landed.

## Git & deploys
6. **git over SSH only**, never HTTPS.
7. **Run `tools/verify.sh` before every commit** (php -l + PHPCS). Never bypass hooks
   (no `--no-verify`); never mask a gate (no `|| true` around tests/lint/build).
8. **Do not push feature changes to `main` of production plugins** without (a) a green
   E2E pass and (b) explicit human approval — these repos can auto-deploy.
9. **Confirm the branch** (`git branch --show-current`) before a batch of edits.

## Data fidelity
10. **Migrate content at the DB level and verify row counts** — WXR import is lossy
    (silently drops `public=false` CPTs).

## Secrets, safety, quality
11. **Never store secret VALUES** in tracked files, docs, or steering — reference by
    name (env var / ssh alias) only.
12. **Never run interactive commands via the shell tool** (sudo prompts, REPLs, pagers,
    login flows) — they hang the session. Redirect stdin from `/dev/null`, use timeouts,
    or hand the command to the user.
13. **Security & accessibility are not optional.** Every WP I/O path: nonce + capability
    check + sanitize input + escape output. Flag any unauthenticated endpoint. Generated
    markup must be accessible.

## Testing production
14. **E2E against production (`gratis.superglobalsdevelopment.com`) must be
    NON-DESTRUCTIVE** — no data writes, no real form submissions that email, no admin
    mutations. Run destructive / admin / stateful specs against the **local** parity
    site (`http://localhost:8080`) only, with cleanup.

# GOAL PROMPT — Test the Gratis production site

Reusable goal: test `https://gratis.superglobalsdevelopment.com` end-to-end and record
findings. Run it whenever you want a fresh pass. **Hyper-fast, low-lag tools only.**

## Read first
- `gratis-suite/RULES.md` — esp. #14 (prod testing MUST be non-destructive).
- `gratis-suite/DESIGN.md` — § tooling (Playwright vs PinchTab vs mcp), § B feedback loop.
- `gratis-suite/EXPECTATIONS.md` — the behavior contract.
- `gratis-suite/docs/FINDINGS.md` — don't duplicate existing findings.

## Tools — pick the fastest fit
- **Durable assertions → Playwright:** `cd gratis-suite/tests/e2e && npm test`
  (prod by default; `BASE_URL=http://localhost:8080` for local; `ALLOW_DESTRUCTIVE=1` local only).
- **Exploration / flows / login → PinchTab MCP** (stable refs like `e5`, token-efficient, low-lag).
- **Visual + a11y + Lighthouse → mcp-for-page-builders** `ui_quality_audit`.

## Do
1. Run the Playwright suite against prod; record pass/skip/fail counts.
2. Explore surfaces the suite doesn't cover yet (EXPECTATIONS ▢ roadmap): popups, search,
   tables, translate switcher, analytics beacon, nav, forms render, and archives/single for
   events/booking/commerce/learn/community. Use PinchTab for clicks, mcp for visual/a11y.
3. For EACH gap/bug:
   - Append a finding to `docs/FINDINGS.md` (next `F-NN`: severity, evidence, expected, status).
   - Add/adjust an `EXPECTATIONS.md` entry.
   - Encode it as a skipped `test.fixme(... [F-NN])` in the right spec (the desired behavior).
   - Update `docs/ADVICE.md` (tactical) / `docs/DESIGN-SUGGESTIONS.md` (structural) if warranted.
4. Stateful/admin/destructive checks: ONLY against `localhost:8080` with `ALLOW_DESTRUCTIVE=1`
   and cleanup. NEVER mutate prod (no form submits that email, no admin changes).
5. Keep the baseline green: new known-bad behavior goes in as `fixme`, never a hard failure.

## Success criteria (done when ALL hold)
- A full `npm test` run was executed and its result recorded (cite counts).
- ≥5 not-yet-covered roadmap surfaces were explored, each asserted (new passing spec) or
  recorded as a finding + `fixme` spec.
- `docs/FINDINGS.md` updated with any new `F-NN` (or an explicit "no new findings" note).
- No production data was mutated (state how you ensured this).
- `tools/verify.sh` still clean if any PHP was touched.

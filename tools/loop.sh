#!/usr/bin/env sh
# loop.sh — feedback-loop GATE/runner for the implement loop (see goals/IMPLEMENT-LOOP.prompt.md).
#
# It is the gate the loop checks, not the LLM itself. Each pass it:
#   1) runs tools/verify.sh --all   (php -l + PHPCS across all plugins)
#   2) runs the E2E suite against TARGET (default: local parity site)
#   3) counts remaining `test.fixme` specs (the open backlog)
# Exit 0 = DONE (verify clean, suite green, zero fixme). Exit 1 = work remains.
#
# Bounded driver: pass --agent-cmd "<cmd>" to run your agent (e.g. a kiro CLI invocation of
# goals/IMPLEMENT-LOOP.prompt.md) before each gate check, up to --max iterations. Without
# --agent-cmd it reports status once. For unattended runs, ralph-tui is recommended.
# This runner NEVER deploys/pushes — it only verifies and reports (RULES #8).
#
# Usage:
#   tools/loop.sh                            # one status check against local
#   tools/loop.sh --target prod              # gate against production (read-only)
#   tools/loop.sh --max 10 --agent-cmd "..." # bounded loop: agent then gate, until DONE/max
set -eu

SCRIPT_DIR=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
SUITE_DIR=$(cd -- "$SCRIPT_DIR/.." && pwd)
E2E="$SUITE_DIR/tests/e2e"

TARGET=local; MAX=1; AGENT=""
while [ "$#" -gt 0 ]; do
  case "$1" in
    --target) TARGET="${2:-local}"; shift 2 ;;
    --max) MAX="${2:-1}"; shift 2 ;;
    --agent-cmd) AGENT="${2:-}"; shift 2 ;;
    -h|--help) sed -n '2,22p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done
case "$TARGET" in
  prod) BASE_URL=https://gratis.superglobalsdevelopment.com ;;
  local) BASE_URL=http://localhost:8080 ;;
  http://*|https://*) BASE_URL="$TARGET" ;;
  *) echo "bad --target: $TARGET (use local|prod|<url>)" >&2; exit 2 ;;
esac

gate() {
  echo "-- verify --"; sh "$SCRIPT_DIR/verify.sh" --all || return 1
  echo "-- e2e ($BASE_URL) --"; ( cd "$E2E" && BASE_URL="$BASE_URL" npm test ) || return 1
  fixmes=$(grep -rEc 'test\.fixme' "$E2E/specs" 2>/dev/null | awk -F: '{s+=$2} END{print s+0}')
  echo "remaining fixme specs (backlog): $fixmes"
  [ "$fixmes" -eq 0 ]
}

i=0
while :; do
  i=$((i + 1))
  if [ -n "$AGENT" ]; then echo "=== iteration $i: agent ==="; sh -c "$AGENT" || echo "(agent step exit $?)"; fi
  echo "=== iteration $i: gate ($TARGET) ==="
  if gate; then echo "DONE — verify clean, suite green, no fixme backlog."; exit 0; fi
  if [ -z "$AGENT" ]; then echo "WORK REMAINS — see output above."; exit 1; fi
  if [ "$i" -ge "$MAX" ]; then echo "Reached --max $MAX with work remaining."; exit 1; fi
done

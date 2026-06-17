#!/usr/bin/env sh
# suite.sh — multi-repo helper for the Gratis plugin suite (35 repos).
#
# Usage:
#   tools/suite.sh status            branch + dirty count for every gratis-* repo
#   tools/suite.sh list              print repo names (one per line)
#   tools/suite.sh foreach <cmd...>  run a shell command in each repo ($REPO is set)
#   tools/suite.sh lint [args]       delegate to verify.sh (default: changed repos)
#   tools/suite.sh -h | --help
#
# Paths resolved from this script's location — no hardcoded machine paths.
set -eu

SCRIPT_DIR=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
SUITE_DIR=$(cd -- "$SCRIPT_DIR/.." && pwd)
WORKSPACE=$(cd -- "$SUITE_DIR/.." && pwd)
SELF=$(basename "$SUITE_DIR")          # meta repo — not a plugin; skip in scans

usage() { sed -n '2,11p' "$0" | sed 's/^# \{0,1\}//'; }
repos() { for d in "$WORKSPACE"/gratis-*/; do [ -d "${d}.git" ] || continue; [ "$(basename "${d%/}")" = "$SELF" ] && continue; basename "${d%/}"; done; }

cmd="${1:-status}"
[ "$#" -gt 0 ] && shift || true

case "$cmd" in
  -h|--help) usage ;;
  list) repos ;;
  status)
    printf '%-22s %-18s %s\n' REPO BRANCH DIRTY
    for r in $(repos); do
      d="$WORKSPACE/$r"
      b=$(git -C "$d" branch --show-current 2>/dev/null || echo '?')
      dirty=$(git -C "$d" status --porcelain 2>/dev/null | wc -l | tr -d ' ')
      printf '%-22s %-18s %s\n' "$r" "$b" "$dirty"
    done ;;
  foreach)
    [ "$#" -gt 0 ] || { echo "usage: suite.sh foreach <cmd...>" >&2; exit 2; }
    rc=0
    for r in $(repos); do
      REPO="$r"; export REPO
      printf '=== %s ===\n' "$r"
      ( cd "$WORKSPACE/$r" && sh -c "$*" ) || { echo "  (exit $?)"; rc=1; }
    done
    exit "$rc" ;;
  lint) sh "$SCRIPT_DIR/verify.sh" "$@" ;;
  *) echo "unknown command: $cmd" >&2; usage; exit 2 ;;
esac

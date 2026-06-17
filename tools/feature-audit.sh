#!/usr/bin/env sh
# feature-audit.sh — surface ADVERTISED feature claims per plugin for source cross-check.
#
# Prints each plugin's header (Plugin Name / Description / Version) plus readme
# feature bullets, so you can verify each advertised claim against actual code.
# It does NOT verify implementation — that is an agent/dev reading the source.
# ponytail: claim EXTRACTOR only; the real audit is a human/agent reading src/.
#
# Usage:
#   tools/feature-audit.sh [<plugin>...]   default: all gratis-* repos
#   tools/feature-audit.sh -h | --help
set -eu

SCRIPT_DIR=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
SUITE_DIR=$(cd -- "$SCRIPT_DIR/.." && pwd)
WORKSPACE=$(cd -- "$SUITE_DIR/.." && pwd)

usage() { sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'; }
case "${1:-}" in -h|--help) usage; exit 0 ;; esac

SELF=$(basename "$SUITE_DIR")          # meta repo — not a plugin
list="$*"
[ -n "$list" ] || list=$(for d in "$WORKSPACE"/gratis-*/; do [ -d "${d}.git" ] || continue; [ "$(basename "${d%/}")" = "$SELF" ] && continue; basename "${d%/}"; done)

for name in $list; do
  repo="$WORKSPACE/$name"
  [ -d "$repo" ] || { echo "skip $name (not found)"; continue; }
  printf '\n===== %s =====\n' "$name"
  main=$(grep -rlE '^[[:space:]]*\*?[[:space:]]*Plugin Name:' "$repo"/*.php 2>/dev/null | head -1 || true)
  if [ -n "$main" ]; then
    grep -E '^[[:space:]]*\*?[[:space:]]*(Plugin Name|Description|Version):' "$main" 2>/dev/null \
      | sed 's/^[[:space:]]*\*\{0,1\}[[:space:]]*/  /'
  else
    echo "  (no plugin header found)"
  fi
  rd=""
  for cand in "$repo/readme.txt" "$repo/README.md"; do [ -f "$cand" ] && { rd="$cand"; break; }; done
  if [ -n "$rd" ]; then
    echo "  -- readme feature/claim lines ($(basename "$rd")) --"
    grep -nE '^[[:space:]]*[-*][[:space:]]|[Ff]eatures|✓|✅|[ Rr]eplaces' "$rd" 2>/dev/null \
      | head -25 | sed 's/^/    /' || echo "    (none)"
  fi
done

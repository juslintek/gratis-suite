#!/usr/bin/env sh
# verify.sh — Gratis suite lint/verify gate: `php -l` + PHPCS for plugin repos.
#
# Usage:
#   tools/verify.sh                 verify repos with uncommitted changes (php -l on CHANGED files)
#   tools/verify.sh --all           verify every gratis-* repo (php -l on ALL files)
#   tools/verify.sh <repo>...       verify named repos (php -l on ALL files), e.g. gratis-security
#   tools/verify.sh -h | --help
#
# Exit: 0 = all clean, 1 = php -l or PHPCS failure, 2 = usage/env error.
# Paths are resolved from this script's location — no hardcoded machine paths.
# ponytail: word-split file lists assume no spaces in .php paths (true for WP plugins).
set -eu

SCRIPT_DIR=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
SUITE_DIR=$(cd -- "$SCRIPT_DIR/.." && pwd)
WORKSPACE=$(cd -- "$SUITE_DIR/.." && pwd)
SELF=$(basename "$SUITE_DIR")          # meta repo (gratis-suite) — not a plugin; skip in scans
PHPCS="$WORKSPACE/vendor/bin/phpcs"

usage() { sed -n '2,11p' "$0" | sed 's/^# \{0,1\}//'; }
case "${1:-}" in -h|--help) usage; exit 0 ;; esac

command -v php >/dev/null 2>&1 || { echo "ERROR: php not on PATH" >&2; exit 2; }
[ -x "$PHPCS" ] || { echo "ERROR: phpcs not found/executable at $PHPCS" >&2; exit 2; }

scope=changed
repos=""
if [ "${1:-}" = "--all" ]; then
  scope=all
  for d in "$WORKSPACE"/gratis-*/; do
    [ -d "${d}.git" ] || continue
    [ "$(basename "${d%/}")" = "$SELF" ] && continue
    repos="$repos ${d%/}"
  done
elif [ "$#" -gt 0 ] && [ "${1#-}" = "$1" ]; then
  scope=all
  for a in "$@"; do
    [ -d "$WORKSPACE/$a/.git" ] || { echo "ERROR: not a repo: $a" >&2; exit 2; }
    repos="$repos $WORKSPACE/$a"
  done
else
  for d in "$WORKSPACE"/gratis-*/; do
    [ -d "${d}.git" ] || continue
    [ "$(basename "${d%/}")" = "$SELF" ] && continue
    [ -n "$(git -C "${d%/}" status --porcelain 2>/dev/null)" ] && repos="$repos ${d%/}"
  done
fi

[ -n "$repos" ] || { echo "Nothing to verify (no matching repos)."; exit 0; }

fail=0
for repo in $repos; do
  name=$(basename "$repo")
  printf '=== %s ===\n' "$name"
  if [ "$scope" = changed ]; then
    files=$(git -C "$repo" status --porcelain | sed 's/^...//' | grep '\.php$' | sed "s#^#$repo/#" || true)
  else
    files=$(find "$repo" -name '*.php' ! -path '*/vendor/*' ! -path '*/node_modules/*' 2>/dev/null || true)
  fi
  lf=0
  for f in $files; do
    [ -f "$f" ] || continue
    php -l "$f" >/dev/null 2>&1 || { echo "  php -l FAIL: ${f#"$repo"/}"; lf=1; }
  done
  if [ "$lf" = 0 ]; then echo "  php -l: pass"; else fail=1; fi
  if ( cd "$WORKSPACE" && "$PHPCS" "$name" >/dev/null 2>&1 ); then
    echo "  phpcs:  clean"
  else
    echo "  phpcs:  VIOLATIONS  (details: cd $WORKSPACE && vendor/bin/phpcs $name)"
    fail=1
  fi
done

if [ "$fail" = 0 ]; then echo "ALL CLEAN"; else echo "FAILURES FOUND"; fi
exit "$fail"

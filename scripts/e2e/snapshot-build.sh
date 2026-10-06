#!/usr/bin/env bash
# Build the app once and copy it to a private folder, so a parallel agent's rebuild of dist/ can't
# break this agent's running e2e. Usage (Git Bash):
#
#   APP=$(bash scripts/e2e/snapshot-build.sh <name>)      # prints the snapshot folder
#   E2E_APP_DIR="$APP" npx tsx scripts/e2e/<script>.ts
#
# Builds are serialised with a lock folder; node_modules is linked, not copied.
set -euo pipefail
if [ "${1:-}" = "--remove" ]; then
  d="${TEMP:-/tmp}/oyelearn-snap-${2:?name}"
  if [ -e "$d/node_modules" ] || [ -L "$d/node_modules" ]; then
    if command -v cmd >/dev/null 2>&1; then cmd //c rmdir "$(cygpath -w "$d/node_modules")" >/dev/null; else rm "$d/node_modules"; fi
  fi
  [ -e "$d/node_modules" ] && { echo "refusing: node_modules link still there" >&2; exit 1; }
  rm -rf "$d"; exit 0
fi
name="${1:?usage: snapshot-build.sh <name> | --remove <name>}"
repo="$(cd "$(dirname "$0")/../.." && pwd)"
tmp="${TEMP:-/tmp}"
lock="$tmp/oyelearn-build.lock"
dest="$tmp/oyelearn-snap-$name"

for i in $(seq 1 600); do mkdir "$lock" 2>/dev/null && break; sleep 2; done
trap 'rmdir "$lock" 2>/dev/null || true' EXIT
cd "$repo"
# No tsc here: a parallel agent's unfinished types must not block a snapshot (CI still type-checks).
{ node scripts/content/build-manifest.mjs && node scripts/content/build-server-content.mjs && npx vite build && node scripts/build-server.mjs; } >"$tmp/oyelearn-snap-$name.build.log" 2>&1
# Unlink node_modules FIRST: rm -rf through a junction/symlink would delete the real node_modules.
if [ -e "$dest/node_modules" ] || [ -L "$dest/node_modules" ]; then
  if command -v cmd >/dev/null 2>&1; then cmd //c rmdir "$(cygpath -w "$dest/node_modules")" >/dev/null; else rm "$dest/node_modules"; fi
fi
[ -e "$dest/node_modules" ] && { echo "refusing: $dest/node_modules is still there" >&2; exit 1; }
rm -rf "$dest"; mkdir -p "$dest"
tar --exclude=./node_modules --exclude=./.git --exclude=./docs -cf - . | (cd "$dest" && tar -xf -)
rmdir "$lock" 2>/dev/null || true
trap - EXIT
if command -v cmd >/dev/null 2>&1; then
  cmd //c mklink //J "$(cygpath -w "$dest/node_modules")" "$(cygpath -w "$repo/node_modules")" >/dev/null
else
  ln -s "$repo/node_modules" "$dest/node_modules"
fi
echo "$dest"
# Clean up later with:  bash scripts/e2e/snapshot-build.sh --remove <name>   (see top of file)

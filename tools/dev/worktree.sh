#!/usr/bin/env bash
# Makes a git worktree that can build and test on its own: it shares the main tree's node_modules
# (symlinked), but keeps its own workspace links and build caches.
# Usage: tools/dev/worktree.sh <dir> <branch>
set -euo pipefail
main="$(cd "$(dirname "$0")/../.." && pwd)"
dir="$1"
branch="$2"
git -C "$main" worktree add -b "$branch" "$dir" HEAD
mkdir -p "$dir/node_modules/@whs"
for e in "$main"/node_modules/* "$main"/node_modules/.bin; do
  n="$(basename "$e")"
  [ "$n" = "@whs" ] && continue
  ln -s "$e" "$dir/node_modules/$n"
done
ln -s ../../packages/core "$dir/node_modules/@whs/core"
ln -s ../../apps/game "$dir/node_modules/@whs/game"
echo "worktree ready: $dir ($branch)"

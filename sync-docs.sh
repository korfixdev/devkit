#!/bin/bash
# Sync bundled docs/ from the korfix-docs repo (ENGLISH source).
# The plugin ships in English, so we mirror src/en/* (not src/ru/*).
# Run after editing korfix-docs/src/en/{miniapps,gamedev}/, then commit both repos.
#
# Note: korfix-docs reorganised src/ into src/en + src/ru. The old single
# src/miniapps path no longer exists — always sync from src/en here.

ROOT="$(dirname "$0")"
SRC_BASE="$ROOT/../korfix-docs/src/en"

sync_one() {
    local name="$1"
    local src="$SRC_BASE/$name"
    local dst="$ROOT/docs/$name"
    if [ ! -d "$src" ]; then
        echo "ERROR: source not found at $src"
        echo "Expected sibling directory: korfix-docs/ (with src/en/$name)"
        exit 1
    fi
    mkdir -p "$dst"
    rsync -av --delete "$src/" "$dst/"
}

sync_one miniapps
sync_one gamedev
echo ""
echo "Done. Review changes with: git diff docs/"
echo "Then commit: git add docs/ && git commit -m 'docs: sync from korfix-docs (en)'"

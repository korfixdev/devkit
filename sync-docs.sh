#!/bin/bash
# Sync docs/miniapps/ from korfix-docs repo.
# Run after editing korfix-docs/src/miniapps/, then commit both repos.

DOCS_SRC="$(dirname "$0")/../korfix-docs/src/miniapps"
DOCS_DST="$(dirname "$0")/docs/miniapps"

if [ ! -d "$DOCS_SRC" ]; then
    echo "ERROR: korfix-docs not found at $DOCS_SRC"
    echo "Expected sibling directory: korfix-docs/"
    exit 1
fi

rsync -av --delete "$DOCS_SRC/" "$DOCS_DST/"
echo ""
echo "Done. Review changes with: git diff docs/miniapps/"
echo "Then commit: git add docs/miniapps/ && git commit -m 'docs: sync from korfix-docs'"

#!/bin/bash

# Legacy helper kept for backwards‑compatibility.
# Delegate to the canonical deploy script, which builds
# and pushes the generated site to the gh-pages branch.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"

echo "⚙️  Running canonical deploy (gh-pages)..."
bin/deploy

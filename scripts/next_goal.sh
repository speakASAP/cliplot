#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"
echo "Active state:"
grep -E "Active goal|Goal status|Current checkpoint" "$ROOT/docs/IMPLEMENTATION_STATE.md" || true
echo
echo "Goal register:"
sed -n '/## Ordered Goals/,$p' "$ROOT/implementation-goals/README.md" | sed -n '1,40p'

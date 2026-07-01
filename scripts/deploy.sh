#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "cliplot-service deploy gate"
python3 scripts/pre_coding_gate.py --root .
python3 scripts/strict_doc_audit.py --root . --format markdown --fail-on-issues

if python3 scripts/deployment_readiness_gate.py --root .; then
  echo "Deployment readiness passed."
else
  status=$?
  if [ "$status" -eq 2 ]; then
    echo "Deployment blocked by readiness gate. No Kubernetes changes applied."
    exit 2
  fi
  exit "$status"
fi

echo "Kubernetes deploy implementation is intentionally unavailable until GOAL-04 supplies app source and manifests."
exit 2

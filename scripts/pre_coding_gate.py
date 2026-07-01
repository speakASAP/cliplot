#!/usr/bin/env python3
import argparse
from pathlib import Path
import sys


REQUIRED = [
    "AGENTS.md",
    "README.md",
    "BUSINESS.md",
    "SYSTEM.md",
    "SPEC.md",
    "GOALS.md",
    "PLAN.md",
    "docs/INTENT_MEMORY.md",
    "docs/DESIGN_CONTRACT.md",
    "docs/IMPLEMENTATION_ORCHESTRATOR.md",
    "docs/IMPLEMENTATION_STATE.md",
    "docs/process/PROJECT_INVARIANTS.md",
    "docs/process/OPERATIONAL_GATES.md",
    "docs/process/AGENT_GAP_FILLING_RULES.md",
    "implementation-goals/README.md",
    "implementation-goals/GOAL-01-orchestration-foundation.md",
    "implementation-goals/GOAL-01-orchestration-foundation.execution-plan.md",
    "implementation-goals/GOAL-01-orchestration-foundation.context-package.md",
    "implementation-goals/GOAL-01-orchestration-foundation.coding-prompt.md",
    "implementation-goals/GOAL-01-orchestration-foundation.validation-report.md",
    "implementation-goals/GOAL-03-shared-service-integration.md",
    "implementation-goals/GOAL-03-shared-service-integration.execution-plan.md",
    "implementation-goals/GOAL-03-shared-service-integration.context-package.md",
    "implementation-goals/GOAL-03-shared-service-integration.coding-prompt.md",
    "implementation-goals/GOAL-03-shared-service-integration.validation-report.md",
    "implementation-goals/GOAL-04-kubernetes-vault-rag-deployment.md",
    "implementation-goals/GOAL-04-kubernetes-vault-rag-deployment.execution-plan.md",
    "implementation-goals/GOAL-04-kubernetes-vault-rag-deployment.context-package.md",
    "implementation-goals/GOAL-04-kubernetes-vault-rag-deployment.coding-prompt.md",
    "implementation-goals/GOAL-04-kubernetes-vault-rag-deployment.validation-report.md",
    "implementation-goals/GOAL-05-checkout-revenue-readiness.md",
    "implementation-goals/GOAL-05-checkout-revenue-readiness.execution-plan.md",
    "implementation-goals/GOAL-05-checkout-revenue-readiness.context-package.md",
    "implementation-goals/GOAL-05-checkout-revenue-readiness.coding-prompt.md",
    "implementation-goals/GOAL-05-checkout-revenue-readiness.validation-report.md",
]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=".")
    args = parser.parse_args()
    root = Path(args.root)
    missing = [p for p in REQUIRED if not (root / p).exists()]
    if missing:
        print("PRE_CODING_GATE=fail")
        for item in missing:
            print(f"MISSING {item}")
        return 1
    state = (root / "docs/IMPLEMENTATION_STATE.md").read_text()
    if "Active goal:" not in state:
        print("PRE_CODING_GATE=fail")
        print("MISSING active goal in docs/IMPLEMENTATION_STATE.md")
        return 1
    if "Active goal: GOAL-03-shared-service-integration" in state:
        goal = (root / "implementation-goals/GOAL-03-shared-service-integration.execution-plan.md").read_text()
        if "No live payment creation" not in goal or "No stock reservation" not in goal:
            print("PRE_CODING_GATE=fail")
            print("GOAL-03 execution plan must preserve live mutation boundaries.")
            return 1
    print("PRE_CODING_GATE=pass")
    print("scope=goal-driven")
    print("note=Selected goal execution plan and validation artifact are present.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

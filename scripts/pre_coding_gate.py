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
    print("PRE_CODING_GATE=pass")
    print("scope=foundation")
    print("note=Product code still requires the selected goal execution plan.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

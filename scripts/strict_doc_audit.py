#!/usr/bin/env python3
import argparse
from pathlib import Path
import sys


REQUIRED_HEADINGS = {
    "README.md": ["# cliplot-service", "## Intent"],
    "PLAN.md": ["# Implementation Plan", "## Parallel Execution Section"],
    "docs/DESIGN_CONTRACT.md": ["# Design Contract", "## Anti-AI Rules"],
    "docs/IMPLEMENTATION_ORCHESTRATOR.md": ["# Cliplot Implementation Orchestrator", "## Intent Preservation Chain"],
    "implementation-goals/README.md": ["# Cliplot Implementation Goals", "## Ordered Goals"],
}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=".")
    parser.add_argument("--format", default="text")
    parser.add_argument("--fail-on-issues", action="store_true")
    args = parser.parse_args()
    root = Path(args.root)
    issues = []
    for rel, headings in REQUIRED_HEADINGS.items():
        path = root / rel
        if not path.exists():
            issues.append(f"missing file: {rel}")
            continue
        text = path.read_text()
        for heading in headings:
            if heading not in text:
                issues.append(f"missing heading in {rel}: {heading}")
    if issues:
        print("STRICT_DOC_AUDIT=fail")
        for issue in issues:
            print(f"- {issue}")
        return 1 if args.fail_on_issues else 0
    print("STRICT_DOC_AUDIT=pass")
    print("checked_files=" + str(len(REQUIRED_HEADINGS)))
    return 0


if __name__ == "__main__":
    sys.exit(main())

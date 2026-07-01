#!/usr/bin/env python3
import argparse
from pathlib import Path
import sys


REQUIRED_FOR_DEPLOY = [
    "Dockerfile",
    "k8s/deployment.yaml",
    "k8s/service.yaml",
    "k8s/ingress.yaml",
    "k8s/configmap.yaml",
    "k8s/external-secret.yaml",
]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=".")
    args = parser.parse_args()
    root = Path(args.root)
    missing = [p for p in REQUIRED_FOR_DEPLOY if not (root / p).exists()]
    if missing:
        print("DEPLOYMENT_READINESS=blocked")
        print("reason=No deployable app baseline yet; this is expected during GOAL-01.")
        for item in missing:
            print(f"MISSING {item}")
        return 2
    print("DEPLOYMENT_READINESS=pass")
    return 0


if __name__ == "__main__":
    sys.exit(main())

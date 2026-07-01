#!/usr/bin/env python3
import argparse
from pathlib import Path
import sys


REQUIRED_FOR_FRONTEND_DEPLOY = [
    "package.json",
    "Dockerfile",
    "src/server.js",
    "public/index.html",
    "public/styles.css",
    "public/app.js",
    "k8s/deployment.yaml",
    "k8s/service.yaml",
    "k8s/ingress.yaml",
    "k8s/configmap.yaml",
]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=".")
    args = parser.parse_args()
    root = Path(args.root)
    missing = [p for p in REQUIRED_FOR_FRONTEND_DEPLOY if not (root / p).exists()]
    if missing:
        print("DEPLOYMENT_READINESS=blocked")
        for item in missing:
            print(f"MISSING {item}")
        return 2
    deploy = (root / "k8s/deployment.yaml").read_text()
    ingress = (root / "k8s/ingress.yaml").read_text()
    if "cliplot-service" not in deploy or "cliplot.alfares.cz" not in ingress:
        print("DEPLOYMENT_READINESS=fail")
        print("Kubernetes manifests do not target cliplot-service/cliplot.alfares.cz")
        return 1
    print("DEPLOYMENT_READINESS=pass")
    print("scope=frontend-foundation")
    print("note=Vault/payment/order readiness remains blocked for later goals.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

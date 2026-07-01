#!/usr/bin/env python3
import argparse
from pathlib import Path
import sys


REQUIRED_FOR_FRONTEND_DEPLOY = [
    "package.json",
    "Dockerfile",
    "src/server.js",
    "src/integrations.js",
    "public/index.html",
    "public/styles.css",
    "public/app.js",
    "k8s/deployment.yaml",
    "k8s/service.yaml",
    "k8s/ingress.yaml",
    "k8s/configmap.yaml",
    "k8s/external-secret.yaml",
    "scripts/vault_secret_presence_gate.py",
    "scripts/publish_docs_rag.sh",
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
    configmap = (root / "k8s/configmap.yaml").read_text()
    external_secret = (root / "k8s/external-secret.yaml").read_text()
    if "cliplot-service" not in deploy or "cliplot.alfares.cz" not in ingress:
        print("DEPLOYMENT_READINESS=fail")
        print("Kubernetes manifests do not target cliplot-service/cliplot.alfares.cz")
        return 1
    required_config = [
        'CLIPLOT_FRONTEND_MODE: "shared-service-integration"',
        'CLIPLOT_ORDER_CHANNEL: "cliplot"',
        'ENABLE_LIVE_ORDER_SUBMIT: "false"',
        'AUTH_PUBLIC_URL: "https://auth.alfares.cz"',
    ]
    missing_config = [item for item in required_config if item not in configmap]
    if missing_config:
        print("DEPLOYMENT_READINESS=fail")
        for item in missing_config:
            print(f"MISSING config {item}")
        return 1
    if "apiVersion: external-secrets.io/v1" not in external_secret:
        print("DEPLOYMENT_READINESS=fail")
        print("ExternalSecret must use installed API external-secrets.io/v1.")
        return 1
    if "secret/prod/cliplot-service" not in external_secret or "vault-backend" not in external_secret:
        print("DEPLOYMENT_READINESS=fail")
        print("ExternalSecret does not map cliplot-service to Vault path secret/prod/cliplot-service")
        return 1
    if "optional: true" not in deploy:
        print("DEPLOYMENT_READINESS=fail")
        print("Deployment must keep cliplot-service-secret optional until Vault is populated.")
        return 1
    print("DEPLOYMENT_READINESS=pass")
    print("scope=shared-service-integration-foundation")
    print("note=Live order/payment mutation remains gated by ENABLE_LIVE_ORDER_SUBMIT=false and missing Vault/provider evidence.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

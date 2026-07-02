#!/usr/bin/env python3
import argparse
import json
import os
import subprocess
import sys


REQUIRED_KEYS = [
    "ORDERS_SERVICE_TOKEN",
    "WAREHOUSE_SERVICE_TOKEN",
    "NOTIFICATIONS_SERVICE_TOKEN",
    "PAYMENT_API_KEY",
    "PAYMENT_WEBHOOK_API_KEY",
    "CLIPLOT_SERVICE_TOKEN",
    "DOCS_RAG_SERVICE_TOKEN",
]

LIVE_SMOKE_KEYS = [
    "ORDERS_STATUS_SERVICE_TOKEN",
    "CLIPLOT_LIVE_ORDER_WAREHOUSE_SMOKE_APPROVAL_ID",
]


def emit_live_smoke_projection(path: str, missing_live_smoke: list[str]) -> None:
    ready = not missing_live_smoke
    print(f"LIVE_SMOKE_PROJECTION={'ready' if ready else 'blocked'}")
    print("projection_keys=" + ",".join(LIVE_SMOKE_KEYS))
    print("external_secret_projection=" + ("ready_to_add_after_owner_review" if ready else "deferred_missing_vault_keys"))
    print("runtime_flag=ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE=false")
    print("mutation=false")
    print("providerCall=false")
    print("persistence=false")
    if missing_live_smoke:
        for key in missing_live_smoke:
            print(f"PROJECTION_BLOCKER [MISSING: {key} in Vault path {path}]")
        print("next=Populate the missing Vault keys before adding live-smoke ExternalSecret refs.")
    else:
        print("next=Add live-smoke ExternalSecret refs only in a reviewed deploy while keeping ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE=false until owner-approved execution.")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--path", default="secret/prod/cliplot")
    parser.add_argument("--allow-missing", action="store_true")
    parser.add_argument("--require-live-smoke", action="store_true")
    parser.add_argument("--projection-plan", action="store_true")
    args = parser.parse_args()

    env = os.environ.copy()
    env.setdefault("VAULT_ADDR", "http://127.0.0.1:8200")
    result = subprocess.run(
        ["vault", "kv", "get", "-format=json", args.path],
        env=env,
        check=False,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    if result.returncode != 0:
        print("VAULT_SECRET_PRESENCE=blocked")
        print(f"path={args.path}")
        print("reason=vault_path_missing_or_unreadable")
        if args.allow_missing:
            return 0
        return 2

    payload = json.loads(result.stdout)
    data = payload.get("data", {}).get("data", {})
    missing = [key for key in REQUIRED_KEYS if not str(data.get(key, "")).strip()]
    missing_live_smoke = [key for key in LIVE_SMOKE_KEYS if not str(data.get(key, "")).strip()]
    if missing:
        print("VAULT_SECRET_PRESENCE=blocked")
        print(f"path={args.path}")
        for key in missing:
            print(f"MISSING {key}")
        if args.allow_missing:
            return 0
        return 2
    if missing_live_smoke:
        print("VAULT_SECRET_PRESENCE=pass")
        print(f"path={args.path}")
        print("checked_keys=" + ",".join(REQUIRED_KEYS))
        print("LIVE_SMOKE_SECRET_PRESENCE=blocked")
        for key in missing_live_smoke:
            print(f"MISSING_LIVE_SMOKE {key}")
        if args.projection_plan:
            emit_live_smoke_projection(args.path, missing_live_smoke)
        print("note=secret values intentionally not printed")
        if args.require_live_smoke and not args.allow_missing:
            return 2
        return 0

    print("VAULT_SECRET_PRESENCE=pass")
    print(f"path={args.path}")
    print("checked_keys=" + ",".join(REQUIRED_KEYS))
    print("LIVE_SMOKE_SECRET_PRESENCE=pass")
    print("checked_live_smoke_keys=" + ",".join(LIVE_SMOKE_KEYS))
    if args.projection_plan:
        emit_live_smoke_projection(args.path, [])
    print("note=secret values intentionally not printed")
    return 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SERVICE_NAME="cliplot-service"
NAMESPACE="${NAMESPACE:-statex-apps}"
REGISTRY="${REGISTRY:-localhost:5000}"
K8S_DIR="$PROJECT_ROOT/k8s"
TAG="$(cd "$PROJECT_ROOT" && git rev-parse --short HEAD 2>/dev/null || date -u +%Y%m%d%H%M%S)"
IMAGE="$REGISTRY/$SERVICE_NAME:$TAG"
IMAGE_LATEST="$REGISTRY/$SERVICE_NAME:latest"

echo "cliplot-service deployment"
cd "$PROJECT_ROOT"

python3 scripts/pre_coding_gate.py --root .
python3 scripts/strict_doc_audit.py --root . --format markdown --fail-on-issues
python3 scripts/deployment_readiness_gate.py --root .
npm run build

kubectl get namespace "$NAMESPACE" >/dev/null
docker build -t "$IMAGE" -t "$IMAGE_LATEST" "$PROJECT_ROOT"
docker push "$IMAGE"
docker push "$IMAGE_LATEST"

TMP_DEPLOYMENT="$(mktemp)"
trap 'rm -f "$TMP_DEPLOYMENT"' EXIT
sed "s#localhost:5000/cliplot-service:latest#$IMAGE#g" "$K8S_DIR/deployment.yaml" > "$TMP_DEPLOYMENT"

kubectl apply -f "$K8S_DIR/configmap.yaml" -n "$NAMESPACE"
if [ -f "$K8S_DIR/external-secret.yaml" ]; then
  kubectl apply -f "$K8S_DIR/external-secret.yaml" -n "$NAMESPACE"
fi
kubectl apply -f "$TMP_DEPLOYMENT" -n "$NAMESPACE"
kubectl apply -f "$K8S_DIR/service.yaml" -n "$NAMESPACE"
kubectl apply -f "$K8S_DIR/ingress.yaml" -n "$NAMESPACE"
kubectl apply -f "$K8S_DIR/readiness-cronjob.yaml" -n "$NAMESPACE"
kubectl rollout status "deployment/$SERVICE_NAME" -n "$NAMESPACE" --timeout=360s

POD="$(kubectl get pod -n "$NAMESPACE" -l app="$SERVICE_NAME" --field-selector=status.phase=Running -o jsonpath='{.items[0].metadata.name}')"
test -n "$POD"
kubectl exec -n "$NAMESPACE" "$POD" -- node -e "fetch('http://127.0.0.1:8080/health').then(async r=>{console.log(await r.text()); if(!r.ok) process.exit(1)}).catch(e=>{console.error(e); process.exit(1)})"

echo "Deployment complete: https://cliplot.alfares.cz/"

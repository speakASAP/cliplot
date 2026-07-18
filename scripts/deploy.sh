#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SERVICE_NAME="cliplot"
NAMESPACE="${NAMESPACE:-statex-apps}"
REGISTRY="${REGISTRY:-localhost:5000}"
K8S_DIR="$PROJECT_ROOT/k8s"
# Tag describes the WORKING TREE that is actually built, not just git HEAD:
# a tag derived from HEAD alone repeats itself when files changed without a
# commit, which makes `kubectl set image` a no-op and silently keeps the old
# image running.
compute_default_tag() {
  local head dirty root
  root="${PROJECT_ROOT:-$(pwd)}"
  head="$(git -C "$root" rev-parse --short HEAD 2>/dev/null || true)"
  if [ -z "$head" ]; then
    echo "build-$(date -u +%Y%m%d%H%M%S)"
    return
  fi
  dirty="$(git -C "$root" status --porcelain 2>/dev/null || true)"
  if [ -n "$dirty" ]; then
    echo "${head}-wt$(date -u +%Y%m%d%H%M%S)"
  else
    echo "$head"
  fi
}

TAG="$(compute_default_tag)"
IMAGE="$REGISTRY/$SERVICE_NAME:$TAG"
IMAGE_LATEST="$REGISTRY/$SERVICE_NAME:latest"

echo "cliplot deployment"
cd "$PROJECT_ROOT"

# shellcheck source=/dev/null
source "$(dirname "$PROJECT_ROOT")/shared/scripts/load-deploy-phase-timing.sh" "$PROJECT_ROOT"
deploy_timing_init "$SERVICE_NAME"

deploy_timing_phase_start "Preflight gates"
python3 scripts/pre_coding_gate.py --root .
python3 scripts/strict_doc_audit.py --root . --format markdown --fail-on-issues
python3 scripts/deployment_readiness_gate.py --root .
deploy_timing_phase_end "Preflight gates"

deploy_timing_phase_start "Build app"
npm run build
deploy_timing_phase_end "Build app"

deploy_timing_phase_start "Build image"
kubectl get namespace "$NAMESPACE" >/dev/null
docker build -t "$IMAGE" -t "$IMAGE_LATEST" "$PROJECT_ROOT"
deploy_timing_phase_end "Build image"

deploy_timing_phase_start "Push image"
docker push "$IMAGE"
docker push "$IMAGE_LATEST"
deploy_timing_phase_end "Push image"

TMP_DEPLOYMENT="$(mktemp)"
# keep the timing library's EXIT handler alive alongside the temp-file cleanup
trap 'rm -f "$TMP_DEPLOYMENT"; deploy_timing_cleanup_exit' EXIT
sed "s#localhost:5000/cliplot:latest#$IMAGE#g" "$K8S_DIR/deployment.yaml" > "$TMP_DEPLOYMENT"

deploy_timing_phase_start "Apply Kubernetes manifests"
kubectl apply -f "$K8S_DIR/configmap.yaml" -n "$NAMESPACE"
if [ -f "$K8S_DIR/external-secret.yaml" ]; then
  kubectl apply -f "$K8S_DIR/external-secret.yaml" -n "$NAMESPACE"
fi
kubectl apply -f "$TMP_DEPLOYMENT" -n "$NAMESPACE"
kubectl apply -f "$K8S_DIR/service.yaml" -n "$NAMESPACE"
kubectl apply -f "$K8S_DIR/ingress.yaml" -n "$NAMESPACE"
kubectl apply -f "$K8S_DIR/readiness-cronjob.yaml" -n "$NAMESPACE"
deploy_timing_phase_end "Apply Kubernetes manifests"

deploy_timing_phase_start "Wait for rollout"
kubectl rollout status "deployment/$SERVICE_NAME" -n "$NAMESPACE" --timeout=360s
deploy_timing_phase_end "Wait for rollout"

# Remove pre-rename Kubernetes objects after the cliplot deployment is healthy.
kubectl delete ingress cliplot-service -n "$NAMESPACE" --ignore-not-found=true
kubectl delete service cliplot-service -n "$NAMESPACE" --ignore-not-found=true
kubectl delete deployment cliplot-service -n "$NAMESPACE" --ignore-not-found=true
kubectl delete configmap cliplot-service-config -n "$NAMESPACE" --ignore-not-found=true
kubectl delete externalsecret cliplot-service-secret -n "$NAMESPACE" --ignore-not-found=true
kubectl delete cronjob cliplot-service-readiness-monitor -n "$NAMESPACE" --ignore-not-found=true

POD="$(kubectl get pod -n "$NAMESPACE" -l app="$SERVICE_NAME" --field-selector=status.phase=Running -o json | node -e '
let input = "";
process.stdin.on("data", (chunk) => input += chunk);
process.stdin.on("end", () => {
  const pods = JSON.parse(input).items || [];
  const candidates = pods
    .filter((pod) => !pod.metadata?.deletionTimestamp)
    .filter((pod) => (pod.status?.conditions || []).some((condition) => condition.type === "Ready" && condition.status === "True"))
    .sort((a, b) => String(a.metadata?.creationTimestamp || "").localeCompare(String(b.metadata?.creationTimestamp || "")));
  const selected = candidates[candidates.length - 1];
  if (selected) process.stdout.write(selected.metadata.name);
});
')"
test -n "$POD"
kubectl exec -n "$NAMESPACE" "$POD" -- node -e "fetch('http://127.0.0.1:8080/health').then(async r=>{console.log(await r.text()); if(!r.ok) process.exit(1)}).catch(e=>{console.error(e); process.exit(1)})"

deploy_timing_finish_success "$SERVICE_NAME"
echo "Deployment complete: https://cliplot.alfares.cz/"

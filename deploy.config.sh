# deploy.config.sh — declaration consumed by shared/scripts/deploy.sh.
# See shared/docs/DEPLOY_STANDARDIZATION_REPORT.md section 6/7 for the design.
# scripts/deploy.sh is still the live, authoritative deploy path.
#
# cliplot's deployment.yaml is sed-templated (image substituted into the
# manifest before apply), not applied statically — so DEPLOYMENTS declares
# an empty image-name field ("still wait for this rollout, but the image was
# already set by deploy_post_manifests, skip the redundant kubectl set image").

SERVICE_NAME="cliplot"
PORT="8080"

IMAGES=(
  "cliplot|.||"
)

DEPLOYMENTS=(
  "cliplot|app|"
)

MANIFESTS=(configmap.yaml external-secret.yaml service.yaml ingress.yaml readiness-cronjob.yaml)

deploy_preflight() {
  python3 "$PROJECT_ROOT/scripts/pre_coding_gate.py" --root "$PROJECT_ROOT"
  python3 "$PROJECT_ROOT/scripts/strict_doc_audit.py" --root "$PROJECT_ROOT" --format markdown --fail-on-issues
  python3 "$PROJECT_ROOT/scripts/deployment_readiness_gate.py" --root "$PROJECT_ROOT"
  ( cd "$PROJECT_ROOT" && npm run build )
}

deploy_post_manifests() {
  local image="${REGISTRY}/${SERVICE_NAME}:${IMAGE_TAG}"
  sed "s#localhost:5000/cliplot:latest#${image}#g" "$PROJECT_ROOT/k8s/deployment.yaml" \
    | kubectl apply -f - -n "$NAMESPACE"
}

deploy_post_verify() {
  # Pre-rename legacy objects (cliplot used to be named cliplot-service) --
  # safe to remove once the current deployment is confirmed healthy.
  kubectl delete ingress cliplot-service -n "$NAMESPACE" --ignore-not-found=true
  kubectl delete service cliplot-service -n "$NAMESPACE" --ignore-not-found=true
  kubectl delete deployment cliplot-service -n "$NAMESPACE" --ignore-not-found=true
  kubectl delete configmap cliplot-service-config -n "$NAMESPACE" --ignore-not-found=true
  kubectl delete externalsecret cliplot-service-secret -n "$NAMESPACE" --ignore-not-found=true
  kubectl delete cronjob cliplot-service-readiness-monitor -n "$NAMESPACE" --ignore-not-found=true
}

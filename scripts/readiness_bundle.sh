#!/usr/bin/env bash
set -u

BASE_URL="${CLIPLOT_BASE_URL:-https://cliplot.alfares.cz}"
NAMESPACE="${NAMESPACE:-statex-apps}"
DEPLOYMENT="${CLIPLOT_DEPLOYMENT:-cliplot}"
REPO_NAME="${DOCS_RAG_REPO_NAME:-cliplot}"

overall=0
critical_failed=0

mark_status() {
  local status="$1"
  if [ "$status" -eq 2 ]; then
    if [ "$overall" -eq 0 ]; then overall=2; fi
  elif [ "$status" -ne 0 ]; then
    overall=1
  fi
}

run_step() {
  local name="$1"
  shift
  echo "READINESS_STEP=$name"
  "$@"
  local status=$?
  echo "READINESS_STEP_EXIT=$name:$status"
  mark_status "$status"
  return "$status"
}

run_critical_step() {
  local name="$1"
  shift
  run_step "$name" "$@"
  local status=$?
  if [ "$status" -ne 0 ]; then critical_failed=1; fi
  return "$status"
}

git_clean() {
  git status --short --branch
  if [ -n "$(git status --short)" ]; then
    echo "reason=git_worktree_dirty"
    return 1
  fi
  return 0
}

kubernetes_rollout() {
  kubectl -n "$NAMESPACE" get deploy "$DEPLOYMENT" \
    -o jsonpath='image={.spec.template.spec.containers[0].image} updated={.status.updatedReplicas} ready={.status.readyReplicas} available={.status.availableReplicas}'
  echo
}

live_preflight() {
  curl -fsS "$BASE_URL/api/checkout/live-preflight" | node -e '
let body = "";
process.stdin.on("data", (chunk) => body += chunk);
process.stdin.on("end", () => {
  const payload = JSON.parse(body);
  const p = payload.liveCheckoutPreflight || {};
  console.log("livePreflight.status=" + p.status);
  console.log("livePreflight.wouldMutate=" + p.wouldMutate);
  console.log("livePreflight.wouldCreateOrder=" + Boolean(p.mutationPlan && p.mutationPlan.wouldCreateOrder));
  console.log("livePreflight.wouldReserveWarehouse=" + Boolean(p.mutationPlan && p.mutationPlan.wouldReserveWarehouse));
  console.log("livePreflight.wouldCreatePayment=" + Boolean(p.mutationPlan && p.mutationPlan.wouldCreatePayment));
  console.log("livePreflight.wouldSendNotification=" + Boolean(p.mutationPlan && p.mutationPlan.wouldSendNotification));
  const guarded = payload.success
    && p.status === "blocked"
    && p.wouldMutate === false
    && p.mutationPlan?.wouldCreateOrder === false
    && p.mutationPlan?.wouldReserveWarehouse === false
    && p.mutationPlan?.wouldCreatePayment === false
    && p.mutationPlan?.wouldSendNotification === false;
  if (!guarded) process.exit(1);
});
'
}

integrations_readiness() {
  curl -fsS "$BASE_URL/api/integrations/readiness" | node -e '
let body = "";
process.stdin.on("data", (chunk) => body += chunk);
process.stdin.on("end", () => {
  const payload = JSON.parse(body);
  const approvals = payload.liveMutationApprovals || {};
  const integrations = payload.integrations || {};
  const validation = payload.liveCheckoutPreflight?.validation || {};
  console.log("readiness.liveOrderSubmit=" + payload.liveOrderSubmit);
  console.log("readiness.livePaymentCreate=" + payload.livePaymentCreate);
  console.log("readiness.liveNotifications=" + payload.liveNotifications);
  console.log("readiness.approval.order=" + approvals.order);
  console.log("readiness.approval.payment=" + approvals.payment);
  console.log("readiness.approval.notification=" + approvals.notification);
  console.log("readiness.orderValidation=" + integrations.orderValidation);
  console.log("readiness.paymentValidation=" + integrations.paymentValidation);
  console.log("readiness.notificationValidation=" + integrations.notificationValidation);
  console.log("readiness.warehouseReservation=" + validation.warehouseReservation);
  console.log("readiness.paymentStatus=" + integrations.paymentStatus);
  const guarded = payload.success
    && payload.liveOrderSubmit === false
    && payload.livePaymentCreate === false
    && payload.liveNotifications === false
    && approvals.order === false
    && approvals.payment === false
    && approvals.notification === false
    && integrations.orderValidation === "enabled_no_mutation"
    && integrations.paymentValidation === "enabled_no_mutation"
    && integrations.notificationValidation === "enabled_no_send"
    && validation.warehouseReservation === "readiness_check_available"
    && integrations.paymentStatus === "guarded_no_persistence";
  if (!guarded) process.exit(1);
});
'
}

docs_rag_preflight() {
  set +e
  DOCS_RAG_PREFLIGHT_ONLY=1 ./scripts/publish_docs_rag.sh "$REPO_NAME"
  local status=$?
  echo "docsRagPreflightExit=$status"
  return "$status"
}

echo "CLIPLOT_READINESS_BUNDLE=start"
echo "baseUrl=$BASE_URL"
echo "namespace=$NAMESPACE"
echo "deployment=$DEPLOYMENT"
echo "repoName=$REPO_NAME"

run_critical_step git_clean git_clean
run_critical_step kubernetes_rollout kubernetes_rollout
run_critical_step live_preflight live_preflight
run_critical_step integrations_readiness integrations_readiness
run_step vault_presence python3 scripts/vault_secret_presence_gate.py --allow-missing
run_step docs_rag_preflight docs_rag_preflight

if [ "$critical_failed" -eq 0 ]; then
  run_step product_filter_readiness npm run readiness:product-filter -- "$BASE_URL"
  run_critical_step order_warehouse_readiness npm run readiness:order-warehouse -- "$BASE_URL"
  run_step checkout_status_surface npm run readiness:checkout-status-surface -- "$BASE_URL"
  run_step customer_status_rollout npm run readiness:customer-status-rollout -- "$BASE_URL"
  run_step payment_callback_readiness npm run readiness:payment-callback -- "$BASE_URL"
  run_step payment_callback_replay_policy npm run readiness:payment-callback-policy -- "$BASE_URL"
  run_step payment_read_scope_readiness npm run readiness:payment-read-scope -- "$BASE_URL"
  run_step payment_status_readiness npm run readiness:payment-status -- "$BASE_URL"
  run_step payment_status_storage_readiness npm run readiness:payment-storage -- "$BASE_URL"
  run_step payment_status_persistence_decision npm run readiness:payment-decision -- "$BASE_URL"
  run_step payment_status_mapping_ownership npm run readiness:payment-mapping -- "$BASE_URL"
  run_step payment_status_snapshot_read_approval npm run readiness:payment-snapshot-read-approval -- "$BASE_URL"
  run_step customer_status_runtime_read npm run readiness:customer-status-runtime-read -- "$BASE_URL"
  run_step live_smoke_plan npm run readiness:live-smoke-plan -- "$BASE_URL"
  run_step customer_status_activation npm run readiness:customer-status-activation -- "$BASE_URL"
  run_step customer_status_approval_evidence npm run readiness:customer-status-approval -- "$BASE_URL"
  run_step live_smoke_executor_guard npm run readiness:live-smoke-executor -- "$BASE_URL"
  run_step guarded_checkout_smoke npm run smoke:checkout -- "$BASE_URL"
else
  echo "READINESS_STEP=guarded_checkout_smoke"
  echo "READINESS_STEP_SKIPPED=guarded_checkout_smoke:critical_preflight_failed"
  overall=1
fi

if [ "$overall" -eq 0 ]; then
  echo "CLIPLOT_READINESS_BUNDLE=pass"
elif [ "$overall" -eq 2 ]; then
  echo "CLIPLOT_READINESS_BUNDLE=blocked"
else
  echo "CLIPLOT_READINESS_BUNDLE=fail"
fi

exit "$overall"

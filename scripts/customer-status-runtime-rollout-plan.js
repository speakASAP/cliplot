#!/usr/bin/env node
const baseUrl = process.argv[2] || process.env.CLIPLOT_CUSTOMER_STATUS_ROLLOUT_PLAN_BASE_URL || 'http://127.0.0.1:8080';

function assert(condition, message, evidence = {}) {
  if (!condition) {
    console.error(JSON.stringify({ ok: false, message, ...evidence }, null, 2));
    process.exit(1);
  }
}

const response = await fetch(new URL('/api/checkout/customer-status-runtime-rollout-plan', baseUrl));
const text = await response.text();
let plan = null;
try {
  plan = text ? JSON.parse(text) : {};
} catch {
  assert(false, 'customer status runtime rollout plan returned non-json response', {
    httpStatus: response.status,
    body: text.slice(0, 300),
  });
}

assert(response.status === 200 && plan.success, 'customer status runtime rollout plan request failed', {
  httpStatus: response.status,
  status: plan.status,
});
assert(plan.status === 'approval_required_read_only_customer_status_runtime_rollout', 'rollout plan should remain approval-required', plan);
assert(plan.mutation === false, 'rollout plan reported mutation', plan);
assert(plan.persistence === false, 'rollout plan reported persistence', plan);
assert(plan.providerCall === false, 'rollout plan reported provider call', plan);
assert(plan.runtimeReadEnabled === false, 'runtime read unexpectedly enabled', plan);
assert(plan.paymentsSnapshotReadEnabled === false, 'payments snapshot read unexpectedly enabled', plan);
assert(plan.storageRead === false, 'storage read unexpectedly enabled', plan);
assert(plan.callbackPersistence === false, 'callback persistence unexpectedly enabled', plan);
assert(plan.approvedRuntimeChange === false, 'runtime change unexpectedly approved', plan);
assert(plan.decisionRecord?.id === 'ADR-003-read-only-customer-status-runtime-rollout', 'ADR-003 decision record missing', plan);
assert(plan.decisionRecord?.status === 'proposed_for_owner_approval', 'ADR-003 should remain proposed', plan);
assert(plan.decisionRecord?.runtimeApproval === false, 'ADR-003 unexpectedly approves runtime', plan);
assert(plan.targetSurface?.currentDataSource === 'browser_local_checkout_snapshot', 'current status data source changed', plan);
assert(plan.targetSurface?.currentPaymentStatusContract === 'payment_status_guarded_no_persistence', 'current payment status contract changed', plan);
assert(plan.targetSurface?.futureReadContract === '/payments/status/by-order-id?applicationId=cliplot&orderId={orderId}', 'future read contract changed', plan);
assert(plan.targetSurface?.requiredScope === 'payments:read', 'payments:read scope missing', plan);
assert(plan.targetSurface?.forbiddenEndpoint === '/payments/{paymentId}', 'forbidden provider-refresh endpoint missing', plan);
assert(plan.targetSurface?.routes?.includes('/objednavka/stav'), 'customer status route missing', plan);
assert(plan.dependencyStatuses?.statusSurface === 'guarded_customer_status_surface_contract', 'status surface dependency missing', plan);
assert(plan.dependencyStatuses?.snapshotReadApproval === 'approval_required_passive_payments_snapshot_read', 'snapshot-read dependency missing', plan);
assert(plan.dependencyStatuses?.paymentDecision === 'decision_recorded_approval_required', 'payment decision dependency missing', plan);
assert(plan.dependencyStatuses?.paymentReadScope === 'validated_payments_read_scope_no_mutation', 'payment read-scope dependency missing', plan);
assert(Array.isArray(plan.prerequisites) && plan.prerequisites.some((item) => item.includes('owner approval')), 'owner approval prerequisite missing', plan);
assert(plan.prerequisites.some((item) => item.includes('customer-safe status copy approval')), 'copy approval prerequisite missing', plan);
assert(plan.prerequisites.some((item) => item.includes('DB-only by-order-id route')), 'DB-only route approval prerequisite missing', plan);
assert(plan.prerequisites.some((item) => item.includes('callback persistence/replay policy')), 'callback replay prerequisite missing', plan);
assert(Array.isArray(plan.rolloutSteps) && plan.rolloutSteps.length >= 5, 'rollout steps missing', plan);
assert(plan.rolloutSteps.some((step) => step.name === 'confirm_guarded_baseline'), 'guarded baseline step missing', plan);
assert(plan.rolloutSteps.some((step) => step.name === 'enable_read_only_surface_feature_flag'), 'feature flag step missing', plan);
assert(Array.isArray(plan.rollbackPlan) && plan.rollbackPlan.some((item) => item.includes('runtimeReadEnabled=false')), 'rollback plan missing runtime guard', plan);
assert(Array.isArray(plan.mustRemainFalseDuringRollout) && plan.mustRemainFalseDuringRollout.includes('ENABLE_LIVE_PAYMENT_CREATE'), 'live payment false guard missing', plan);
assert(plan.mustRemainFalseDuringRollout.includes('provider-backed /payments/{paymentId} reads'), 'provider-refresh endpoint guard missing', plan);
assert(Array.isArray(plan.forbiddenOperations) && plan.forbiddenOperations.includes('create payment'), 'forbidden payment creation missing', plan);
assert(plan.forbiddenOperations.includes('read /payments/{paymentId}'), 'forbidden provider-refresh read missing', plan);
assert(Array.isArray(plan.validationCommands) && plan.validationCommands.includes('npm run readiness:customer-status-rollout -- https://cliplot.alfares.cz'), 'rollout validation command missing', plan);
assert(plan.validationCommands.includes('npm run readiness:checkout-status-surface -- https://cliplot.alfares.cz'), 'status surface validation command missing', plan);
assert(Array.isArray(plan.blockers) && plan.blockers.some((item) => item.includes('owner approval')), 'owner blocker missing', plan);

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  status: plan.status,
  currentDataSource: plan.targetSurface.currentDataSource,
  futureReadContract: plan.targetSurface.futureReadContract,
  requiredScope: plan.targetSurface.requiredScope,
  forbiddenEndpoint: plan.targetSurface.forbiddenEndpoint,
  rolloutStepCount: plan.rolloutSteps.length,
  rollbackStepCount: plan.rollbackPlan.length,
  runtimeReadEnabled: plan.runtimeReadEnabled,
  paymentsSnapshotReadEnabled: plan.paymentsSnapshotReadEnabled,
  storageRead: plan.storageRead,
  callbackPersistence: plan.callbackPersistence,
  decisionRecord: plan.decisionRecord.id,
  blockerCount: plan.blockers.length,
  mutation: plan.mutation,
  persistence: plan.persistence,
  providerCall: plan.providerCall,
}, null, 2));

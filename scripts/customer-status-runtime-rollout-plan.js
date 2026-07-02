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
const approved = plan.status === 'approved_read_only_customer_status_runtime_rollout';
assert(approved || plan.status === 'approval_required_read_only_customer_status_runtime_rollout', 'rollout plan status unexpected', plan);
assert(plan.mutation === false, 'rollout plan reported mutation', plan);
assert(plan.persistence === false, 'rollout plan reported persistence', plan);
assert(plan.providerCall === false, 'rollout plan reported provider call', plan);
assert(plan.storageRead === false, 'storage read unexpectedly enabled', plan);
assert(plan.callbackPersistence === false, 'callback persistence unexpectedly enabled', plan);
assert(plan.decisionRecord?.id === 'ADR-003-read-only-customer-status-runtime-rollout', 'ADR-003 decision record missing', plan);
assert(plan.decisionRecord?.status === 'proposed_for_owner_approval', 'ADR-003 should remain proposed', plan);
assert(plan.targetSurface?.futureReadContract === '/payments/status/by-order-id?applicationId=cliplot&orderId={orderId}', 'future read contract changed', plan);
assert(plan.targetSurface?.requiredScope === 'payments:read', 'payments:read scope missing', plan);
assert(plan.targetSurface?.forbiddenEndpoint === '/payments/{paymentId}', 'forbidden provider-refresh endpoint missing', plan);
assert(plan.targetSurface?.routes?.includes('/objednavka/stav'), 'customer status route missing', plan);
assert(['guarded_customer_status_surface_contract', 'approved_read_only_customer_status_surface_contract'].includes(plan.dependencyStatuses?.statusSurface), 'status surface dependency missing', plan);
assert(['approval_required_passive_payments_snapshot_read', 'approved_passive_payments_snapshot_read'].includes(plan.dependencyStatuses?.snapshotReadApproval), 'snapshot-read dependency missing', plan);
assert(plan.dependencyStatuses?.paymentDecision === 'decision_recorded_approval_required', 'payment decision dependency missing', plan);
assert(['validated_payments_read_scope_no_mutation', 'validated_payments_read_scope_no_mutation_cached'].includes(plan.dependencyStatuses?.paymentReadScope), 'payment read-scope dependency missing', plan);
assert(Array.isArray(plan.rolloutSteps) && plan.rolloutSteps.length >= 5, 'rollout steps missing', plan);
assert(Array.isArray(plan.rollbackPlan) && plan.rollbackPlan.some((item) => item.includes('runtimeReadEnabled=false')), 'rollback plan missing runtime guard', plan);
assert(Array.isArray(plan.mustRemainFalseDuringRollout) && plan.mustRemainFalseDuringRollout.includes('ENABLE_LIVE_PAYMENT_CREATE'), 'live payment false guard missing', plan);
assert(plan.mustRemainFalseDuringRollout.includes('provider-backed /payments/{paymentId} reads'), 'provider-refresh endpoint guard missing', plan);
assert(Array.isArray(plan.forbiddenOperations) && plan.forbiddenOperations.includes('create payment'), 'forbidden payment creation missing', plan);
assert(plan.forbiddenOperations.includes('read /payments/{paymentId}'), 'forbidden provider-refresh read missing', plan);
assert(Array.isArray(plan.validationCommands) && plan.validationCommands.includes('npm run readiness:customer-status-rollout -- https://cliplot.alfares.cz'), 'rollout validation command missing', plan);
if (approved) {
  assert(plan.runtimeReadEnabled === true, 'approved rollout runtime read not enabled', plan);
  assert(plan.paymentsSnapshotReadEnabled === true, 'approved rollout snapshot read not enabled', plan);
  assert(plan.approvedRuntimeChange === true, 'approved rollout runtime change missing', plan);
  assert(plan.decisionRecord?.runtimeApproval === true, 'approved rollout ADR runtime flag missing', plan);
} else {
  assert(plan.runtimeReadEnabled === false, 'blocked rollout runtime read unexpectedly enabled', plan);
  assert(plan.paymentsSnapshotReadEnabled === false, 'blocked rollout snapshot read unexpectedly enabled', plan);
  assert(plan.approvedRuntimeChange === false, 'blocked rollout runtime change unexpectedly approved', plan);
  assert(Array.isArray(plan.blockers) && plan.blockers.length > 0, 'blocked rollout missing blockers', plan);
}

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

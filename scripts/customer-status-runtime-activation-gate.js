#!/usr/bin/env node
const baseUrl = process.argv[2] || process.env.CLIPLOT_CUSTOMER_STATUS_ACTIVATION_GATE_BASE_URL || 'http://127.0.0.1:8080';

function assert(condition, message, evidence = {}) {
  if (!condition) {
    console.error(JSON.stringify({ ok: false, message, ...evidence }, null, 2));
    process.exit(1);
  }
}

const response = await fetch(new URL('/api/checkout/customer-status-runtime-activation-gate', baseUrl));
const text = await response.text();
let gate = null;
try {
  gate = text ? JSON.parse(text) : {};
} catch {
  assert(false, 'customer status runtime activation gate returned non-json response', {
    httpStatus: response.status,
    body: text.slice(0, 300),
  });
}

assert(response.status === 200 && gate.success, 'customer status runtime activation gate request failed', {
  httpStatus: response.status,
  status: gate.status,
});
assert(gate.status === 'blocked_read_only_customer_status_runtime_activation', 'customer status runtime activation should remain blocked before approval', gate);
assert(gate.mutation === false, 'activation gate reported mutation', gate);
assert(gate.persistence === false, 'activation gate reported persistence', gate);
assert(gate.providerCall === false, 'activation gate reported provider call', gate);
assert(gate.runtimeReadEnabled === false, 'runtime read unexpectedly enabled', gate);
assert(gate.paymentsSnapshotReadEnabled === false, 'payments snapshot read unexpectedly enabled', gate);
assert(gate.storageRead === false, 'storage read unexpectedly enabled', gate);
assert(gate.callbackPersistence === false, 'callback persistence unexpectedly enabled', gate);
assert(gate.approvedRuntimeChange === false, 'runtime change unexpectedly approved', gate);
assert(gate.wouldReadPaymentsSnapshot === false, 'activation gate would read Payments snapshot before approval', gate);
assert(gate.wouldRenderRuntimeCustomerStatus === false, 'activation gate would render runtime customer status before approval', gate);
assert(gate.wouldMutate === false, 'activation gate would mutate', gate);
assert(gate.partialEnablement === false, 'default guarded deployment should not be partially enabled', gate);
assert(gate.runtimeFlags?.customerStatusRuntimeRead === false, 'customer status runtime flag unexpectedly enabled', gate);
assert(gate.runtimeFlags?.paymentStatusSnapshotRead === false, 'payment snapshot read flag unexpectedly enabled', gate);
assert(gate.runtimeFlags?.statusRuntimeApprovalPresent === false, 'status runtime approval unexpectedly present', gate);
assert(gate.liveMutationGuards?.requested === false, 'live mutation requested during status activation readiness', gate);
assert(gate.liveMutationGuards?.liveOrderSubmit === false, 'live order submit unexpectedly enabled', gate);
assert(gate.liveMutationGuards?.livePaymentCreate === false, 'live payment create unexpectedly enabled', gate);
assert(gate.liveMutationGuards?.liveNotifications === false, 'live notifications unexpectedly enabled', gate);
assert(gate.currentBaseline?.rollout === 'approval_required_read_only_customer_status_runtime_rollout', 'rollout baseline missing', gate);
assert(gate.currentBaseline?.surface === 'guarded_customer_status_surface_contract', 'status surface baseline missing', gate);
assert(gate.currentBaseline?.snapshotReadApproval === 'approval_required_passive_payments_snapshot_read', 'snapshot read approval baseline missing', gate);
assert(gate.currentBaseline?.paymentReadScope === 'validated_payments_read_scope_no_mutation', 'payment read scope baseline missing', gate);
assert(gate.approvedReadContract?.endpoint === '/payments/status/by-order-id?applicationId=cliplot&orderId={orderId}', 'approved read contract endpoint changed', gate);
assert(gate.approvedReadContract?.forbiddenEndpoint === '/payments/{paymentId}', 'forbidden provider-refresh endpoint missing', gate);
assert(gate.approvedReadContract?.requiredScope === 'payments:read', 'payments:read scope missing', gate);
assert(Array.isArray(gate.requiredRuntimeFlags) && gate.requiredRuntimeFlags.includes('ENABLE_CUSTOMER_STATUS_RUNTIME_READ=true'), 'customer status runtime flag requirement missing', gate);
assert(gate.requiredRuntimeFlags.includes('ENABLE_PAYMENT_STATUS_SNAPSHOT_READ=true'), 'payment snapshot runtime flag requirement missing', gate);
assert(Array.isArray(gate.requiredApprovalIds) && gate.requiredApprovalIds.includes('CLIPLOT_STATUS_RUNTIME_APPROVAL_ID'), 'status runtime approval id requirement missing', gate);
assert(Array.isArray(gate.mustRemainFalseBeforeActivation) && gate.mustRemainFalseBeforeActivation.includes('provider-backed /payments/{paymentId} reads'), 'provider-refresh guard missing', gate);
assert(Array.isArray(gate.blockers) && gate.blockers.some((item) => item.includes('CLIPLOT_STATUS_RUNTIME_APPROVAL_ID')), 'approval id blocker missing', gate);
assert(gate.blockers.some((item) => item.includes('owner approval')), 'owner approval blocker missing', gate);

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  status: gate.status,
  runtimeReadEnabled: gate.runtimeReadEnabled,
  paymentsSnapshotReadEnabled: gate.paymentsSnapshotReadEnabled,
  storageRead: gate.storageRead,
  callbackPersistence: gate.callbackPersistence,
  wouldReadPaymentsSnapshot: gate.wouldReadPaymentsSnapshot,
  wouldRenderRuntimeCustomerStatus: gate.wouldRenderRuntimeCustomerStatus,
  wouldMutate: gate.wouldMutate,
  customerStatusRuntimeRead: gate.runtimeFlags.customerStatusRuntimeRead,
  paymentStatusSnapshotRead: gate.runtimeFlags.paymentStatusSnapshotRead,
  statusRuntimeApprovalPresent: gate.runtimeFlags.statusRuntimeApprovalPresent,
  blockerCount: gate.blockers.length,
  mutation: gate.mutation,
  persistence: gate.persistence,
  providerCall: gate.providerCall,
}, null, 2));

#!/usr/bin/env node
const baseUrl = process.argv[2] || process.env.CLIPLOT_CUSTOMER_STATUS_APPROVAL_BASE_URL || 'http://127.0.0.1:8080';

function assert(condition, message, evidence = {}) {
  if (!condition) {
    console.error(JSON.stringify({ ok: false, message, ...evidence }, null, 2));
    process.exit(1);
  }
}

const response = await fetch(new URL('/api/checkout/customer-status-approval-evidence-packet', baseUrl));
const text = await response.text();
let packet = null;
try {
  packet = text ? JSON.parse(text) : {};
} catch {
  assert(false, 'customer status approval evidence packet returned non-json response', {
    httpStatus: response.status,
    body: text.slice(0, 300),
  });
}

assert(response.status === 200 && packet.success, 'customer status approval evidence packet request failed', {
  httpStatus: response.status,
  status: packet.status,
});
const approved = packet.status === 'approved_customer_status_runtime_evidence_packet';
assert(approved || packet.status === 'approval_required_customer_status_runtime_evidence_packet', 'approval evidence packet status unexpected', packet);
assert(packet.mode === 'guarded_customer_status_runtime_approval_evidence', 'approval evidence packet mode changed', packet);
assert(packet.baselineGuarded === true, 'guarded baseline evidence missing', packet);
assert(packet.mutation === false, 'approval evidence packet reported mutation', packet);
assert(packet.persistence === false, 'approval evidence packet reported persistence', packet);
assert(packet.providerCall === false, 'approval evidence packet reported provider call', packet);
assert(packet.storageRead === false, 'storage read unexpectedly enabled', packet);
assert(packet.callbackPersistence === false, 'callback persistence unexpectedly enabled', packet);
assert(packet.wouldMutate === false, 'approval packet would mutate', packet);
assert(['guarded_customer_status_surface_contract', 'approved_read_only_customer_status_surface_contract'].includes(packet.currentEvidence?.statusSurface), 'status surface evidence missing', packet);
assert(['approval_required_read_only_customer_status_runtime_rollout', 'approved_read_only_customer_status_runtime_rollout'].includes(packet.currentEvidence?.runtimeRollout), 'runtime rollout evidence missing', packet);
assert(['blocked_read_only_customer_status_runtime_activation', 'ready_for_approved_read_only_customer_status_runtime'].includes(packet.currentEvidence?.activationGate), 'activation gate evidence missing', packet);
assert(['blocked_payments_snapshot_runtime_read', 'ready_for_approved_payments_snapshot_runtime_read'].includes(packet.currentEvidence?.paymentRuntimeReadiness), 'payment runtime readiness evidence missing', packet);
assert(['approval_required_passive_payments_snapshot_read', 'approved_passive_payments_snapshot_read'].includes(packet.currentEvidence?.snapshotReadApproval), 'snapshot approval evidence missing', packet);
assert(packet.currentEvidence?.paymentReadScope === 'validated_payments_read_scope_no_mutation', 'payment read-scope evidence missing', packet);
assert(packet.currentEvidence?.frontendStatusFetch === 'deployed_guarded_fetch', 'frontend guarded fetch evidence missing', packet);
assert(packet.runtimeFlags?.liveOrderSubmit === false, 'live order submit unexpectedly enabled', packet);
assert(packet.runtimeFlags?.livePaymentCreate === false, 'live payment create unexpectedly enabled', packet);
assert(packet.runtimeFlags?.liveNotifications === false, 'live notifications unexpectedly enabled', packet);
assert(packet.approvedReadContract?.endpoint === '/payments/status/by-order-id?applicationId=cliplot&orderId={orderId}', 'approved read endpoint changed', packet);
assert(packet.approvedReadContract?.requiredScope === 'payments:read', 'payments:read scope missing', packet);
assert(packet.approvedReadContract?.forbiddenEndpoint === '/payments/{paymentId}', 'forbidden provider-refresh endpoint missing', packet);
assert(packet.approvedReadContract?.providerCall === false, 'approved read contract would call provider', packet);
assert(packet.approvalRequest?.requiredApprovalId === 'CLIPLOT_STATUS_RUNTIME_APPROVAL_ID', 'status runtime approval id missing', packet);
assert(Array.isArray(packet.approvalRequest?.mustRemainFalse) && packet.approvalRequest.mustRemainFalse.includes('ENABLE_LIVE_PAYMENT_CREATE'), 'live payment create guard missing', packet);
assert(packet.approvalRequest.mustRemainFalse.includes('provider-backed /payments/{paymentId} reads'), 'provider-refresh guard missing', packet);
assert(Array.isArray(packet.validationCommands) && packet.validationCommands.includes('npm run readiness:customer-status-approval -- https://cliplot.alfares.cz'), 'approval validation command missing', packet);
assert(packet.validationCommands.includes('npm run readiness:bundle'), 'readiness bundle validation command missing', packet);
assert(Array.isArray(packet.forbiddenOperations) && packet.forbiddenOperations.includes('read /payments/{paymentId}'), 'forbidden paymentId read missing', packet);
assert(packet.forbiddenOperations.includes('call payment provider'), 'provider-call forbidden operation missing', packet);
assert(packet.intentChain?.validation === 'npm run readiness:customer-status-approval -- https://cliplot.alfares.cz', 'intent validation chain missing', packet);
if (approved) {
  assert(packet.runtimeReadEnabled === true, 'approved runtime read not enabled', packet);
  assert(packet.paymentsSnapshotReadEnabled === true, 'approved snapshot read not enabled', packet);
  assert(packet.approvedRuntimeChange === true, 'approved runtime change missing', packet);
  assert(packet.wouldReadPaymentsSnapshot === true, 'approved packet would not read Payments snapshot', packet);
  assert(packet.wouldRenderRuntimeCustomerStatus === true, 'approved packet would not render runtime status', packet);
  assert(packet.runtimeFlags?.customerStatusRuntimeRead === true, 'approved customer runtime flag missing', packet);
  assert(packet.runtimeFlags?.paymentStatusSnapshotRead === true, 'approved snapshot flag missing', packet);
  assert(packet.runtimeFlags?.statusRuntimeApprovalPresent === true, 'approved runtime approval missing', packet);
} else {
  assert(packet.runtimeReadEnabled === false, 'blocked runtime read unexpectedly enabled', packet);
  assert(packet.paymentsSnapshotReadEnabled === false, 'blocked snapshot read unexpectedly enabled', packet);
  assert(packet.approvedRuntimeChange === false, 'blocked runtime change unexpectedly approved', packet);
  assert(packet.wouldReadPaymentsSnapshot === false, 'blocked packet would read Payments snapshot', packet);
  assert(packet.wouldRenderRuntimeCustomerStatus === false, 'blocked packet would render runtime status', packet);
  assert(Array.isArray(packet.blockers) && packet.blockers.length > 0, 'blocked approval evidence missing blockers', packet);
}

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  status: packet.status,
  baselineGuarded: packet.baselineGuarded,
  statusSurface: packet.currentEvidence.statusSurface,
  runtimeRollout: packet.currentEvidence.runtimeRollout,
  activationGate: packet.currentEvidence.activationGate,
  paymentRuntimeReadiness: packet.currentEvidence.paymentRuntimeReadiness,
  snapshotReadApproval: packet.currentEvidence.snapshotReadApproval,
  frontendStatusFetch: packet.currentEvidence.frontendStatusFetch,
  runtimeReadEnabled: packet.runtimeReadEnabled,
  paymentsSnapshotReadEnabled: packet.paymentsSnapshotReadEnabled,
  storageRead: packet.storageRead,
  callbackPersistence: packet.callbackPersistence,
  statusRuntimeApprovalPresent: packet.runtimeFlags.statusRuntimeApprovalPresent,
  blockerCount: packet.blockers.length,
  mutation: packet.mutation,
  persistence: packet.persistence,
  providerCall: packet.providerCall,
}, null, 2));

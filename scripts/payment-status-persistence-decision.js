#!/usr/bin/env node
const baseUrl = process.argv[2] || process.env.CLIPLOT_PAYMENT_STATUS_PERSISTENCE_DECISION_BASE_URL || 'http://127.0.0.1:8080';

function assert(condition, message, evidence = {}) {
  if (!condition) {
    console.error(JSON.stringify({ ok: false, message, ...evidence }, null, 2));
    process.exit(1);
  }
}

const response = await fetch(new URL('/api/payments/status-persistence-decision', baseUrl));
const text = await response.text();
let packet = null;
try {
  packet = text ? JSON.parse(text) : {};
} catch {
  assert(false, 'payment status persistence decision returned non-json response', {
    httpStatus: response.status,
    body: text.slice(0, 300),
  });
}

assert(response.status === 200 && packet.success, 'decision packet request failed', {
  httpStatus: response.status,
  status: packet.status,
});
assert(['decision_recorded_approval_required', 'approved_payment_status_persistence_decision_metadata_execution_disabled'].includes(packet.status), 'decision packet status unexpected', packet);
assert(packet.mutation === false, 'decision packet reported mutation', packet);
assert(packet.persistence === false, 'decision packet reported persistence', packet);
assert(packet.providerCall === false, 'decision packet reported provider call', packet);
assert(packet.recommendedOption === 'shared-payments-source-of-truth', 'recommended option changed', packet);
assert(packet.decisionRecord?.id === 'ADR-002-payment-status-persistence-ownership', 'decision record id missing', packet);
assert(packet.decisionRecord?.recorded === true, 'decision record should be marked recorded', packet);
assert(['proposed_for_owner_approval', 'owner_approved_shared_payments_source_of_truth'].includes(packet.decisionRecord?.status), 'decision record status unexpected', packet);
assert(typeof packet.decisionRecord?.runtimeApproval === 'boolean', 'decision runtime approval flag missing', packet);
assert(Array.isArray(packet.decisionOptions) && packet.decisionOptions.length === 3, 'decision options missing', packet);
assert(packet.decisionOptions.some((option) => option.id === 'shared-payments-source-of-truth'), 'shared payments option missing', packet);
assert(packet.decisionOptions.some((option) => option.id === 'cliplot-local-status-cache'), 'cliplot-local option missing', packet);
assert(['blocked_pending_provider_backed_status_contract', 'ready_for_approved_payment_status_runtime_read'].includes(packet.currentReadiness?.paymentStatus), 'payment status readiness unexpected', packet);
assert(['blocked_storage_backend_not_approved', 'approved_payment_status_storage_metadata_execution_disabled'].includes(packet.currentReadiness?.paymentStorage), 'payment storage readiness unexpected', packet);
assert(packet.currentReadiness?.callbackPersistence === false, 'callback persistence unexpectedly enabled', packet);
assert(packet.currentReadiness?.currentStatusPersistence === false, 'current status persistence unexpectedly enabled', packet);
assert(packet.currentReadiness?.providerRefreshRisk === 'db_snapshot_endpoint_no_provider_refresh', 'provider refresh risk missing', packet);
assert(['validated_payments_read_scope_no_mutation', 'validated_payments_read_scope_no_mutation_cached'].includes(packet.currentReadiness?.readScopeStatus), 'payment read-scope readiness missing', packet);
assert(packet.evidence?.paymentsAuthoritativeState?.some((item) => item.includes('stores payment id')), 'payments ownership evidence missing', packet);
assert(packet.evidence?.paymentsAuthoritativeState?.some((item) => item.includes('/payments/status/by-order-id')), 'payments snapshot endpoint evidence missing', packet);
assert(packet.evidence?.ordersBoundary?.some((item) => item.includes('bounded payment references')), 'orders boundary evidence missing', packet);
assert(packet.evidence?.cliplotBoundary?.some((item) => item.includes('guarded_no_persistence')), 'cliplot boundary evidence missing', packet);
assert(packet.evidence?.decisionRecord?.some((item) => item.includes('ADR-002-payment-status-persistence-ownership')), 'decision record evidence missing', packet);
assert(packet.approvalPacket?.requiredDecisionRecord === 'ADR-002-payment-status-persistence-ownership', 'required ADR missing', packet);
assert(packet.approvalPacket?.decisionRecorded === true, 'approval packet should mark ADR recorded', packet);
assert(['proposed_for_owner_approval', 'owner_approved_shared_payments_source_of_truth'].includes(packet.approvalPacket?.requiredDecisionRecordStatus), 'ADR approval status missing', packet);
assert(packet.approvalPacket?.mustRemainFalseBeforeApproval?.includes('provider-backed status reads'), 'approval guard missing', packet);
assert(Array.isArray(packet.satisfiedEvidence) && packet.satisfiedEvidence.some((item) => item.includes('[DONE: ADR-002-payment-status-persistence-ownership')), 'ADR recorded evidence missing', packet);
const passiveSnapshotApproved = packet.currentReadiness?.passiveSnapshotReadApproved === true;
if (passiveSnapshotApproved) {
  assert(packet.satisfiedEvidence.some((item) => item.includes('owner-approved passive Payments DB snapshot read is active')), 'approved passive snapshot read evidence missing', packet);
  assert(!packet.blockers.some((item) => item.includes('owner approval to enable Cliplot passive Payments status snapshot reads')), 'approved passive snapshot read still reported missing', packet);
  assert(packet.currentReadiness?.runtimeReadEnabled === true, 'runtime read evidence missing from decision packet', packet);
  assert(packet.currentReadiness?.paymentsSnapshotReadEnabled === true, 'snapshot read evidence missing from decision packet', packet);
  assert(packet.currentReadiness?.statusRuntimeApprovalPresent === true, 'status runtime approval evidence missing from decision packet', packet);
  assert(packet.currentReadiness?.liveMutationRequested === false, 'decision packet reports live mutation requested', packet);
} else {
  assert(packet.blockers.some((item) => item.includes('owner approval')), 'owner approval blocker missing', packet);
}
assert(!packet.blockers.some((item) => item.includes('[MISSING: ADR-payment-status-persistence-ownership]')), 'stale missing ADR blocker still present', packet);
assert(Array.isArray(packet.blockers), 'decision blockers missing', packet);
if (packet.status === 'approved_payment_status_persistence_decision_metadata_execution_disabled') {
  assert(packet.blockers.length === 0, 'approved decision metadata should clear blockers', packet);
} else {
  assert(packet.blockers.length >= 1, 'decision blockers missing before metadata approval', packet);
}
assert(!packet.blockers.some((item) => item.startsWith('[DONE:')), 'satisfied decision evidence should not be counted as blockers', packet);
assert(Array.isArray(packet.sensitiveDataPolicy) && packet.sensitiveDataPolicy.includes('decision metadata only'), 'sensitive data policy missing', packet);

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  status: packet.status,
  recommendedOption: packet.recommendedOption,
  decisionRecord: packet.decisionRecord.id,
  decisionRecordStatus: packet.decisionRecord.status,
  decisionRecorded: packet.decisionRecord.recorded,
  optionCount: packet.decisionOptions.length,
  paymentStatus: packet.currentReadiness.paymentStatus,
  paymentStorage: packet.currentReadiness.paymentStorage,
  callbackPersistence: packet.currentReadiness.callbackPersistence,
  currentStatusPersistence: packet.currentReadiness.currentStatusPersistence,
  providerRefreshRisk: packet.currentReadiness.providerRefreshRisk,
  readScopeStatus: packet.currentReadiness.readScopeStatus,
  passiveSnapshotReadApproved: packet.currentReadiness.passiveSnapshotReadApproved,
  runtimeReadEnabled: packet.currentReadiness.runtimeReadEnabled,
  paymentsSnapshotReadEnabled: packet.currentReadiness.paymentsSnapshotReadEnabled,
  evidenceCount: Object.values(packet.evidence || {}).reduce((count, list) => count + (Array.isArray(list) ? list.length : 0), 0),
  requiredDecisionRecord: packet.approvalPacket.requiredDecisionRecord,
  requiredDecisionRecordStatus: packet.approvalPacket.requiredDecisionRecordStatus,
  blockerCount: packet.blockers.length,
  mutation: packet.mutation,
  persistence: packet.persistence,
  providerCall: packet.providerCall,
}, null, 2));

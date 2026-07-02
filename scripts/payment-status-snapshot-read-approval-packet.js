#!/usr/bin/env node
const baseUrl = process.argv[2] || process.env.CLIPLOT_PAYMENT_STATUS_SNAPSHOT_READ_APPROVAL_BASE_URL || 'http://127.0.0.1:8080';

function assert(condition, message, evidence = {}) {
  if (!condition) {
    console.error(JSON.stringify({ ok: false, message, ...evidence }, null, 2));
    process.exit(1);
  }
}

const response = await fetch(new URL('/api/payments/status-snapshot-read-approval-packet', baseUrl));
const text = await response.text();
let packet = null;
try {
  packet = text ? JSON.parse(text) : {};
} catch {
  assert(false, 'payment status snapshot read approval packet returned non-json response', {
    httpStatus: response.status,
    body: text.slice(0, 300),
  });
}

assert(response.status === 200 && packet.success, 'payment status snapshot read approval packet request failed', {
  httpStatus: response.status,
  status: packet.status,
});
const approved = packet.status === 'approved_passive_payments_snapshot_read';
assert(approved || packet.status === 'approval_required_passive_payments_snapshot_read', 'snapshot read approval packet status unexpected', packet);
assert(packet.mutation === false, 'approval packet reported mutation', packet);
assert(packet.persistence === false, 'approval packet reported persistence', packet);
assert(packet.providerCall === false, 'approval packet reported provider call', packet);
assert(packet.livePaymentCreate === false, 'live payment create unexpectedly enabled', packet);
assert(packet.recommendedOption === 'shared-payments-source-of-truth', 'recommended option changed', packet);
assert(packet.decisionRecord?.id === 'ADR-002-payment-status-persistence-ownership', 'decision record missing', packet);
assert(['proposed_for_owner_approval', 'owner_approved_shared_payments_source_of_truth'].includes(packet.decisionRecord?.status), 'decision record status unexpected', packet);
assert(packet.readContract?.endpoint === '/payments/status/by-order-id?applicationId=cliplot&orderId={orderId}', 'Payments DB snapshot endpoint missing', packet);
assert(packet.readContract?.requiredScope === 'payments:read', 'payments:read scope missing', packet);
assert(packet.readContract?.providerRefreshRisk === 'db_snapshot_endpoint_no_provider_refresh', 'provider refresh risk missing', packet);
assert(packet.readContract?.providerCall === false && packet.readContract?.persistence === false && packet.readContract?.mutation === false, 'read contract is not read-only', packet);
assert(packet.readContract?.forbiddenEndpoint === '/payments/{paymentId}', 'forbidden provider-refresh endpoint missing', packet);
assert(['blocked_pending_provider_backed_status_contract', 'ready_for_approved_payment_status_runtime_read'].includes(packet.currentReadiness?.paymentStatus), 'payment status readiness unexpected', packet);
assert(['blocked_storage_backend_not_approved', 'approved_payment_status_storage_metadata_execution_disabled'].includes(packet.currentReadiness?.paymentStorage), 'payment storage readiness unexpected', packet);
assert(['decision_recorded_approval_required', 'approved_payment_status_persistence_decision_metadata_execution_disabled'].includes(packet.currentReadiness?.paymentDecision), 'payment decision readiness unexpected', packet);
assert(['validated_payments_read_scope_no_mutation', 'validated_payments_read_scope_no_mutation_cached'].includes(packet.currentReadiness?.readScopeStatus), 'read-scope readiness missing', packet);
assert(packet.currentReadiness?.scopeValidated === true, 'payments:read scope evidence missing', packet);
assert(packet.currentReadiness?.currentStatusPersistence === false, 'current status persistence unexpectedly enabled', packet);
assert(packet.currentReadiness?.callbackPersistence === false, 'callback persistence unexpectedly enabled', packet);
assert(packet.customerSafeStatusContract?.labelsLocale === 'cs-CZ', 'customer-safe status locale missing', packet);
assert(Array.isArray(packet.approvalChecklist) && packet.approvalChecklist.some((item) => item.id === 'payments-read-scope' && item.status === 'satisfied'), 'payments read-scope checklist evidence missing', packet);
if (approved) {
  assert(packet.runtimeReadEnabled === true, 'approved passive snapshot read not enabled', packet);
  assert(packet.approvedRuntimeChange === true, 'approved runtime change missing', packet);
  assert(packet.approvalChecklist.every((item) => item.status === 'satisfied'), 'approved snapshot packet has unsatisfied checklist items', packet);
  assert(Array.isArray(packet.blockers) && packet.blockers.length === 0, 'approved snapshot packet still has blockers', packet);
} else {
  assert(packet.runtimeReadEnabled === false, 'blocked passive snapshot read unexpectedly enabled', packet);
  assert(packet.approvedRuntimeChange === false, 'blocked runtime change unexpectedly approved', packet);
  assert(Array.isArray(packet.blockers) && packet.blockers.length > 0, 'blocked snapshot packet missing blockers', packet);
}
assert(Array.isArray(packet.sensitiveDataPolicy) && packet.sensitiveDataPolicy.includes('approval metadata only'), 'sensitive data policy missing', packet);

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  status: packet.status,
  recommendedOption: packet.recommendedOption,
  decisionRecord: packet.decisionRecord.id,
  decisionRecordStatus: packet.decisionRecord.status,
  readEndpoint: packet.readContract.endpoint,
  requiredScope: packet.readContract.requiredScope,
  providerRefreshRisk: packet.readContract.providerRefreshRisk,
  readScopeStatus: packet.currentReadiness.readScopeStatus,
  scopeValidated: packet.currentReadiness.scopeValidated,
  runtimeReadEnabled: packet.runtimeReadEnabled,
  approvedRuntimeChange: packet.approvedRuntimeChange,
  blockerCount: packet.blockers.length,
  mutation: packet.mutation,
  persistence: packet.persistence,
  providerCall: packet.providerCall,
}, null, 2));

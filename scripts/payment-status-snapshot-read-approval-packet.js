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
assert(packet.status === 'approval_required_passive_payments_snapshot_read', 'payment status snapshot read approval packet should remain approval-required for passive snapshot reads', packet);
assert(packet.mutation === false, 'approval packet reported mutation', packet);
assert(packet.persistence === false, 'approval packet reported persistence', packet);
assert(packet.providerCall === false, 'approval packet reported provider call', packet);
assert(packet.runtimeReadEnabled === false, 'passive snapshot read unexpectedly enabled', packet);
assert(packet.approvedRuntimeChange === false, 'runtime change unexpectedly approved', packet);
assert(packet.livePaymentCreate === false, 'live payment create unexpectedly enabled', packet);
assert(packet.recommendedOption === 'shared-payments-source-of-truth', 'recommended option changed', packet);
assert(packet.decisionRecord?.id === 'ADR-002-payment-status-persistence-ownership', 'decision record missing', packet);
assert(packet.decisionRecord?.status === 'proposed_for_owner_approval', 'decision record should remain proposed', packet);
assert(packet.readContract?.endpoint === '/payments/status/by-order-id?applicationId=cliplot&orderId={orderId}', 'Payments DB snapshot endpoint missing', packet);
assert(packet.readContract?.requiredScope === 'payments:read', 'payments:read scope missing', packet);
assert(packet.readContract?.providerRefreshRisk === 'db_snapshot_endpoint_no_provider_refresh', 'provider refresh risk missing', packet);
assert(packet.readContract?.providerCall === false && packet.readContract?.persistence === false && packet.readContract?.mutation === false, 'read contract is not read-only', packet);
assert(packet.readContract?.forbiddenEndpoint === '/payments/{paymentId}', 'forbidden provider-refresh endpoint missing', packet);
assert(packet.currentReadiness?.paymentStatus === 'blocked_pending_provider_backed_status_contract', 'payment status readiness unexpected', packet);
assert(packet.currentReadiness?.paymentStorage === 'blocked_storage_backend_not_approved', 'payment storage readiness unexpected', packet);
assert(packet.currentReadiness?.paymentDecision === 'decision_recorded_approval_required', 'payment decision readiness unexpected', packet);
assert(packet.currentReadiness?.readScopeStatus === 'validated_payments_read_scope_no_mutation', 'read-scope readiness missing', packet);
assert(packet.currentReadiness?.scopeValidated === true, 'payments:read scope evidence missing', packet);
assert(packet.currentReadiness?.currentStatusPersistence === false, 'current status persistence unexpectedly enabled', packet);
assert(packet.currentReadiness?.callbackPersistence === false, 'callback persistence unexpectedly enabled', packet);
assert(packet.customerSafeStatusContract?.labelsLocale === 'cs-CZ', 'customer-safe status locale missing', packet);
assert(Array.isArray(packet.approvalChecklist) && packet.approvalChecklist.some((item) => item.id === 'payments-read-scope' && item.status === 'satisfied'), 'payments read-scope checklist evidence missing', packet);
assert(packet.approvalChecklist.some((item) => item.id === 'owner-approval-passive-status-read' && item.status === 'missing'), 'owner approval blocker missing from checklist', packet);
assert(Array.isArray(packet.requiredApprovalEvidence) && packet.requiredApprovalEvidence.some((item) => item.includes('owner approval')), 'required owner approval evidence missing', packet);
assert(Array.isArray(packet.mustRemainFalseBeforeApproval) && packet.mustRemainFalseBeforeApproval.includes('runtimeReadEnabled'), 'passive read guard missing', packet);
assert(Array.isArray(packet.blockers) && packet.blockers.some((item) => item.includes('owner approval')), 'owner approval blocker missing', packet);
assert(packet.blockers.some((item) => item.includes('customer-safe status copy approval')), 'customer-safe copy approval blocker missing', packet);
assert(packet.blockers.some((item) => item.includes('approved runtime rollout plan')), 'runtime rollout plan blocker missing', packet);
assert(packet.blockers.some((item) => item.includes('DB-only by-order-id route')), 'DB-only route approval blocker missing', packet);
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

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
assert(packet.status === 'decision_required', 'decision packet should remain decision-required', packet);
assert(packet.mutation === false, 'decision packet reported mutation', packet);
assert(packet.persistence === false, 'decision packet reported persistence', packet);
assert(packet.providerCall === false, 'decision packet reported provider call', packet);
assert(packet.recommendedOption === 'shared-payments-source-of-truth', 'recommended option changed', packet);
assert(Array.isArray(packet.decisionOptions) && packet.decisionOptions.length === 3, 'decision options missing', packet);
assert(packet.decisionOptions.some((option) => option.id === 'shared-payments-source-of-truth'), 'shared payments option missing', packet);
assert(packet.decisionOptions.some((option) => option.id === 'cliplot-local-status-cache'), 'cliplot-local option missing', packet);
assert(packet.currentReadiness?.paymentStatus === 'blocked_pending_provider_backed_status_contract', 'payment status readiness unexpected', packet);
assert(packet.currentReadiness?.paymentStorage === 'blocked_storage_backend_not_approved', 'payment storage readiness unexpected', packet);
assert(packet.currentReadiness?.callbackPersistence === false, 'callback persistence unexpectedly enabled', packet);
assert(packet.currentReadiness?.currentStatusPersistence === false, 'current status persistence unexpectedly enabled', packet);
assert(packet.currentReadiness?.providerRefreshRisk === 'db_snapshot_endpoint_no_provider_refresh', 'provider refresh risk missing', packet);
assert(packet.currentReadiness?.readScopeStatus === 'validated_payments_read_scope_no_mutation', 'payment read-scope readiness missing', packet);
assert(packet.evidence?.paymentsAuthoritativeState?.some((item) => item.includes('stores payment id')), 'payments ownership evidence missing', packet);
assert(packet.evidence?.paymentsAuthoritativeState?.some((item) => item.includes('/payments/status/by-order-id')), 'payments snapshot endpoint evidence missing', packet);
assert(packet.evidence?.ordersBoundary?.some((item) => item.includes('bounded payment references')), 'orders boundary evidence missing', packet);
assert(packet.evidence?.cliplotBoundary?.some((item) => item.includes('guarded_no_persistence')), 'cliplot boundary evidence missing', packet);
assert(packet.approvalPacket?.requiredDecisionRecord === 'ADR-payment-status-persistence-ownership', 'required ADR missing', packet);
assert(packet.approvalPacket?.mustRemainFalseBeforeApproval?.includes('provider-backed status reads'), 'approval guard missing', packet);
assert(Array.isArray(packet.blockers) && packet.blockers.length >= 5, 'decision blockers missing', packet);
assert(Array.isArray(packet.sensitiveDataPolicy) && packet.sensitiveDataPolicy.includes('decision metadata only'), 'sensitive data policy missing', packet);

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  status: packet.status,
  recommendedOption: packet.recommendedOption,
  optionCount: packet.decisionOptions.length,
  paymentStatus: packet.currentReadiness.paymentStatus,
  paymentStorage: packet.currentReadiness.paymentStorage,
  callbackPersistence: packet.currentReadiness.callbackPersistence,
  currentStatusPersistence: packet.currentReadiness.currentStatusPersistence,
  providerRefreshRisk: packet.currentReadiness.providerRefreshRisk,
  readScopeStatus: packet.currentReadiness.readScopeStatus,
  evidenceCount: Object.values(packet.evidence || {}).reduce((count, list) => count + (Array.isArray(list) ? list.length : 0), 0),
  requiredDecisionRecord: packet.approvalPacket.requiredDecisionRecord,
  blockerCount: packet.blockers.length,
  mutation: packet.mutation,
  persistence: packet.persistence,
  providerCall: packet.providerCall,
}, null, 2));

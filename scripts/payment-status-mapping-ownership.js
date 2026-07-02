#!/usr/bin/env node
const baseUrl = process.argv[2] || process.env.CLIPLOT_PAYMENT_STATUS_MAPPING_BASE_URL || 'http://127.0.0.1:8080';

function assert(condition, message, evidence = {}) {
  if (!condition) {
    console.error(JSON.stringify({ ok: false, message, ...evidence }, null, 2));
    process.exit(1);
  }
}

const response = await fetch(new URL('/api/payments/status-mapping-ownership', baseUrl));
const text = await response.text();
let packet = null;
try {
  packet = text ? JSON.parse(text) : {};
} catch {
  assert(false, 'payment status mapping ownership returned non-json response', {
    httpStatus: response.status,
    body: text.slice(0, 300),
  });
}

assert(response.status === 200 && packet.success, 'mapping ownership packet request failed', {
  httpStatus: response.status,
  status: packet.status,
});
assert(packet.status === 'approval_required_order_payment_status_mapping_ownership', 'mapping ownership should remain approval-required', packet);
assert(packet.mode === 'guarded_order_payment_status_mapping_ownership', 'mapping ownership mode changed', packet);
assert(packet.mutation === false, 'mapping ownership reported mutation', packet);
assert(packet.persistence === false, 'mapping ownership reported persistence', packet);
assert(packet.providerCall === false, 'mapping ownership reported provider call', packet);
assert(typeof packet.runtimeReadEnabled === 'boolean', 'runtime read flag missing', packet);
assert(typeof packet.paymentsSnapshotReadEnabled === 'boolean', 'payments snapshot read flag missing', packet);
assert(packet.storageRead === false, 'storage read unexpectedly enabled', packet);
assert(packet.callbackPersistence === false, 'callback persistence unexpectedly enabled', packet);
assert(packet.decisionRecord?.id === 'ADR-006-order-payment-status-mapping-ownership', 'ADR-006 decision record missing', packet);
assert(packet.decisionRecord?.status === 'proposed_for_owner_approval', 'ADR-006 decision status changed', packet);
assert(typeof packet.decisionRecord?.runtimeApproval === 'boolean', 'ADR-006 runtime approval flag missing', packet);
assert(packet.ownership?.orders?.owner === 'orders-microservice', 'Orders owner missing', packet);
assert(packet.ownership?.orders?.authoritative === true, 'Orders must stay authoritative for order lifecycle', packet);
assert(packet.ownership?.payments?.owner === 'payments-microservice', 'Payments owner missing', packet);
assert(packet.ownership?.payments?.authoritative === true, 'Payments must stay authoritative for payment status', packet);
assert(packet.ownership?.cliplot?.owner === 'cliplot', 'Cliplot role missing', packet);
assert(packet.ownership?.cliplot?.authoritative === false, 'Cliplot must remain non-authoritative', packet);
assert(packet.currentEvidence?.paymentDecision === 'decision_recorded_approval_required', 'payment decision evidence missing', packet);
assert(['approval_required_callback_replay_policy', 'approved_callback_replay_policy_metadata_execution_disabled'].includes(packet.currentEvidence?.callbackReplayPolicy), 'callback replay policy evidence missing', packet);
assert(['approval_required_passive_payments_snapshot_read', 'approved_passive_payments_snapshot_read'].includes(packet.currentEvidence?.snapshotReadApproval), 'snapshot-read evidence missing', packet);
assert(['blocked_payments_snapshot_runtime_read', 'ready_for_approved_payments_snapshot_runtime_read'].includes(packet.currentEvidence?.runtimeReadiness), 'runtime readiness evidence missing', packet);
assert(packet.currentEvidence?.currentStatusPersistence === false, 'current status persistence unexpectedly enabled', packet);
assert(packet.currentEvidence?.callbackPersistence === false, 'callback persistence evidence missing', packet);
assert(packet.currentEvidence?.storageRead === false, 'storage read evidence missing', packet);
assert(typeof packet.currentEvidence?.runtimeReadEnabled === 'boolean', 'runtime read evidence missing', packet);
assert(typeof packet.currentEvidence?.paymentsSnapshotReadEnabled === 'boolean', 'snapshot read evidence missing', packet);
assert(packet.readContract?.endpoint === '/payments/status/by-order-id?applicationId=cliplot&orderId={orderId}', 'DB-only read endpoint changed', packet);
assert(packet.readContract?.forbiddenEndpoint === '/payments/{paymentId}', 'forbidden provider-backed endpoint missing', packet);
assert(packet.readContract?.providerCall === false, 'read contract provider call enabled', packet);
assert(packet.readContract?.mutation === false, 'read contract mutation enabled', packet);
assert(packet.readContract?.persistence === false, 'read contract persistence enabled', packet);

const requiredFields = [
  'externalOrderId',
  'orderId',
  'paymentId',
  'paymentCreateIdempotencyKey',
  'amount',
  'currency',
  'status',
  'customerSafePaymentStatus',
  'createdAt',
  'completedAt',
];
for (const field of requiredFields) {
  assert(packet.mappingContract?.proposedFields?.includes(field), `mapping field missing: ${field}`, packet);
}

assert(Array.isArray(packet.forbiddenOperations) && packet.forbiddenOperations.includes('read /payments/{paymentId}'), 'forbidden payment read missing', packet);
assert(packet.forbiddenOperations.includes('persist callback state'), 'forbidden callback persistence missing', packet);
assert(Array.isArray(packet.blockers) && packet.blockers.some((item) => item.includes('approved order/payment status mapping ownership')), 'mapping ownership approval blocker missing', packet);
if (packet.runtimeReadEnabled === true) {
  assert(packet.blockers.some((item) => item.includes('owner-approved passive Payments DB snapshot read is active')), 'approved passive snapshot read evidence missing', packet);
  assert(packet.blockers.some((item) => item.includes('CLIPLOT_STATUS_RUNTIME_APPROVAL_ID recorded')), 'status runtime approval evidence missing', packet);
  assert(!packet.blockers.some((item) => item.includes('owner approval to enable Cliplot passive Payments status snapshot reads')), 'approved passive snapshot read still reported missing', packet);
} else {
  assert(packet.blockers.some((item) => item.includes('owner approval to enable Cliplot passive Payments status snapshot reads')), 'snapshot-read owner approval blocker missing', packet);
}
assert(Array.isArray(packet.sensitiveDataPolicy) && packet.sensitiveDataPolicy.includes('ownership metadata only'), 'sensitive data policy missing', packet);

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  status: packet.status,
  decisionRecord: packet.decisionRecord.id,
  orderOwner: packet.ownership.orders.owner,
  paymentOwner: packet.ownership.payments.owner,
  cliplotAuthoritative: packet.ownership.cliplot.authoritative,
  blockerCount: packet.blockers.length,
  mutation: packet.mutation,
  persistence: packet.persistence,
  providerCall: packet.providerCall,
}, null, 2));

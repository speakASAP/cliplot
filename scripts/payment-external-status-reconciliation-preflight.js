#!/usr/bin/env node
const baseUrl = process.argv[2] || process.env.CLIPLOT_EXTERNAL_STATUS_RECONCILIATION_PREFLIGHT_BASE_URL || 'http://127.0.0.1:8080';

function assert(condition, message, evidence = {}) {
  if (!condition) {
    console.error(JSON.stringify({ ok: false, message, ...evidence }, null, 2));
    process.exit(1);
  }
}

const response = await fetch(new URL('/api/payments/external-status-reconciliation-preflight-packet', baseUrl));
const text = await response.text();
let packet = null;
try {
  packet = text ? JSON.parse(text) : {};
} catch {
  assert(false, 'external status reconciliation preflight returned non-json response', {
    httpStatus: response.status,
    body: text.slice(0, 300),
  });
}

assert(response.status === 200 && packet.success, 'external status reconciliation preflight request failed', {
  httpStatus: response.status,
  status: packet.status,
});
assert(packet.mode === 'read_only_external_status_reconciliation_preflight_packet', 'preflight mode mismatch', packet);
assert(packet.mutation === false, 'preflight reports mutation', packet);
assert(packet.persistence === false, 'preflight reports persistence', packet);
assert(packet.providerCall === false, 'preflight reports provider call', packet);
assert(packet.liveExecutionAllowed === false, 'preflight allows live execution', packet);
assert(packet.currentPacketEnablesRuntime === false, 'preflight enables runtime', packet);
assert(packet.prerequisiteEvidence?.statusWriteWindowRequest === 'ready_for_bounded_payment_status_write_window_request_execution_disabled', 'status write window request prerequisite missing', packet);
assert(packet.prerequisiteEvidence?.completedOrderId === '7938b1c4-1fb8-44e3-a4f3-e61e71052afb', 'completed order evidence missing', packet);
assert(packet.prerequisiteEvidence?.completedPaymentStatus === 'processing', 'completed payment processing evidence missing', packet);
assert(packet.paymentsSnapshotReadback?.paymentIdPresent === true, 'payment id was not resolved from snapshot', packet);
assert(typeof packet.paymentsSnapshotReadback?.paymentIdFingerprint === 'string', 'payment id fingerprint missing', packet);
assert(packet.paymentsSnapshotReadback?.paymentStatus === 'processing', 'snapshot payment status mismatch', packet);
assert(packet.paymentsSnapshotReadback?.providerCall === false, 'snapshot provider call occurred', packet);
assert(packet.paymentsSnapshotReadback?.mutation === false, 'snapshot mutation occurred', packet);
assert(packet.paymentsSnapshotReadback?.persistence === false, 'snapshot persistence occurred', packet);
assert(packet.requestTemplate?.paymentId === '[REDACTED: available from Payments snapshot readback]', 'request template exposed raw payment id or did not resolve it', packet);
assert(packet.requestTemplate?.targetStatus === 'owner_review_required_cancelled_candidate', 'target status candidate mismatch', packet);
assert(packet.blockers?.includes('[MISSING: owner/provider approval that cancelled is the correct targetStatus for this processing payment after order cleanup]'), 'owner target-status blocker missing', packet);
assert(packet.blockers?.includes('[MISSING: PAYMENTS_EXTERNAL_STATUS_RECONCILIATION_ENABLED=true only inside the future bounded window]'), 'Payments runtime flag blocker missing', packet);
assert(packet.forbiddenOperationsNow?.includes('do not call POST /payments/external/status-reconciliation'), 'Payments POST forbidden operation missing', packet);

const serialized = JSON.stringify(packet);
for (const forbidden of ['sk_live', 'sk_test', 'whsec_', 'Bearer ', 'rawProviderPayload', 'providerTransactionId', 'recipientEmail', 'messageBody']) {
  assert(!serialized.includes(forbidden), `sensitive marker leaked: ${forbidden}`, { marker: forbidden });
}

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  status: packet.status,
  completedOrderId: packet.prerequisiteEvidence.completedOrderId,
  completedPaymentStatus: packet.prerequisiteEvidence.completedPaymentStatus,
  snapshotPaymentStatus: packet.paymentsSnapshotReadback.paymentStatus,
  paymentIdFingerprint: packet.paymentsSnapshotReadback.paymentIdFingerprint,
  targetStatus: packet.requestTemplate.targetStatus,
  blockerCount: packet.blockers.length,
  mutation: packet.mutation,
  persistence: packet.persistence,
  providerCall: packet.providerCall,
}, null, 2));

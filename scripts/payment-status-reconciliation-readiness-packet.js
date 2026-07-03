#!/usr/bin/env node
const baseUrl = process.argv[2] || process.env.CLIPLOT_PAYMENT_STATUS_RECONCILIATION_BASE_URL || 'http://127.0.0.1:8080';

function assert(condition, message, evidence = {}) {
  if (!condition) {
    console.error(JSON.stringify({ ok: false, message, ...evidence }, null, 2));
    process.exit(1);
  }
}

const response = await fetch(new URL('/api/payments/status-reconciliation-readiness-packet', baseUrl));
const text = await response.text();
let packet = null;
try {
  packet = text ? JSON.parse(text) : {};
} catch {
  assert(false, 'payment status reconciliation packet returned non-json response', {
    httpStatus: response.status,
    body: text.slice(0, 300),
  });
}

assert(response.status === 200 && packet.success, 'payment status reconciliation packet request failed', {
  httpStatus: response.status,
  status: packet.status,
});
assert(packet.status === 'ready_for_callback_payment_status_reconciliation_review_execution_disabled', 'payment status reconciliation status mismatch', packet);
assert(packet.mode === 'read_only_callback_payment_status_reconciliation_packet', 'payment status reconciliation mode mismatch', packet);
assert(packet.mutation === false, 'reconciliation packet reports mutation', packet);
assert(packet.persistence === false, 'reconciliation packet reports persistence', packet);
assert(packet.providerCall === false, 'reconciliation packet reports provider call', packet);
assert(packet.sideEffects === false, 'reconciliation packet reports side effects', packet);
assert(packet.liveExecutionAllowed === false, 'reconciliation packet allows live execution', packet);
assert(packet.currentPacketEnablesRuntime === false, 'reconciliation packet enables runtime', packet);
assert(packet.callbackEvidence?.callbackReadiness === 'validated_guarded_ack_no_persistence', 'guarded callback ACK evidence missing', packet);
assert(packet.callbackEvidence?.callbackPolicy === 'approved_callback_replay_policy_metadata_execution_disabled', 'callback policy approval missing', packet);
assert(packet.callbackEvidence?.callbackPersistence === false, 'callback persistence enabled in callback evidence', packet);
assert(packet.callbackEvidence?.callbackReplayEnabled === false, 'callback replay enabled in callback evidence', packet);
assert(packet.passivePaymentStatusRead?.paymentStatus === 'ready_for_approved_payment_status_runtime_read', 'payment status runtime read not ready', packet);
assert(packet.passivePaymentStatusRead?.snapshotReadApproval === 'approved_passive_payments_snapshot_read', 'snapshot read approval missing', packet);
assert(packet.passivePaymentStatusRead?.mappingOwnership === 'approved_order_payment_status_mapping_ownership', 'mapping ownership approval missing', packet);
assert(packet.passivePaymentStatusRead?.runtimeReadEnabled === true, 'runtime read not enabled', packet);
assert(packet.passivePaymentStatusRead?.paymentsSnapshotReadEnabled === true, 'payments snapshot read not enabled', packet);
assert(packet.passivePaymentStatusRead?.storageRead === false, 'storage read unexpectedly enabled', packet);
assert(packet.passivePaymentStatusRead?.approvedReadContract?.forbiddenEndpoint === '/payments/{paymentId}', 'provider-backed payment read guard missing', packet);
assert(packet.reconciliationBoundaries?.noCliplotLocalPaymentTruth === true, 'Cliplot local payment truth boundary missing', packet);
assert(packet.reconciliationBoundaries?.noProviderBackedPaymentIdReads === true, 'provider-backed read boundary missing', packet);
assert(packet.reconciliationBoundaries?.noOrderStatusWritesFromCliplot === true, 'order status write boundary missing', packet);
assert(packet.currentRuntimeGuards?.liveFlagsClosed === true, 'live flags are not closed', packet);
assert(packet.currentRuntimeGuards?.callbackPersistence === false, 'callback persistence enabled', packet);
assert(packet.currentRuntimeGuards?.callbackReplayEnabled === false, 'callback replay enabled', packet);
assert(packet.currentRuntimeGuards?.replayExecutionAllowed === false, 'callback replay execution enabled', packet);
assert(packet.currentRuntimeGuards?.liveStatusWritesEnabled === false, 'live status writes enabled', packet);
assert(packet.currentRuntimeGuards?.liveStatusWritesNow === false, 'live status writes active now', packet);
assert(packet.currentRuntimeGuards?.currentStatusPersistence === false, 'current status persistence enabled', packet);
assert(packet.currentRuntimeGuards?.liveWritesEnabled === false, 'live writes enabled', packet);
assert(packet.currentRuntimeGuards?.livePaymentCreate === false, 'live payment create enabled', packet);
assert(packet.currentRuntimeGuards?.liveNotifications === false, 'live notifications enabled', packet);
assert(packet.currentRuntimeGuards?.liveOrderSubmit === false, 'live order submit enabled', packet);
assert(packet.dryRunReconciliationMatrix?.cases?.every((item) => item.runtimeMutationNow === false), 'dry-run matrix would mutate', packet);
assert(Array.isArray(packet.failedAssertions) && packet.failedAssertions.length === 0, 'reconciliation assertions failed', packet);
assert(Array.isArray(packet.blockers) && packet.blockers.length === 0, 'reconciliation blockers should be empty', packet);
assert(packet.forbiddenOperationsNow?.includes('do not execute callback replay'), 'callback replay forbidden operation missing', packet);
assert(packet.forbiddenOperationsNow?.includes('do not read provider-backed /payments/{paymentId}'), 'provider-backed read forbidden operation missing', packet);

const serialized = JSON.stringify(packet);
for (const forbidden of ['sk_live', 'sk_test', 'whsec_', 'Bearer ', 'rawProviderPayload', 'providerTransactionId', 'recipientEmail', 'messageBody']) {
  assert(!serialized.includes(forbidden), `sensitive marker leaked: ${forbidden}`, { marker: forbidden });
}

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  status: packet.status,
  callbackReadiness: packet.callbackEvidence.callbackReadiness,
  callbackPolicy: packet.callbackEvidence.callbackPolicy,
  paymentStatus: packet.passivePaymentStatusRead.paymentStatus,
  snapshotReadApproval: packet.passivePaymentStatusRead.snapshotReadApproval,
  mappingOwnership: packet.passivePaymentStatusRead.mappingOwnership,
  liveFlagsClosed: packet.currentRuntimeGuards.liveFlagsClosed,
  callbackPersistence: packet.currentRuntimeGuards.callbackPersistence,
  replayExecutionAllowed: packet.currentRuntimeGuards.replayExecutionAllowed,
  liveStatusWritesNow: packet.currentRuntimeGuards.liveStatusWritesNow,
  failedAssertionCount: packet.failedAssertions.length,
  mutation: packet.mutation,
  persistence: packet.persistence,
  providerCall: packet.providerCall,
}, null, 2));

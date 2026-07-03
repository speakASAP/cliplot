#!/usr/bin/env node
const baseUrl = process.argv[2] || process.env.CLIPLOT_PAYMENT_STATUS_WRITE_WINDOW_REQUEST_BASE_URL || 'http://127.0.0.1:8080';

function assert(condition, message, evidence = {}) {
  if (!condition) {
    console.error(JSON.stringify({ ok: false, message, ...evidence }, null, 2));
    process.exit(1);
  }
}

const response = await fetch(new URL('/api/payments/status-write-window-request-packet', baseUrl));
const text = await response.text();
let packet = null;
try {
  packet = text ? JSON.parse(text) : {};
} catch {
  assert(false, 'payment status write-window request packet returned non-json response', {
    httpStatus: response.status,
    body: text.slice(0, 300),
  });
}

assert(response.status === 200 && packet.success, 'payment status write-window request packet request failed', {
  httpStatus: response.status,
  status: packet.status,
});
assert(packet.status === 'ready_for_bounded_payment_status_write_window_request_execution_disabled', 'status write-window request status mismatch', packet);
assert(packet.mode === 'read_only_payment_status_write_window_request_packet', 'status write-window request mode mismatch', packet);
assert(packet.mutation === false, 'request packet reports mutation', packet);
assert(packet.persistence === false, 'request packet reports persistence', packet);
assert(packet.providerCall === false, 'request packet reports provider call', packet);
assert(packet.sideEffects === false, 'request packet reports side effects', packet);
assert(packet.liveExecutionAllowed === false, 'request packet allows live execution', packet);
assert(packet.currentPacketEnablesRuntime === false, 'request packet enables runtime', packet);
assert(packet.prerequisiteEvidence?.reconciliation === 'ready_for_callback_payment_status_reconciliation_review_execution_disabled', 'reconciliation prerequisite missing', packet);
assert(packet.prerequisiteEvidence?.callbackReadiness === 'validated_guarded_ack_no_persistence', 'callback readiness prerequisite missing', packet);
assert(packet.prerequisiteEvidence?.paymentStatus === 'ready_for_approved_payment_status_runtime_read', 'payment status prerequisite missing', packet);
assert(packet.operatorRequestContract?.currentPacketAcceptsRequests === false, 'packet accepts write requests', packet);
assert(packet.operatorRequestContract?.currentPacketMayOpenFlags === false, 'packet may open flags', packet);
assert(packet.operatorRequestContract?.currentPacketMayExecuteWrites === false, 'packet may execute writes', packet);
assert(packet.operatorRequestContract?.requestFields?.some((field) => field.name === 'confirm' && field.requiredValue === 'PAYMENT_STATUS_WRITE_WINDOW'), 'confirm request field missing', packet);
assert(packet.operatorRequestContract?.requestFields?.some((field) => field.name === 'approvalId' && field.requiredValue === 'CLIPLOT_LIVE_STATUS_WRITE_APPROVAL_ID'), 'approval request field missing', packet);
assert(packet.operatorRequestContract?.requestFields?.some((field) => field.name === 'postWindowReconciliationEvidence'), 'post-window evidence request field missing', packet);
assert(packet.currentRuntimeFlags?.ENABLE_PAYMENT_LIVE_STATUS_WRITE === false, 'status write flag enabled', packet);
assert(packet.currentRuntimeFlags?.ENABLE_PAYMENT_CALLBACK_PERSISTENCE === false, 'callback persistence flag enabled', packet);
assert(packet.currentRuntimeFlags?.ENABLE_PAYMENT_CALLBACK_REPLAY_EXECUTION === false, 'callback replay flag enabled', packet);
assert(packet.currentRuntimeFlags?.ENABLE_LIVE_PAYMENT_CREATE === false, 'live payment create enabled', packet);
assert(packet.currentRuntimeFlags?.ENABLE_LIVE_NOTIFICATIONS === false, 'live notifications enabled', packet);
assert(packet.currentRuntimeGuards?.callbackPersistence === false, 'callback persistence guard enabled', packet);
assert(packet.currentRuntimeGuards?.replayExecutionAllowed === false, 'replay execution guard enabled', packet);
assert(packet.currentRuntimeGuards?.liveStatusWritesNow === false, 'live status writes active now', packet);
assert(packet.rollbackPlan?.includes('set ENABLE_PAYMENT_LIVE_STATUS_WRITE=false'), 'rollback flag close missing', packet);
assert(packet.validationPlan?.includes('post-window: readiness:bundle pass'), 'post-window bundle validation missing', packet);
assert(packet.postWindowEvidenceRequired?.includes('payment status reconciliation packet after close'), 'post-window reconciliation evidence missing', packet);
assert(Array.isArray(packet.failedAssertions) && packet.failedAssertions.length === 0, 'write-window request assertions failed', packet);
assert(Array.isArray(packet.blockers) && packet.blockers.length === 0, 'write-window request blockers should be empty', packet);
assert(packet.forbiddenOperationsNow?.includes('do not open ENABLE_PAYMENT_LIVE_STATUS_WRITE'), 'status write flag forbidden operation missing', packet);
assert(packet.forbiddenOperationsNow?.includes('do not read provider-backed /payments/{paymentId}'), 'provider-backed read forbidden operation missing', packet);

const serialized = JSON.stringify(packet);
for (const forbidden of ['sk_live', 'sk_test', 'whsec_', 'Bearer ', 'rawProviderPayload', 'providerTransactionId', 'recipientEmail', 'messageBody']) {
  assert(!serialized.includes(forbidden), `sensitive marker leaked: ${forbidden}`, { marker: forbidden });
}

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  status: packet.status,
  reconciliation: packet.prerequisiteEvidence.reconciliation,
  callbackReadiness: packet.prerequisiteEvidence.callbackReadiness,
  paymentStatus: packet.prerequisiteEvidence.paymentStatus,
  requestFieldCount: packet.operatorRequestContract.requestFields.length,
  liveStatusWriteFlag: packet.currentRuntimeFlags.ENABLE_PAYMENT_LIVE_STATUS_WRITE,
  callbackPersistenceFlag: packet.currentRuntimeFlags.ENABLE_PAYMENT_CALLBACK_PERSISTENCE,
  callbackReplayFlag: packet.currentRuntimeFlags.ENABLE_PAYMENT_CALLBACK_REPLAY_EXECUTION,
  failedAssertionCount: packet.failedAssertions.length,
  mutation: packet.mutation,
  persistence: packet.persistence,
  providerCall: packet.providerCall,
}, null, 2));

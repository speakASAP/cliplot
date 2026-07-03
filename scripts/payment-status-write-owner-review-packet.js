#!/usr/bin/env node
const baseUrl = process.argv[2] || process.env.CLIPLOT_PAYMENT_STATUS_WRITE_OWNER_REVIEW_BASE_URL || 'http://127.0.0.1:8080';

function assert(condition, message, evidence = {}) {
  if (!condition) {
    console.error(JSON.stringify({ ok: false, message, ...evidence }, null, 2));
    process.exit(1);
  }
}

const response = await fetch(new URL('/api/payments/status-write-owner-review-packet', baseUrl));
const text = await response.text();
let packet = null;
try {
  packet = text ? JSON.parse(text) : {};
} catch {
  assert(false, 'payment status-write owner review packet returned non-json response', {
    httpStatus: response.status,
    body: text.slice(0, 300),
  });
}

assert(response.status === 200 && packet.success, 'payment status-write owner review packet request failed', {
  httpStatus: response.status,
  status: packet.status,
});
assert(packet.status === 'ready_for_payment_status_write_owner_review_execution_disabled', 'owner review status mismatch', packet);
assert(packet.mode === 'read_only_payment_status_write_owner_review_packet', 'owner review mode mismatch', packet);
assert(packet.mutation === false, 'owner review reports mutation', packet);
assert(packet.persistence === false, 'owner review reports persistence', packet);
assert(packet.providerCall === false, 'owner review reports provider call', packet);
assert(packet.sideEffects === false, 'owner review reports side effects', packet);
assert(packet.liveExecutionAllowed === false, 'owner review allows live execution', packet);
assert(packet.currentPacketEnablesRuntime === false, 'owner review enables runtime', packet);
assert(packet.currentPacketCallsExecutor === false, 'owner review calls executor', packet);
assert(packet.prerequisiteEvidence?.dryRunContract === 'ready_for_synthetic_callback_to_status_write_dry_run_execution_disabled', 'dry-run prerequisite missing', packet);
assert(packet.prerequisiteEvidence?.writeWindowRequest === 'ready_for_bounded_payment_status_write_window_request_execution_disabled', 'write-window prerequisite missing', packet);
assert(packet.prerequisiteEvidence?.reconciliation === 'ready_for_callback_payment_status_reconciliation_review_execution_disabled', 'reconciliation prerequisite missing', packet);
assert(packet.prerequisiteEvidence?.liveStatusWrite === 'approved_live_status_write_metadata_execution_disabled', 'live status-write prerequisite missing', packet);
assert(packet.prerequisiteEvidence?.callbackStorageContract === 'proposal_metadata_recorded_approval_required', 'storage contract prerequisite missing', packet);
assert(packet.prerequisiteEvidence?.callbackReplayRollout === 'approved_callback_replay_execution_metadata_execution_disabled', 'callback replay rollout prerequisite missing', packet);
assert(packet.implementationContract?.owner === 'payments-microservice', 'implementation owner mismatch', packet);
assert(packet.implementationContract?.projectionOwner === 'payments-microservice', 'projection owner mismatch', packet);
assert(packet.implementationContract?.commandOwner === 'payments-microservice', 'command owner mismatch', packet);
assert(packet.implementationContract?.currentPacketMayCallExecutor === false, 'packet may call executor', packet);
assert(packet.implementationContract?.currentPacketMayOpenFlags === false, 'packet may open flags', packet);
assert(packet.implementationContract?.currentPacketMayWriteStatus === false, 'packet may write status', packet);
assert(packet.implementationContract?.currentPacketMayPersistCallback === false, 'packet may persist callback', packet);
assert(packet.implementationContract?.currentPacketMayReplayCallback === false, 'packet may replay callback', packet);
assert(packet.implementationContract?.currentPacketMayReadProviderPaymentDetail === false, 'packet may read provider detail', packet);
assert(packet.currentRuntimeFlags?.ENABLE_PAYMENT_CALLBACK_PERSISTENCE === false, 'callback persistence flag enabled', packet);
assert(packet.currentRuntimeFlags?.ENABLE_PAYMENT_CALLBACK_REPLAY_EXECUTION === false, 'callback replay flag enabled', packet);
assert(packet.currentRuntimeFlags?.ENABLE_PAYMENT_LIVE_STATUS_WRITE === false, 'live status-write flag enabled', packet);
assert(packet.currentRuntimeFlags?.ENABLE_LIVE_PAYMENT_CREATE === false, 'live payment create flag enabled', packet);
assert(packet.currentRuntimeFlags?.ENABLE_LIVE_NOTIFICATIONS === false, 'live notifications flag enabled', packet);
assert(packet.reviewChecklist?.every((item) => item.complete === true), 'owner review checklist incomplete', packet);
assert(packet.requiredBeforeRuntimeEnablement?.includes('bounded CLIPLOT_LIVE_STATUS_WRITE_WINDOW'), 'bounded window requirement missing', packet);
assert(packet.validationPlan?.includes('post-window: readiness:payment-status-write-owner-review pass'), 'post-window owner review validation missing', packet);
assert(Array.isArray(packet.failedAssertions) && packet.failedAssertions.length === 0, 'owner review assertions failed', packet);
assert(Array.isArray(packet.blockers) && packet.blockers.length === 0, 'owner review blockers should be empty', packet);
assert(packet.forbiddenOperationsNow?.includes('do not call POST /api/payments/status-write-bounded-executor from this packet'), 'executor forbidden operation missing', packet);
assert(packet.forbiddenOperationsNow?.includes('do not read provider-backed /payments/{paymentId}'), 'provider read forbidden operation missing', packet);

const serialized = JSON.stringify(packet);
for (const forbidden of ['sk_live', 'sk_test', 'whsec_', 'Bearer ', 'rawProviderPayload', 'providerTransactionId', 'recipientEmail', 'messageBody']) {
  assert(!serialized.includes(forbidden), `sensitive marker leaked: ${forbidden}`, { marker: forbidden });
}

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  status: packet.status,
  dryRunContract: packet.prerequisiteEvidence.dryRunContract,
  writeWindowRequest: packet.prerequisiteEvidence.writeWindowRequest,
  reconciliation: packet.prerequisiteEvidence.reconciliation,
  projectionOwner: packet.implementationContract.projectionOwner,
  commandOwner: packet.implementationContract.commandOwner,
  checklistCount: packet.reviewChecklist.length,
  failedAssertionCount: packet.failedAssertions.length,
  mutation: packet.mutation,
  persistence: packet.persistence,
  providerCall: packet.providerCall,
}, null, 2));

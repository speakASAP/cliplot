#!/usr/bin/env node
const baseUrl = process.argv[2] || process.env.CLIPLOT_PAYMENT_CALLBACK_TO_STATUS_WRITE_DRY_RUN_BASE_URL || 'http://127.0.0.1:8080';

function assert(condition, message, evidence = {}) {
  if (!condition) {
    console.error(JSON.stringify({ ok: false, message, ...evidence }, null, 2));
    process.exit(1);
  }
}

const response = await fetch(new URL('/api/payments/callback-to-status-write-dry-run-contract-packet', baseUrl));
const text = await response.text();
let packet = null;
try {
  packet = text ? JSON.parse(text) : {};
} catch {
  assert(false, 'synthetic status-write dry-run packet returned non-json response', {
    httpStatus: response.status,
    body: text.slice(0, 300),
  });
}

assert(response.status === 200 && packet.success, 'synthetic status-write dry-run packet request failed', {
  httpStatus: response.status,
  status: packet.status,
});
assert(packet.status === 'ready_for_synthetic_callback_to_status_write_dry_run_execution_disabled', 'synthetic dry-run status mismatch', packet);
assert(packet.mode === 'read_only_synthetic_callback_to_status_write_dry_run_packet', 'synthetic dry-run mode mismatch', packet);
assert(packet.mutation === false, 'synthetic dry-run reports mutation', packet);
assert(packet.persistence === false, 'synthetic dry-run reports persistence', packet);
assert(packet.providerCall === false, 'synthetic dry-run reports provider call', packet);
assert(packet.sideEffects === false, 'synthetic dry-run reports side effects', packet);
assert(packet.liveExecutionAllowed === false, 'synthetic dry-run allows live execution', packet);
assert(packet.currentPacketEnablesRuntime === false, 'synthetic dry-run enables runtime', packet);
assert(packet.syntheticOnly === true, 'synthetic-only marker missing', packet);
assert(packet.prerequisiteEvidence?.reconciliation === 'ready_for_callback_payment_status_reconciliation_review_execution_disabled', 'reconciliation prerequisite missing', packet);
assert(packet.prerequisiteEvidence?.liveStatusWrite === 'approved_live_status_write_metadata_execution_disabled', 'live status write prerequisite missing', packet);
assert(packet.prerequisiteEvidence?.callbackPolicy === 'approved_callback_replay_policy_metadata_execution_disabled', 'callback policy prerequisite missing', packet);
assert(packet.prerequisiteEvidence?.callbackReplayRollout === 'approved_callback_replay_execution_metadata_execution_disabled', 'callback replay rollout prerequisite missing', packet);
assert(packet.syntheticCallbackEvent?.source === 'synthetic_dry_run_only', 'synthetic callback source missing', packet);
assert(packet.syntheticCallbackEvent?.paymentId === 'synthetic-payment-id', 'synthetic payment id missing', packet);
assert(packet.callbackProjectionShape?.owner === 'payments-microservice', 'projection owner mismatch', packet);
assert(packet.callbackProjectionShape?.currentPersistence === false, 'projection persistence enabled', packet);
assert(packet.callbackProjectionShape?.idempotencyKeys?.includes('paymentId'), 'projection idempotency keys missing', packet);
assert(packet.statusWriteCommandShape?.owner === 'payments-microservice', 'status write owner mismatch', packet);
assert(packet.statusWriteCommandShape?.liveStatusWritesNow === false, 'live status writes active now', packet);
assert(packet.statusWriteCommandShape?.wouldWritePaymentStatusNow === false, 'payment status write active now', packet);
assert(packet.dryRunMatrix?.callbackEventToProjection === true, 'callback-to-projection mapping missing', packet);
assert(packet.dryRunMatrix?.projectionToStatusWriteCommand === true, 'projection-to-command mapping missing', packet);
assert(packet.dryRunCases?.every((item) => item.runtimeMutationNow === false && item.persistenceNow === false && item.providerCallNow === false), 'dry-run cases have side effects', packet);
assert(packet.currentRuntimeFlags?.ENABLE_PAYMENT_CALLBACK_PERSISTENCE === false, 'callback persistence flag enabled', packet);
assert(packet.currentRuntimeFlags?.ENABLE_PAYMENT_CALLBACK_REPLAY_EXECUTION === false, 'callback replay flag enabled', packet);
assert(packet.currentRuntimeFlags?.ENABLE_PAYMENT_LIVE_STATUS_WRITE === false, 'live status write flag enabled', packet);
assert(Array.isArray(packet.failedAssertions) && packet.failedAssertions.length === 0, 'synthetic dry-run assertions failed', packet);
assert(Array.isArray(packet.blockers) && packet.blockers.length === 0, 'synthetic dry-run blockers should be empty', packet);
assert(packet.forbiddenOperationsNow?.includes('do not write payment status'), 'payment status write forbidden operation missing', packet);
assert(packet.forbiddenOperationsNow?.includes('do not execute callback replay'), 'callback replay forbidden operation missing', packet);

const serialized = JSON.stringify(packet);
for (const forbidden of ['sk_live', 'sk_test', 'whsec_', 'Bearer ', 'rawProviderPayload', 'providerTransactionId', 'recipientEmail', 'messageBody']) {
  assert(!serialized.includes(forbidden), `sensitive marker leaked: ${forbidden}`, { marker: forbidden });
}

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  status: packet.status,
  reconciliation: packet.prerequisiteEvidence.reconciliation,
  liveStatusWrite: packet.prerequisiteEvidence.liveStatusWrite,
  callbackReplayRollout: packet.prerequisiteEvidence.callbackReplayRollout,
  projectionOwner: packet.callbackProjectionShape.owner,
  statusWriteOwner: packet.statusWriteCommandShape.owner,
  dryRunCaseCount: packet.dryRunCases.length,
  failedAssertionCount: packet.failedAssertions.length,
  mutation: packet.mutation,
  persistence: packet.persistence,
  providerCall: packet.providerCall,
}, null, 2));

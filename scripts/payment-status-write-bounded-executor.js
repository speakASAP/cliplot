#!/usr/bin/env node
const baseUrl = process.argv[2] || process.env.CLIPLOT_PAYMENT_STATUS_WRITE_EXECUTOR_BASE_URL || 'http://127.0.0.1:8080';

function assert(condition, message, evidence = {}) {
  if (!condition) {
    console.error(JSON.stringify({ ok: false, message, ...evidence }, null, 2));
    process.exit(1);
  }
}

async function postJson(path, body) {
  const response = await fetch(new URL(path, baseUrl), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    assert(false, 'status write bounded executor returned non-json response', {
      httpStatus: response.status,
      body: text.slice(0, 300),
    });
  }
  return { response, payload };
}

const executorResult = await postJson('/api/payments/status-write-bounded-executor', {
  confirm: 'PAYMENT_STATUS_WRITE_WINDOW',
  approvalId: 'readiness-synthetic-not-approved',
  approvedBy: 'codex-readiness',
  reasonCode: 'OWNER_APPROVED_PAYMENT_STATUS_RECONCILIATION_WRITE',
  boundedWindow: 'readiness-synthetic-window',
  rollbackOwner: 'codex-readiness-rollback',
  validationOwner: 'codex-readiness-validation',
  postWindowReconciliationEvidence: true,
  paymentId: 'synthetic-payment-id',
  orderId: 'synthetic-order-id',
  targetStatus: 'completed',
  expectedCurrentStatus: 'processing',
  externalEventId: 'synthetic-event-id',
  occurredAt: '2026-07-04T00:00:00.000Z',
  statusWriteIdempotencyKey: 'synthetic-status-write-idempotency-key',
});
const executor = executorResult.payload;

assert(executorResult.response.status === 202, 'status write executor should return 202 while blocked', executor);
assert(executor.success === true, 'status write executor envelope failed', executor);
assert(executor.status === 'approval_required', 'status write executor should require approval', executor);
assert(executor.mode === 'guarded_payment_status_write_bounded_executor', 'status write executor mode mismatch', executor);
assert(executor.mutation === false, 'status write executor reports mutation', executor);
assert(executor.persistence === false, 'status write executor reports persistence', executor);
assert(executor.providerCall === false, 'status write executor reports provider call', executor);
assert(executor.sideEffects === false, 'status write executor reports side effects', executor);
assert(executor.liveExecutionAllowed === false, 'status write executor unexpectedly allowed live execution', executor);
assert(executor.currentPacketEnablesRuntime === false, 'status write executor enables runtime', executor);
assert(executor.paymentStatusWritten === false, 'status write executor wrote payment status', executor);
assert(executor.orderStatusWritten === false, 'status write executor wrote order status', executor);
assert(executor.callbackPersisted === false, 'status write executor persisted callback state', executor);
assert(executor.callbackReplayExecuted === false, 'status write executor executed callback replay', executor);
assert(executor.paymentCreated === false, 'status write executor created payment', executor);
assert(executor.notificationSent === false, 'status write executor sent notification', executor);
assert(executor.providerBackedRead === false, 'status write executor performed provider-backed read', executor);
assert(executor.liveStatusWritesNow === false, 'status write executor activated live status writes', executor);
assert(executor.currentRuntimeFlags?.ENABLE_PAYMENT_LIVE_STATUS_WRITE === false, 'status write flag enabled', executor);
assert(executor.currentRuntimeFlags?.ENABLE_PAYMENT_CALLBACK_PERSISTENCE === false, 'callback persistence flag enabled', executor);
assert(executor.currentRuntimeFlags?.ENABLE_PAYMENT_CALLBACK_REPLAY_EXECUTION === false, 'callback replay flag enabled', executor);
assert(executor.endpointBoundary?.executorEndpoint === '/api/payments/status-write-bounded-executor', 'executor endpoint boundary missing', executor);
assert(executor.endpointBoundary?.forbiddenProviderBackedReadEndpoint === '/payments/{paymentId}', 'provider read boundary missing', executor);
assert(executor.endpointBoundary?.fullCheckoutActivationAllowed === false, 'full checkout activation allowed', executor);
assert(executor.blockers?.includes('invalid_or_missing_live_status_write_approval_id'), 'approval id blocker missing', executor);
assert(executor.blockers?.includes('payment_live_status_write_flag_disabled'), 'live status write flag blocker missing', executor);
assert(executor.endpointBoundary?.paymentsExternalStatusReconciliationEndpoint === '/payments/external/status-reconciliation', 'Payments external reconciliation endpoint boundary missing', executor);
assert(executor.forbiddenOperationsNow?.includes('write payment status'), 'payment status write forbidden operation missing', executor);
assert(executor.forbiddenOperationsNow?.includes('execute callback replay'), 'callback replay forbidden operation missing', executor);
assert(executor.sensitiveDataPolicy?.includes('no PAYMENT_API_KEY value'), 'payment key policy missing', executor);
assert(executor.packet?.status === 'ready_for_bounded_payment_status_write_window_request_execution_disabled', 'request packet evidence missing', executor);
assert(executor.packet?.operatorRequestContract?.currentPacketMayExecuteWrites === false, 'embedded packet allows writes', executor);

const serialized = JSON.stringify(executor);
for (const forbidden of ['sk_live', 'sk_test', 'whsec_', 'Bearer ', 'rawProviderPayload', 'providerTransactionId', 'recipientEmail', 'messageBody']) {
  assert(!serialized.includes(forbidden), `sensitive marker leaked: ${forbidden}`, { marker: forbidden });
}

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  status: executor.status,
  mode: executor.mode,
  liveExecutionAllowed: executor.liveExecutionAllowed,
  blockerCount: executor.blockers.length,
  mutation: executor.mutation,
  persistence: executor.persistence,
  providerCall: executor.providerCall,
  sideEffects: executor.sideEffects,
  paymentStatusWritten: executor.paymentStatusWritten,
  callbackReplayExecuted: executor.callbackReplayExecuted,
  providerBackedRead: executor.providerBackedRead,
}, null, 2));

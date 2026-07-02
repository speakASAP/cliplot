#!/usr/bin/env node
const baseUrl = process.argv[2] || process.env.CLIPLOT_PAYMENT_CALLBACK_PERSISTENCE_APPROVAL_BASE_URL || 'http://127.0.0.1:8080';

function assert(condition, message, evidence = {}) {
  if (!condition) {
    console.error(JSON.stringify({ ok: false, message, ...evidence }, null, 2));
    process.exit(1);
  }
}

const response = await fetch(new URL('/api/payments/callback-persistence-approval-packet', baseUrl));
const text = await response.text();
let packet = null;
try {
  packet = text ? JSON.parse(text) : {};
} catch {
  assert(false, 'callback persistence approval packet returned non-json response', {
    httpStatus: response.status,
    body: text.slice(0, 300),
  });
}

assert(response.status === 200 && packet.success, 'callback persistence approval packet request failed', {
  httpStatus: response.status,
  status: packet.status,
});
assert(packet.status === 'approval_required_callback_persistence_storage_backend', 'callback persistence packet should remain approval-required', packet);
assert(packet.mode === 'read_only_callback_persistence_approval_packet', 'callback persistence packet mode changed', packet);
assert(packet.mutation === false, 'callback persistence packet reported mutation', packet);
assert(packet.persistence === false, 'callback persistence packet reported persistence', packet);
assert(packet.providerCall === false, 'callback persistence packet reported provider call', packet);
assert(packet.callbackPersistence === false, 'callback persistence unexpectedly enabled', packet);
assert(packet.callbackReplayEnabled === false, 'callback replay unexpectedly enabled', packet);
assert(packet.livePaymentCreate === false, 'live payment create unexpectedly enabled', packet);
assert(packet.callbackReadiness?.status === 'validated_guarded_ack_no_persistence', 'guarded callback ACK evidence missing', packet);
assert(packet.callbackReadiness?.callbackAccepted === true, 'callback accepted evidence missing', packet);
assert(packet.callbackPolicy?.status === 'approved_callback_replay_policy_metadata_execution_disabled', 'callback policy metadata approval missing', packet);
assert(packet.callbackPolicy?.approvalIdPresent === true, 'callback policy approval id evidence missing', packet);
assert(packet.callbackPolicy?.callbackPersistence === false, 'callback policy persistence enabled', packet);
assert(packet.callbackPolicy?.callbackReplayEnabled === false, 'callback policy replay enabled', packet);
assert(packet.storageReadiness?.status === 'blocked_storage_backend_not_approved', 'storage readiness should remain blocked', packet);
assert(packet.storageReadiness?.storageConfigured === false, 'storage unexpectedly configured', packet);
assert(packet.storageReadiness?.storageOwnershipApproved === true, 'Payments storage ownership approval missing', packet);
assert(packet.storageReadiness?.cliplotLocalStorageApproved === false, 'Cliplot-local storage unexpectedly approved', packet);
assert(packet.storageReadiness?.liveWritesEnabled === false, 'live storage writes unexpectedly enabled', packet);
assert(packet.storageReadiness?.callbackPersistence === false, 'storage contract persistence enabled', packet);
assert(packet.approvedPassiveReadContract?.decisionRecordStatus === 'owner_approved_shared_payments_source_of_truth', 'approved passive read decision missing', packet);
assert(packet.approvedPassiveReadContract?.endpoint === '/payments/status/by-order-id?applicationId=cliplot&orderId={orderId}', 'approved DB snapshot endpoint missing', packet);
assert(packet.approvedPassiveReadContract?.forbiddenEndpoint === '/payments/{paymentId}', 'forbidden provider endpoint missing', packet);
assert(packet.futureCallbackPersistenceContract?.schemaVersion === 'cliplot.payment_status.v1', 'callback persistence schema version missing', packet);
assert(packet.futureCallbackPersistenceContract?.idempotencyKeys?.includes('paymentId'), 'callback idempotency keys missing', packet);
assert(packet.futureCallbackPersistenceContract?.uniqueKeys?.includes('externalOrderId'), 'callback unique key missing', packet);
assert(packet.futureCallbackPersistenceContract?.allowedPaymentStatuses?.includes('processing'), 'callback status enum incomplete', packet);
assert(packet.futureCallbackPersistenceContract?.rollbackOwner === 'cliplot-operator', 'rollback owner missing', packet);
assert(packet.futureCallbackPersistenceContract?.validationOwner === 'cliplot-validation-owner', 'validation owner missing', packet);
assert(packet.futureCallbackPersistenceContract?.currentPersistence === false, 'future contract reports current persistence', packet);
assert(packet.futureCallbackPersistenceContract?.replayExecution === false, 'future contract reports replay execution', packet);
assert(packet.requiredApprovalsBeforeEnablement?.includes('callback persistence storage backend approval'), 'storage backend approval requirement missing', packet);
assert(packet.requiredApprovalsBeforeEnablement?.includes('callback replay execution rollout approval'), 'replay rollout approval requirement missing', packet);
assert(packet.mustRemainFalseBeforeApproval?.includes('callbackPersistence'), 'callback persistence guard missing', packet);
assert(packet.mustRemainFalseBeforeApproval?.includes('provider-backed /payments/{paymentId} reads'), 'provider-backed read guard missing', packet);
assert(packet.forbiddenOperations?.includes('persist callback state'), 'persist callback forbidden operation missing', packet);
assert(packet.forbiddenOperations?.includes('call payment provider'), 'provider call forbidden operation missing', packet);
assert(packet.satisfiedEvidence?.some((item) => item.includes('guarded callback ACK')), 'callback ACK satisfied evidence missing', packet);
assert(packet.satisfiedEvidence?.some((item) => item.includes('callback replay/persistence metadata policy approved')), 'callback policy satisfied evidence missing', packet);
assert(packet.blockers?.some((item) => item.includes('callback persistence storage backend approval')), 'callback storage blocker missing', packet);
assert(packet.blockers?.some((item) => item.includes('callback replay execution rollout approval')), 'callback replay blocker missing', packet);
assert(!packet.blockers.some((item) => item.startsWith('[DONE:')), 'satisfied evidence should not be counted as blockers', packet);
assert(packet.sensitiveDataPolicy?.includes('metadata only'), 'sensitive data policy missing', packet);

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  status: packet.status,
  callbackReadiness: packet.callbackReadiness.status,
  callbackPolicy: packet.callbackPolicy.status,
  storageReadiness: packet.storageReadiness.status,
  storageOwnershipApproved: packet.storageReadiness.storageOwnershipApproved,
  callbackPersistence: packet.callbackPersistence,
  callbackReplayEnabled: packet.callbackReplayEnabled,
  blockerCount: packet.blockers.length,
  mutation: packet.mutation,
  persistence: packet.persistence,
  providerCall: packet.providerCall,
}, null, 2));

#!/usr/bin/env node
const baseUrl = process.argv[2] || process.env.CLIPLOT_PAYMENT_CALLBACK_STORAGE_PROPOSAL_BASE_URL || 'http://127.0.0.1:8080';

function assert(condition, message, evidence = {}) {
  if (!condition) {
    console.error(JSON.stringify({ ok: false, message, ...evidence }, null, 2));
    process.exit(1);
  }
}

const response = await fetch(new URL('/api/payments/callback-storage-backend-proposal-packet', baseUrl));
const text = await response.text();
let packet = null;
try {
  packet = text ? JSON.parse(text) : {};
} catch {
  assert(false, 'callback storage backend proposal packet returned non-json response', {
    httpStatus: response.status,
    body: text.slice(0, 300),
  });
}

assert(response.status === 200 && packet.success, 'callback storage backend proposal packet request failed', {
  httpStatus: response.status,
  status: packet.status,
});
assert(packet.status === 'proposal_metadata_recorded_approval_required', 'proposal packet status changed', packet);
assert(packet.mode === 'read_only_callback_storage_backend_proposal_packet', 'proposal packet mode changed', packet);
assert(packet.mutation === false, 'proposal packet reported mutation', packet);
assert(packet.persistence === false, 'proposal packet reported persistence', packet);
assert(packet.providerCall === false, 'proposal packet reported provider call', packet);
assert(packet.callbackPersistence === false, 'proposal packet enabled callback persistence', packet);
assert(packet.callbackReplayEnabled === false, 'proposal packet enabled callback replay', packet);
assert(packet.livePaymentCreate === false, 'proposal packet enabled live payment create', packet);
assert(packet.storageBackendProposal?.status === 'proposal_metadata_recorded_approval_required', 'storage proposal missing', packet);
assert(packet.storageBackendProposal?.proposedOwner === 'payments-microservice', 'storage proposal owner missing', packet);
assert(packet.storageBackendProposal?.proposedStorageModel === 'payments_owned_callback_event_projection', 'storage model proposal changed', packet);
assert(packet.storageBackendProposal?.cliplotRole === 'non_authoritative_renderer_and_guarded_callback_ack', 'Cliplot role boundary missing', packet);
assert(packet.storageBackendProposal?.currentRuntimeFlagEnabled === false, 'storage proposal enabled runtime flag', packet);
assert(packet.storageBackendProposal?.storageConfiguredNow === false, 'storage proposal configured storage', packet);
assert(packet.storageBackendProposal?.callbackPersistenceNow === false, 'storage proposal enabled callback persistence', packet);
assert(packet.storageBackendProposal?.callbackReplayEnabledNow === false, 'storage proposal enabled callback replay', packet);
assert(packet.storageBackendProposal?.liveStatusWritesNow === false, 'storage proposal enabled status writes', packet);
assert(packet.storageBackendProposal?.mutation === false, 'storage proposal reported mutation', packet);
assert(packet.storageBackendProposal?.persistence === false, 'storage proposal reported persistence', packet);
assert(packet.storageBackendProposal?.providerCall === false, 'storage proposal reported provider call', packet);
assert(packet.futureCallbackPersistenceContract?.schemaVersion === 'cliplot.payment_status.v1', 'schema version missing', packet);
assert(packet.futureCallbackPersistenceContract?.idempotencyKeys?.includes('paymentId'), 'paymentId idempotency missing', packet);
assert(packet.futureCallbackPersistenceContract?.idempotencyKeys?.includes('paymentStatus'), 'paymentStatus idempotency missing', packet);
assert(packet.futureCallbackPersistenceContract?.uniqueKeys?.includes('externalOrderId'), 'externalOrderId uniqueness missing', packet);
assert(packet.futureCallbackPersistenceContract?.allowedPaymentStatuses?.includes('refunded'), 'status enum incomplete', packet);
assert(packet.futureCallbackPersistenceContract?.currentPersistence === false, 'future contract persists now', packet);
assert(packet.futureCallbackPersistenceContract?.replayExecution === false, 'future contract replays now', packet);
assert(packet.approvedPassiveReadContract?.endpoint === '/payments/status/by-order-id?applicationId=cliplot&orderId={orderId}', 'approved passive read endpoint missing', packet);
assert(packet.approvedPassiveReadContract?.forbiddenEndpoint === '/payments/{paymentId}', 'forbidden provider endpoint missing', packet);
assert(packet.rolloutPlan?.mode === 'dry_run_plan_only', 'rollout plan is not dry-run-only', packet);
assert(packet.rolloutPlan?.dryRunOnlyNow === true, 'rollout plan is not dry-run-only now', packet);
assert(packet.rolloutPlan?.runtimeEnablementNow === false, 'rollout plan enabled runtime now', packet);
assert(packet.rolloutPlan?.callbackPersistenceNow === false, 'rollout plan enabled persistence now', packet);
assert(packet.rolloutPlan?.callbackReplayEnabledNow === false, 'rollout plan enabled replay now', packet);
assert(packet.rolloutPlan?.liveStatusWritesNow === false, 'rollout plan enabled live status writes now', packet);
assert(packet.replayDryRunContract?.mode === 'dry_run_only_no_replay_execution', 'replay dry-run mode changed', packet);
assert(packet.replayDryRunContract?.syntheticOnlyNow === true, 'replay dry-run is not synthetic-only', packet);
assert(packet.replayDryRunContract?.replayExecutionNow === false, 'replay dry-run enabled replay now', packet);
assert(packet.replayDryRunContract?.callbackPersistenceNow === false, 'replay dry-run enabled persistence now', packet);
assert(packet.currentGuards?.storageConfigured === false, 'current guards show storage configured', packet);
assert(packet.currentGuards?.cliplotLocalStorageApproved === false, 'current guards approved Cliplot storage', packet);
assert(packet.currentGuards?.liveWritesEnabled === false, 'current guards enabled live writes', packet);
assert(packet.currentGuards?.liveReadsEnabled === false, 'current guards enabled live reads', packet);
assert(packet.currentGuards?.callbackPersistence === false, 'current guards enabled callback persistence', packet);
assert(packet.currentGuards?.callbackReplayEnabled === false, 'current guards enabled callback replay', packet);
assert(packet.mustRemainFalseBeforeApproval?.includes('callbackPersistence'), 'callback persistence guard missing', packet);
assert(packet.mustRemainFalseBeforeApproval?.includes('provider-backed /payments/{paymentId} reads'), 'provider-backed read guard missing', packet);
assert(packet.forbiddenOperations?.includes('persist callback state'), 'persist callback forbidden operation missing', packet);
assert(packet.forbiddenOperations?.includes('call payment provider'), 'provider call forbidden operation missing', packet);
assert(packet.blockers?.some((item) => item.includes('callback persistence storage backend approval')), 'storage approval blocker missing', packet);
assert(packet.blockers?.some((item) => item.includes('callback replay execution rollout approval')), 'replay execution blocker missing', packet);

const serialized = JSON.stringify(packet);
assert(!/sk_live|sk_test|whsec_|Bearer\s+/i.test(serialized), 'proposal packet appears to expose secret material', packet);
assert(!serialized.includes('rawProviderPayload'), 'proposal packet exposes raw provider payload field', packet);
assert(!serialized.includes('providerTransactionId'), 'proposal packet exposes provider transaction id field', packet);
assert(!serialized.includes('customerEmail'), 'proposal packet exposes customer email field', packet);
assert(!serialized.includes('customerName'), 'proposal packet exposes customer name field', packet);
assert(packet.sensitiveDataPolicy?.includes('proposal packet only'), 'proposal sensitive data policy missing', packet);

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  status: packet.status,
  mode: packet.mode,
  storageBackendProposal: packet.storageBackendProposal.status,
  proposedOwner: packet.storageBackendProposal.proposedOwner,
  rolloutPlan: packet.rolloutPlan.status,
  replayDryRunContract: packet.replayDryRunContract.mode,
  blockerCount: packet.blockers.length,
  mutation: packet.mutation,
  persistence: packet.persistence,
  providerCall: packet.providerCall,
}, null, 2));

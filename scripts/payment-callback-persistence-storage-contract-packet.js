#!/usr/bin/env node
const baseUrl = process.argv[2] || process.env.CLIPLOT_PAYMENT_CALLBACK_STORAGE_CONTRACT_BASE_URL || 'http://127.0.0.1:8080';

function assert(condition, message, evidence = {}) {
  if (!condition) {
    console.error(JSON.stringify({ ok: false, message, ...evidence }, null, 2));
    process.exit(1);
  }
}

const response = await fetch(new URL('/api/payments/callback-persistence-storage-contract-packet', baseUrl));
const text = await response.text();
let packet = null;
try {
  packet = text ? JSON.parse(text) : {};
} catch {
  assert(false, 'callback persistence storage contract packet returned non-json response', {
    httpStatus: response.status,
    body: text.slice(0, 300),
  });
}

assert(response.status === 200 && packet.success, 'callback persistence storage contract packet request failed', {
  httpStatus: response.status,
  status: packet.status,
});
assert(packet.status === 'proposal_metadata_recorded_approval_required', 'storage contract status changed', packet);
assert(packet.mode === 'read_only_callback_persistence_storage_contract_packet', 'storage contract mode changed', packet);
assert(packet.mutation === false, 'storage contract reported mutation', packet);
assert(packet.persistence === false, 'storage contract reported persistence', packet);
assert(packet.providerCall === false, 'storage contract reported provider call', packet);
assert(packet.callbackPersistence === false, 'storage contract enabled callback persistence', packet);
assert(packet.callbackReplayEnabled === false, 'storage contract enabled callback replay', packet);
assert(packet.liveStatusWritesNow === false, 'storage contract enabled live status writes', packet);
assert(packet.livePaymentCreate === false, 'storage contract enabled live payment create', packet);
assert(packet.storageContract?.owner === 'payments-microservice', 'storage contract owner missing', packet);
assert(packet.storageContract?.model === 'payments_owned_callback_event_projection', 'storage model changed', packet);
assert(packet.storageContract?.writeAuthority === 'payments-microservice', 'write authority missing', packet);
assert(packet.storageContract?.cliplotRole === 'guarded_callback_ack_and_non_authoritative_renderer', 'Cliplot role changed', packet);
assert(packet.storageContract?.currentRuntimeFlagEnabled === false, 'runtime flag enabled', packet);
assert(packet.storageContract?.storageConfiguredNow === false, 'storage configured now', packet);
assert(packet.storageContract?.callbackPersistenceNow === false, 'callback persistence active now', packet);
assert(packet.storageContract?.callbackReplayEnabledNow === false, 'callback replay active now', packet);
assert(packet.storageContract?.liveStatusWritesNow === false, 'live status writes active now in contract', packet);
assert(packet.eventIdentity?.requiredKeys?.includes('externalOrderId'), 'externalOrderId key missing', packet);
assert(packet.eventIdentity?.idempotencyKeys?.includes('paymentId'), 'paymentId idempotency missing', packet);
assert(packet.eventIdentity?.idempotencyKeys?.includes('paymentStatus'), 'paymentStatus idempotency missing', packet);
assert(packet.eventIdentity?.uniqueness?.includes('paymentId'), 'paymentId uniqueness missing', packet);
assert(packet.statusContract?.allowedPaymentStatuses?.includes('refunded'), 'allowed status enum incomplete', packet);
assert(packet.statusContract?.cliplotAuthoritative === false, 'Cliplot became authoritative', packet);
assert(packet.statusContract?.paymentsAuthoritative === true, 'Payments must stay authoritative', packet);
assert(packet.statusContract?.ordersAuthoritative === true, 'Orders must stay authoritative', packet);
assert(packet.retentionAndAudit?.rawPayloadStorageAllowed === false, 'raw payload storage allowed', packet);
assert(packet.retentionAndAudit?.providerTransactionStorageAllowedInCliplot === false, 'provider transaction id storage allowed in Cliplot', packet);
assert(packet.retentionAndAudit?.customerPiiStorageAllowedInCliplot === false, 'customer PII storage allowed in Cliplot', packet);
assert(packet.retentionAndAudit?.deletionPolicyRequired === true, 'deletion policy requirement missing', packet);
assert(packet.rolloutPrerequisites?.approvalIds?.includes('CLIPLOT_CALLBACK_PERSISTENCE_STORAGE_APPROVAL_ID'), 'storage approval id missing', packet);
assert(packet.rolloutPrerequisites?.approvalIds?.includes('CLIPLOT_CALLBACK_REPLAY_EXECUTION_APPROVAL_ID'), 'replay approval id missing', packet);
assert(packet.rolloutPrerequisites?.runtimeFlags?.ENABLE_PAYMENT_CALLBACK_PERSISTENCE === false, 'callback persistence runtime flag enabled', packet);
assert(packet.rolloutPrerequisites?.runtimeFlags?.ENABLE_PAYMENT_CALLBACK_REPLAY_EXECUTION === false, 'callback replay runtime flag enabled', packet);
assert(packet.rolloutPrerequisites?.runtimeFlags?.ENABLE_PAYMENT_LIVE_STATUS_WRITE === false, 'live status write runtime flag enabled', packet);
assert(packet.currentGuards?.storageConfigured === false, 'current guard storage configured', packet);
assert(packet.currentGuards?.cliplotLocalStorageApproved === false, 'Cliplot-local storage approved', packet);
assert(packet.currentGuards?.liveWritesEnabled === false, 'current guard live writes enabled', packet);
assert(packet.currentGuards?.callbackPersistence === false, 'current guard callback persistence enabled', packet);
assert(packet.currentGuards?.callbackReplayEnabled === false, 'current guard callback replay enabled', packet);
assert(packet.approvedPassiveReadContract?.forbiddenEndpoint === '/payments/{paymentId}', 'forbidden provider-backed read endpoint missing', packet);
assert(packet.storageBackendProposal?.status === 'proposal_metadata_recorded_approval_required', 'storage backend proposal missing', packet);
assert(packet.rolloutPlan?.mode === 'dry_run_plan_only', 'dry-run rollout plan missing', packet);
assert(packet.replayDryRunContract?.mode === 'dry_run_only_no_replay_execution', 'replay dry-run contract missing', packet);
assert(packet.requiredApprovalsBeforeEnablement?.includes('approved callback event retention/deletion policy'), 'retention/deletion approval missing', packet);
assert(packet.requiredApprovalsBeforeEnablement?.includes('approved callback storage uniqueness and conflict contract'), 'uniqueness/conflict approval missing', packet);
assert(packet.mustRemainFalseBeforeApproval?.includes('ENABLE_PAYMENT_CALLBACK_PERSISTENCE'), 'callback persistence flag guard missing', packet);
assert(packet.mustRemainFalseBeforeApproval?.includes('ENABLE_PAYMENT_CALLBACK_REPLAY_EXECUTION'), 'callback replay flag guard missing', packet);
assert(packet.mustRemainFalseBeforeApproval?.includes('ENABLE_PAYMENT_LIVE_STATUS_WRITE'), 'live status write flag guard missing', packet);
assert(packet.forbiddenOperations?.includes('persist callback state'), 'persist callback forbidden operation missing', packet);
assert(packet.forbiddenOperations?.includes('call payment provider'), 'provider call forbidden operation missing', packet);
assert(packet.blockers?.some((item) => item.includes('callback persistence storage backend approval')), 'storage backend blocker missing', packet);
assert(packet.blockers?.some((item) => item.includes('callback event retention/deletion policy')), 'retention/deletion blocker missing', packet);
assert(packet.blockers?.some((item) => item.includes('callback storage uniqueness and conflict contract')), 'uniqueness/conflict blocker missing', packet);

const serialized = JSON.stringify(packet);
assert(!/sk_live|sk_test|whsec_|Bearer\s+/i.test(serialized), 'storage contract appears to expose secret material', packet);
assert(!serialized.includes('rawProviderPayload'), 'storage contract exposes raw provider payload field', packet);
assert(!serialized.includes('providerTransactionId'), 'storage contract exposes provider transaction id field', packet);
assert(!serialized.includes('customerEmail'), 'storage contract exposes customer email field', packet);
assert(!serialized.includes('customerName'), 'storage contract exposes customer name field', packet);
assert(packet.sensitiveDataPolicy?.includes('storage contract packet only'), 'storage contract sensitive data policy missing', packet);

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  status: packet.status,
  mode: packet.mode,
  owner: packet.storageContract.owner,
  model: packet.storageContract.model,
  callbackPersistence: packet.callbackPersistence,
  callbackReplayEnabled: packet.callbackReplayEnabled,
  liveStatusWritesNow: packet.liveStatusWritesNow,
  blockerCount: packet.blockers.length,
  mutation: packet.mutation,
  persistence: packet.persistence,
  providerCall: packet.providerCall,
}, null, 2));

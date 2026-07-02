#!/usr/bin/env node
const baseUrl = process.argv[2] || process.env.CLIPLOT_PAYMENT_LIVE_STATUS_WRITE_APPROVAL_BASE_URL || 'http://127.0.0.1:8080';

function assert(condition, message, evidence = {}) {
  if (!condition) {
    console.error(JSON.stringify({ ok: false, message, ...evidence }, null, 2));
    process.exit(1);
  }
}

const response = await fetch(new URL('/api/payments/live-status-write-approval-packet', baseUrl));
const text = await response.text();
let packet = null;
try {
  packet = text ? JSON.parse(text) : {};
} catch {
  assert(false, 'live status write approval packet returned non-json response', {
    httpStatus: response.status,
    body: text.slice(0, 300),
  });
}

assert(response.status === 200 && packet.success, 'live status write approval packet request failed', {
  httpStatus: response.status,
  status: packet.status,
});
assert(packet.status === 'approval_required_live_status_write', 'live status write status changed', packet);
assert(packet.mode === 'read_only_live_status_write_approval_packet', 'live status write mode changed', packet);
assert(packet.mutation === false, 'live status write packet reported mutation', packet);
assert(packet.persistence === false, 'live status write packet reported persistence', packet);
assert(packet.providerCall === false, 'live status write packet reported provider call', packet);
assert(packet.callbackPersistence === false, 'live status write packet enabled callback persistence', packet);
assert(packet.callbackReplayEnabled === false, 'live status write packet enabled callback replay', packet);
assert(packet.liveStatusWritesEnabled === false, 'live status writes enabled', packet);
assert(packet.liveStatusWritesNow === false, 'live status writes active now', packet);
assert(packet.livePaymentCreate === false, 'live payment create enabled', packet);
assert(packet.passiveReadEvidence?.paymentStatus === 'ready_for_approved_payment_status_runtime_read', 'passive payment status evidence missing', packet);
assert(packet.passiveReadEvidence?.snapshotReadApproval === 'approved_passive_payments_snapshot_read', 'snapshot-read approval missing', packet);
assert(packet.passiveReadEvidence?.mappingOwnership === 'approved_order_payment_status_mapping_ownership', 'mapping ownership approval missing', packet);
assert(packet.passiveReadEvidence?.runtimeReadEnabled === true, 'runtime read not enabled', packet);
assert(packet.passiveReadEvidence?.paymentsSnapshotReadEnabled === true, 'payments snapshot read not enabled', packet);
assert(packet.passiveReadEvidence?.storageRead === false, 'storage read enabled', packet);
assert(packet.passiveReadEvidence?.callbackPersistence === false, 'runtime callback persistence enabled', packet);
assert(packet.ownership?.ordersOwner === 'orders-microservice', 'orders owner missing', packet);
assert(packet.ownership?.paymentsOwner === 'payments-microservice', 'payments owner missing', packet);
assert(packet.ownership?.cliplotAuthoritative === false, 'Cliplot became authoritative', packet);
assert(packet.approvedReadContract?.endpoint === '/payments/status/by-order-id?applicationId=cliplot&orderId={orderId}', 'approved read contract endpoint missing', packet);
assert(packet.approvedReadContract?.forbiddenEndpoint === '/payments/{paymentId}', 'forbidden provider-backed endpoint missing', packet);
assert(packet.approvedReadContract?.providerCall === false, 'approved read contract provider call enabled', packet);
assert(packet.currentWriteGuards?.storageConfigured === false, 'storage configured unexpectedly', packet);
assert(packet.currentWriteGuards?.liveWritesEnabled === false, 'current write guards enabled live writes', packet);
assert(packet.currentWriteGuards?.currentStatusPersistence === false, 'current status persistence enabled', packet);
assert(packet.currentWriteGuards?.callbackPersistence === false, 'current callback persistence enabled', packet);
assert(packet.currentWriteGuards?.callbackReplayEnabled === false, 'current callback replay enabled', packet);
assert(packet.currentWriteGuards?.replayExecutionAllowed === false, 'replay execution allowed', packet);
assert(packet.currentWriteGuards?.liveStatusWritesNow === false, 'current guard allows live status writes now', packet);
assert(packet.approvalProposal?.mode === 'bounded_live_status_write_window_proposal_only', 'approval proposal mode changed', packet);
assert(packet.approvalProposal?.approvalIdPlaceholder === 'CLIPLOT_LIVE_STATUS_WRITE_APPROVAL_ID', 'live status write approval id placeholder missing', packet);
assert(packet.approvalProposal?.currentRuntimeFlagEnabled === false, 'live status write runtime flag enabled', packet);
assert(packet.approvalProposal?.liveStatusWritesNow === false, 'proposal enables live status writes now', packet);
assert(packet.approvalProposal?.callbackPersistenceNow === false, 'proposal enables callback persistence now', packet);
assert(packet.approvalProposal?.providerBackedReadsNow === false, 'proposal enables provider-backed reads now', packet);
assert(packet.dryRunPlan?.mode === 'synthetic_live_status_write_dry_run_only', 'dry-run mode changed', packet);
assert(packet.dryRunPlan?.dryRunOnlyNow === true, 'dry-run plan is not dry-run-only', packet);
assert(packet.dryRunPlan?.syntheticOnlyNow === true, 'dry-run plan is not synthetic-only', packet);
assert(packet.dryRunPlan?.phases?.every((phase) => phase.runtimeMutation === false), 'dry-run phase would mutate', packet);
assert(packet.futureExecutionPlan?.status === 'approval_required_before_runtime_use', 'future execution plan status changed', packet);
assert(packet.futureExecutionPlan?.currentRuntimeExecution === false, 'future execution runs now', packet);
assert(packet.futureExecutionPlan?.wouldCallProviderAfterApproval === false, 'future execution would call provider', packet);
assert(packet.futureExecutionPlan?.wouldSendNotificationAfterApproval === false, 'future execution would send notification', packet);
assert(packet.requiredApprovalIds?.includes('CLIPLOT_LIVE_STATUS_WRITE_APPROVAL_ID'), 'live status write approval id missing', packet);
assert(packet.requiredApprovalIds?.includes('CLIPLOT_CALLBACK_PERSISTENCE_STORAGE_APPROVAL_ID'), 'callback persistence storage approval id missing', packet);
assert(packet.requiredRuntimeFlags?.ENABLE_PAYMENT_LIVE_STATUS_WRITE === false, 'live status write runtime flag should be false', packet);
assert(packet.requiredRuntimeFlags?.ENABLE_PAYMENT_CALLBACK_PERSISTENCE === false, 'callback persistence runtime flag should be false', packet);
assert(packet.requiredRuntimeFlags?.ENABLE_PAYMENT_CALLBACK_REPLAY_EXECUTION === false, 'callback replay runtime flag should be false', packet);
assert(packet.rollbackOwner?.includes('[MISSING:'), 'rollback owner should remain missing until approval', packet);
assert(packet.validationOwner?.includes('[MISSING:'), 'validation owner should remain missing until approval', packet);
assert(packet.boundedWriteWindow?.includes('[MISSING:'), 'bounded write window should remain missing until approval', packet);
assert(packet.rollbackPlan?.includes('set ENABLE_PAYMENT_LIVE_STATUS_WRITE=false'), 'live status write rollback flag missing', packet);
assert(packet.requiredApprovalsBeforeEnablement?.includes('owner approval before enabling live status writes'), 'owner approval requirement missing', packet);
assert(packet.mustRemainFalseBeforeApproval?.includes('ENABLE_PAYMENT_LIVE_STATUS_WRITE'), 'live status write guard missing', packet);
assert(packet.mustRemainFalseBeforeApproval?.includes('provider-backed /payments/{paymentId} reads'), 'provider-backed read guard missing', packet);
assert(packet.forbiddenOperations?.includes('write payment status'), 'write payment status forbidden operation missing', packet);
assert(packet.forbiddenOperations?.includes('read /payments/{paymentId}'), 'provider-backed read forbidden operation missing', packet);
assert(packet.forbiddenOperations?.includes('send notification'), 'notification forbidden operation missing', packet);
assert(packet.blockers?.some((item) => item.includes('owner approval before enabling live status writes')), 'live status write approval blocker missing', packet);
assert(packet.blockers?.some((item) => item.includes('callback persistence storage backend approval')), 'callback persistence storage blocker missing', packet);

const serialized = JSON.stringify(packet);
assert(!/sk_live|sk_test|whsec_|Bearer\s+/i.test(serialized), 'live status write packet appears to expose secret material', packet);
assert(!serialized.includes('rawProviderPayload'), 'live status write packet exposes raw provider payload field', packet);
assert(!serialized.includes('providerTransactionId'), 'live status write packet exposes provider transaction id field', packet);
assert(!serialized.includes('customerEmail'), 'live status write packet exposes customer email field', packet);
assert(!serialized.includes('customerName'), 'live status write packet exposes customer name field', packet);
assert(packet.sensitiveDataPolicy?.includes('no callback payload'), 'callback payload sensitive-data guard missing', packet);

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  status: packet.status,
  mode: packet.mode,
  liveStatusWritesEnabled: packet.liveStatusWritesEnabled,
  liveStatusWritesNow: packet.liveStatusWritesNow,
  dryRunOnlyNow: packet.dryRunPlan.dryRunOnlyNow,
  proposal: packet.approvalProposal.status,
  blockerCount: packet.blockers.length,
  mutation: packet.mutation,
  persistence: packet.persistence,
  providerCall: packet.providerCall,
}, null, 2));

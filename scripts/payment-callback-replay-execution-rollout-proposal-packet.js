#!/usr/bin/env node
const baseUrl = process.argv[2] || process.env.CLIPLOT_PAYMENT_CALLBACK_REPLAY_ROLLOUT_PROPOSAL_BASE_URL || 'http://127.0.0.1:8080';

function assert(condition, message, evidence = {}) {
  if (!condition) {
    console.error(JSON.stringify({ ok: false, message, ...evidence }, null, 2));
    process.exit(1);
  }
}

const response = await fetch(new URL('/api/payments/callback-replay-execution-rollout-proposal-packet', baseUrl));
const text = await response.text();
let packet = null;
try {
  packet = text ? JSON.parse(text) : {};
} catch {
  assert(false, 'callback replay execution rollout packet returned non-json response', {
    httpStatus: response.status,
    body: text.slice(0, 300),
  });
}

assert(response.status === 200 && packet.success, 'callback replay execution rollout packet request failed', {
  httpStatus: response.status,
  status: packet.status,
});
const replayRolloutMetadataApproved = packet.status === 'approved_callback_replay_execution_metadata_execution_disabled';
assert(['proposal_metadata_recorded_approval_required', 'approved_callback_replay_execution_metadata_execution_disabled'].includes(packet.status), 'replay rollout status changed', packet);
assert(packet.mode === 'read_only_callback_replay_execution_rollout_proposal_packet', 'replay rollout mode changed', packet);
assert(packet.mutation === false, 'replay rollout reported mutation', packet);
assert(packet.persistence === false, 'replay rollout reported persistence', packet);
assert(packet.providerCall === false, 'replay rollout reported provider call', packet);
assert(packet.callbackPersistence === false, 'replay rollout enabled callback persistence', packet);
assert(packet.callbackReplayEnabled === false, 'replay rollout enabled callback replay', packet);
assert(packet.replayExecutionAllowed === false, 'replay rollout allowed replay execution', packet);
assert(packet.dryRunOnlyNow === true, 'replay rollout is not dry-run-only', packet);
assert(packet.syntheticOnlyNow === true, 'replay rollout is not synthetic-only', packet);
assert(packet.liveStatusWritesNow === false, 'replay rollout enabled live status writes', packet);
assert(packet.livePaymentCreate === false, 'replay rollout enabled live payment create', packet);
assert(packet.policyEvidence?.status === 'approved_callback_replay_policy_metadata_execution_disabled', 'callback replay policy evidence missing', packet);
assert(packet.policyEvidence?.callbackPersistence === false, 'policy evidence enabled callback persistence', packet);
assert(packet.policyEvidence?.callbackReplayEnabled === false, 'policy evidence enabled callback replay', packet);
assert(['approval_required_callback_persistence_storage_backend', 'approved_callback_persistence_metadata_execution_disabled'].includes(packet.storageEvidence?.callbackPersistenceApproval), 'callback persistence approval evidence missing', packet);
assert(packet.storageEvidence?.storageBackendProposal === 'proposal_metadata_recorded_approval_required', 'storage proposal evidence missing', packet);
assert(packet.storageEvidence?.replayDryRunContract === 'dry_run_only_no_replay_execution', 'replay dry-run evidence missing', packet);
assert(packet.storageEvidence?.storageConfigured === false, 'storage evidence configured storage', packet);
assert(packet.storageEvidence?.callbackPersistence === false, 'storage evidence enabled callback persistence', packet);
assert(packet.storageEvidence?.callbackReplayEnabled === false, 'storage evidence enabled callback replay', packet);
assert(packet.storageEvidence?.liveWritesEnabled === false, 'storage evidence enabled live writes', packet);
assert(['proposal_metadata_recorded_approval_required', 'approved_callback_replay_execution_window_metadata_execution_disabled'].includes(packet.executionWindowProposal?.status), 'execution window status changed', packet);
assert(packet.executionWindowProposal?.mode === 'bounded_window_proposal_only', 'execution window mode changed', packet);
assert(packet.executionWindowProposal?.approvalIdPlaceholder === 'CLIPLOT_CALLBACK_REPLAY_EXECUTION_APPROVAL_ID', 'replay approval placeholder missing', packet);
assert(packet.executionWindowProposal?.currentRuntimeFlagEnabled === false, 'replay execution runtime flag enabled', packet);
assert(packet.executionWindowProposal?.replayExecutionNow === false, 'execution window enabled replay now', packet);
assert(packet.executionWindowProposal?.callbackPersistenceNow === false, 'execution window enabled persistence now', packet);
assert(packet.executionWindowProposal?.liveStatusWritesNow === false, 'execution window enabled live status writes now', packet);
assert(packet.executionWindowProposal?.mutation === false, 'execution window reports mutation', packet);
assert(packet.executionWindowProposal?.persistence === false, 'execution window reports persistence', packet);
assert(packet.executionWindowProposal?.providerCall === false, 'execution window reports provider call', packet);
assert(packet.dryRunPlan?.mode === 'synthetic_dry_run_only', 'dry-run mode changed', packet);
assert(packet.dryRunPlan?.phases?.every((phase) => phase.runtimeMutation === false), 'dry-run phase would mutate', packet);
assert(packet.dryRunPlan?.syntheticReplayDryRunAssertions?.length >= 6, 'synthetic replay dry-run assertions missing', packet);
assert(packet.dryRunPlan.syntheticReplayDryRunAssertions.every((item) => item.mutation === false && item.persistence === false && item.providerCall === false), 'synthetic replay dry-run assertion would mutate or call provider', packet);
assert(packet.dryRunPlan.syntheticReplayDryRunAssertions.some((item) => item.caseId === 'duplicate_same_semantic_callback' && item.result === 'dry_run_passed_no_write'), 'duplicate callback dry-run assertion missing', packet);
assert(packet.dryRunPlan.syntheticReplayDryRunAssertions.some((item) => item.caseId === 'incompatible_terminal_status_conflict' && item.result === 'dry_run_passed_manual_review_required'), 'terminal conflict dry-run assertion missing', packet);
assert(packet.dryRunPlan.syntheticReplayDryRunAssertions.some((item) => item.caseId === 'retention_and_deletion_metadata' && item.result === 'dry_run_passed_metadata_present'), 'retention dry-run assertion missing', packet);
assert(packet.dryRunPlan.syntheticReplayDryRunAssertions.some((item) => item.caseId === 'rollback_and_validation_owner' && item.result === 'dry_run_passed_owner_present'), 'rollback/validation owner dry-run assertion missing', packet);
assert(packet.dryRunPlan.syntheticReplayDryRunAssertions.some((item) => item.caseId === 'runtime_guard_closed' && item.replayExecutionAllowed === false && item.callbackPersistenceNow === false && item.liveStatusWritesNow === false), 'runtime guard dry-run assertion missing', packet);
assert(packet.dryRunPlan?.idempotencyKeys?.includes('paymentId'), 'paymentId idempotency missing', packet);
assert(packet.dryRunPlan?.idempotencyKeys?.includes('paymentStatus'), 'paymentStatus idempotency missing', packet);
assert(packet.futureExecutionPlan?.status === 'approval_required_before_runtime_use', 'future execution plan status changed', packet);
assert(packet.futureExecutionPlan?.currentRuntimeExecution === false, 'future execution plan runs now', packet);
assert(packet.futureExecutionPlan?.executionWouldCallProviderAfterApproval === false, 'future execution plan would call provider', packet);
assert(packet.futureExecutionPlan?.executionWouldSendNotificationAfterApproval === false, 'future execution plan would send notification', packet);
assert(packet.rollbackPlan?.includes('set ENABLE_PAYMENT_CALLBACK_REPLAY_EXECUTION=false'), 'replay rollback flag missing', packet);
assert(packet.requiredApprovalsBeforeEnablement?.includes('callback replay execution rollout approval'), 'replay execution approval requirement missing', packet);
assert(packet.mustRemainFalseBeforeApproval?.includes('ENABLE_PAYMENT_CALLBACK_REPLAY_EXECUTION'), 'replay execution guard missing', packet);
assert(packet.mustRemainFalseBeforeApproval?.includes('provider-backed /payments/{paymentId} reads'), 'provider-backed read guard missing', packet);
assert(packet.forbiddenOperations?.includes('replay callback into storage'), 'replay forbidden operation missing', packet);
assert(packet.forbiddenOperations?.includes('call payment provider'), 'provider call forbidden operation missing', packet);
assert(packet.forbiddenOperations?.includes('send notification'), 'notification forbidden operation missing', packet);
if (replayRolloutMetadataApproved) {
  assert(packet.blockers.length === 0, 'replay rollout metadata approval should clear blockers', packet);
  assert(packet.executionWindowProposal?.approvalIdPresent === true, 'replay approval metadata missing after approval', packet);
} else {
  assert(packet.blockers?.some((item) => item.includes('callback replay execution rollout approval') || item.includes('callback replay/persistence policy metadata') || item.includes('callback persistence storage backend approval')), 'replay execution blocker missing', packet);
}

const serialized = JSON.stringify(packet);
assert(!/sk_live|sk_test|whsec_|Bearer\s+/i.test(serialized), 'replay rollout packet appears to expose secret material', packet);
assert(!serialized.includes('rawProviderPayload'), 'replay rollout packet exposes raw provider payload field', packet);
assert(!serialized.includes('providerTransactionId'), 'replay rollout packet exposes provider transaction id field', packet);
assert(!serialized.includes('customerEmail'), 'replay rollout packet exposes customer email field', packet);
assert(!serialized.includes('customerName'), 'replay rollout packet exposes customer name field', packet);
assert(packet.sensitiveDataPolicy?.includes('no callback payload'), 'callback payload sensitive-data guard missing', packet);

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  status: packet.status,
  mode: packet.mode,
  replayExecutionAllowed: packet.replayExecutionAllowed,
  dryRunOnlyNow: packet.dryRunOnlyNow,
  executionWindow: packet.executionWindowProposal.status,
  dryRunPlan: packet.dryRunPlan.status,
  syntheticReplayDryRunAssertions: packet.dryRunPlan.syntheticReplayDryRunAssertions.map((item) => ({
    caseId: item.caseId,
    result: item.result,
    mutation: item.mutation,
    persistence: item.persistence,
    providerCall: item.providerCall,
  })),
  blockerCount: packet.blockers.length,
  mutation: packet.mutation,
  persistence: packet.persistence,
  providerCall: packet.providerCall,
}, null, 2));

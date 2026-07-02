#!/usr/bin/env node
const baseUrl = process.argv[2] || process.env.CLIPLOT_PAYMENT_CALLBACK_POLICY_BASE_URL || 'http://127.0.0.1:8080';

function assert(condition, message, evidence = {}) {
  if (!condition) {
    console.error(JSON.stringify({ ok: false, message, ...evidence }, null, 2));
    process.exit(1);
  }
}

const response = await fetch(new URL('/api/payments/callback-replay-policy', baseUrl));
const text = await response.text();
let policy = null;
try {
  policy = text ? JSON.parse(text) : {};
} catch {
  assert(false, 'callback replay policy returned non-json response', {
    httpStatus: response.status,
    body: text.slice(0, 300),
  });
}

assert(response.status === 200 && policy.success, 'callback replay policy request failed', {
  httpStatus: response.status,
  status: policy.status,
});
assert(['approval_required_callback_replay_policy', 'approved_callback_replay_policy_metadata_execution_disabled'].includes(policy.status), 'callback replay policy status unexpected', policy);
assert(policy.mode === 'guarded_payment_callback_replay_policy_readiness', 'callback replay policy mode changed', policy);
assert(policy.mutation === false, 'callback replay policy reported mutation', policy);
assert(policy.persistence === false, 'callback replay policy reported persistence', policy);
assert(policy.providerCall === false, 'callback replay policy reported provider call', policy);
assert(policy.callbackPersistence === false, 'callback persistence unexpectedly enabled', policy);
assert(policy.callbackReplayEnabled === false, 'callback replay unexpectedly enabled', policy);
assert(policy.callbackAccepted === true, 'guarded callback ACK evidence missing', policy);
assert(policy.callbackReadiness === 'validated_guarded_ack_no_persistence', 'callback readiness evidence missing', policy);
assert(policy.currentCallbackContract?.endpoint === '/api/payments/callback', 'callback endpoint missing', policy);
assert(policy.currentCallbackContract?.currentPersistence === false, 'current callback contract persists', policy);
assert(policy.currentCallbackContract?.currentOrderMutation === false, 'current callback contract mutates order', policy);
assert(policy.currentCallbackContract?.currentPaymentMutation === false, 'current callback contract mutates payment', policy);
assert(policy.proposedReplayPolicy?.decisionRecord === 'ADR-005-payment-callback-replay-policy', 'callback replay decision record missing', policy);
assert(['proposed_for_owner_approval', 'owner_approved_metadata_execution_disabled'].includes(policy.proposedReplayPolicy?.status), 'callback replay decision status changed', policy);
assert(Array.isArray(policy.proposedReplayPolicy?.idempotencyKeys) && policy.proposedReplayPolicy.idempotencyKeys.includes('paymentId'), 'callback idempotency keys missing', policy);
assert(policy.approvalRequest?.requiredDecision === 'approved callback persistence/replay policy', 'approval request missing', policy);
if (policy.callbackPolicyApproved === true) {
  assert(policy.approvalRequest?.requiredApprovalId === 'CLIPLOT_CALLBACK_REPLAY_POLICY_APPROVAL_ID', 'callback policy approval id requirement missing', policy);
  assert(policy.proposedReplayPolicy?.approvalIdPresent === true, 'callback policy approval evidence missing', policy);
  assert(policy.proposedReplayPolicy?.approvalIdFingerprint, 'callback policy approval fingerprint missing', policy);
  assert(!policy.blockers.some((item) => item.includes('callback event ownership decision')), 'approved callback ownership still reported missing', policy);
  if (policy.blockers.length === 0) {
    assert(policy.proposedReplayPolicy?.storageBackendApprovalPresent === true, 'callback storage metadata evidence missing after approval', policy);
    assert(policy.proposedReplayPolicy?.replayExecutionApprovalPresent === true, 'callback replay execution metadata evidence missing after approval', policy);
  }
}
assert(typeof policy.approvalRequest?.requiredBeforeRuntimeStatusReads === 'boolean', 'runtime status dependency missing', policy);
assert(Array.isArray(policy.mustRemainFalseBeforeApproval) && policy.mustRemainFalseBeforeApproval.includes('callbackPersistence'), 'callback persistence guard missing', policy);
assert(policy.mustRemainFalseBeforeApproval.includes('provider-backed /payments/{paymentId} reads'), 'provider-refresh guard missing', policy);
assert(Array.isArray(policy.forbiddenOperations) && policy.forbiddenOperations.includes('persist callback state'), 'callback persistence forbidden operation missing', policy);
assert(policy.forbiddenOperations.includes('call payment provider'), 'provider call forbidden operation missing', policy);
assert(Array.isArray(policy.blockers), 'callback policy blockers missing', policy);
if (policy.callbackPolicyApproved === true) {
  if (policy.blockers.length === 0) {
    assert(policy.proposedReplayPolicy?.storageBackendApprovalPresent === true, 'callback storage backend approval metadata missing', policy);
    assert(policy.proposedReplayPolicy?.replayExecutionApprovalPresent === true, 'callback replay execution approval metadata missing', policy);
  } else {
    assert(policy.blockers.some((item) => item.includes('callback persistence storage backend approval') || item.includes('callback replay execution rollout approval')), 'callback storage/replay blocker missing', policy);
  }
} else {
  assert(policy.blockers.some((item) => item.includes('callback persistence/replay policy') || item.includes('CLIPLOT_CALLBACK_REPLAY_POLICY_APPROVAL_ID')), 'callback policy blocker missing', policy);
}
assert(Array.isArray(policy.sensitiveDataPolicy) && policy.sensitiveDataPolicy.includes('policy metadata only'), 'sensitive data policy missing', policy);

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  status: policy.status,
  callbackReadiness: policy.callbackReadiness,
  callbackPersistence: policy.callbackPersistence,
  callbackReplayEnabled: policy.callbackReplayEnabled,
  decisionRecord: policy.proposedReplayPolicy.decisionRecord,
  decisionStatus: policy.proposedReplayPolicy.status,
  blockerCount: policy.blockers.length,
  mutation: policy.mutation,
  persistence: policy.persistence,
  providerCall: policy.providerCall,
}, null, 2));

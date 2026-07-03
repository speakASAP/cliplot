#!/usr/bin/env node
const baseUrl = process.argv[2] || process.env.CLIPLOT_LIVE_CHECKOUT_EXECUTION_EVIDENCE_BASE_URL || 'http://127.0.0.1:8080';

function assert(condition, message, evidence = {}) {
  if (!condition) {
    console.error(JSON.stringify({ ok: false, message, ...evidence }, null, 2));
    process.exit(1);
  }
}

async function getJson(path) {
  const response = await fetch(new URL(path, baseUrl), {
    method: 'GET',
    headers: { accept: 'application/json' },
  });
  const payload = await response.json();
  return { response, payload };
}

const { response, payload: packet } = await getJson('/api/checkout/live-execution-evidence-packet');

assert(response.status === 200 && packet.success, 'live checkout execution evidence packet failed', packet);
assert(packet.status === 'read_only_live_checkout_execution_evidence_packet_recorded_execution_disabled', 'live checkout execution evidence status mismatch', packet);
assert(packet.mode === 'read_only_live_checkout_execution_evidence_packet', 'live checkout execution evidence mode mismatch', packet);
assert(packet.mutation === false, 'evidence packet reports mutation', packet);
assert(packet.persistence === false, 'evidence packet reports persistence', packet);
assert(packet.providerCall === false, 'evidence packet reports provider call', packet);
assert(packet.sideEffects === false, 'evidence packet reports side effects', packet);
assert(packet.sideEffectsAllowed === false, 'evidence packet allows side effects', packet);
assert(packet.liveExecutionAllowed === false, 'evidence packet unexpectedly allows live execution', packet);
assert(packet.currentPacketEnablesRuntime === false, 'evidence packet enables runtime', packet);
assert(packet.orderCreated === false, 'evidence packet created order', packet);
assert(packet.warehouseReserved === false, 'evidence packet reserved Warehouse stock', packet);
assert(packet.paymentCreated === false, 'evidence packet created payment', packet);
assert(packet.notificationSent === false, 'evidence packet sent notification', packet);
assert(packet.callbackPersistence === false, 'evidence packet allows callback persistence', packet);
assert(packet.callbackReplay === false, 'evidence packet allows callback replay', packet);
assert(packet.statusWrite === false, 'evidence packet allows status write', packet);
assert(packet.providerRead === false, 'evidence packet allows provider read', packet);
assert(packet.liveFlagsClosed === true, 'live flags are not closed', packet);
assert(packet.liveFlags?.order === false, 'live order flag unexpectedly enabled', packet);
assert(packet.liveFlags?.payment === false, 'live payment flag unexpectedly enabled', packet);
assert(packet.liveFlags?.notification === false, 'live notification flag unexpectedly enabled', packet);
assert(packet.liveFlags?.orderWarehouseSmoke === false, 'live order/Warehouse smoke flag unexpectedly enabled', packet);
assert(packet.guardrails?.getOnlyRoute === true, 'GET-only route guardrail missing', packet);
assert(packet.guardrails?.executorCalled === false, 'evidence lane called executor', packet);
assert(packet.guardrails?.dbWriteAllowed === false, 'evidence lane allows DB writes', packet);
assert(packet.guardrails?.providerCallAllowed === false, 'evidence lane allows provider calls', packet);
assert(packet.guardrails?.secretPrintingAllowed === false, 'evidence lane allows secret printing', packet);
assert(packet.readinessEvidence?.livePreflightWouldMutate === false, 'preflight would mutate', packet);
assert(packet.readinessEvidence?.livePreflightWouldCreateOrder === false, 'preflight would create order', packet);
assert(packet.readinessEvidence?.livePreflightWouldReserveWarehouse === false, 'preflight would reserve Warehouse', packet);
assert(packet.readinessEvidence?.livePreflightWouldCreatePayment === false, 'preflight would create payment', packet);
assert(packet.readinessEvidence?.livePreflightWouldSendNotification === false, 'preflight would send notification', packet);
assert(packet.readinessEvidence?.sideEffectsFalse === true, 'side-effect evidence is not false', packet);
assert(packet.boundedRun?.confirmationRequired?.includes('CREATE_REPLAY_CANCEL'), 'CREATE_REPLAY_CANCEL future contract missing', packet);
assert(packet.futureEvidenceRequirements?.duringCreate?.length > 0, 'create evidence requirements missing', packet);
assert(packet.futureEvidenceRequirements?.duringReplay?.length > 0, 'replay evidence requirements missing', packet);
assert(packet.futureEvidenceRequirements?.duringCancel?.length > 0, 'cancel evidence requirements missing', packet);
assert(packet.forbiddenOperationsNow?.includes('POST /api/checkout/submit'), 'checkout submit forbidden operation missing', packet);
assert(packet.forbiddenOperationsNow?.includes('database writes'), 'database write forbidden operation missing', packet);
assert(packet.forbiddenOperationsNow?.includes('provider calls'), 'provider call forbidden operation missing', packet);
const serialized = JSON.stringify(packet);
for (const forbidden of ['sk_live', 'sk_test', 'whsec_', 'Bearer ', '@example.com', 'recipientEmail', 'messageBody']) {
  assert(!serialized.includes(forbidden), `sensitive marker leaked: ${forbidden}`, { marker: forbidden });
}

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  status: packet.status,
  liveFlagsClosed: packet.liveFlagsClosed,
  liveExecutionAllowed: packet.liveExecutionAllowed,
  mutation: packet.mutation,
  persistence: packet.persistence,
  providerCall: packet.providerCall,
  sideEffects: packet.sideEffects,
  executionWindowStatus: packet.readinessEvidence.executionWindowStatus,
  createReplayCancelStatus: packet.readinessEvidence.createReplayCancelStatus,
  blockerCount: packet.executionBlockers.length,
}, null, 2));

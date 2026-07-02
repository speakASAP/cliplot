#!/usr/bin/env node
const baseUrl = process.argv[2] || process.env.CLIPLOT_LIVE_SMOKE_EXECUTION_CHECKLIST_BASE_URL || 'http://127.0.0.1:8080';

function assert(condition, message, evidence = {}) {
  if (!condition) {
    console.error(JSON.stringify({ ok: false, message, ...evidence }, null, 2));
    process.exit(1);
  }
}

const path = process.env.CLIPLOT_LIVE_SMOKE_CONTRACT_PATH || '/api/checkout/live-order-warehouse-smoke-execution-checklist-packet';
const response = await fetch(new URL(path, baseUrl));
const text = await response.text();
let packet = null;
try {
  packet = text ? JSON.parse(text) : {};
} catch {
  assert(false, 'live smoke execution checklist returned non-json response', {
    httpStatus: response.status,
    body: text.slice(0, 300),
  });
}

assert(response.status === 200 && packet.success, 'live smoke execution checklist request failed', {
  httpStatus: response.status,
  status: packet.status,
});
assert(packet.status === 'approval_required_live_order_warehouse_smoke_execution', 'execution checklist status changed', packet);
assert(packet.mode === 'read_only_live_order_warehouse_smoke_execution_checklist_packet', 'execution checklist mode changed', packet);
assert(packet.mutation === false, 'execution checklist reported mutation', packet);
assert(packet.persistence === false, 'execution checklist reported persistence', packet);
assert(packet.providerCall === false, 'execution checklist reported provider call', packet);
assert(packet.liveExecutionAllowed === false, 'execution checklist allowed live execution', packet);
assert(packet.liveOrderWarehouseSmokeFlag === false, 'live smoke flag enabled unexpectedly', packet);
assert(packet.readyForBoundedWindow === false, 'placeholder smoke window should block bounded-window readiness', packet);
assert(packet.metadataApprovals?.orderWarehouseSmoke === true, 'smoke metadata approval missing', packet);
assert(packet.metadataApprovals?.cleanup === true, 'cleanup metadata approval missing', packet);
assert(packet.metadataApprovals?.window === false, 'placeholder smoke window should not count as concrete window approval', packet);
assert(packet.metadataApprovals?.windowConfigured === true, 'smoke window placeholder should remain visible as configured metadata', packet);
assert(packet.metadataApprovals?.rollbackOwner === true, 'rollback owner metadata missing', packet);
assert(packet.metadataApprovals?.validationOwner === true, 'validation owner metadata missing', packet);
assert(packet.serviceTokenReadiness?.ordersServiceTokenPresent === true, 'orders service token missing', packet);
assert(packet.serviceTokenReadiness?.ordersStatusServiceTokenPresent === true, 'orders status service token missing', packet);
assert(packet.serviceTokenReadiness?.warehouseServiceTokenPresent === true, 'warehouse service token missing', packet);
assert(packet.serviceTokenReadiness?.secretValuesPrinted === false, 'secret values printed', packet);
assert(packet.runtimeEnablement?.requiredFlag === 'ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE', 'required runtime flag missing', packet);
assert(packet.runtimeEnablement?.currentRuntimeFlagEnabled === false, 'runtime flag enabled', packet);
assert(packet.runtimeEnablement?.currentPacketEnablesRuntime === false, 'checklist enables runtime', packet);
assert(packet.runtimeEnablement?.liveExecutionAllowedNow === false, 'runtime enablement allows execution now', packet);
assert(packet.createReplayCancelContract?.status === 'create_replay_cancel_contract_recorded_execution_disabled', 'CREATE_REPLAY_CANCEL contract status missing', packet);
assert(packet.createReplayCancelContract?.liveExecutionAllowed === false, 'CREATE_REPLAY_CANCEL contract allows execution', packet);
assert(packet.createReplayCancelContract?.requiredBodyFields?.includes('confirm=CREATE_REPLAY_CANCEL'), 'CREATE_REPLAY_CANCEL required body field missing', packet);
assert(packet.createReplayCancelContract?.cleanupContract === 'cancel only through /api/orders/{orderId}/status', 'cleanup contract changed', packet);
assert(packet.createReplayCancelContract?.reservationVerification?.includes('after-cancel Warehouse availability restored'), 'reservation verification missing', packet);
assert(packet.executorRequestChecklist?.endpoint === 'POST /api/checkout/live-order-warehouse-smoke-executor', 'executor endpoint missing', packet);
assert(packet.executorRequestChecklist?.requiredBody?.confirm === 'CREATE_REPLAY_CANCEL', 'CREATE_REPLAY_CANCEL body missing', packet);
assert(packet.executorRequestChecklist?.currentChecklistSendsBody === false, 'checklist sends executor body', packet);
assert(packet.expectedExecutionScopeAfterApproval?.createEndpoint === '/api/orders', 'create endpoint missing', packet);
assert(packet.expectedExecutionScopeAfterApproval?.cleanupEndpoint === '/api/orders/{orderId}/status', 'cleanup endpoint missing', packet);
assert(packet.expectedExecutionScopeAfterApproval?.stepCount === 5, 'execution step count changed', packet);
assert(packet.expectedExecutionScopeAfterApproval?.paymentCreateAllowed === false, 'payment creation allowed', packet);
assert(packet.expectedExecutionScopeAfterApproval?.notificationSendAllowed === false, 'notification send allowed', packet);
assert(packet.expectedExecutionScopeAfterApproval?.callbackPersistenceAllowed === false, 'callback persistence allowed', packet);
assert(packet.rollbackAndStopConditions?.cleanupThroughOrdersOnly === true, 'cleanup must go through Orders', packet);
assert(packet.rollbackAndStopConditions?.directWarehouseMutationAllowed === false, 'direct Warehouse mutation allowed', packet);
assert(packet.rollbackAndStopConditions?.stopConditions?.includes('do not retry mutation after partial create without cleanup owner review'), 'partial-create stop condition missing', packet);
assert(packet.planEvidence?.productId, 'product id evidence missing', packet);
assert(packet.planEvidence?.warehouseId, 'warehouse id evidence missing', packet);
assert(packet.planEvidence?.payloadFingerprint, 'payload fingerprint missing', packet);
assert(packet.planEvidence?.readiness === 'validated_no_mutation', 'readiness evidence missing', packet);
assert(packet.planEvidence?.livePreflight === 'blocked', 'live preflight evidence missing', packet);
assert(packet.planEvidence?.wouldReserveWarehouseNow === false, 'would reserve Warehouse now', packet);
assert(packet.defaultExecutorBlockers?.includes('live_order_warehouse_smoke_flag_disabled'), 'default disabled flag blocker missing', packet);
assert(packet.defaultExecutorBlockers?.includes('invalid_or_missing_smoke_approval_id'), 'default approval id blocker missing', packet);
assert(packet.defaultExecutorBlockers?.includes('missing_CREATE_REPLAY_CANCEL_confirmation'), 'default confirmation blocker missing', packet);
assert(!packet.defaultExecutorBlockers?.includes('missing_ORDERS_STATUS_SERVICE_TOKEN'), 'orders status token should be present', packet);
assert(packet.executionBlockers?.some((item) => item.includes('live Orders/Warehouse smoke metadata and service-token readiness')), 'metadata readiness blocker missing', packet);
assert(packet.executionBlockers?.some((item) => item.includes('ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE=true')), 'runtime flag blocker missing', packet);
assert(packet.executionBlockers?.some((item) => item.includes('confirm=CREATE_REPLAY_CANCEL')), 'confirmation blocker missing', packet);
assert(packet.mustRemainFalseBeforeApprovedWindow?.includes('ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE'), 'live smoke flag guard missing', packet);
assert(packet.mustRemainFalseBeforeApprovedWindow?.includes('ENABLE_LIVE_PAYMENT_CREATE'), 'payment flag guard missing', packet);
assert(packet.forbiddenOperations?.includes('create order'), 'create order forbidden now missing', packet);
assert(packet.forbiddenOperations?.includes('create payment'), 'create payment forbidden now missing', packet);
assert(packet.forbiddenOperations?.includes('send notification'), 'send notification forbidden now missing', packet);

const serialized = JSON.stringify(packet);
assert(!/sk_live|sk_test|whsec_|Bearer\s+/i.test(serialized), 'execution checklist appears to expose secret material', packet);
assert(!serialized.includes('x-internal-service-token'), 'execution checklist exposes token header name', packet);
assert(!serialized.includes('customerEmail'), 'execution checklist exposes customer email field', packet);
assert(!serialized.includes('customerName'), 'execution checklist exposes customer name field', packet);
assert(packet.sensitiveDataPolicy?.includes('no service token values'), 'service token sensitive-data guard missing', packet);

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  status: packet.status,
  mode: packet.mode,
  contractStatus: packet.createReplayCancelContract.status,
  readyForBoundedWindow: packet.readyForBoundedWindow,
  liveExecutionAllowed: packet.liveExecutionAllowed,
  liveOrderWarehouseSmokeFlag: packet.liveOrderWarehouseSmokeFlag,
  blockerCount: packet.executionBlockers.length,
  defaultExecutorBlockerCount: packet.defaultExecutorBlockers.length,
  productId: packet.planEvidence.productId,
  warehouseId: packet.planEvidence.warehouseId,
  payloadFingerprint: packet.planEvidence.payloadFingerprint,
  mutation: packet.mutation,
  persistence: packet.persistence,
  providerCall: packet.providerCall,
}, null, 2));

#!/usr/bin/env node
const baseUrl = process.argv[2] || process.env.CLIPLOT_REVENUE_CLOSURE_BASE_URL || 'http://127.0.0.1:8080';

function assert(condition, message, evidence = {}) {
  if (!condition) {
    console.error(JSON.stringify({ ok: false, message, ...evidence }, null, 2));
    process.exit(1);
  }
}

const response = await fetch(new URL('/api/checkout/revenue-closure-packet', baseUrl));
const text = await response.text();
let packet = null;
try {
  packet = text ? JSON.parse(text) : {};
} catch {
  assert(false, 'revenue closure packet returned non-json response', {
    httpStatus: response.status,
    body: text.slice(0, 300),
  });
}

assert(response.status === 200 && packet.success, 'revenue closure packet request failed', {
  httpStatus: response.status,
  status: packet.status,
});
assert(packet.status === 'approval_required_live_revenue_closure', 'revenue closure should remain approval-required', packet);
assert(packet.mode === 'read_only_live_revenue_closure_packet', 'revenue closure mode changed', packet);
assert(packet.mutation === false, 'revenue closure reported mutation', packet);
assert(packet.persistence === false, 'revenue closure reported persistence', packet);
assert(packet.providerCall === false, 'revenue closure reported provider call', packet);
assert(packet.wouldMutateNow === false, 'revenue closure would mutate before approvals', packet);
assert(packet.approvalPacket?.status === 'approval_required_live_checkout_execution', 'approval packet aggregation status missing', packet.approvalPacket || {});
assert(packet.liveCheckoutPreflight?.status === 'blocked', 'live preflight should remain blocked', packet);
assert(packet.liveCheckoutPreflight?.wouldMutate === false, 'live preflight would mutate', packet);
assert(packet.liveCheckoutPreflight?.mutationPlan?.wouldCreateOrder === false, 'live preflight would create order', packet);
assert(packet.liveCheckoutPreflight?.mutationPlan?.wouldReserveWarehouse === false, 'live preflight would reserve Warehouse stock', packet);
assert(packet.liveCheckoutPreflight?.mutationPlan?.wouldCreatePayment === false, 'live preflight would create payment', packet);
assert(packet.liveCheckoutPreflight?.mutationPlan?.wouldSendNotification === false, 'live preflight would send notification', packet);
assert(Array.isArray(packet.requiredApprovalIds) && packet.requiredApprovalIds.includes('CLIPLOT_LIVE_ORDER_APPROVAL_ID'), 'order approval id missing', packet);
assert(packet.requiredApprovalIds.includes('CLIPLOT_LIVE_PAYMENT_APPROVAL_ID'), 'payment approval id missing', packet);
assert(packet.requiredApprovalIds.includes('CLIPLOT_LIVE_NOTIFICATION_APPROVAL_ID'), 'notification approval id missing', packet);
assert(packet.requiredApprovalIds.includes('CLIPLOT_LIVE_ORDER_WAREHOUSE_SMOKE_APPROVAL_ID'), 'live smoke approval id missing', packet);
assert(Array.isArray(packet.requiredRuntimeKeys) && packet.requiredRuntimeKeys.includes('ORDERS_STATUS_SERVICE_TOKEN'), 'orders status runtime key missing', packet);
assert(packet.catalog?.catalogSource === 'catalog', 'catalog source evidence missing', packet);
assert(packet.catalog?.warehouseBackedProductCount > 0, 'warehouse-backed product evidence missing', packet);
assert(packet.catalog?.approvedCliplotSkuScope === true, 'approved SKU scope evidence missing', packet);
assert(packet.orderWarehouse?.status === 'validated_no_mutation', 'order/Warehouse readiness not validated', packet);
assert(packet.orderWarehouse?.mutation === false, 'order/Warehouse readiness reported mutation', packet);
assert(packet.payment?.statusReadiness === 'ready_for_approved_payment_status_runtime_read', 'payment status readiness missing', packet);
assert(packet.payment?.storageReadiness === 'blocked_storage_backend_not_approved', 'payment storage guard changed', packet);
assert(['approval_required_order_payment_status_mapping_ownership', 'approved_order_payment_status_mapping_ownership'].includes(packet.payment?.mappingOwnership), 'payment mapping ownership evidence missing', packet);
assert(['approval_required_callback_replay_policy', 'approved_callback_replay_policy_metadata_execution_disabled'].includes(packet.callbackPolicy?.status), 'callback policy evidence missing', packet);
assert(packet.callbackPolicy?.callbackPersistence === false, 'callback persistence enabled', packet);
assert(packet.customerStatus?.activation === 'ready_for_approved_read_only_customer_status_runtime', 'customer status activation missing', packet);
assert(packet.customerStatus?.runtimeReadEnabled === true, 'read-only customer status runtime not enabled', packet);
assert(packet.customerStatus?.storageRead === false, 'customer status storage read enabled', packet);
assert(['approval_required', 'approved_live_order_warehouse_smoke_metadata_execution_disabled'].includes(packet.liveSmokePlan?.status), 'live smoke plan should remain approval-required or metadata-approved execution-disabled', packet);
assert(packet.liveSmokePlan?.liveExecutionAllowed === false, 'live smoke execution unexpectedly allowed', packet);
assert(packet.blockerClassification?.mode === 'read_only_blocker_classification', 'blocker classification missing', packet.blockerClassification || {});
assert(packet.blockerClassification?.classificationOnly === true, 'blocker classification is not metadata-only', packet.blockerClassification || {});
assert(packet.blockerClassification?.currentPacketMayMutate === false, 'blocker classification would mutate', packet.blockerClassification || {});
assert(packet.blockerClassification?.currentPacketMayPersist === false, 'blocker classification would persist', packet.blockerClassification || {});
assert(packet.blockerClassification?.currentPacketMayCallProvider === false, 'blocker classification would call provider', packet.blockerClassification || {});
assert(packet.blockerClassification?.currentPacketMaySendNotification === false, 'blocker classification would send notification', packet.blockerClassification || {});
assert(packet.blockerClassification?.metadataPacketEligible?.includes('callback persistence storage backend proposal'), 'metadata-eligible callback storage proposal missing', packet.blockerClassification || {});
assert(packet.blockerClassification?.requiresOwnerLiveMutationApproval?.includes('ENABLE_LIVE_ORDER_SUBMIT=true'), 'live order mutation approval classifier missing', packet.blockerClassification || {});
assert(packet.blockerClassification?.requiresOwnerLiveMutationApproval?.includes('CREATE_REPLAY_CANCEL live smoke executor run'), 'live smoke execution classifier missing', packet.blockerClassification || {});
assert(packet.blockerClassification?.requiresOwnerLiveMutationApproval?.includes('callback persistence enablement'), 'callback persistence enablement classifier missing', packet.blockerClassification || {});
assert(packet.blockerClassification?.requiresOwnerLiveMutationApproval?.includes('callback replay execution enablement'), 'callback replay execution classifier missing', packet.blockerClassification || {});
assert(packet.blockerClassification?.requiresOwnerLiveMutationApproval?.includes('live order/payment status writes'), 'live status write classifier missing', packet.blockerClassification || {});
assert(Array.isArray(packet.forbiddenOperations) && packet.forbiddenOperations.includes('create payment'), 'forbidden payment operation missing', packet);
assert(Array.isArray(packet.blockers) && packet.blockers.length > 0, 'revenue closure blockers missing', packet);

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  status: packet.status,
  livePreflight: packet.liveCheckoutPreflight.status,
  wouldMutateNow: packet.wouldMutateNow,
  catalogSource: packet.catalog.catalogSource,
  warehouseBackedProductCount: packet.catalog.warehouseBackedProductCount,
  approvedCliplotSkuScope: packet.catalog.approvedCliplotSkuScope,
  orderWarehouse: packet.orderWarehouse.status,
  paymentStatus: packet.payment.statusReadiness,
  callbackPolicy: packet.callbackPolicy.status,
  customerStatusActivation: packet.customerStatus.activation,
  liveSmokePlan: packet.liveSmokePlan.status,
  blockerClassification: packet.blockerClassification.mode,
  blockerCount: packet.blockers.length,
  mutation: packet.mutation,
  persistence: packet.persistence,
  providerCall: packet.providerCall,
}, null, 2));

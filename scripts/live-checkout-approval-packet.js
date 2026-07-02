#!/usr/bin/env node
const baseUrl = process.argv[2] || process.env.CLIPLOT_APPROVAL_BASE_URL || 'http://127.0.0.1:8080';

function assert(condition, message, evidence = {}) {
  if (!condition) {
    console.error(JSON.stringify({ ok: false, message, ...evidence }, null, 2));
    process.exit(1);
  }
}

const response = await fetch(new URL('/api/checkout/approval-packet', baseUrl));
const packet = await response.json();

assert(response.status === 200 && packet.success, 'approval packet request failed', {
  httpStatus: response.status,
  status: packet.status,
});
assert(packet.mutation === false && packet.providerCall === false && packet.persistence === false, 'approval packet is not read-only', packet);
assert(packet.catalog?.catalogSource === 'catalog', 'approval packet does not prove Catalog product source', packet.catalog || {});
assert(packet.catalog?.warehouseBackedProductCount > 0, 'approval packet lacks Warehouse-backed product evidence', packet.catalog || {});
assert(packet.status === 'approval_required_live_checkout_execution', 'approval packet should remain approval-required for live checkout execution', packet);
assert(packet.liveCheckoutPreflight?.status === 'blocked', 'approval packet unexpectedly reports live checkout ready', packet.liveCheckoutPreflight || {});
assert(packet.liveCheckoutPreflight?.wouldMutate === false, 'approval packet would mutate', packet.liveCheckoutPreflight || {});
assert(packet.liveCheckoutPreflight?.mutationPlan?.wouldCreateOrder === false, 'approval packet would create order', packet.liveCheckoutPreflight || {});
assert(packet.liveCheckoutPreflight?.mutationPlan?.wouldReserveWarehouse === false, 'approval packet would reserve Warehouse stock', packet.liveCheckoutPreflight || {});
assert(packet.liveCheckoutPreflight?.mutationPlan?.wouldCreatePayment === false, 'approval packet would create payment', packet.liveCheckoutPreflight || {});
assert(packet.liveCheckoutPreflight?.mutationPlan?.wouldSendNotification === false, 'approval packet would send notification', packet.liveCheckoutPreflight || {});
assert(Array.isArray(packet.requiredRuntimeKeys) && packet.requiredRuntimeKeys.includes('PAYMENT_API_KEY'), 'runtime key names missing', packet);
assert(packet.requiredRuntimeKeys.includes('ORDERS_STATUS_SERVICE_TOKEN'), 'orders status token runtime key missing', packet);
assert(Array.isArray(packet.requiredApprovalIds) && packet.requiredApprovalIds.includes('CLIPLOT_LIVE_ORDER_APPROVAL_ID'), 'order approval id missing', packet);
assert(packet.requiredApprovalIds.includes('CLIPLOT_LIVE_PAYMENT_APPROVAL_ID'), 'payment approval id missing', packet);
assert(packet.requiredApprovalIds.includes('CLIPLOT_LIVE_NOTIFICATION_APPROVAL_ID'), 'notification approval id missing', packet);
assert(packet.requiredApprovalIds.includes('CLIPLOT_LIVE_ORDER_WAREHOUSE_SMOKE_APPROVAL_ID'), 'live smoke approval id missing', packet);
assert(Array.isArray(packet.missing) && packet.missing.length >= 4, 'approval blockers missing', packet);
assert(packet.wouldMutateNow === false, 'approval packet would mutate now', packet);
assert(['approval_required', 'approved_live_order_warehouse_smoke_metadata_execution_disabled'].includes(packet.readinessEvidence?.liveSmokePlan), 'live smoke metadata approval evidence missing', packet.readinessEvidence || {});
assert(packet.readinessEvidence?.callbackPersistence === 'approval_required_callback_persistence_storage_backend', 'callback persistence blocker evidence missing', packet.readinessEvidence || {});
assert(packet.paymentBoundary?.callbackPersistenceEnabled === false, 'callback persistence unexpectedly enabled', packet.paymentBoundary || {});
assert(packet.paymentBoundary?.callbackReplayEnabled === false, 'callback replay unexpectedly enabled', packet.paymentBoundary || {});
assert(packet.notificationBoundary?.mutation === false, 'notification boundary reports mutation', packet.notificationBoundary || {});
assert(packet.mustRemainFalseUntilApproved?.includes('callbackPersistence'), 'callback persistence guard missing', packet);
assert(packet.forbiddenOperations?.includes('create payment'), 'create payment forbidden operation missing', packet);
assert(packet.satisfiedEvidence?.some((item) => item.includes('read-only customer status runtime')), 'read-only customer status evidence missing', packet);
assert(!packet.missing.some((item) => item.startsWith('[DONE:')), 'satisfied evidence should not be counted as blockers', packet);

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  status: packet.status,
  mode: packet.mode,
  catalogSource: packet.catalog.catalogSource,
  productCount: packet.catalog.productCount,
  warehouseBackedProductCount: packet.catalog.warehouseBackedProductCount,
  livePreflight: packet.liveCheckoutPreflight.status,
  wouldMutate: packet.liveCheckoutPreflight.wouldMutate,
  requiredApprovalIds: packet.requiredApprovalIds,
  missingCount: packet.missing.length,
  mutation: packet.mutation,
  providerCall: packet.providerCall,
  persistence: packet.persistence,
}, null, 2));

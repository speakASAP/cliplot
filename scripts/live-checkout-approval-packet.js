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
assert(packet.liveCheckoutPreflight?.status === 'blocked', 'approval packet unexpectedly reports live checkout ready', packet.liveCheckoutPreflight || {});
assert(packet.liveCheckoutPreflight?.wouldMutate === false, 'approval packet would mutate', packet.liveCheckoutPreflight || {});
assert(packet.liveCheckoutPreflight?.mutationPlan?.wouldCreateOrder === false, 'approval packet would create order', packet.liveCheckoutPreflight || {});
assert(packet.liveCheckoutPreflight?.mutationPlan?.wouldCreatePayment === false, 'approval packet would create payment', packet.liveCheckoutPreflight || {});
assert(packet.liveCheckoutPreflight?.mutationPlan?.wouldSendNotification === false, 'approval packet would send notification', packet.liveCheckoutPreflight || {});
assert(Array.isArray(packet.requiredRuntimeKeys) && packet.requiredRuntimeKeys.includes('PAYMENT_API_KEY'), 'runtime key names missing', packet);
assert(Array.isArray(packet.requiredApprovalIds) && packet.requiredApprovalIds.length === 3, 'approval id names missing', packet);
assert(Array.isArray(packet.missing) && packet.missing.length >= 3, 'approval blockers missing', packet);

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  status: packet.status,
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

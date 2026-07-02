#!/usr/bin/env node
const baseUrl = process.argv[2] || process.env.CLIPLOT_ORDER_WAREHOUSE_BASE_URL || 'http://127.0.0.1:8080';

function assert(condition, message, evidence = {}) {
  if (!condition) {
    console.error(JSON.stringify({ ok: false, message, ...evidence }, null, 2));
    process.exit(1);
  }
}

const response = await fetch(new URL('/api/checkout/order-warehouse-readiness', baseUrl));
const report = await response.json();

assert(response.status === 200 && report.success, 'order/warehouse readiness request failed', {
  httpStatus: response.status,
  status: report.status,
});
assert(report.status === 'validated_no_mutation', 'order/warehouse readiness is not validated', report);
assert(report.mutation === false && report.providerCall === false && report.persistence === false, 'report is not read-only', report);
assert(report.service === 'cliplot', 'service identity is not cliplot', { service: report.service });
assert(report.catalog?.catalogSource === 'catalog', 'catalog source is not authenticated Catalog', report.catalog || {});
assert(report.catalog?.sampleProduct?.productSource === 'catalog', 'sample product is not Catalog-backed', report.catalog || {});
assert(Boolean(report.catalog?.sampleProduct?.warehouseId), 'sample product lacks warehouseId', report.catalog || {});
assert(report.orderCreateContract?.endpoint === '/api/orders/validate-create', 'Orders endpoint is not validate-create', report.orderCreateContract || {});
assert(report.orderCreateContract?.contractVersion === 'orders.create.v1', 'Orders contract version mismatch', report.orderCreateContract || {});
assert(report.orderCreateContract?.channel === 'cliplot', 'Orders channel mismatch', report.orderCreateContract || {});
assert(report.orderCreateContract?.serviceName === 'cliplot', 'Orders service identity mismatch', report.orderCreateContract || {});
assert(String(report.orderCreateContract?.idempotencyKey || '').startsWith('cliplot-order-validate-'), 'Orders validation idempotency key missing', report.orderCreateContract || {});
assert(report.orderValidation?.status === 'validated_no_mutation', 'Orders validation failed', report.orderValidation || {});
assert(report.orderValidation?.mutation === false, 'Orders validation reported mutation', report.orderValidation || {});
assert(report.orderValidation?.orderCreated === false, 'Orders validation created an order', report.orderValidation || {});
assert(report.orderValidation?.warehouseMutation === false, 'Orders validation reported Warehouse mutation', report.orderValidation || {});
assert(report.orderValidation?.eventPublished === false, 'Orders validation published an event', report.orderValidation || {});
assert(report.warehouseReadinessContract?.endpoint === '/api/stock/availability/batch', 'Warehouse readiness endpoint mismatch', report.warehouseReadinessContract || {});
assert(report.warehouseReservationReadiness?.status === 'validated_no_mutation', 'Warehouse readiness failed', report.warehouseReservationReadiness || {});
assert(report.warehouseReservationReadiness?.mutation === false, 'Warehouse readiness reported mutation', report.warehouseReservationReadiness || {});
assert(report.warehouseReservationReadiness?.reservationCreated === false, 'Warehouse readiness created a reservation', report.warehouseReservationReadiness || {});
assert(report.warehouseReservationReadiness?.stockMutation === false, 'Warehouse readiness mutated stock', report.warehouseReservationReadiness || {});
assert(report.liveCheckoutPreflight?.status === 'blocked' && report.liveCheckoutPreflight?.wouldMutate === false, 'live preflight is not fail-closed', report.liveCheckoutPreflight || {});
assert(Array.isArray(report.blockers) && report.blockers.length === 0, 'readiness report has blockers', report);

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  status: report.status,
  service: report.service,
  catalogSource: report.catalog.catalogSource,
  productId: report.catalog.sampleProduct.id,
  warehouseId: report.catalog.sampleProduct.warehouseId,
  ordersEndpoint: report.orderCreateContract.endpoint,
  ordersContractVersion: report.orderCreateContract.contractVersion,
  ordersChannel: report.orderCreateContract.channel,
  ordersServiceName: report.orderCreateContract.serviceName,
  ordersIdempotencyKey: report.orderCreateContract.idempotencyKey,
  orderValidation: report.orderValidation.status,
  warehouseEndpoint: report.warehouseReadinessContract.endpoint,
  warehouseReservationReadiness: report.warehouseReservationReadiness.status,
  livePreflight: report.liveCheckoutPreflight.status,
  wouldMutate: report.liveCheckoutPreflight.wouldMutate,
  mutation: report.mutation,
  providerCall: report.providerCall,
  persistence: report.persistence,
}, null, 2));

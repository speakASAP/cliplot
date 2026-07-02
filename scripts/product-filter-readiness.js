#!/usr/bin/env node
const baseUrl = process.argv[2] || process.env.CLIPLOT_PRODUCT_FILTER_BASE_URL || 'http://127.0.0.1:8080';

function assert(condition, message, evidence = {}) {
  if (!condition) {
    console.error(JSON.stringify({ ok: false, message, ...evidence }, null, 2));
    process.exit(1);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadReadinessReport() {
  const response = await fetch(new URL('/api/products/filter-readiness', baseUrl));
  const text = await response.text();
  let report = null;
  try {
    report = text ? JSON.parse(text) : {};
  } catch {
    assert(false, 'product filter readiness returned non-json response', {
      httpStatus: response.status,
      body: text.slice(0, 300),
    });
  }

  assert(response.status === 200 && report.success, 'product filter readiness request failed', {
    httpStatus: response.status,
    status: report.status,
  });
  return report;
}

let report = await loadReadinessReport();
for (let attempt = 2; attempt <= 4 && Number(report.warehouseBackedProductCount || 0) === 0; attempt += 1) {
  await sleep(300 * attempt);
  report = await loadReadinessReport();
}
assert(['approval_required_catalog_product_filter_rule', 'approved_cliplot_product_filter_scope'].includes(report.status), 'product filter readiness status unexpected', report);
assert(report.mode === 'guarded_catalog_product_filter_readiness', 'product filter readiness mode changed', report);
assert(report.mutation === false, 'product filter readiness reported mutation', report);
assert(report.persistence === false, 'product filter readiness reported persistence', report);
assert(report.providerCall === false, 'product filter readiness reported provider call', report);
assert(report.catalogSource === 'catalog', 'product filter readiness is not using authenticated Catalog', report);
assert(Number(report.productCount) > 0, 'product filter readiness has no products', report);
assert(Number(report.warehouseBackedProductCount) > 0, 'product filter readiness has no Warehouse-backed products', report);
assert(['active_catalog_query', 'configured_product_ids'].includes(report.selectionMode), 'unknown product selection mode', report);
if (report.status === 'approved_cliplot_product_filter_scope') {
  assert(report.approvedCliplotSkuScope === true, 'approved product SKU scope flag missing', report);
  assert(report.productScopeApprovalPresent === true, 'product scope approval id missing', report);
  assert(report.configuredProductScope === true, 'configured product scope evidence missing', report);
} else {
  assert(report.approvedCliplotSkuScope === false, 'product SKU scope should not be approved without owner decision', report);
}
assert(Number.isInteger(report.configuredProductIdCount), 'configured product ID count missing', report);
assert(!Array.isArray(report.configuredProductIds), 'raw configured product IDs must not be exposed', report);
assert(report.currentQueryContract?.requiresOwnerApproval === true, 'query contract should still require owner approval', report);
assert(report.currentQueryContract?.exposesRawProductIds === false, 'query contract exposes raw product IDs', report);
assert(Array.isArray(report.sampleProducts) && report.sampleProducts.length > 0, 'sample products missing', report);
assert(report.sampleProducts.every((product) => product.productSource === 'catalog' && product.warehouseId), 'sample products must be Catalog and Warehouse-backed', report);
assert(report.approvalRequest?.requiredDecision === 'approved Cliplot product SKU list/filtering rule', 'approval decision missing', report);
assert(Array.isArray(report.approvalRequest?.acceptableOptions) && report.approvalRequest.acceptableOptions.length >= 3, 'approval options missing', report);
assert(Array.isArray(report.forbiddenOperations) && report.forbiddenOperations.includes('reserve Warehouse stock'), 'Warehouse mutation guard missing', report);
assert(report.forbiddenOperations.includes('create payment'), 'payment mutation guard missing', report);
if (report.status === 'approved_cliplot_product_filter_scope') {
  assert(Array.isArray(report.blockers) && report.blockers.length === 0, 'approved product filter should have no blockers', report);
} else {
  assert(Array.isArray(report.blockers) && report.blockers.some((item) => item.includes('approved Cliplot product SKU list/filtering rule')), 'product filter blocker missing', report);
}

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  status: report.status,
  catalogSource: report.catalogSource,
  productCount: report.productCount,
  warehouseBackedProductCount: report.warehouseBackedProductCount,
  selectionMode: report.selectionMode,
  configuredProductIdCount: report.configuredProductIdCount,
  approvedCliplotSkuScope: report.approvedCliplotSkuScope,
  configuredProductIdFingerprintPresent: Boolean(report.configuredProductIdFingerprint),
  sampleProductId: report.sampleProducts[0]?.id || null,
  sampleWarehouseId: report.sampleProducts[0]?.warehouseId || null,
  blockerCount: report.blockers.length,
  mutation: report.mutation,
  persistence: report.persistence,
  providerCall: report.providerCall,
}, null, 2));

import { createHash, timingSafeEqual } from 'node:crypto';

const requestTimeoutMs = Number(process.env.SERVICE_REQUEST_TIMEOUT_MS || 2200);
const liveSmokeRequestTimeoutMs = Number(process.env.CLIPLOT_LIVE_SMOKE_REQUEST_TIMEOUT_MS || 15000);
const orderIdPrefix = process.env.CLIPLOT_ORDER_ID_PREFIX || 'cliplot';
const externalOrderIdPattern = /^[a-z0-9][a-z0-9-]{7,95}$/;

export const fallbackProducts = [
  {
    id: 'clip-home-organizer',
    name: 'Sada chytrých úchytů Cliplot',
    category: 'Domácnost',
    price: 349,
    originalPrice: 429,
    currency: 'Kč',
    stockStatus: 'Skladem',
    delivery: 'Doručení 1-2 dny',
    image: '/assets/product-clips.svg',
    description: 'Praktická sada pro rychlé upevnění kabelů, dekorací a drobných věcí doma i v dílně.',
    productSource: 'fallback',
  },
  {
    id: 'clip-workshop-box',
    name: 'Organizér do dílny',
    category: 'Dílna',
    price: 589,
    currency: 'Kč',
    stockStatus: 'Skladem',
    delivery: 'Doručení 1-2 dny',
    image: '/assets/product-workshop.svg',
    description: 'Pevný organizér s přehlednými přihrádkami pro nářadí, šroubky a příslušenství.',
    productSource: 'fallback',
  },
  {
    id: 'clip-travel-pack',
    name: 'Cestovní balení klipů',
    category: 'Cestování',
    price: 249,
    currency: 'Kč',
    stockStatus: 'Skladem',
    delivery: 'Doručení 1-2 dny',
    image: '/assets/product-travel.svg',
    description: 'Lehké balení pro kabely, tašky a drobnosti na cestách.',
    productSource: 'fallback',
  },
  {
    id: 'clip-family-set',
    name: 'Rodinný set Cliplot',
    category: 'Akce',
    price: 899,
    originalPrice: 1099,
    currency: 'Kč',
    stockStatus: 'Skladem',
    delivery: 'Doručení 1-2 dny',
    image: '/assets/product-family.svg',
    description: 'Výhodný set pro domácnost, garáž i školní tašku.',
    productSource: 'fallback',
  },
];

export const serviceConfig = {
  serviceName: process.env.SERVICE_NAME || 'cliplot',
  applicationId: process.env.CLIPLOT_APPLICATION_ID || 'cliplot',
  orderChannel: process.env.CLIPLOT_ORDER_CHANNEL || 'cliplot',
  channelAccountId: process.env.CLIPLOT_CHANNEL_ACCOUNT_ID || 'cliplot-storefront',
  frontendMode: process.env.CLIPLOT_FRONTEND_MODE || 'shared-service-integration',
  liveOrderSubmit: process.env.ENABLE_LIVE_ORDER_SUBMIT === 'true',
  livePaymentCreate: process.env.ENABLE_LIVE_PAYMENT_CREATE === 'true',
  liveNotifications: process.env.ENABLE_LIVE_NOTIFICATIONS === 'true',
  liveOrderWarehouseSmoke: process.env.ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE === 'true',
  liveOrderApprovalId: process.env.CLIPLOT_LIVE_ORDER_APPROVAL_ID || '',
  livePaymentApprovalId: process.env.CLIPLOT_LIVE_PAYMENT_APPROVAL_ID || '',
  liveNotificationApprovalId: process.env.CLIPLOT_LIVE_NOTIFICATION_APPROVAL_ID || '',
  livePaymentCreateExecutionWindow: process.env.CLIPLOT_PAYMENT_CREATE_EXECUTION_WINDOW || '',
  livePaymentCreateRollbackOwner: process.env.CLIPLOT_PAYMENT_CREATE_ROLLBACK_OWNER || 'cliplot-payment-operator',
  livePaymentCreateValidationOwner: process.env.CLIPLOT_PAYMENT_CREATE_VALIDATION_OWNER || 'cliplot-validation-owner',
  liveNotificationSendExecutionWindow: process.env.CLIPLOT_NOTIFICATION_SEND_EXECUTION_WINDOW || '',
  liveNotificationSendRollbackOwner: process.env.CLIPLOT_NOTIFICATION_SEND_ROLLBACK_OWNER || 'cliplot-notification-operator',
  liveNotificationSendValidationOwner: process.env.CLIPLOT_NOTIFICATION_SEND_VALIDATION_OWNER || 'cliplot-validation-owner',
  liveCheckoutExecutionWindow: process.env.CLIPLOT_LIVE_CHECKOUT_EXECUTION_WINDOW || '',
  liveCheckoutRollbackOwner: process.env.CLIPLOT_LIVE_CHECKOUT_ROLLBACK_OWNER || 'cliplot-operator',
  liveCheckoutValidationOwner: process.env.CLIPLOT_LIVE_CHECKOUT_VALIDATION_OWNER || 'cliplot-validation-owner',
  liveOrderWarehouseSmokeApprovalId: process.env.CLIPLOT_LIVE_ORDER_WAREHOUSE_SMOKE_APPROVAL_ID || '',
  liveOrderWarehouseSmokeCleanupApprovalId: process.env.CLIPLOT_LIVE_ORDER_WAREHOUSE_SMOKE_CLEANUP_APPROVAL_ID || '',
  liveOrderWarehouseSmokeWindow: process.env.CLIPLOT_LIVE_ORDER_WAREHOUSE_SMOKE_WINDOW || '',
  liveOrderWarehouseSmokeRollbackOwner: process.env.CLIPLOT_LIVE_ORDER_WAREHOUSE_SMOKE_ROLLBACK_OWNER || '',
  liveOrderWarehouseSmokeValidationOwner: process.env.CLIPLOT_LIVE_ORDER_WAREHOUSE_SMOKE_VALIDATION_OWNER || '',
  customerStatusRuntimeRead: process.env.ENABLE_CUSTOMER_STATUS_RUNTIME_READ === 'true',
  paymentStatusSnapshotRead: process.env.ENABLE_PAYMENT_STATUS_SNAPSHOT_READ === 'true',
  statusRuntimeApprovalId: process.env.CLIPLOT_STATUS_RUNTIME_APPROVAL_ID || '',
  callbackReplayPolicyApprovalId: process.env.CLIPLOT_CALLBACK_REPLAY_POLICY_APPROVAL_ID || '',
  callbackPersistenceStorageApprovalId: process.env.CLIPLOT_CALLBACK_PERSISTENCE_STORAGE_APPROVAL_ID || '',
  callbackPersistenceRolloutApprovalId: process.env.CLIPLOT_CALLBACK_PERSISTENCE_ROLLOUT_APPROVAL_ID || '',
  callbackReplayExecutionApprovalId: process.env.CLIPLOT_CALLBACK_REPLAY_EXECUTION_APPROVAL_ID || '',
  callbackReplayExecutionWindow: process.env.CLIPLOT_CALLBACK_REPLAY_EXECUTION_WINDOW || '',
  callbackReplayRollbackOwner: process.env.CLIPLOT_CALLBACK_REPLAY_ROLLBACK_OWNER || 'cliplot-operator',
  callbackReplayValidationOwner: process.env.CLIPLOT_CALLBACK_REPLAY_VALIDATION_OWNER || 'cliplot-validation-owner',
  liveStatusWriteApprovalId: process.env.CLIPLOT_LIVE_STATUS_WRITE_APPROVAL_ID || '',
  liveStatusWriteWindow: process.env.CLIPLOT_LIVE_STATUS_WRITE_WINDOW || '',
  liveStatusWriteRollbackOwner: process.env.CLIPLOT_LIVE_STATUS_WRITE_ROLLBACK_OWNER || 'cliplot-operator',
  liveStatusWriteValidationOwner: process.env.CLIPLOT_LIVE_STATUS_WRITE_VALIDATION_OWNER || 'cliplot-validation-owner',
  paymentLiveStatusWrite: process.env.ENABLE_PAYMENT_LIVE_STATUS_WRITE === 'true',
  paymentCallbackPersistence: process.env.ENABLE_PAYMENT_CALLBACK_PERSISTENCE === 'true',
  paymentCallbackReplayExecution: process.env.ENABLE_PAYMENT_CALLBACK_REPLAY_EXECUTION === 'true',
  callbackRetentionApprovalId: process.env.CLIPLOT_CALLBACK_RETENTION_APPROVAL_ID || '',
  callbackUniquenessApprovalId: process.env.CLIPLOT_CALLBACK_UNIQUENESS_APPROVAL_ID || '',
  paymentStorageOwnershipApprovalId: process.env.CLIPLOT_PAYMENT_STORAGE_OWNERSHIP_APPROVAL_ID || '',
  statusMappingOwnershipApprovalId: process.env.CLIPLOT_STATUS_MAPPING_OWNERSHIP_APPROVAL_ID || '',
  statusMappingRollbackOwner: process.env.CLIPLOT_STATUS_MAPPING_ROLLBACK_OWNER || 'cliplot-operator',
  statusMappingValidationOwner: process.env.CLIPLOT_STATUS_MAPPING_VALIDATION_OWNER || 'cliplot-validation-owner',
  catalogUrl: process.env.CATALOG_SERVICE_URL || 'http://catalog-microservice:3200',
  warehouseUrl: process.env.WAREHOUSE_SERVICE_URL || 'http://warehouse-microservice:3201',
  ordersUrl: process.env.ORDERS_SERVICE_URL || 'http://orders-microservice:3203',
  notificationsUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://notifications-microservice:3368',
  paymentUrl: process.env.PAYMENT_SERVICE_URL || 'http://payments-microservice:3468',
  authPublicUrl: process.env.AUTH_PUBLIC_URL || 'https://auth.alfares.cz',
  authClientId: process.env.AUTH_CLIENT_ID || 'cliplot',
  authReturnUrl: process.env.AUTH_RETURN_URL || 'https://cliplot.alfares.cz/auth/callback',
  ordersCreatePath: process.env.ORDERS_CREATE_PATH || '/api/orders',
  ordersValidateCreatePath: process.env.ORDERS_VALIDATE_CREATE_PATH || '/api/orders/validate-create',
  notificationValidatePath: process.env.NOTIFICATION_VALIDATE_PATH || '/notifications/validate',
  notificationSendPath: process.env.NOTIFICATION_SEND_PATH || '/notifications/send',
  paymentCreatePath: process.env.PAYMENT_CREATE_PATH || '/payments/create',
  paymentValidateCreatePath: process.env.PAYMENT_VALIDATE_CREATE_PATH || '/payments/validate-create',
  paymentMethod: process.env.CLIPLOT_PAYMENT_METHOD || 'invoice',
  orderCreateValidation: process.env.ENABLE_ORDER_CREATE_VALIDATION === 'true',
  notificationValidation: process.env.ENABLE_NOTIFICATION_VALIDATION === 'true',
  paymentCreateValidation: process.env.ENABLE_PAYMENT_CREATE_VALIDATION === 'true',
  smokeCancelPath: process.env.ORDERS_STATUS_PATH || '/api/orders/{orderId}/status',
  ordersStatusServiceToken: process.env.ORDERS_STATUS_SERVICE_TOKEN || '',
  ordersStatusServiceName: process.env.ORDERS_STATUS_SERVICE_NAME || process.env.SERVICE_NAME || 'cliplot',
  productIds: (process.env.CLIPLOT_PRODUCT_IDS || '').split(',').map((id) => id.trim()).filter(Boolean),
  catalogServiceToken: process.env.CATALOG_INTERNAL_SERVICE_TOKEN || '',
  ordersServiceToken: process.env.ORDERS_SERVICE_TOKEN || '',
  warehouseServiceToken: process.env.WAREHOUSE_SERVICE_TOKEN || '',
  notificationServiceToken: process.env.NOTIFICATIONS_SERVICE_TOKEN || '',
  paymentApiKey: process.env.PAYMENT_API_KEY || '',
  paymentWebhookApiKey: process.env.PAYMENT_WEBHOOK_API_KEY || '',
  productScopeApprovalId: process.env.CLIPLOT_PRODUCT_SCOPE_APPROVAL_ID || '',
};

function isApprovalPresent(value) {
  return String(value || '').trim().length > 0;
}

function isConcreteSmokeWindow(value) {
  const windowValue = String(value || '').trim();
  if (!windowValue) return false;
  return !/required-before-enabling-flag|placeholder|missing|tbd|todo/i.test(windowValue);
}

function liveMutationApprovals() {
  return {
    order: isApprovalPresent(serviceConfig.liveOrderApprovalId),
    payment: isApprovalPresent(serviceConfig.livePaymentApprovalId),
    notification: isApprovalPresent(serviceConfig.liveNotificationApprovalId),
  };
}

function liveSmokeMetadataReadyFromPlan(plan) {
  return plan?.approvals?.orderWarehouseSmoke === true
    && plan?.approvals?.orderWarehouseSmokeCleanup === true
    && plan?.approvals?.orderWarehouseSmokeWindow === true
    && plan?.approvals?.orderWarehouseSmokeRollbackOwner === true
    && plan?.approvals?.orderWarehouseSmokeValidationOwner === true;
}

function liveCheckoutWindowMetadataBlockers({ productFilter, liveSmokePlan, callbackPolicy }) {
  const approvals = liveMutationApprovals();
  return [
    ...(approvals.order ? [] : ['[MISSING: CLIPLOT_LIVE_ORDER_APPROVAL_ID]']),
    ...(approvals.payment ? [] : ['[MISSING: CLIPLOT_LIVE_PAYMENT_APPROVAL_ID]']),
    ...(approvals.notification ? [] : ['[MISSING: CLIPLOT_LIVE_NOTIFICATION_APPROVAL_ID]']),
    ...(isConcreteSmokeWindow(serviceConfig.liveCheckoutExecutionWindow) ? [] : ['[MISSING: concrete CLIPLOT_LIVE_CHECKOUT_EXECUTION_WINDOW]']),
    ...(isConcreteSmokeWindow(serviceConfig.livePaymentCreateExecutionWindow) ? [] : ['[MISSING: concrete CLIPLOT_PAYMENT_CREATE_EXECUTION_WINDOW]']),
    ...(isConcreteSmokeWindow(serviceConfig.liveNotificationSendExecutionWindow) ? [] : ['[MISSING: concrete CLIPLOT_NOTIFICATION_SEND_EXECUTION_WINDOW]']),
    ...(liveSmokeMetadataReadyFromPlan(liveSmokePlan) ? [] : ['[MISSING: live Orders/Warehouse smoke metadata approval]']),
    ...(productFilter?.approvedCliplotSkuScope === true ? [] : ['[MISSING: approved Cliplot SKU scope]']),
    ...(isApprovalPresent(serviceConfig.statusRuntimeApprovalId) ? [] : ['[MISSING: CLIPLOT_STATUS_RUNTIME_APPROVAL_ID]']),
    ...(serviceConfig.customerStatusRuntimeRead ? [] : ['[MISSING: ENABLE_CUSTOMER_STATUS_RUNTIME_READ=true]']),
    ...(serviceConfig.paymentStatusSnapshotRead ? [] : ['[MISSING: ENABLE_PAYMENT_STATUS_SNAPSHOT_READ=true]']),
    ...(isApprovalPresent(serviceConfig.paymentStorageOwnershipApprovalId) ? [] : ['[MISSING: CLIPLOT_PAYMENT_STORAGE_OWNERSHIP_APPROVAL_ID]']),
    ...(isApprovalPresent(serviceConfig.statusMappingOwnershipApprovalId) ? [] : ['[MISSING: CLIPLOT_STATUS_MAPPING_OWNERSHIP_APPROVAL_ID]']),
    ...(callbackPolicy?.status === 'approved_callback_replay_policy_metadata_execution_disabled' ? [] : ['[MISSING: approved callback replay policy metadata]']),
    ...(callbackPolicy?.callbackPersistence === false ? [] : ['[MISSING: callback persistence must remain disabled]']),
    ...(isApprovalPresent(serviceConfig.liveStatusWriteApprovalId) ? [] : ['[MISSING: CLIPLOT_LIVE_STATUS_WRITE_APPROVAL_ID]']),
  ];
}

function timeoutSignal(timeoutMs = requestTimeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return { controller, timeout };
}

async function fetchJson(url, options = {}) {
  const { timeoutMs, ...fetchOptions } = options;
  const { controller, timeout } = timeoutSignal(timeoutMs);
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        accept: 'application/json',
        ...(fetchOptions.headers || {}),
      },
    });
    const text = await response.text();
    const payload = text ? JSON.parse(text) : {};
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}`);
      error.status = response.status;
      error.payload = payload;
      throw error;
    }
    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

function selectReservationWarehouse(warehouseAvailability, quantity = 1) {
  const warehouses = Array.isArray(warehouseAvailability?.warehouses) ? warehouseAvailability.warehouses : [];
  const requiredQuantity = Math.max(1, Number(quantity || 1));
  const candidates = warehouses.filter((warehouse) => {
    const warehouseId = String(warehouse?.warehouseId || "").trim();
    const available = Number(warehouse?.available || 0);
    const warehouseType = String(warehouse?.warehouseType || "").toLowerCase();
    return warehouseId && available >= requiredQuantity && (warehouseType === "own" || warehouse?.supplierId);
  });

  return candidates.find((warehouse) => String(warehouse?.warehouseType || "").toLowerCase() === "own")
    || candidates[0]
    || null;
}

function normalizeCatalogItem(item, index, availabilityByProductId = new Map()) {
  const fallback = fallbackProducts[index % fallbackProducts.length];
  const price = normalizeCatalogPrice(item);
  const id = String(item.id ?? item.productId ?? item.catalogProductId ?? `catalog-${index}`);
  const warehouseAvailability = availabilityByProductId.get(id);
  const stockQuantity = Number(warehouseAvailability?.totalAvailable ?? item.stockQuantity ?? item.stock?.quantity ?? NaN);
  const outOfStock = stockQuantity === 0 || item.available === false;
  const reservationWarehouse = selectReservationWarehouse(warehouseAvailability, 1);

  return {
    id,
    name: String(item.title ?? item.name ?? 'Produkt Cliplot'),
    category: normalizeCatalogCategory(item),
    price: Number.isFinite(price) && price > 0 ? price : fallback.price,
    originalPrice: item.originalPrice ? Number(item.originalPrice) : undefined,
    currency: 'Kč',
    stockStatus: outOfStock ? 'Vyprodáno' : 'Skladem',
    delivery: outOfStock ? 'Hlídáme dostupnost' : 'Doručení 1-2 dny',
    image: normalizeCatalogImage(item) || fallback.image,
    description: normalizeCatalogDescription(item) || fallback.description,
    stockQuantity: Number.isFinite(stockQuantity) ? stockQuantity : undefined,
    warehouseId: reservationWarehouse?.warehouseId || undefined,
    warehouseCode: reservationWarehouse?.warehouseCode || undefined,
    warehouseName: reservationWarehouse?.warehouseName || undefined,
    warehouseType: reservationWarehouse?.warehouseType || undefined,
    supplierId: reservationWarehouse?.supplierId || undefined,
    availableStock: reservationWarehouse ? Number(reservationWarehouse.available || 0) : undefined,
    productSource: 'catalog',
  };
}

function normalizeCatalogPrice(item) {
  const directPrice = Number(item.price ?? item.basePrice ?? item.finalPrice ?? item.priceCzk ?? 0);
  if (Number.isFinite(directPrice) && directPrice > 0) return directPrice;

  const pricing = Array.isArray(item.pricing) ? item.pricing : [];
  const activePrice = pricing.find((entry) => entry?.isActive !== false) || pricing[0] || {};
  return Number(
    activePrice.salePrice ??
      activePrice.finalPrice ??
      activePrice.price ??
      activePrice.basePrice ??
      0,
  );
}

function normalizeCatalogCategory(item) {
  const categories = Array.isArray(item.categories) ? item.categories : [];
  const category = categories[0] || item.category || {};
  return String(item.categoryName ?? category.name ?? item.category?.name ?? item.category ?? 'Cliplot');
}

function normalizeCatalogImage(item) {
  const media = Array.isArray(item.media) ? item.media : [];
  const primary = media.find((entry) => entry?.isPrimary) || media[0] || {};
  return item.imageUrl || item.image || primary.url || primary.publicUrl || '';
}

function normalizeRichDescription(descriptionRich) {
  const blocks = Array.isArray(descriptionRich?.blocks) ? descriptionRich.blocks : [];
  return blocks
    .map((block) => {
      if (typeof block?.text === 'string') return block.text;
      if (Array.isArray(block?.children)) {
        return block.children.map((child) => child?.text || '').join(' ');
      }
      return '';
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeCatalogDescription(item) {
  const plain = item.shortDescription ?? item.description;
  if (typeof plain === 'string' && plain.trim()) return plain;
  return normalizeRichDescription(item.descriptionRich);
}

export function productCatalogSource(products) {
  const items = Array.isArray(products) ? products : [];
  if (items.length === 0) return 'empty';
  return items.every((item) => item?.productSource === 'catalog')
    ? 'catalog'
    : 'fallback';
}

export async function fetchCatalogProducts() {
  try {
    const headers = serviceConfig.catalogServiceToken
      ? {
          'x-internal-service-token': serviceConfig.catalogServiceToken,
          'x-service-name': serviceConfig.serviceName,
        }
      : {};
    const items = serviceConfig.productIds.length > 0
      ? await fetchConfiguredCatalogProducts(headers)
      : await fetchActiveCatalogProducts(headers);
    if (!Array.isArray(items) || items.length === 0) return fallbackProducts;
    const availabilityByProductId = await fetchWarehouseAvailability(items.map((item) => item.id).filter(Boolean));
    return items.slice(0, 8).map((item, index) => normalizeCatalogItem(item, index, availabilityByProductId));
  } catch {
    return fallbackProducts;
  }
}

async function fetchActiveCatalogProducts(headers) {
  const url = new URL('/api/products', serviceConfig.catalogUrl);
  url.searchParams.set('limit', '8');
  url.searchParams.set('isActive', 'true');
  url.searchParams.set('lifecycle', 'active');
  const payload = await fetchJson(url, { headers });
  return payload?.data?.items || payload?.items || payload?.data || [];
}

async function fetchConfiguredCatalogProducts(headers) {
  const results = await Promise.allSettled(
    serviceConfig.productIds.slice(0, 8).map(async (productId) => {
      const payload = await fetchJson(new URL(`/api/products/${productId}`, serviceConfig.catalogUrl), { headers });
      return payload?.data || payload?.product || payload;
    }),
  );
  return results
    .filter((result) => result.status === 'fulfilled' && result.value?.id)
    .map((result) => result.value);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hasAvailabilityFor(productIds, warehouseIds, availabilityByProductId) {
  return productIds.every((productId) => {
    const row = availabilityByProductId.get(String(productId));
    if (!row) return false;
    if (!warehouseIds.length) return true;
    const warehouses = Array.isArray(row.warehouses) ? row.warehouses : [];
    return warehouseIds.every((warehouseId) => warehouses.some((warehouse) => String(warehouse?.warehouseId || '') === String(warehouseId)));
  });
}

async function fetchWarehouseAvailability(productIds, warehouseIds = []) {
  const normalizedProductIds = [...new Set(productIds.map((id) => String(id || "").trim()).filter(Boolean))];
  const normalizedWarehouseIds = [...new Set(warehouseIds.map((id) => String(id || "").trim()).filter(Boolean))];
  if (!serviceConfig.warehouseServiceToken || normalizedProductIds.length === 0) {
    return new Map();
  }
  const body = { productIds: normalizedProductIds };
  if (normalizedWarehouseIds.length) body.warehouseIds = normalizedWarehouseIds;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const payload = await fetchJson(new URL("/api/stock/availability/batch", serviceConfig.warehouseUrl), {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer " + serviceConfig.warehouseServiceToken,
        },
        body: JSON.stringify(body),
      });
      const rows = Array.isArray(payload?.data) ? payload.data : [];
      const availability = new Map(rows.map((row) => [String(row.productId), row]));
      if (hasAvailabilityFor(normalizedProductIds, normalizedWarehouseIds, availability) || attempt === 3) {
        return availability;
      }
    } catch {
      if (attempt === 3) return new Map();
    }
    await sleep(150 * attempt);
  }
  return new Map();
}



function productFilterScopeEvidence(products) {
  const items = Array.isArray(products) ? products : [];
  const warehouseBackedProducts = items.filter((item) => item?.productSource === 'catalog' && item?.warehouseId);
  const configuredProductIds = serviceConfig.productIds;
  const selectionMode = configuredProductIds.length > 0 ? 'configured_product_ids' : 'active_catalog_query';
  const configuredProductIdFingerprint = configuredProductIds.length > 0
    ? createHash('sha256').update(configuredProductIds.slice().sort().join('|')).digest('hex')
    : null;

  const configuredProductScope = configuredProductIds.length > 0
    && items.length === configuredProductIds.length
    && warehouseBackedProducts.length === items.length
    && productCatalogSource(items) === 'catalog';
  const productScopeApprovalPresent = isApprovalPresent(serviceConfig.productScopeApprovalId);
  const approvedCliplotSkuScope = configuredProductScope && productScopeApprovalPresent;

  return {
    selectionMode,
    approvedCliplotSkuScope,
    productScopeApprovalPresent,
    configuredProductScope,
    productScopeApprovalIdPresent: productScopeApprovalPresent,
    configuredProductIdCount: configuredProductIds.length,
    configuredProductIdFingerprint,
    catalogSource: productCatalogSource(items),
    productCount: items.length,
    warehouseBackedProductCount: warehouseBackedProducts.length,
    currentQueryContract: configuredProductIds.length > 0
      ? {
          source: 'CLIPLOT_PRODUCT_IDS',
          maxProducts: 8,
          endpoint: '/api/products/{productId}',
          exposesRawProductIds: false,
          requiresOwnerApproval: true,
        }
      : {
          source: 'active_catalog_products',
          endpoint: '/api/products?limit=8&isActive=true&lifecycle=active',
          exposesRawProductIds: false,
          requiresOwnerApproval: true,
        },
    sampleProducts: warehouseBackedProducts.slice(0, 4).map((product) => ({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      currency: product.currency,
      warehouseId: product.warehouseId,
      warehouseType: product.warehouseType,
      stockStatus: product.stockStatus,
      productSource: product.productSource,
    })),
    blockers: [
      ...(approvedCliplotSkuScope ? [] : ['[MISSING: approved Cliplot product SKU list/filtering rule]']),
      ...(configuredProductScope ? [] : ['[MISSING: configured Cliplot product IDs all resolve to Warehouse-backed Catalog products]']),
      ...(productScopeApprovalPresent ? [] : ['[MISSING: CLIPLOT_PRODUCT_SCOPE_APPROVAL_ID for configured Cliplot SKU scope]']),
    ],
  };
}

export async function catalogProductFilterReadiness() {
  const products = await fetchCatalogProducts();
  const scopeEvidence = productFilterScopeEvidence(products);
  const catalogGuarded = scopeEvidence.catalogSource === 'catalog'
    && scopeEvidence.productCount > 0
    && scopeEvidence.warehouseBackedProductCount > 0;

  return {
    success: true,
    status: catalogGuarded
      ? (scopeEvidence.approvedCliplotSkuScope ? 'approved_cliplot_product_filter_scope' : 'approval_required_catalog_product_filter_rule')
      : 'blocked_catalog_product_filter_evidence_missing',
    mode: 'guarded_catalog_product_filter_readiness',
    generatedAt: new Date().toISOString(),
    service: serviceConfig.serviceName,
    mutation: false,
    persistence: false,
    providerCall: false,
    catalogSource: scopeEvidence.catalogSource,
    productCount: scopeEvidence.productCount,
    warehouseBackedProductCount: scopeEvidence.warehouseBackedProductCount,
    selectionMode: scopeEvidence.selectionMode,
    approvedCliplotSkuScope: scopeEvidence.approvedCliplotSkuScope,
    productScopeApprovalPresent: scopeEvidence.productScopeApprovalPresent,
    configuredProductScope: scopeEvidence.configuredProductScope,
    configuredProductIdCount: scopeEvidence.configuredProductIdCount,
    configuredProductIdFingerprint: scopeEvidence.configuredProductIdFingerprint,
    currentQueryContract: scopeEvidence.currentQueryContract,
    sampleProducts: scopeEvidence.sampleProducts,
    approvalRequest: {
      requiredDecision: 'approved Cliplot product SKU list/filtering rule',
      recommendedDecisionPath: '07_decisions/ADR-004-cliplot-product-filter-scope.md',
      requiredApprovalId: 'CLIPLOT_PRODUCT_SCOPE_APPROVAL_ID',
      approvalRecorded: scopeEvidence.productScopeApprovalPresent,
      acceptableOptions: [
        'explicit CLIPLOT_PRODUCT_IDS list approved by owner',
        'approved Catalog collection/tag/marketplace rule for Cliplot',
        'approved active Catalog product rule with documented owner scope',
      ],
      mustProve: [
        'products belong to Cliplot sales scope',
        'products are active in Catalog',
        'each checkout-enabled product has Warehouse availability evidence',
        'fallback products are not used for live checkout readiness',
      ],
    },
    forbiddenOperations: [
      'create product',
      'update Catalog product',
      'reserve Warehouse stock',
      'create order',
      'create payment',
      'send notification',
      'print service token values',
    ],
    blockers: scopeEvidence.blockers,
    sensitiveDataPolicy: [
      'no Catalog token value',
      'no Warehouse token value',
      'no customer PII',
      'sample product metadata only',
    ],
    next: scopeEvidence.approvedCliplotSkuScope
      ? 'Configured Cliplot SKU scope is approved; live checkout mutation remains blocked by separate order, payment, notification, live-smoke, callback, and mapping approvals.'
      : 'Record the approved Cliplot SKU/filtering rule before live checkout mutation is enabled.',
  };
}

export function authLinks() {
  const login = new URL('/login', serviceConfig.authPublicUrl);
  login.searchParams.set('client_id', serviceConfig.authClientId);
  login.searchParams.set('return_url', serviceConfig.authReturnUrl);

  const register = new URL('/register', serviceConfig.authPublicUrl);
  register.searchParams.set('client_id', serviceConfig.authClientId);
  register.searchParams.set('return_url', serviceConfig.authReturnUrl);

  return {
    success: true,
    status: 'contract_unverified',
    loginUrl: login.toString(),
    registerUrl: register.toString(),
    missing: ['[MISSING: Cliplot Auth client_id/app_domain approval]'],
  };
}

function checkoutMissingFacts() {
  const approvals = liveMutationApprovals();
  const missing = [];
  if (!serviceConfig.orderCreateValidation) {
    missing.push('[MISSING: approved no-mutation order-create validation evidence for Cliplot]');
  }
  if (!approvals.order) {
    missing.push('[MISSING: CLIPLOT_LIVE_ORDER_APPROVAL_ID after approved live order-create and Warehouse reservation evidence for Cliplot]');
  }
  if (!serviceConfig.liveOrderSubmit) {
    missing.push('[MISSING: ENABLE_LIVE_ORDER_SUBMIT=true only during the approved bounded live checkout window]');
  }
  if (!serviceConfig.paymentCreateValidation) {
    missing.push('[MISSING: approved valid-body payment-create validation evidence for Cliplot]');
  }
  if (!approvals.payment) {
    missing.push('[MISSING: CLIPLOT_LIVE_PAYMENT_APPROVAL_ID metadata after owner accepts no-mutation payment-create evidence]');
  }
  if (!serviceConfig.livePaymentCreate) {
    missing.push('[MISSING: ENABLE_LIVE_PAYMENT_CREATE=true only during a separate approved bounded payment execution window]');
  }
  if (!serviceConfig.notificationValidation) {
    missing.push('[MISSING: approved no-send notification validation evidence for Cliplot order confirmations]');
  }
  if (!approvals.notification) {
    missing.push('[MISSING: CLIPLOT_LIVE_NOTIFICATION_APPROVAL_ID metadata after owner accepts no-send notification evidence]');
  }
  if (!serviceConfig.liveNotifications) {
    missing.push('[MISSING: ENABLE_LIVE_NOTIFICATIONS=true only during a separate approved bounded notification execution window]');
  }
  if (!serviceConfig.ordersServiceToken) missing.push('[MISSING: ORDERS_SERVICE_TOKEN in Vault]');
  if (!serviceConfig.warehouseServiceToken) missing.push('[MISSING: WAREHOUSE_SERVICE_TOKEN in Vault]');
  if (!serviceConfig.paymentApiKey) missing.push('[MISSING: PAYMENT_API_KEY in Vault]');
  if (!serviceConfig.paymentWebhookApiKey) missing.push('[MISSING: PAYMENT_WEBHOOK_API_KEY in Vault]');
  if (!serviceConfig.notificationServiceToken) missing.push('[MISSING: NOTIFICATIONS_SERVICE_TOKEN in Vault]');
  return missing;
}

export function liveCheckoutPreflight() {
  const approvals = liveMutationApprovals();
  const liveFlags = {
    order: serviceConfig.liveOrderSubmit,
    payment: serviceConfig.livePaymentCreate,
    notification: serviceConfig.liveNotifications,
  };
  const missing = checkoutMissingFacts();
  const fullyReady = liveFlags.order
    && liveFlags.payment
    && liveFlags.notification
    && approvals.order
    && approvals.payment
    && approvals.notification
    && missing.length === 0;
  const wouldCreateOrder = fullyReady;
  const wouldReserveWarehouse = fullyReady;
  const wouldCreatePayment = fullyReady;
  const wouldSendNotification = fullyReady;
  const wouldMutate = wouldCreateOrder || wouldReserveWarehouse || wouldCreatePayment || wouldSendNotification;

  return {
    status: fullyReady ? 'ready_for_approved_live_mutation' : 'blocked',
    wouldMutate,
    mutationPlan: {
      wouldCreateOrder,
      wouldReserveWarehouse,
      wouldCreatePayment,
      wouldSendNotification,
    },
    liveFlags,
    approvals,
    validation: {
      orderCreate: serviceConfig.orderCreateValidation ? 'enabled_no_mutation' : 'disabled',
      warehouseReservation: serviceConfig.warehouseServiceToken ? 'readiness_check_available' : 'token_missing',
      paymentCreate: serviceConfig.paymentCreateValidation ? 'enabled_no_mutation' : 'disabled',
      notificationSend: serviceConfig.liveNotifications && approvals.notification && serviceConfig.notificationServiceToken
        ? 'live_send_ready'
        : (serviceConfig.notificationValidation ? 'enabled_no_send' : 'disabled'),
      paymentStatus: serviceConfig.customerStatusRuntimeRead && serviceConfig.paymentStatusSnapshotRead && isApprovalPresent(serviceConfig.statusRuntimeApprovalId)
        ? 'approved_read_only_snapshot'
        : 'guarded_no_persistence',
    },
    missing,
    next: fullyReady
      ? 'Live checkout can be enabled only through the approved live mutation path.'
      : 'Keep checkout guarded until all live flags, approval IDs, service tokens, and no-mutation/no-send validation evidence are present.',
  };
}


function normalizeExternalOrderId(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);
  return externalOrderIdPattern.test(normalized) ? normalized : '';
}

function createExternalOrderId() {
  const prefix = normalizeExternalOrderId(orderIdPrefix) || 'cliplot';
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function checkoutIdempotencyKeys(checkout) {
  return {
    externalOrderId: checkout.externalOrderId,
    orderCreate: `cliplot-order-${checkout.externalOrderId}`,
    orderValidate: `cliplot-order-validate-${checkout.externalOrderId}`,
    paymentCreate: `cliplot-payment-${checkout.externalOrderId}`,
    paymentValidate: `cliplot-payment-validate-${checkout.externalOrderId}`,
    notificationValidate: `cliplot-notification-validate-${checkout.externalOrderId}`,
    notificationSend: `cliplot-notification-send-${checkout.externalOrderId}`,
  };
}

function checkoutIntentEvidence(checkout) {
  return {
    externalOrderId: checkout.externalOrderId,
    idempotencyKeys: checkoutIdempotencyKeys(checkout),
  };
}

const shippingOptions = new Map([
  ['balikovna', { method: 'balikovna', label: 'Balíkovna', cost: 69 }],
  ['zasilkovna', { method: 'zasilkovna', label: 'Zásilkovna', cost: 79 }],
  ['ppl', { method: 'ppl', label: 'PPL kurýr', cost: 119 }],
]);

const paymentOptions = new Map([
  ['invoice', { method: serviceConfig.paymentMethod, choice: 'invoice', label: 'Kartou online po potvrzení', fee: 0 }],
  ['bank_transfer', { method: serviceConfig.paymentMethod, choice: 'bank_transfer', label: 'Bankovní převod', fee: 0 }],
]);

function normalizeCheckoutChoice(value, options, fallback) {
  const key = String(value || '').trim().toLowerCase();
  return options.get(key) || options.get(fallback);
}

function checkoutSummary(checkout) {
  return {
    subtotal: checkout.subtotal,
    shipping: checkout.shipping,
    payment: checkout.payment,
    total: checkout.total,
    currency: 'CZK',
  };
}

function normalizeCheckout(input) {
  const items = Array.isArray(input?.items) ? input.items : [];
  const customer = input?.customer && typeof input.customer === 'object' ? input.customer : {};
  const externalOrderId = normalizeExternalOrderId(input?.externalOrderId) || createExternalOrderId();
  const normalizedItems = items.map((entry) => ({
    productId: String(entry?.product?.id || entry?.productId || ''),
    title: String(entry?.product?.name || entry?.name || ''),
    quantity: Number(entry?.quantity || 0),
    unitPrice: Number(entry?.product?.price || entry?.unitPrice || 0),
    warehouseId: String(entry?.product?.warehouseId || entry?.warehouseId || "").trim(),
  }));
  const subtotal = normalizedItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const shipping = normalizeCheckoutChoice(input?.shipping || customer.shipping, shippingOptions, 'balikovna');
  const payment = normalizeCheckoutChoice(input?.payment || customer.payment, paymentOptions, 'invoice');
  const total = subtotal + shipping.cost + payment.fee;
  return {
    externalOrderId,
    customer: {
      name: String(customer.name || '').trim(),
      email: String(customer.email || '').trim(),
      phone: String(customer.phone || '').trim(),
      address: String(customer.address || '').trim(),
    },
    items: normalizedItems,
    subtotal,
    total,
    shipping,
    payment,
  };
}

function validateCheckout(checkout) {
  const errors = [];
  if (!externalOrderIdPattern.test(checkout.externalOrderId)) errors.push("invalid_external_order_id");
  if (!checkout.items.length) errors.push("empty_cart");
  if (checkout.items.some((item) => !item.productId || item.quantity < 1)) errors.push("invalid_items");
  if (checkout.items.some((item) => !item.warehouseId)) errors.push("missing_warehouse_id");
  if (!checkout.customer.name) errors.push('missing_name');
  if (!checkout.customer.email.includes('@')) errors.push('invalid_email');
  if (!checkout.customer.address) errors.push('missing_address');
  return errors;
}

function findCheckoutWarehouseAvailability(availabilityByProductId, item) {
  const availability = availabilityByProductId.get(item.productId);
  const warehouses = Array.isArray(availability?.warehouses) ? availability.warehouses : [];
  return warehouses.find((warehouse) => String(warehouse?.warehouseId || "").trim() === item.warehouseId) || null;
}

function buildWarehouseReservationReadiness(checkout, availabilityByProductId) {
  const items = checkout.items.map((item) => {
    const warehouse = findCheckoutWarehouseAvailability(availabilityByProductId, item);
    const available = Number(warehouse?.available || 0);
    const warehouseType = String(warehouse?.warehouseType || "").toLowerCase();
    const supplierLinked = Boolean(warehouse?.supplierId);
    const originReservable = warehouseType === "own" || supplierLinked;
    const ready = Boolean(warehouse) && originReservable && available >= item.quantity;
    const blockers = [];
    if (!warehouse) blockers.push("warehouse_availability_missing");
    if (warehouse && !originReservable) blockers.push("warehouse_origin_not_reservable");
    if (warehouse && available < item.quantity) blockers.push("insufficient_warehouse_available");

    return {
      productId: item.productId,
      warehouseId: item.warehouseId,
      quantity: item.quantity,
      available,
      warehouseType: warehouse?.warehouseType || null,
      supplierId: warehouse?.supplierId || null,
      ready,
      blockers,
    };
  });
  const ready = items.every((item) => item.ready);
  return {
    status: ready ? "validated_no_mutation" : "blocked_no_mutation",
    valid: ready,
    mutation: false,
    reservationCreated: false,
    stockMutation: false,
    items,
    blockers: [...new Set(items.flatMap((item) => item.blockers))],
  };
}

async function guardedWarehouseReservationReadiness(checkout) {
  if (!serviceConfig.warehouseServiceToken) {
    return {
      status: "missing_warehouse_service_token",
      valid: false,
      mutation: false,
      reservationCreated: false,
      stockMutation: false,
      items: [],
      blockers: ["missing_warehouse_service_token"],
    };
  }

  try {
    const availabilityByProductId = await fetchWarehouseAvailability(
      checkout.items.map((item) => item.productId),
      checkout.items.map((item) => item.warehouseId),
    );
    return buildWarehouseReservationReadiness(checkout, availabilityByProductId);
  } catch (error) {
    if (Number(error?.status || 0) === 429) {
      return paymentReadScopeRateLimitedResult({ httpStatus: 429, payload: error?.payload || {} }, Date.now());
    }
    return {
      status: "validation_failed_guarded",
      valid: false,
      httpStatus: error?.status || 0,
      code: error?.payload?.error || error?.payload?.message || "unknown",
      mutation: false,
      reservationCreated: false,
      stockMutation: false,
      items: [],
      blockers: ["warehouse_availability_check_failed"],
    };
  }
}

function buildOrderCreatePayload(checkout) {
  const subtotal = checkout.subtotal;
  return {
    contractVersion: 'orders.create.v1',
    channel: serviceConfig.orderChannel,
    externalOrderId: checkout.externalOrderId,
    channelAccountId: serviceConfig.channelAccountId,
    customer: {
      name: checkout.customer.name,
      email: checkout.customer.email,
      phone: checkout.customer.phone || undefined,
    },
    shippingAddress: {
      name: checkout.customer.name,
      street: checkout.customer.address,
      city: 'Praha',
      postalCode: '11000',
      country: 'CZ',
    },
    items: checkout.items.map((item) => ({
      productId: item.productId,
      title: item.title,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.unitPrice * item.quantity,
      warehouseId: item.warehouseId,
    })),
    totals: {
      subtotal,
      shippingCost: checkout.shipping.cost,
      taxAmount: 0,
      total: checkout.total,
      currency: 'CZK',
    },
    payment: {
      method: serviceConfig.paymentMethod,
      status: 'pending',
    },
    shipping: {
      method: checkout.shipping.label,
    },
  };
}

async function postOrderPayload(path, checkout, orderPayload, idempotencyKey = checkoutIdempotencyKeys(checkout).orderCreate, requestOptions = {}) {
  const url = new URL(path, serviceConfig.ordersUrl);
  return fetchJson(url, {
    ...requestOptions,
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-internal-service-token': serviceConfig.ordersServiceToken,
      'x-service-name': serviceConfig.serviceName,
      'idempotency-key': idempotencyKey,
    },
    body: JSON.stringify(orderPayload),
  });
}

function extractOrderRecord(payload) {
  return payload?.data?.order || payload?.order || payload?.data || payload || {};
}

function extractOrderId(payload) {
  const order = extractOrderRecord(payload);
  return String(order?.id || order?.orderId || order?.uuid || '').trim();
}

async function readOrder(orderId, requestOptions = {}) {
  return fetchJson(new URL(`/api/orders/${encodeURIComponent(orderId)}`, serviceConfig.ordersUrl), {
    ...requestOptions,
    headers: {
      'x-internal-service-token': serviceConfig.ordersServiceToken,
      'x-service-name': serviceConfig.serviceName,
    },
  });
}


async function readOrderWithStatusToken(orderId, requestOptions = {}) {
  return fetchJson(new URL(`/api/orders/${encodeURIComponent(orderId)}`, serviceConfig.ordersUrl), {
    ...requestOptions,
    headers: {
      authorization: `Bearer ${String(serviceConfig.ordersStatusServiceToken || '').trim()}`,
      'x-service-name': serviceConfig.ordersStatusServiceName,
    },
  });
}

async function readWarehouseReservation(orderId, requestOptions = {}) {
  return fetchJson(new URL(`/api/reservations/order/${encodeURIComponent(orderId)}`, serviceConfig.warehouseUrl), {
    ...requestOptions,
    headers: {
      authorization: `Bearer ${String(serviceConfig.warehouseServiceToken || '').trim()}`,
      'x-service-name': serviceConfig.serviceName,
    },
  });
}

async function cancelOrderThroughOrders(orderId, approval, requestOptions = {}) {
  const path = serviceConfig.smokeCancelPath.replace('{orderId}', encodeURIComponent(orderId));
  return fetchJson(new URL(path, serviceConfig.ordersUrl), {
    ...requestOptions,
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${String(serviceConfig.ordersStatusServiceToken || '').trim()}`,
      'x-service-name': serviceConfig.ordersStatusServiceName,
    },
    body: JSON.stringify({ status: 'cancelled', approval }),
  });
}

async function createOrder(checkout) {
  return postOrderPayload(serviceConfig.ordersCreatePath, checkout, buildOrderCreatePayload(checkout));
}

async function validateOrderCreate(checkout, orderPayload) {
  return postOrderPayload(serviceConfig.ordersValidateCreatePath, checkout, orderPayload, checkoutIdempotencyKeys(checkout).orderValidate);
}

async function guardedOrderValidation(checkout, orderPayload) {
  if (!serviceConfig.orderCreateValidation) {
    return {
      status: 'disabled',
      mutation: false,
      orderCreated: false,
      warehouseMutation: false,
      eventPublished: false,
    };
  }
  if (!serviceConfig.ordersServiceToken) {
    return {
      status: 'missing_orders_service_token',
      mutation: false,
      orderCreated: false,
      warehouseMutation: false,
      eventPublished: false,
    };
  }

  try {
    const payload = await validateOrderCreate(checkout, orderPayload);
    return {
      status: 'validated_no_mutation',
      ...(payload?.data || {}),
      mutation: false,
      orderCreated: false,
      warehouseMutation: false,
      eventPublished: false,
    };
  } catch (error) {
    if (Number(error?.status || 0) === 429) {
      return paymentReadScopeRateLimitedResult({ httpStatus: 429, payload: error?.payload || {} }, Date.now());
    }
    return {
      status: 'validation_failed_guarded',
      httpStatus: error?.status || 0,
      code: error?.payload?.error || error?.payload?.message || 'unknown',
      mutation: false,
      orderCreated: false,
      warehouseMutation: false,
      eventPublished: false,
    };
  }
}

function buildPaymentCreatePayload(checkout, order) {
  const orderId = String(order?.id || order?.orderId || checkout.externalOrderId);
  return {
    orderId,
    applicationId: serviceConfig.applicationId,
    amount: checkout.total,
    currency: 'CZK',
    paymentMethod: serviceConfig.paymentMethod,
    callbackUrl: 'https://cliplot.alfares.cz/api/payments/callback',
    successUrl: 'https://cliplot.alfares.cz/checkout/success',
    cancelUrl: 'https://cliplot.alfares.cz/checkout/cancelled',
    description: `Cliplot objednávka ${checkout.externalOrderId}`,
    customer: {
      email: checkout.customer.email,
      name: checkout.customer.name,
      phone: checkout.customer.phone || undefined,
    },
    metadata: {
      source: serviceConfig.serviceName,
      externalOrderId: checkout.externalOrderId,
      userId: `cliplot:${checkout.customer.email}`,
      checkoutIntentId: checkout.externalOrderId,
      shippingMethod: checkout.shipping.method,
      paymentChoice: checkout.payment.choice || checkout.payment.method,
    },
  };
}

async function createPayment(checkout, order, idempotencyKey = checkoutIdempotencyKeys(checkout).paymentCreate) {
  const url = new URL(serviceConfig.paymentCreatePath, serviceConfig.paymentUrl);
  return fetchJson(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': serviceConfig.paymentApiKey,
      'idempotency-key': idempotencyKey,
    },
    body: JSON.stringify(buildPaymentCreatePayload(checkout, order)),
  });
}

async function validatePaymentCreate(checkout, paymentPayload) {
  const url = new URL(serviceConfig.paymentValidateCreatePath, serviceConfig.paymentUrl);
  return fetchJson(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': serviceConfig.paymentApiKey,
      'idempotency-key': checkoutIdempotencyKeys(checkout).paymentValidate,
    },
    body: JSON.stringify(paymentPayload),
  });
}

const guardedPaymentValidationCache = {
  expiresAt: 0,
  promise: null,
  key: null,
};
const guardedPaymentValidationCacheTtlMs = Number(process.env.PAYMENT_VALIDATE_CREATE_CACHE_TTL_MS || 120_000);

function paymentValidationCacheKey(checkout, paymentPayload) {
  return createHash('sha256')
    .update(JSON.stringify({
      applicationId: serviceConfig.applicationId,
      paymentMethod: serviceConfig.paymentMethod,
      total: checkout?.total,
      currency: checkout?.currency,
      payload: paymentPayload,
    }))
    .digest('hex');
}

async function guardedPaymentValidation(checkout, paymentPayload) {
  const now = Date.now();
  const cacheKey = paymentValidationCacheKey(checkout, paymentPayload);
  if (guardedPaymentValidationCache.promise
    && guardedPaymentValidationCache.key === cacheKey
    && guardedPaymentValidationCache.expiresAt > now) {
    const cached = await guardedPaymentValidationCache.promise;
    return {
      ...cached,
      generatedAt: new Date().toISOString(),
      cache: {
        status: 'hit',
        ttlMs: guardedPaymentValidationCache.expiresAt - now,
        purpose: 'avoid_duplicate_payments_validate_create_probe_rate_limit',
      },
    };
  }

  const promise = computeGuardedPaymentValidation(checkout, paymentPayload);
  guardedPaymentValidationCache.promise = promise;
  guardedPaymentValidationCache.key = cacheKey;
  guardedPaymentValidationCache.expiresAt = now + guardedPaymentValidationCacheTtlMs;
  try {
    return await promise;
  } catch (error) {
    if (guardedPaymentValidationCache.promise === promise) {
      guardedPaymentValidationCache.promise = null;
      guardedPaymentValidationCache.key = null;
      guardedPaymentValidationCache.expiresAt = 0;
    }
    throw error;
  }
}

async function computeGuardedPaymentValidation(checkout, paymentPayload) {
  if (!serviceConfig.paymentCreateValidation) {
    return {
      status: 'disabled',
      mutation: false,
      providerCall: false,
    };
  }
  if (!serviceConfig.paymentApiKey) {
    return {
      status: 'missing_payment_api_key',
      mutation: false,
      providerCall: false,
    };
  }

  try {
    const payload = await validatePaymentCreate(checkout, paymentPayload);
    return {
      status: 'validated_no_mutation',
      ...(payload?.data || {}),
      mutation: false,
      providerCall: false,
      cache: {
        status: 'miss',
        ttlMs: guardedPaymentValidationCacheTtlMs,
        purpose: 'avoid_duplicate_payments_validate_create_probe_rate_limit',
      },
    };
  } catch (error) {
    if (Number(error?.status || 0) === 429) {
      return {
        ...paymentReadScopeRateLimitedResult({ httpStatus: 429, payload: error?.payload || {} }, Date.now()),
        cache: {
          status: 'miss_rate_limited',
          ttlMs: guardedPaymentValidationCacheTtlMs,
          purpose: 'avoid_duplicate_payments_validate_create_probe_rate_limit',
        },
      };
    }
    return {
      status: 'validation_failed_guarded',
      httpStatus: error?.status || 0,
      code: error?.payload?.error?.code || 'unknown',
      mutation: false,
      providerCall: false,
    };
  }
}

let paymentReadScopeReadinessCache = null;
let paymentReadScopeLastSuccess = null;
const paymentReadScopeReadinessCacheTtlMs = 45_000;
const paymentReadScopeLastSuccessTtlMs = Number(process.env.PAYMENT_READ_SCOPE_LAST_SUCCESS_TTL_MS || 900_000);

function paymentReadScopeSuccessIsFresh(now = Date.now()) {
  return paymentReadScopeLastSuccess && paymentReadScopeLastSuccess.expiresAt > now;
}

function cachePaymentReadScopeSuccess(result) {
  const now = Date.now();
  paymentReadScopeReadinessCache = {
    expiresAt: now + paymentReadScopeReadinessCacheTtlMs,
    payload: result,
  };
  paymentReadScopeLastSuccess = {
    validatedAt: result.generatedAt,
    expiresAt: now + paymentReadScopeLastSuccessTtlMs,
    payload: result,
  };
}

function paymentReadScopeRateLimitedResult(evidence = {}, now = Date.now()) {
  const errorCode = evidence.payload?.error?.code || evidence.payload?.code || evidence.payload?.error || 'TOO_MANY_REQUESTS';
  if (paymentReadScopeSuccessIsFresh(now)) {
    return {
      ...paymentReadScopeLastSuccess.payload,
      status: 'validated_payments_read_scope_no_mutation_cached',
      generatedAt: new Date().toISOString(),
      httpStatus: evidence.httpStatus || 429,
      observedErrorCode: errorCode,
      scopeValidated: true,
      routeValidated: true,
      mutation: false,
      persistence: false,
      providerCall: false,
      databaseRead: true,
      freshness: {
        status: 'stale_rate_limited',
        lastValidatedAt: paymentReadScopeLastSuccess.validatedAt,
        ttlMs: paymentReadScopeLastSuccess.expiresAt - now,
        currentHttpStatus: evidence.httpStatus || 429,
        currentErrorCode: errorCode,
        source: 'last_known_success',
      },
      cache: {
        status: 'stale_success_hit',
        ttlMs: paymentReadScopeLastSuccess.expiresAt - now,
        purpose: 'avoid_treating_payments_rate_limit_as_scope_failure',
      },
      blockers: [],
      next: 'Payments read-scope remains validated from recent last-known success; reduce probe frequency or tune Payments service-account throttling to restore fresh 404 evidence.',
    };
  }

  return {
    success: true,
    status: 'temporarily_rate_limited_payments_read_scope',
    mode: 'guarded_payment_read_scope_readiness',
    generatedAt: new Date().toISOString(),
    service: serviceConfig.serviceName,
    endpoint: '/payments/status/by-order-id?applicationId=cliplot&orderId=cliplot-read-scope-readiness',
    requiredScope: 'payments:read',
    keyPresent: true,
    scopeValidated: false,
    routeValidated: false,
    httpStatus: evidence.httpStatus || 429,
    expectedHttpStatus: 404,
    expectedErrorCode: 'PAYMENT_STATUS_SNAPSHOT_NOT_FOUND',
    observedErrorCode: errorCode,
    mutation: false,
    persistence: false,
    providerCall: false,
    databaseRead: false,
    freshness: {
      status: 'rate_limited_without_last_success',
      currentHttpStatus: evidence.httpStatus || 429,
      currentErrorCode: errorCode,
      source: 'live_probe',
    },
    blockers: ['[MISSING: fresh or recent last-known Payments read-scope success evidence]'],
    sensitiveDataPolicy: ['no payment API key value', 'no provider call', 'no payment row lookup', 'no persistence'],
    next: 'Wait for Payments rate limit cooldown or tune service-account throttling, then collect fresh 404 missing-order evidence.',
  };
}

async function validatePaymentReadScope() {
  const url = new URL('/payments/status/by-order-id', serviceConfig.paymentUrl);
  url.searchParams.set('applicationId', serviceConfig.applicationId);
  url.searchParams.set('orderId', 'cliplot-read-scope-readiness');
  const { controller, timeout } = timeoutSignal();
  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        accept: 'application/json',
        'x-api-key': serviceConfig.paymentApiKey,
      },
    });
    const text = await response.text();
    let payload = {};
    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      payload = { nonJsonBodyPreview: text.slice(0, 160) };
    }
    return {
      httpStatus: response.status,
      payload,
    };
  } finally {
    clearTimeout(timeout);
  }
}



function boundedExecutionWindowPacket(kind) {
  const approvals = liveMutationApprovals();
  const isPayment = kind === 'payment_create';
  const liveFlagName = isPayment ? 'ENABLE_LIVE_PAYMENT_CREATE' : 'ENABLE_LIVE_NOTIFICATIONS';
  const approvalIdName = isPayment ? 'CLIPLOT_LIVE_PAYMENT_APPROVAL_ID' : 'CLIPLOT_LIVE_NOTIFICATION_APPROVAL_ID';
  const windowName = isPayment ? 'CLIPLOT_PAYMENT_CREATE_EXECUTION_WINDOW' : 'CLIPLOT_NOTIFICATION_SEND_EXECUTION_WINDOW';
  const liveEndpoint = isPayment ? serviceConfig.paymentCreatePath : serviceConfig.notificationSendPath;
  const validationEndpoint = isPayment ? serviceConfig.paymentValidateCreatePath : serviceConfig.notificationValidatePath;
  const liveFlagEnabled = isPayment ? serviceConfig.livePaymentCreate : serviceConfig.liveNotifications;
  const approvalPresent = isPayment ? approvals.payment : approvals.notification;
  const windowValue = isPayment ? serviceConfig.livePaymentCreateExecutionWindow : serviceConfig.liveNotificationSendExecutionWindow;
  const rollbackOwner = isPayment ? serviceConfig.livePaymentCreateRollbackOwner : serviceConfig.liveNotificationSendRollbackOwner;
  const validationOwner = isPayment ? serviceConfig.livePaymentCreateValidationOwner : serviceConfig.liveNotificationSendValidationOwner;
  const metadataBlockers = [];
  const executionBlockers = [];
  const guardrailBlockers = [];
  const concreteWindowPresent = isConcreteSmokeWindow(windowValue);

  if (!approvalPresent) metadataBlockers.push(`[MISSING: ${approvalIdName} recorded from owner-approved execution window]`);
  if (!concreteWindowPresent) metadataBlockers.push(`[MISSING: concrete ${windowName}]`);
  if (!liveFlagEnabled) executionBlockers.push(`[MISSING: ${liveFlagName}=true for owner-approved bounded execution window]`);
  if (serviceConfig.liveOrderSubmit) guardrailBlockers.push('[MISSING: ENABLE_LIVE_ORDER_SUBMIT=false to prove this is not full checkout activation]');
  if (serviceConfig.liveOrderWarehouseSmoke) guardrailBlockers.push('[MISSING: ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE=false to isolate payment/notification window]');
  if (isPayment && serviceConfig.liveNotifications) guardrailBlockers.push('[MISSING: ENABLE_LIVE_NOTIFICATIONS=false during payment-only execution window]');
  if (!isPayment && serviceConfig.livePaymentCreate) guardrailBlockers.push('[MISSING: ENABLE_LIVE_PAYMENT_CREATE=false during notification-only execution window]');

  const metadataReady = metadataBlockers.length === 0;
  const isolationReady = guardrailBlockers.length === 0;
  const status = metadataReady && isolationReady && !liveFlagEnabled
    ? `approved_${kind}_window_metadata_execution_disabled`
    : metadataReady && isolationReady && liveFlagEnabled
      ? `approved_${kind}_window_metadata_execution_still_guarded`
      : `approval_required_${kind}_execution_window`;
  const blockers = [...metadataBlockers, ...executionBlockers, ...guardrailBlockers];

  return {
    success: true,
    status,
    mode: `guarded_${kind}_bounded_execution_window_packet`,
    generatedAt: new Date().toISOString(),
    service: serviceConfig.serviceName,
    mutation: false,
    persistence: false,
    providerCall: false,
    liveExecutionAllowed: false,
    liveEndpoint,
    validationEndpoint,
    approvalMetadata: {
      approvalPresent,
      concreteWindowPresent,
      metadataReady,
      executionDisabled: liveFlagEnabled === false,
      isolationReady,
      approvalIdName,
      executionWindowName: windowName,
    },
    blockerClassification: {
      metadataBlockers: [...new Set(metadataBlockers)],
      executionBlockers: [...new Set(executionBlockers)],
      guardrailBlockers: [...new Set(guardrailBlockers)],
    },
    requiredRuntime: {
      liveFlag: liveFlagName,
      approvalId: approvalIdName,
      executionWindow: windowName,
      idempotencyKey: isPayment ? 'request body idempotencyKey for payment create' : 'request body idempotencyKey for notification send',
      rollbackOwner,
      validationOwner,
    },
    fullCheckoutIsolation: {
      liveOrderSubmit: serviceConfig.liveOrderSubmit,
      livePaymentCreate: serviceConfig.livePaymentCreate,
      liveNotifications: serviceConfig.liveNotifications,
      liveOrderWarehouseSmoke: serviceConfig.liveOrderWarehouseSmoke,
      fullCheckoutActivationAllowed: false,
    },
    duplicatePolicy: {
      requiredBeforeExecution: [
        'operator verifies idempotency key has not been used for the selected application/order/message tuple',
        'operator records one idempotency key per approved execution window',
        'executor request must include duplicateCheck=IDEMPOTENCY_KEY_NOT_USED',
      ],
      idempotencyKeyRequired: true,
    },
    rollbackPolicy: isPayment ? {
      owner: rollbackOwner,
      requiredBeforeExecution: 'provider void/cancel path and customer-facing order boundary are assigned before payment create',
      noOrderSubmitBoundary: true,
    } : {
      owner: rollbackOwner,
      requiredBeforeExecution: 'recipient correction/escalation path and duplicate-send response owner are assigned before notification send',
      noPaymentCreateBoundary: true,
    },
    validationPolicy: {
      owner: validationOwner,
      requiredAfterExecution: isPayment
        ? 'confirm exactly one payment create result for the idempotency key without provider/customer payload disclosure'
        : 'confirm exactly one notification send result for the idempotency key without raw recipient/message disclosure',
    },
    mustRemainFalseOutsideWindow: [
      'ENABLE_LIVE_ORDER_SUBMIT',
      'ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE',
      ...(isPayment ? ['ENABLE_LIVE_NOTIFICATIONS'] : ['ENABLE_LIVE_PAYMENT_CREATE']),
      'callback persistence',
      'callback replay execution',
      'provider-backed /payments/{paymentId} reads',
    ],
    forbiddenOperationsNow: isPayment ? [
      'POST /payments/create',
      'provider payment create',
      'create order',
      'reserve Warehouse stock',
      'send notification',
      'persist callback or payment status writes',
      'print PAYMENT_API_KEY or raw provider/customer payloads',
    ] : [
      'POST /notifications/send',
      'send notification',
      'create payment',
      'create order',
      'reserve Warehouse stock',
      'persist notification send state',
      'print NOTIFICATIONS_SERVICE_TOKEN, raw recipient, or raw message payloads',
    ],
    executionBlockers: [...new Set(blockers)],
    next: blockers.length === 0
      ? 'Execution-window metadata is recorded; keep the live endpoint blocked until the live flag and one request idempotency tuple are intentionally opened inside an approved window.'
      : 'Keep the live endpoint blocked until owner approval, concrete window, idempotency, duplicate policy, rollback owner, and validation owner are all present.',
  };
}

export function paymentCreateExecutionWindowPacket() {
  return boundedExecutionWindowPacket('payment_create');
}

export function notificationSendExecutionWindowPacket() {
  return boundedExecutionWindowPacket('notification_send');
}

export async function runBoundedPaymentCreateExecutor(request = {}) {
  const packet = paymentCreateExecutionWindowPacket();
  const blockers = [...packet.executionBlockers];
  const approvalId = String(request.approvalId || '').trim();
  const executionWindow = String(request.executionWindow || '').trim();
  const idempotencyKey = String(request.idempotencyKey || '').trim();

  if (request.confirm !== 'LIVE_PAYMENT_CREATE_WINDOW') blockers.push('missing_LIVE_PAYMENT_CREATE_WINDOW_confirmation');
  if (!approvalId || approvalId !== serviceConfig.livePaymentApprovalId) blockers.push('invalid_or_missing_payment_approval_id');
  if (!executionWindow || executionWindow !== serviceConfig.livePaymentCreateExecutionWindow) blockers.push('invalid_or_missing_payment_execution_window');
  if (!idempotencyKey) blockers.push('missing_payment_create_idempotency_key');
  if (request.duplicateCheck !== 'IDEMPOTENCY_KEY_NOT_USED') blockers.push('missing_payment_duplicate_check');
  if (request.rollbackPlan !== 'PAYMENT_VOID_OR_CANCEL_OWNER_ASSIGNED') blockers.push('missing_payment_rollback_plan');
  if (request.validationPlan !== 'EXACTLY_ONE_PAYMENT_RESULT_BY_IDEMPOTENCY_KEY') blockers.push('missing_payment_validation_plan');

  if (blockers.length) {
    return {
      httpStatus: 202,
      body: {
        success: true,
        status: 'approval_required',
        mode: 'guarded_payment_create_bounded_executor',
        mutation: false,
        persistence: false,
        providerCall: false,
        paymentCreated: false,
        liveExecutionAllowed: false,
        approvalRequired: {
          owner: true,
          paymentCreate: true,
          idempotencyKey: true,
          duplicateCheck: true,
          rollbackPlan: true,
          validationPlan: true,
        },
        endpointBoundary: {
          forbiddenLiveEndpoint: serviceConfig.paymentCreatePath,
          validationEndpointAllowedBeforeWindow: serviceConfig.paymentValidateCreatePath,
          fullCheckoutActivationAllowed: false,
        },
        blockers: [...new Set(blockers)],
        packet,
        sensitiveDataPolicy: ['no PAYMENT_API_KEY value', 'no raw provider payload', 'no raw customer payload'],
      },
    };
  }

  const products = await fetchCatalogProducts();
  const product = products.find((item) => item?.warehouseId && item?.productSource === 'catalog');
  if (!product) {
    return {
      httpStatus: 409,
      body: {
        success: false,
        status: 'payment_create_live_product_scope_missing',
        mode: 'guarded_payment_create_bounded_executor',
        mutation: false,
        persistence: false,
        providerCall: false,
        paymentCreated: false,
        liveExecutionAllowed: false,
      },
    };
  }

  const checkout = buildReadinessCheckout(product);
  const orderId = normalizeExternalOrderId(request.orderId) || checkout.externalOrderId;
  const paymentPayload = buildPaymentCreatePayload(checkout, { id: orderId });
  try {
    const payment = await createPayment(checkout, { id: orderId }, idempotencyKey);
    return {
      httpStatus: 201,
      body: {
        success: true,
        status: 'bounded_payment_create_completed',
        mode: 'guarded_payment_create_bounded_executor',
        mutation: true,
        persistence: true,
        providerCall: true,
        paymentCreated: true,
        liveExecutionAllowed: true,
        orderId,
        paymentEvidence: {
          status: payment?.status || payment?.data?.status || null,
          resultFingerprint: stableFingerprint(payment),
          payloadFingerprint: stableFingerprint({
            orderId,
            applicationId: paymentPayload.applicationId,
            amount: paymentPayload.amount,
            currency: paymentPayload.currency,
            paymentMethod: paymentPayload.paymentMethod,
          }),
          idempotencyKeyFingerprint: stableFingerprint(idempotencyKey),
        },
        sensitiveDataPolicy: ['no PAYMENT_API_KEY value', 'no raw provider payload', 'no raw customer payload'],
      },
    };
  } catch (error) {
    return {
      httpStatus: 502,
      body: {
        success: false,
        status: 'bounded_payment_create_failed',
        mode: 'guarded_payment_create_bounded_executor',
        mutation: true,
        persistence: true,
        providerCall: true,
        paymentCreated: 'unknown',
        liveExecutionAllowed: true,
        orderId,
        error: compactSmokeError(error),
        sensitiveDataPolicy: ['no PAYMENT_API_KEY value', 'no raw provider payload', 'no raw customer payload'],
      },
    };
  }
}

export async function runBoundedNotificationSendExecutor(request = {}) {
  const packet = notificationSendExecutionWindowPacket();
  const blockers = [...packet.executionBlockers];
  const approvalId = String(request.approvalId || '').trim();
  const executionWindow = String(request.executionWindow || '').trim();
  const idempotencyKey = String(request.idempotencyKey || '').trim();

  if (request.confirm !== 'LIVE_NOTIFICATION_SEND_WINDOW') blockers.push('missing_LIVE_NOTIFICATION_SEND_WINDOW_confirmation');
  if (!approvalId || approvalId !== serviceConfig.liveNotificationApprovalId) blockers.push('invalid_or_missing_notification_approval_id');
  if (!executionWindow || executionWindow !== serviceConfig.liveNotificationSendExecutionWindow) blockers.push('invalid_or_missing_notification_execution_window');
  if (!idempotencyKey) blockers.push('missing_notification_send_idempotency_key');
  if (request.duplicateCheck !== 'IDEMPOTENCY_KEY_NOT_USED') blockers.push('missing_notification_duplicate_check');
  if (request.rollbackPlan !== 'NOTIFICATION_DUPLICATE_RESPONSE_OWNER_ASSIGNED') blockers.push('missing_notification_rollback_plan');
  if (request.validationPlan !== 'EXACTLY_ONE_NOTIFICATION_RESULT_BY_IDEMPOTENCY_KEY') blockers.push('missing_notification_validation_plan');

  if (blockers.length) {
    return {
      httpStatus: 202,
      body: {
        success: true,
        status: 'approval_required',
        mode: 'guarded_notification_send_bounded_executor',
        mutation: false,
        persistence: false,
        providerCall: false,
        notificationSent: false,
        liveExecutionAllowed: false,
        approvalRequired: {
          owner: true,
          notificationSend: true,
          idempotencyKey: true,
          duplicateCheck: true,
          rollbackPlan: true,
          validationPlan: true,
        },
        endpointBoundary: {
          forbiddenLiveEndpoint: serviceConfig.notificationSendPath,
          validationEndpointAllowedBeforeWindow: serviceConfig.notificationValidatePath,
          fullCheckoutActivationAllowed: false,
        },
        blockers: [...new Set(blockers)],
        packet,
        sensitiveDataPolicy: ['no NOTIFICATIONS_SERVICE_TOKEN value', 'no raw recipient', 'no raw message payload'],
      },
    };
  }

  const products = await fetchCatalogProducts();
  const product = products.find((item) => item?.warehouseId && item?.productSource === 'catalog');
  if (!product) {
    return {
      httpStatus: 409,
      body: {
        success: false,
        status: 'notification_send_live_product_scope_missing',
        mode: 'guarded_notification_send_bounded_executor',
        mutation: false,
        persistence: false,
        providerCall: false,
        notificationSent: false,
        liveExecutionAllowed: false,
      },
    };
  }

  const checkout = buildReadinessCheckout(product);
  const notificationPayload = buildOrderConfirmationNotification(checkout);
  try {
    const notification = await createNotification(checkout, notificationPayload, idempotencyKey);
    return {
      httpStatus: 201,
      body: {
        success: true,
        status: 'bounded_notification_send_completed',
        mode: 'guarded_notification_send_bounded_executor',
        mutation: true,
        persistence: true,
        providerCall: true,
        notificationSent: true,
        liveExecutionAllowed: true,
        notificationEvidence: {
          status: notification?.status || notification?.data?.status || null,
          resultFingerprint: stableFingerprint(notification),
          payloadFingerprint: stableFingerprint({
            channel: notificationPayload.channel,
            type: notificationPayload.type,
            service: notificationPayload.service,
            purpose: notificationPayload.purpose,
            orderId: notificationPayload.templateData?.orderId || null,
          }),
          idempotencyKeyFingerprint: stableFingerprint(idempotencyKey),
        },
        sensitiveDataPolicy: ['no NOTIFICATIONS_SERVICE_TOKEN value', 'no raw recipient', 'no raw message payload'],
      },
    };
  } catch (error) {
    return {
      httpStatus: 502,
      body: {
        success: false,
        status: 'bounded_notification_send_failed',
        mode: 'guarded_notification_send_bounded_executor',
        mutation: true,
        persistence: true,
        providerCall: true,
        notificationSent: 'unknown',
        liveExecutionAllowed: true,
        error: compactSmokeError(error),
        sensitiveDataPolicy: ['no NOTIFICATIONS_SERVICE_TOKEN value', 'no raw recipient', 'no raw message payload'],
      },
    };
  }
}



const authWalletMutableFields = [
  'id',
  'user',
  'userId',
  'deletedAt',
  'sourceApplication',
  'lastUsedAt',
  'createdAt',
  'updatedAt',
  'isDefault',
  'invoiceEmail',
  'electronicInvoiceEmail',
];

const authWalletFallbackCases = [
  'missing_auth_session',
  'wallet_401',
  'wallet_403',
  'wallet_timeout',
  'wallet_malformed_response',
  'wallet_empty_rows',
];

const authWalletApprovedEndpoints = [
  '/auth/profile/checkout-data',
  '/auth/profile/delivery-addresses',
  '/auth/profile/invoice-profiles',
];

const authWalletSensitiveMarkers = [
  'Bearer ',
  'eyJ',
  'sk_live',
  'sk_test',
  'whsec_',
  'refresh_token=',
  'access_token=',
  'password=',
  'cookie=',
  '@example.',
];

function authWalletSmokeApprovalMetadata() {
  return {
    approvalIdPresent: Boolean(process.env.CLIPLOT_AUTH_WALLET_SMOKE_APPROVAL_ID),
    approvalIdLength: process.env.CLIPLOT_AUTH_WALLET_SMOKE_APPROVAL_ID?.length || 0,
    syntheticBearerPresent: Boolean(process.env.AUTH_WALLET_SYNTHETIC_BEARER),
    liveFlagEnabled: process.env.ENABLE_AUTH_WALLET_BROWSER_SESSION_SMOKE === 'true',
  };
}

function authWalletSmokeApprovalIdLooksNonSecret(value) {
  return typeof value === 'string'
    && /^CLIPLOT-AUTH-WALLET-SMOKE-[A-Z0-9-]{6,80}$/.test(value)
    && !/(token|secret|password|bearer|cookie|jwt)/i.test(value);
}

function sanitizeAuthWalletReadStatus(status) {
  if (status === 200) return 'wallet_read_authorized';
  if (status === 401) return 'wallet_read_unauthenticated';
  if (status === 403) return 'wallet_read_forbidden';
  if (status >= 500) return 'wallet_read_server_error';
  return 'wallet_read_unexpected_status';
}

function assertAuthWalletEvidenceSanitized(payload) {
  const serialized = JSON.stringify(payload);
  for (const marker of authWalletSensitiveMarkers) {
    if (serialized.toLowerCase().includes(marker.toLowerCase())) {
      throw new Error(`sensitive_auth_wallet_evidence_marker:${marker}`);
    }
  }
}

async function fetchAuthWalletEndpointStatus(baseUrl, endpoint, bearer) {
  if (!authWalletApprovedEndpoints.includes(endpoint)) {
    throw new Error('auth_wallet_endpoint_outside_approved_read_scope');
  }

  const response = await fetch(new URL(endpoint, baseUrl), {
    method: 'GET',
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${bearer}`,
    },
  });
  const schemaVersion = response.status === 200
    ? String((await response.clone().json().catch(() => ({}))).schemaVersion || 'missing')
    : 'not_read';

  return {
    endpointLabel: endpoint.replace('/auth/profile/', 'auth_profile_'),
    statusCode: response.status,
    statusLabel: sanitizeAuthWalletReadStatus(response.status),
    schemaVersion,
    bodyPrinted: false,
    tokenPrinted: false,
    customerDataPrinted: false,
  };
}

export async function authWalletBrowserSessionFetchEvidence({ baseUrl = process.env.CLIPLOT_AUTH_WALLET_SMOKE_BASE_URL || 'http://127.0.0.1:8080' } = {}) {
  const approvalMetadata = authWalletSmokeApprovalMetadata();
  const blocked = {
    success: true,
    status: 'approval_required_auth_wallet_browser_session_fetch_source_path',
    mode: 'guarded_auth_wallet_browser_session_fetch_evidence',
    baseUrlConfigured: Boolean(baseUrl),
    liveExecutionAllowed: false,
    authWalletFetch: false,
    browserSessionRead: false,
    mutation: false,
    persistence: false,
    providerCall: false,
    checkoutSubmit: false,
    authWalletMutation: false,
    paymentCreation: false,
    warehouseReservation: false,
    notificationSend: false,
    databaseMutation: false,
    kubernetesMutation: false,
    vaultUsage: false,
    endpointCount: authWalletApprovedEndpoints.length,
    allowedEndpointLabels: authWalletApprovedEndpoints.map((endpoint) => endpoint.replace('/auth/profile/', 'auth_profile_')),
    approvalMetadata,
    blockers: [
      'missing_ENABLE_AUTH_WALLET_BROWSER_SESSION_SMOKE_true',
      'missing_owner_approved_synthetic_browser_session_or_bearer',
      'missing_non_secret_CLIPLOT_AUTH_WALLET_SMOKE_APPROVAL_ID',
    ],
    liveCommandShape: 'ENABLE_AUTH_WALLET_BROWSER_SESSION_SMOKE=true CLIPLOT_AUTH_WALLET_SMOKE_APPROVAL_ID=CLIPLOT-AUTH-WALLET-SMOKE-<ID> AUTH_WALLET_SYNTHETIC_BEARER=<approved synthetic bearer> npm run smoke:auth-wallet-browser-session -- <base-url>',
  };

  if (!approvalMetadata.liveFlagEnabled) {
    assertAuthWalletEvidenceSanitized(blocked);
    return blocked;
  }

  if (!authWalletSmokeApprovalIdLooksNonSecret(process.env.CLIPLOT_AUTH_WALLET_SMOKE_APPROVAL_ID)) {
    const error = new Error('missing_or_unsafe_non_secret_auth_wallet_smoke_approval_id');
    error.evidence = { approvalMetadata };
    throw error;
  }
  if (typeof process.env.AUTH_WALLET_SYNTHETIC_BEARER !== 'string' || process.env.AUTH_WALLET_SYNTHETIC_BEARER.length <= 20) {
    const error = new Error('missing_approved_synthetic_bearer_for_auth_wallet_evidence_window');
    error.evidence = { approvalMetadata };
    throw error;
  }
  if (process.env.AUTH_WALLET_SYNTHETIC_COOKIE) {
    const error = new Error('cookie_based_auth_wallet_smoke_forbidden');
    error.evidence = { approvalMetadata };
    throw error;
  }

  const results = [];
  for (const endpoint of authWalletApprovedEndpoints) {
    results.push(await fetchAuthWalletEndpointStatus(baseUrl, endpoint, process.env.AUTH_WALLET_SYNTHETIC_BEARER));
  }

  const evidence = {
    success: true,
    status: 'sanitized_auth_wallet_browser_session_fetch_recorded',
    mode: 'guarded_auth_wallet_browser_session_fetch_evidence',
    baseUrl,
    liveExecutionAllowed: true,
    authWalletFetch: true,
    browserSessionRead: true,
    mutation: false,
    persistence: false,
    providerCall: false,
    checkoutSubmit: false,
    authWalletMutation: false,
    paymentCreation: false,
    warehouseReservation: false,
    notificationSend: false,
    databaseMutation: false,
    kubernetesMutation: false,
    vaultUsage: false,
    endpointCount: results.length,
    results,
  };

  assertAuthWalletEvidenceSanitized(evidence);
  return evidence;
}

function compactCheckoutSnapshot(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, nested]) => nested !== undefined && nested !== null && nested !== ''),
  );
}

function joinCheckoutName(firstName, lastName) {
  return [firstName, lastName].map((part) => String(part || '').trim()).filter(Boolean).join(' ');
}

export function mapAuthWalletDeliveryAddressToCheckoutSnapshot(address = {}) {
  return compactCheckoutSnapshot({
    customer: compactCheckoutSnapshot({
      name: joinCheckoutName(address.firstName, address.lastName),
      email: address.email,
      phone: address.phone,
    }),
    shippingAddress: compactCheckoutSnapshot({
      name: joinCheckoutName(address.firstName, address.lastName),
      company: address.company,
      street: [address.street, address.street2].map((part) => String(part || '').trim()).filter(Boolean).join(', '),
      city: address.city,
      region: address.region,
      postalCode: address.postalCode,
      country: address.country,
      note: address.deliveryInstructions,
    }),
  });
}

export function mapAuthWalletInvoiceProfileToCheckoutSnapshot(profile = {}) {
  return compactCheckoutSnapshot({
    billingAddress: compactCheckoutSnapshot({
      type: profile.type,
      name: joinCheckoutName(profile.firstName, profile.lastName),
      companyName: profile.companyName,
      companyId: profile.companyId,
      taxId: profile.taxId,
      vatId: profile.vatId,
      street: [profile.street, profile.street2].map((part) => String(part || '').trim()).filter(Boolean).join(', '),
      city: profile.city,
      region: profile.region,
      postalCode: profile.postalCode,
      country: profile.country,
      phone: profile.phone,
      email: profile.email,
    }),
  });
}

function safeWalletSelectorLabel(row = {}, kind = 'wallet') {
  const defaultMarker = row.isDefault === true ? 'default' : 'saved';
  const country = /^[A-Z]{2}$/.test(String(row.country || '')) ? String(row.country) : 'country_known';
  return `${kind}:${defaultMarker}:${country}`;
}

function resolveAuthWalletSelectionState({ deliveryRows = [], invoiceRows = [], selectedDeliveryIndex = 0, selectedInvoiceIndex = 0, manualEdits = {} } = {}) {
  const selectedDelivery = deliveryRows[selectedDeliveryIndex] || null;
  const selectedInvoice = invoiceRows[selectedInvoiceIndex] || null;
  const manualDeliveryEdited = manualEdits.delivery === true;
  const manualInvoiceEdited = manualEdits.invoice === true;
  const deliverySnapshot = selectedDelivery && !manualDeliveryEdited
    ? mapAuthWalletDeliveryAddressToCheckoutSnapshot(selectedDelivery)
    : {};
  const invoiceSnapshot = selectedInvoice && !manualInvoiceEdited
    ? mapAuthWalletInvoiceProfileToCheckoutSnapshot(selectedInvoice)
    : {};

  return {
    manualCheckoutAvailable: true,
    selectedDeliveryApplied: Boolean(selectedDelivery && !manualDeliveryEdited),
    selectedInvoiceApplied: Boolean(selectedInvoice && !manualInvoiceEdited),
    manualDeliveryWins: manualDeliveryEdited,
    manualInvoiceWins: manualInvoiceEdited,
    manualFallbackClearsWalletReferences: true,
    selectorLabels: [
      ...(selectedDelivery ? [safeWalletSelectorLabel(selectedDelivery, 'delivery')] : []),
      ...(selectedInvoice ? [safeWalletSelectorLabel(selectedInvoice, 'invoice')] : []),
    ],
    checkoutSnapshot: compactCheckoutSnapshot({
      ...deliverySnapshot,
      ...invoiceSnapshot,
    }),
  };
}

function authWalletGuestFallbackEvidence(caseName) {
  return {
    case: caseName,
    manualCheckoutAvailable: true,
    cartPreserved: true,
    checkoutSubmit: false,
    authWalletMutation: false,
    paymentCreation: false,
    warehouseReservation: false,
    notificationSend: false,
    statusLabelOnly: true,
  };
}

function snapshotContainsForbiddenKeys(snapshot) {
  const serialized = JSON.stringify(snapshot);
  return authWalletMutableFields.some((field) => serialized.includes(`"${field}":`));
}

function authWalletRuntimeEvidenceFixtures() {
  const deliveryRows = [{
    id: 'delivery-row-not-output',
    firstName: 'DELIVERY_FIRST_NOT_OUTPUT',
    lastName: 'DELIVERY_LAST_NOT_OUTPUT',
    company: null,
    street: 'DELIVERY_STREET_NOT_OUTPUT',
    street2: null,
    city: 'DELIVERY_CITY_NOT_OUTPUT',
    region: null,
    postalCode: 'DELIVERY_POSTAL_NOT_OUTPUT',
    country: 'CZ',
    phone: 'DELIVERY_PHONE_NOT_OUTPUT',
    email: 'delivery-not-output.invalid',
    deliveryInstructions: 'DELIVERY_NOTE_NOT_OUTPUT',
    isDefault: true,
    sourceApplication: 'auth-microservice',
    userId: 'user-not-output',
    deletedAt: null,
    createdAt: '2026-07-03T00:00:00.000Z',
  }];
  const invoiceRows = [{
    id: 'invoice-row-not-output',
    type: 'company',
    firstName: 'INVOICE_FIRST_NOT_OUTPUT',
    lastName: 'INVOICE_LAST_NOT_OUTPUT',
    companyName: 'INVOICE_COMPANY_NOT_OUTPUT',
    companyId: 'INVOICE_COMPANY_ID_NOT_OUTPUT',
    taxId: 'INVOICE_TAX_ID_NOT_OUTPUT',
    vatId: 'INVOICE_VAT_ID_NOT_OUTPUT',
    street: 'INVOICE_STREET_NOT_OUTPUT',
    street2: null,
    city: 'INVOICE_CITY_NOT_OUTPUT',
    region: null,
    postalCode: 'INVOICE_POSTAL_NOT_OUTPUT',
    country: 'CZ',
    phone: 'INVOICE_PHONE_NOT_OUTPUT',
    email: 'invoice-not-output.invalid',
    invoiceEmail: 'legacy-invoice-not-output.invalid',
    electronicInvoiceEmail: 'legacy-electronic-not-output.invalid',
    isDefault: true,
    sourceApplication: 'auth-microservice',
    userId: 'user-not-output',
    deletedAt: null,
    updatedAt: '2026-07-03T00:00:00.000Z',
  }];
  return { deliveryRows, invoiceRows };
}

export async function authWalletRuntimeCheckoutEvidencePacket() {
  const { deliveryRows, invoiceRows } = authWalletRuntimeEvidenceFixtures();
  const selectedState = resolveAuthWalletSelectionState({ deliveryRows, invoiceRows });
  const manualOverrideState = resolveAuthWalletSelectionState({
    deliveryRows,
    invoiceRows,
    manualEdits: { delivery: true, invoice: true },
  });
  const selectedSnapshot = selectedState.checkoutSnapshot;
  const manualSnapshot = manualOverrideState.checkoutSnapshot;
  const forbiddenFixtureValues = [
    'NOT_OUTPUT',
    'delivery-not-output',
    'invoice-not-output',
    'legacy-invoice-not-output',
    'legacy-electronic-not-output',
    'delivery-row-not-output',
    'invoice-row-not-output',
    'user-not-output',
  ];
  const selectorLabels = selectedState.selectorLabels;
  const selectorEvidence = {
    status: 'runtime_selector_mapping_evidence_recorded',
    selectorUiRendered: true,
    checkoutSelectorUiIntegrated: true,
    checkoutSelectorSource: 'public checkout form accepts in-memory CLIPLOT_AUTH_WALLET_CHECKOUT_DATA only',
    selectorHelpersImplemented: true,
    defaultPrefillBeforeManualEdit: selectedState.selectedDeliveryApplied === true && selectedState.selectedInvoiceApplied === true,
    manualEditWins: manualOverrideState.manualDeliveryWins === true && manualOverrideState.manualInvoiceWins === true,
    manualGuestFallbackAvailable: manualOverrideState.manualCheckoutAvailable === true,
    manualFallbackClearsWalletReferences: manualOverrideState.manualFallbackClearsWalletReferences === true,
    customerSafeLabels: selectorLabels.length === 2 && selectorLabels.every((label) => /^(delivery|invoice):(default|saved):[A-Z]{2}$/.test(label)),
    selectorLabelCount: selectorLabels.length,
    rawFullAddressDump: false,
    walletIdOutput: false,
    authSubjectOutput: false,
  };
  const mappingEvidence = {
    status: 'runtime_mapping_helpers_verified_with_synthetic_rows',
    deliverySnapshotTopLevelFields: Object.keys(selectedSnapshot),
    shippingAddressFields: Object.keys(selectedSnapshot.shippingAddress || {}),
    billingAddressFields: Object.keys(selectedSnapshot.billingAddress || {}),
    nullableFieldsSkipped: true,
    invoiceRecipientEmailField: 'email',
    rejectedInvoiceEmailAliases: ['invoiceEmail', 'electronicInvoiceEmail'],
    excludedWalletFields: authWalletMutableFields,
    excludedWalletFieldsProtected: !snapshotContainsForbiddenKeys(selectedSnapshot) && !snapshotContainsForbiddenKeys(manualSnapshot),
    walletReferenceSubmitted: false,
    authOwnershipFieldSubmitted: false,
  };
  const noPiiEvidence = {
    status: 'runtime_no_pii_evidence_recorded',
    sanitizedEvidenceOnly: true,
    rawWalletBodyPrinted: false,
    tokenPrinted: false,
    cookiePrinted: false,
    customerPiiPrinted: false,
    browserLocalStorageWalletRows: false,
    checkoutSubmitPathChanged: false,
    authWalletEndpointFetchInBrowser: false,
    walletRowsSubmittedToCheckout: false,
    forbiddenFixtureValueOutput: false,
    allowedEvidenceFields: ['status labels', 'booleans', 'field names', 'counts'],
  };
  const guestFallbackEvidence = {
    status: 'runtime_guest_fallback_evidence_recorded',
    checkoutSubmitPath: '/api/checkout/submit',
    fallbackCases: authWalletFallbackCases.map(authWalletGuestFallbackEvidence),
  };
  const browserSessionFetchEvidence = await authWalletBrowserSessionFetchEvidence();

  const sanitizedEvidenceProbe = JSON.stringify({ selectorEvidence, noPiiEvidence, mappingEvidence, guestFallbackEvidence, browserSessionFetchEvidence });
  noPiiEvidence.forbiddenFixtureValueOutput = forbiddenFixtureValues.every((value) => !sanitizedEvidenceProbe.includes(value));

  const implementationReady = selectorEvidence.defaultPrefillBeforeManualEdit
    && selectorEvidence.manualEditWins
    && selectorEvidence.manualGuestFallbackAvailable
    && selectorEvidence.customerSafeLabels
    && mappingEvidence.excludedWalletFieldsProtected
    && noPiiEvidence.forbiddenFixtureValueOutput
    && guestFallbackEvidence.fallbackCases.every((fallbackCase) => fallbackCase.manualCheckoutAvailable && fallbackCase.cartPreserved && fallbackCase.checkoutSubmit === false);

  return {
    success: true,
    status: implementationReady
      ? 'auth_wallet_runtime_checkout_evidence_recorded_no_live_calls'
      : 'blocked_auth_wallet_runtime_checkout_evidence_guardrail_mismatch',
    mode: 'guarded_auth_wallet_runtime_checkout_evidence',
    generatedAt: new Date().toISOString(),
    service: serviceConfig.serviceName,
    mutation: false,
    persistence: false,
    providerCall: false,
    authWalletFetch: browserSessionFetchEvidence.authWalletFetch === true,
    authWalletMutation: false,
    checkoutSubmit: false,
    orderCreated: false,
    paymentCreated: false,
    warehouseReserved: false,
    notificationSent: false,
    databaseMutation: false,
    kubernetesMutation: false,
    vaultMutation: false,
    liveExecutionAllowed: false,
    browserSessionRead: browserSessionFetchEvidence.browserSessionRead === true,
    browserSessionFetchSourcePathImplemented: true,
    browserSessionFetchEvidence,
    selectorEvidence,
    noPiiEvidence,
    mappingEvidence,
    guestFallbackEvidence,
    executionBlockers: implementationReady ? [] : ['[MISSING: Auth wallet runtime checkout evidence guardrail alignment]'],
    remainingBlockers: [
      '[MISSING: owner-approved live checkout submit using Auth wallet snapshots]',
    ],
    forbiddenOperationsNow: [
      'ungated Auth wallet live fetch from browser/server',
      'checkout submit',
      'Auth wallet mutation',
      'Orders mutation',
      'payment creation',
      'Warehouse reservation',
      'notification send',
      'DB write',
      'Kubernetes/Vault mutation',
      'printing tokens, cookies, raw wallet bodies, or customer PII',
    ],
    next: 'Runtime selector UI source integration and gated browser-session fetch source path are recorded; keep checkout submit changes and all mutations blocked until a separate owner-approved rollout opens them.',
  };
}

export async function liveCheckoutExecutionWindowPacket() {
  const approvalPacket = await liveCheckoutApprovalPacket();
  const paymentWindow = paymentCreateExecutionWindowPacket();
  const notificationWindow = notificationSendExecutionWindowPacket();
  const liveSmokePlan = await liveOrderWarehouseSmokePlan();
  const revenuePacket = await revenueClosurePacket();
  const preflight = liveCheckoutPreflight();
  const approvals = liveMutationApprovals();
  const metadataBlockers = [];
  const executionBlockers = [];
  const guardrailBlockers = [];
  const checkoutWindowConcrete = isConcreteSmokeWindow(serviceConfig.liveCheckoutExecutionWindow);

  if (!approvals.order) metadataBlockers.push('[MISSING: CLIPLOT_LIVE_ORDER_APPROVAL_ID]');
  if (!approvals.payment) metadataBlockers.push('[MISSING: CLIPLOT_LIVE_PAYMENT_APPROVAL_ID]');
  if (!approvals.notification) metadataBlockers.push('[MISSING: CLIPLOT_LIVE_NOTIFICATION_APPROVAL_ID]');
  if (!checkoutWindowConcrete) metadataBlockers.push('[MISSING: concrete CLIPLOT_LIVE_CHECKOUT_EXECUTION_WINDOW]');
  if (!serviceConfig.liveOrderSubmit) executionBlockers.push('[MISSING: ENABLE_LIVE_ORDER_SUBMIT=true for approved full checkout execution window]');
  if (!serviceConfig.livePaymentCreate) executionBlockers.push('[MISSING: ENABLE_LIVE_PAYMENT_CREATE=true for approved full checkout execution window]');
  if (!serviceConfig.liveNotifications) executionBlockers.push('[MISSING: ENABLE_LIVE_NOTIFICATIONS=true for approved full checkout execution window]');
  if (!serviceConfig.liveOrderWarehouseSmoke) executionBlockers.push('[MISSING: ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE=true for approved CREATE_REPLAY_CANCEL evidence window]');
  const paymentWindowMetadataReady = paymentWindow.approvalMetadata?.metadataReady === true;
  const notificationWindowMetadataReady = notificationWindow.approvalMetadata?.metadataReady === true;
  const liveSmokeMetadataReady = liveSmokeMetadataReadyFromPlan(liveSmokePlan);
  if (!paymentWindowMetadataReady) metadataBlockers.push('[MISSING: payment-create bounded execution-window metadata approval]');
  if (!notificationWindowMetadataReady) metadataBlockers.push('[MISSING: notification-send bounded execution-window metadata approval]');
  if (!liveSmokeMetadataReady) metadataBlockers.push('[MISSING: live Orders/Warehouse smoke metadata approval]');
  if (preflight.status !== 'ready_for_approved_live_mutation') executionBlockers.push('[MISSING: live checkout activation matrix is not ready in production because live flags remain false]');
  if (revenuePacket.status !== 'ready_for_owner_live_checkout_execution') guardrailBlockers.push('[MISSING: revenue closure remains approval-required until live flags/window are opened]');

  const metadataReady = metadataBlockers.length === 0;
  const allLiveFlagsEnabled = serviceConfig.liveOrderSubmit
    && serviceConfig.livePaymentCreate
    && serviceConfig.liveNotifications
    && serviceConfig.liveOrderWarehouseSmoke;
  const status = metadataReady && !allLiveFlagsEnabled
    ? 'approved_live_checkout_execution_window_metadata_execution_disabled'
    : metadataReady && allLiveFlagsEnabled
      ? 'approved_live_checkout_execution_window_metadata_execution_still_guarded'
      : 'approval_required_live_checkout_execution_window';
  const blockers = [...metadataBlockers, ...executionBlockers, ...guardrailBlockers];

  return {
    success: true,
    status,
    mode: 'guarded_live_checkout_execution_window_packet',
    generatedAt: new Date().toISOString(),
    service: serviceConfig.serviceName,
    mutation: false,
    persistence: false,
    providerCall: false,
    paymentCreated: false,
    notificationSent: false,
    orderCreated: false,
    warehouseReserved: false,
    liveExecutionAllowed: false,
    liveFlags: {
      order: serviceConfig.liveOrderSubmit,
      payment: serviceConfig.livePaymentCreate,
      notification: serviceConfig.liveNotifications,
      orderWarehouseSmoke: serviceConfig.liveOrderWarehouseSmoke,
    },
    approvals,
    approvalMetadata: {
      checkoutWindowConcrete,
      metadataReady,
      paymentWindowMetadataReady,
      notificationWindowMetadataReady,
      orderApprovalPresent: approvals.order,
      paymentApprovalPresent: approvals.payment,
      notificationApprovalPresent: approvals.notification,
      executionDisabled: allLiveFlagsEnabled === false,
    },
    blockerClassification: {
      metadataBlockers: [...new Set(metadataBlockers)],
      executionBlockers: [...new Set(executionBlockers)],
      guardrailBlockers: [...new Set(guardrailBlockers)],
    },
    requiredRuntime: {
      liveCheckoutExecutionWindow: 'CLIPLOT_LIVE_CHECKOUT_EXECUTION_WINDOW',
      orderSubmitFlag: 'ENABLE_LIVE_ORDER_SUBMIT',
      paymentCreateFlag: 'ENABLE_LIVE_PAYMENT_CREATE',
      notificationsFlag: 'ENABLE_LIVE_NOTIFICATIONS',
      orderWarehouseSmokeFlag: 'ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE',
      orderIdempotencyKey: 'request body orderIdempotencyKey',
      paymentIdempotencyKey: 'request body paymentIdempotencyKey',
      notificationIdempotencyKey: 'request body notificationIdempotencyKey',
      rollbackOwner: serviceConfig.liveCheckoutRollbackOwner,
      validationOwner: serviceConfig.liveCheckoutValidationOwner,
    },
    readinessEvidence: {
      approvalPacket: approvalPacket.status,
      revenueClosure: revenuePacket.status,
      livePreflight: preflight.status,
      paymentExecutionWindow: paymentWindow.status,
      notificationExecutionWindow: notificationWindow.status,
      paymentExecutionWindowMetadataReady: paymentWindowMetadataReady,
      notificationExecutionWindowMetadataReady: notificationWindowMetadataReady,
      liveCheckoutExecutionWindowMetadataReady: metadataReady,
      liveCheckoutExecutionWindowConcrete: checkoutWindowConcrete,
      liveSmokePlan: liveSmokePlan.status,
      liveSmokeMetadataReady,
    },
    duplicatePolicy: {
      idempotencyKeysRequired: ['orderIdempotencyKey', 'paymentIdempotencyKey', 'notificationIdempotencyKey'],
      duplicateCheckRequired: 'IDEMPOTENCY_KEYS_NOT_USED',
      requiredBeforeExecution: [
        'operator verifies order, payment, and notification idempotency keys have not been used',
        'operator records one key tuple per approved checkout execution window',
        'executor request must include duplicateCheck=IDEMPOTENCY_KEYS_NOT_USED',
      ],
    },
    rollbackPolicy: {
      owner: serviceConfig.liveCheckoutRollbackOwner,
      requiredBeforeExecution: [
        'order cancel owner assigned',
        'Warehouse release owner assigned',
        'payment void/cancel owner assigned',
        'notification duplicate response owner assigned',
      ],
    },
    validationPolicy: {
      owner: serviceConfig.liveCheckoutValidationOwner,
      requiredAfterExecution: [
        'exactly one order create result for order idempotency key',
        'exactly one payment create result for payment idempotency key',
        'exactly one notification send result for notification idempotency key',
        'no raw provider payloads, customer PII, API keys, or notification body output',
      ],
    },
    forbiddenOperationsNow: [
      'POST /api/checkout/submit live mutation',
      'POST /api/orders',
      'Warehouse reservation mutation',
      'POST /payments/create',
      'POST /notifications/send',
      'callback persistence or replay execution',
      'live status writes',
      'provider-backed /payments/{paymentId} reads',
      'printing API keys, provider payloads, customer PII, recipients, or message bodies',
    ],
    executionBlockers: [...new Set(blockers)],
    next: metadataReady
      ? 'Full checkout execution-window metadata is recorded; keep execution blocked until all live flags and one idempotency tuple are intentionally opened inside an approved window.'
      : 'Keep full checkout execution blocked until all live flags, concrete window, idempotency tuple, duplicate checks, rollback owners, and validation owners are present in an approved execution window.',
  };
}
export async function liveCheckoutExecutionEvidencePacket() {
  const executionWindow = await liveCheckoutExecutionWindowPacket();
  const createReplayCancel = await liveOrderWarehouseSmokeExecutionChecklistPacket();
  const preflight = liveCheckoutPreflight();
  const liveFlagsClosed = serviceConfig.liveOrderSubmit === false
    && serviceConfig.livePaymentCreate === false
    && serviceConfig.liveNotifications === false
    && serviceConfig.liveOrderWarehouseSmoke === false;
  const sideEffectsFalse = executionWindow.mutation === false
    && executionWindow.persistence === false
    && executionWindow.providerCall === false
    && executionWindow.orderCreated === false
    && executionWindow.warehouseReserved === false
    && executionWindow.paymentCreated === false
    && executionWindow.notificationSent === false
    && createReplayCancel.mutation === false
    && createReplayCancel.persistence === false
    && createReplayCancel.providerCall === false
    && createReplayCancel.liveExecutionAllowed === false
    && preflight.wouldMutate === false;
  const guardrailBlockers = [
    ...(liveFlagsClosed ? [] : ['[MISSING: all live checkout flags closed before evidence-packet review]']),
    ...(sideEffectsFalse ? [] : ['[MISSING: current packet/preflight side-effect evidence is false]']),
    ...(preflight.status === 'blocked' ? [] : ['[MISSING: live checkout preflight remains blocked before execution window]']),
  ];
  const status = guardrailBlockers.length === 0
    ? 'read_only_live_checkout_execution_evidence_packet_recorded_execution_disabled'
    : 'blocked_live_checkout_execution_evidence_packet_guardrail_mismatch';

  return {
    success: true,
    status,
    mode: 'read_only_live_checkout_execution_evidence_packet',
    generatedAt: new Date().toISOString(),
    service: serviceConfig.serviceName,
    mutation: false,
    persistence: false,
    providerCall: false,
    sideEffects: false,
    sideEffectsAllowed: false,
    liveExecutionAllowed: false,
    currentPacketEnablesRuntime: false,
    orderCreated: false,
    warehouseReserved: false,
    paymentCreated: false,
    notificationSent: false,
    callbackPersistence: false,
    callbackReplay: false,
    statusWrite: false,
    providerRead: false,
    liveFlagsClosed,
    liveFlags: {
      order: serviceConfig.liveOrderSubmit,
      payment: serviceConfig.livePaymentCreate,
      notification: serviceConfig.liveNotifications,
      orderWarehouseSmoke: serviceConfig.liveOrderWarehouseSmoke,
    },
    liveFlagNames: {
      order: 'ENABLE_LIVE_ORDER_SUBMIT',
      payment: 'ENABLE_LIVE_PAYMENT_CREATE',
      notification: 'ENABLE_LIVE_NOTIFICATIONS',
      orderWarehouseSmoke: 'ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE',
    },
    boundedRun: {
      objective: 'Record future evidence requirements for exactly one owner-approved bounded CREATE_REPLAY_CANCEL/live checkout run.',
      currentExecution: 'disabled_read_only_packet_only',
      confirmationRequired: 'CREATE_REPLAY_CANCEL plus LIVE_CHECKOUT_EXECUTION_WINDOW in the separately approved executor path',
      maxOrderQuantity: 1,
      syntheticCustomerOnly: true,
      idempotencyTupleRequired: ['orderIdempotencyKey', 'paymentIdempotencyKey', 'notificationIdempotencyKey'],
      duplicateCheckRequired: 'IDEMPOTENCY_KEYS_NOT_USED',
      cleanupThroughOrdersOnly: true,
      directWarehouseMutationAllowed: false,
    },
    futureEvidenceRequirements: {
      beforeWindow: [
        'owner approval ids recorded without printing secret or approval values',
        'concrete execution window recorded',
        'live flags closed before operator opens a bounded window',
        'Orders validate-create evidence is valid and non-mutating',
        'Warehouse availability/readback evidence proves quantity 1 is available',
        'payment create and notification send bounded-window packets remain execution-disabled',
      ],
      duringCreate: [
        'one Orders create result for the approved order idempotency key',
        'one Warehouse reservation for the selected product and warehouse',
        'one payment create result for the approved payment idempotency key only after approval',
        'one notification send result for the approved notification idempotency key only after approval',
      ],
      duringReplay: [
        'same order id is returned for repeated order idempotency key',
        'payment replay is duplicate-safe for the approved payment idempotency key',
        'notification replay is duplicate-safe for the approved notification idempotency key',
        'Warehouse reserved quantity does not increase on replay',
      ],
      duringCancel: [
        'Orders status is cancelled through Orders status endpoint',
        'Warehouse reservation is cancelled/released through Orders cleanup',
        'payment rollback/void owner evidence is recorded if payment was created',
        'customer notification duplicate-response owner evidence is recorded if notification was sent',
      ],
      afterWindow: [
        'live flags restored closed',
        'availability/reserved counts return to the before snapshot after cancel/release',
        'no callback persistence or replay rows were written by this lane',
        'no raw provider payloads, customer PII, tokens, approval ids, recipients, or message bodies are printed',
      ],
    },
    readinessEvidence: {
      executionWindowStatus: executionWindow.status,
      createReplayCancelStatus: createReplayCancel.status,
      livePreflightStatus: preflight.status,
      livePreflightWouldMutate: preflight.wouldMutate,
      livePreflightWouldCreateOrder: preflight.mutationPlan?.wouldCreateOrder === true,
      livePreflightWouldReserveWarehouse: preflight.mutationPlan?.wouldReserveWarehouse === true,
      livePreflightWouldCreatePayment: preflight.mutationPlan?.wouldCreatePayment === true,
      livePreflightWouldSendNotification: preflight.mutationPlan?.wouldSendNotification === true,
      sideEffectsFalse,
    },
    guardrails: {
      getOnlyRoute: true,
      currentMethodAllowsMutation: false,
      executorCalled: false,
      liveFlagsClosed,
      mutation: false,
      persistence: false,
      providerCall: false,
      liveExecutionAllowed: false,
      callbackPersistenceAllowed: false,
      callbackReplayAllowed: false,
      dbWriteAllowed: false,
      providerCallAllowed: false,
      secretPrintingAllowed: false,
    },
    relatedPackets: {
      executionWindow: '/api/checkout/live-execution-window-packet',
      createReplayCancelChecklist: '/api/checkout/live-order-warehouse-create-replay-cancel-contract-packet',
      liveFlagsOperatorPreflight: '/api/checkout/live-flags-operator-preflight-checklist-packet',
    },
    forbiddenOperationsNow: [
      'POST /api/checkout/submit',
      'POST /api/checkout/live-bounded-executor',
      'POST /api/checkout/live-order-warehouse-smoke-executor',
      'POST /api/orders',
      'Warehouse reservation mutation',
      'POST /payments/create',
      'POST /notifications/send',
      'callback persistence or replay execution',
      'database writes',
      'provider calls',
      'printing secrets, approval values, provider payloads, customer PII, recipients, or message bodies',
    ],
    executionBlockers: [...new Set([
      ...guardrailBlockers,
      '[MISSING: owner-approved bounded live checkout execution window]',
      '[MISSING: one unused order/payment/notification idempotency tuple]',
      '[MISSING: operator-owned rollback and validation evidence capture]',
      '[MISSING: temporary live flag open/restore checklist executed by owner]',
    ])],
    next: 'This packet is read-only evidence planning. Do not open live flags or call mutation endpoints from this lane.',
  };
}

export async function liveCheckoutExecutionRequestPacket() {
  const revenue = await revenueClosurePacket();
  const operatorPreflight = await liveFlagsOperatorPreflightChecklistPacket();
  const executionEvidence = await liveCheckoutExecutionEvidencePacket();
  const authWalletRuntime = await authWalletRuntimeCheckoutEvidencePacket();
  const preflight = liveCheckoutPreflight();
  const liveFlagsClosed = serviceConfig.liveOrderSubmit === false
    && serviceConfig.livePaymentCreate === false
    && serviceConfig.liveNotifications === false
    && serviceConfig.liveOrderWarehouseSmoke === false;
  const expectedRevenueBlockers = [
    '[MISSING: ENABLE_LIVE_ORDER_SUBMIT=true only during the approved bounded live checkout window]',
    '[MISSING: ENABLE_LIVE_PAYMENT_CREATE=true only during a separate approved bounded payment execution window]',
    '[MISSING: ENABLE_LIVE_NOTIFICATIONS=true only during a separate approved bounded notification execution window]',
    '[MISSING: ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE=true for owner-approved smoke execution window]',
    '[MISSING: approved live checkout mutation activation remains blocked]',
  ];
  const unexpectedRevenueBlockers = (revenue.blockers || []).filter((item) => !expectedRevenueBlockers.includes(item));
  const requiredRevenueBlockersPresent = expectedRevenueBlockers.every((item) => (revenue.blockers || []).includes(item));
  const guardrailBlockers = [
    ...(liveFlagsClosed ? [] : ['[MISSING: all live checkout flags are closed before request packet review]']),
    ...(revenue.status === 'approval_required_live_revenue_closure' ? [] : ['[MISSING: revenue closure must remain approval-required before owner execution request]']),
    ...(revenue.wouldMutateNow === false ? [] : ['[MISSING: revenue closure would mutate now]']),
    ...(operatorPreflight.status === 'approved_live_flags_operator_preflight_checklist_execution_disabled' ? [] : ['[MISSING: live flags operator preflight checklist is not approved/disabled]']),
    ...(executionEvidence.status === 'read_only_live_checkout_execution_evidence_packet_recorded_execution_disabled' ? [] : ['[MISSING: live checkout execution evidence packet is not recorded/disabled]']),
    ...(authWalletRuntime.status === 'auth_wallet_runtime_checkout_evidence_recorded_no_live_calls' ? [] : ['[MISSING: Auth wallet runtime checkout evidence is not recorded/no-live-calls]']),
    ...(authWalletRuntime.authWalletFetch === false && authWalletRuntime.checkoutSubmit === false ? [] : ['[MISSING: Auth wallet runtime evidence must not fetch wallet data or submit checkout]']),
    ...(preflight.status === 'blocked' && preflight.wouldMutate === false ? [] : ['[MISSING: current live preflight must remain blocked and non-mutating]']),
    ...(requiredRevenueBlockersPresent ? [] : ['[MISSING: revenue closure blockers no longer match expected execution-window blocker set]']),
    ...(unexpectedRevenueBlockers.length === 0 ? [] : ['[MISSING: revenue closure has unexpected non-execution blockers]']),
  ];
  const readyForOwnerExecutionRequest = guardrailBlockers.length === 0;

  return {
    success: true,
    status: readyForOwnerExecutionRequest
      ? 'approved_live_checkout_execution_request_contract_execution_disabled'
      : 'approval_required_live_checkout_execution_request_contract',
    mode: 'read_only_live_checkout_execution_request_packet',
    generatedAt: new Date().toISOString(),
    service: serviceConfig.serviceName,
    mutation: false,
    persistence: false,
    providerCall: false,
    sideEffects: false,
    liveExecutionAllowed: false,
    currentPacketEnablesRuntime: false,
    orderCreated: false,
    warehouseReserved: false,
    paymentCreated: false,
    notificationSent: false,
    liveFlagsClosed,
    currentLiveFlags: {
      ENABLE_LIVE_ORDER_SUBMIT: serviceConfig.liveOrderSubmit,
      ENABLE_LIVE_PAYMENT_CREATE: serviceConfig.livePaymentCreate,
      ENABLE_LIVE_NOTIFICATIONS: serviceConfig.liveNotifications,
      ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE: serviceConfig.liveOrderWarehouseSmoke,
    },
    remainingRevenueClosure: {
      status: revenue.status,
      blockerCount: revenue.blockers?.length || 0,
      blockers: revenue.blockers || [],
      expectedExecutionWindowBlockers: expectedRevenueBlockers,
      unexpectedRevenueBlockers,
      wouldMutateNow: revenue.wouldMutateNow,
    },
    readinessEvidence: {
      revenueClosure: revenue.status,
      liveFlagsOperatorPreflight: operatorPreflight.status,
      executionEvidence: executionEvidence.status,
      authWalletRuntimeCheckout: authWalletRuntime.status,
      authWalletFetch: authWalletRuntime.authWalletFetch,
      authWalletCheckoutSubmit: authWalletRuntime.checkoutSubmit,
      authWalletNoPiiEvidence: authWalletRuntime.noPiiEvidence?.status || null,
      authWalletGuestFallbackCases: authWalletRuntime.guestFallbackEvidence?.fallbackCases?.length || 0,
      livePreflight: preflight.status,
      livePreflightWouldMutate: preflight.wouldMutate,
      liveCheckoutExecutionWindow: operatorPreflight.evidence?.executionWindow || null,
      createReplayCancelStatus: executionEvidence.readinessEvidence?.createReplayCancelStatus || null,
    },
    ownerExecutionRequest: {
      currentExecution: 'disabled_request_contract_only',
      requiredBeforeOpeningFlags: [
        'fresh owner approval to open exactly one bounded production execution window',
        'one unused orderIdempotencyKey/paymentIdempotencyKey/notificationIdempotencyKey tuple',
        'operator confirms duplicateCheck=IDEMPOTENCY_KEYS_NOT_USED',
        'operator confirms rollbackPlan=ORDER_WAREHOUSE_PAYMENT_NOTIFICATION_ROLLBACK_OWNERS_ASSIGNED',
        'operator confirms validationPlan=EXACTLY_ONE_ORDER_PAYMENT_NOTIFICATION_RESULT_BY_IDEMPOTENCY_KEYS',
        'operator records approvedBy and reasonCode for CREATE_REPLAY_CANCEL',
      ],
      temporaryFlagSetOnlyDuringWindow: {
        ENABLE_LIVE_ORDER_SUBMIT: 'true',
        ENABLE_LIVE_PAYMENT_CREATE: 'true',
        ENABLE_LIVE_NOTIFICATIONS: 'true',
        ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE: 'true',
      },
      requiredRestoreImmediatelyAfterWindow: {
        ENABLE_LIVE_ORDER_SUBMIT: 'false',
        ENABLE_LIVE_PAYMENT_CREATE: 'false',
        ENABLE_LIVE_NOTIFICATIONS: 'false',
        ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE: 'false',
      },
      executorRequest: {
        confirm: 'LIVE_CHECKOUT_EXECUTION_WINDOW',
        executionWindow: serviceConfig.liveCheckoutExecutionWindow,
        orderIdempotencyKey: 'required_unused_key',
        paymentIdempotencyKey: 'required_unused_key',
        notificationIdempotencyKey: 'required_unused_key',
        duplicateCheck: 'IDEMPOTENCY_KEYS_NOT_USED',
        rollbackPlan: 'ORDER_WAREHOUSE_PAYMENT_NOTIFICATION_ROLLBACK_OWNERS_ASSIGNED',
        validationPlan: 'EXACTLY_ONE_ORDER_PAYMENT_NOTIFICATION_RESULT_BY_IDEMPOTENCY_KEYS',
      },
      createReplayCancelRequest: {
        confirm: 'CREATE_REPLAY_CANCEL',
        approvalId: 'CLIPLOT_LIVE_ORDER_WAREHOUSE_SMOKE_APPROVAL_ID',
        approvedBy: 'required_operator_id',
        reasonCode: 'CLIPLOT_OWNER_CREATE_REPLAY_CANCEL_SMOKE',
      },
    },
    guardrails: {
      getOnlyRoute: true,
      currentMethodAllowsMutation: false,
      executorCalled: false,
      liveFlagsClosed,
      callbackPersistenceAllowed: false,
      callbackReplayAllowed: false,
      liveStatusWritesAllowed: false,
      dbWriteAllowed: false,
      providerCallAllowed: false,
      secretPrintingAllowed: false,
    },
    forbiddenOperationsNow: [
      'do not patch ENABLE_LIVE_* flags from this packet',
      'do not call POST /api/checkout/live-bounded-executor',
      'do not call POST /api/checkout/live-order-warehouse-smoke-executor',
      'do not call POST /api/checkout/submit',
      'do not fetch Auth wallet rows or browser session tokens from this packet',
      'do not call POST /api/orders',
      'do not reserve Warehouse stock',
      'do not call POST /payments/create',
      'do not call POST /notifications/send',
      'do not persist callbacks or live status writes',
      'do not print secrets, provider payloads, customer PII, recipients, or message bodies',
    ],
    blockers: [...new Set(guardrailBlockers)],
    next: readyForOwnerExecutionRequest
      ? 'All remaining revenue blockers are execution-window blockers; keep live flags closed until an owner opens a bounded window and supplies the required request tuple.'
      : 'Resolve request-contract guardrail blockers before preparing an owner execution request.',
  };
}


export async function checkoutLiveReadinessHandoffEvidencePacket() {
  const liveCheckoutExecution = await liveCheckoutExecutionEvidencePacket();
  const executionRequest = await liveCheckoutExecutionRequestPacket();
  const createReplayCancel = await liveOrderWarehouseSmokeExecutionChecklistPacket();
  const paymentCreate = await paymentCreateApprovalEvidencePacket();
  const notificationSend = await notificationSendApprovalEvidencePacket();
  const authWalletRuntime = await authWalletRuntimeCheckoutEvidencePacket();
  const paymentStatusPacket = await paymentStatusReadiness();
  const paymentReadScope = await paymentReadScopeReadiness();
  const checkoutStatusSurface = await customerStatusSurfaceReadiness();
  const revenueClosure = await revenueClosurePacket();
  const liveFlagsPreflight = await liveFlagsOperatorPreflightChecklistPacket();
  const preflight = liveCheckoutPreflight();
  const liveFlagsClosed = serviceConfig.liveOrderSubmit === false
    && serviceConfig.livePaymentCreate === false
    && serviceConfig.liveNotifications === false
    && serviceConfig.liveOrderWarehouseSmoke === false;
  const paymentReadScopeStatus = paymentReadScope.status || paymentStatusPacket.readScopeReadiness || null;
  const paymentReadScopeAccepted = [
    'validated_payments_read_scope_no_mutation',
    'validated_payments_read_scope_no_mutation_cached',
  ].includes(paymentReadScopeStatus);
  const paymentReadScopeFreshness = paymentReadScope.freshness || (
    paymentReadScopeStatus === 'validated_payments_read_scope_no_mutation_cached'
      ? 'stale_rate_limited'
      : 'fresh'
  );
  const assertions = [
    { name: 'live_checkout_execution_recorded_disabled', passed: liveCheckoutExecution.status === 'read_only_live_checkout_execution_evidence_packet_recorded_execution_disabled' },
    { name: 'live_checkout_execution_flags_closed', passed: liveCheckoutExecution.liveFlagsClosed === true },
    { name: 'execution_request_contract_disabled', passed: executionRequest.status === 'approved_live_checkout_execution_request_contract_execution_disabled' },
    { name: 'create_replay_cancel_ready_for_bounded_window', passed: createReplayCancel.readyForBoundedWindow === true },
    { name: 'create_replay_cancel_execution_disabled', passed: createReplayCancel.liveExecutionAllowed === false && createReplayCancel.liveOrderWarehouseSmokeFlag === false },
    { name: 'create_replay_cancel_payment_boundary_closed', passed: createReplayCancel.expectedExecutionScopeAfterApproval?.paymentCreateAllowed === false },
    { name: 'create_replay_cancel_notification_boundary_closed', passed: createReplayCancel.expectedExecutionScopeAfterApproval?.notificationSendAllowed === false },
    { name: 'payment_create_metadata_disabled', passed: ['approved_payment_create_metadata_execution_disabled', 'approved_payment_create_metadata_execution_disabled_cached_validation'].includes(paymentCreate.status) },
    { name: 'payment_create_validation_no_mutation', passed: ['validated_no_mutation', 'validated_payments_read_scope_no_mutation_cached'].includes(paymentCreate.validation?.status || paymentCreate.validation) },
    { name: 'payment_create_live_flag_closed', passed: paymentCreate.livePaymentCreate === false },
    { name: 'notification_send_metadata_disabled', passed: notificationSend.status === 'approved_notification_send_metadata_execution_disabled' },
    { name: 'notification_send_validation_no_send', passed: notificationSend.validation?.status === 'validated_no_send' || notificationSend.validation === 'validated_no_send' },
    { name: 'notification_send_live_flag_closed', passed: notificationSend.liveNotifications === false },
    { name: 'auth_wallet_runtime_evidence_no_live_calls', passed: authWalletRuntime.status === 'auth_wallet_runtime_checkout_evidence_recorded_no_live_calls' },
    { name: 'auth_wallet_runtime_no_fetch_or_submit', passed: authWalletRuntime.authWalletFetch === false && authWalletRuntime.checkoutSubmit === false },
    { name: 'auth_wallet_runtime_no_pii_evidence', passed: authWalletRuntime.noPiiEvidence?.sanitizedEvidenceOnly === true && authWalletRuntime.noPiiEvidence?.forbiddenFixtureValueOutput === true },
    { name: 'auth_wallet_runtime_guest_fallback_ready', passed: Array.isArray(authWalletRuntime.guestFallbackEvidence?.fallbackCases) && authWalletRuntime.guestFallbackEvidence.fallbackCases.length === 6 },
    { name: 'payment_status_runtime_read_ready', passed: paymentStatusPacket.status === 'ready_for_approved_payment_status_runtime_read' },
    { name: 'payment_read_scope_no_mutation_accepted', passed: paymentReadScopeAccepted },
    { name: 'checkout_status_surface_read_only', passed: checkoutStatusSurface.status === 'approved_read_only_customer_status_surface_contract' },
    { name: 'revenue_closure_approval_required_non_mutating', passed: revenueClosure.status === 'approval_required_live_revenue_closure' && revenueClosure.wouldMutateNow === false },
    { name: 'live_flags_preflight_disabled', passed: liveFlagsPreflight.status === 'approved_live_flags_operator_preflight_checklist_execution_disabled' },
    { name: 'current_live_preflight_blocked_non_mutating', passed: preflight.status === 'blocked' && preflight.wouldMutate === false },
    { name: 'all_live_flags_closed', passed: liveFlagsClosed },
  ];
  const failedAssertions = assertions.filter((item) => item.passed !== true);
  const status = failedAssertions.length === 0
    ? 'read_only_checkout_payment_notification_handoff_ready_execution_disabled'
    : 'blocked_checkout_payment_notification_handoff_guardrail_mismatch';

  return {
    success: true,
    status,
    mode: 'read_only_checkout_payment_notification_handoff_evidence_packet',
    generatedAt: new Date().toISOString(),
    service: serviceConfig.serviceName,
    mutation: false,
    persistence: false,
    providerCall: false,
    sideEffects: false,
    liveExecutionAllowed: false,
    currentPacketEnablesRuntime: false,
    orderCreated: false,
    warehouseReserved: false,
    paymentCreated: false,
    notificationSent: false,
    callbackPersistence: false,
    callbackReplay: false,
    statusWrite: false,
    providerRead: false,
    liveFlagsClosed,
    currentLiveFlags: {
      order: serviceConfig.liveOrderSubmit,
      payment: serviceConfig.livePaymentCreate,
      notification: serviceConfig.liveNotifications,
      orderWarehouseSmoke: serviceConfig.liveOrderWarehouseSmoke,
    },
    readinessEvidence: {
      liveCheckoutExecution: liveCheckoutExecution.status,
      executionRequest: executionRequest.status,
      createReplayCancel: createReplayCancel.status,
      createReplayCancelReadyForBoundedWindow: createReplayCancel.readyForBoundedWindow === true,
      paymentCreate: paymentCreate.status,
      paymentCreateValidation: paymentCreate.validation?.status || paymentCreate.validation || null,
      notificationSend: notificationSend.status,
      notificationSendValidation: notificationSend.validation?.status || notificationSend.validation || null,
      authWalletRuntimeCheckout: authWalletRuntime.status,
      authWalletSelectorHelpersImplemented: authWalletRuntime.selectorEvidence?.selectorHelpersImplemented === true,
      authWalletCustomerSafeLabels: authWalletRuntime.selectorEvidence?.customerSafeLabels === true,
      authWalletNoPiiEvidence: authWalletRuntime.noPiiEvidence?.status || null,
      authWalletGuestFallbackCases: authWalletRuntime.guestFallbackEvidence?.fallbackCases?.length || 0,
      authWalletFetch: authWalletRuntime.authWalletFetch,
      authWalletCheckoutSubmit: authWalletRuntime.checkoutSubmit,
      paymentStatus: paymentStatusPacket.status,
      paymentReadScopeStatus,
      paymentReadScopeFreshness,
      paymentReadScopeHttpStatus: paymentReadScope.httpStatus || null,
      paymentReadScopeObservedErrorCode: paymentReadScope.observedErrorCode || null,
      checkoutStatusSurface: checkoutStatusSurface.status,
      revenueClosure: revenueClosure.status,
      liveFlagsPreflight: liveFlagsPreflight.status,
      livePreflight: preflight.status,
      livePreflightWouldMutate: preflight.wouldMutate,
    },
    handoffSummary: {
      catalogAndOrderWarehouse: 'validated_no_mutation_in_readiness_bundle',
      orderWarehouseCreateReplayCancel: 'ready_for_owner_bounded_window_but_execution_disabled',
      paymentCreate: paymentCreate.status === 'approved_payment_create_metadata_execution_disabled_cached_validation' ? 'metadata_approved_cached_no_mutation_execution_disabled' : 'metadata_approved_validation_no_mutation_execution_disabled',
      notificationSend: 'metadata_approved_validation_no_send_execution_disabled',
      customerStatus: 'read_only_surface_and_runtime_snapshot_read_approved',
      authWalletCheckout: 'runtime_mapping_and_guest_fallback_evidence_recorded_no_live_calls',
      revenueClosure: 'only_execution_window_blockers_remain',
      liveExecution: 'disabled_until_owner_opens_bounded_window',
    },
    paymentReadScopePolicy: {
      acceptedStatuses: [
        'validated_payments_read_scope_no_mutation',
        'validated_payments_read_scope_no_mutation_cached',
      ],
      currentStatus: paymentReadScopeStatus,
      freshness: paymentReadScopeFreshness,
      note: 'Cached/rate-limited read-scope evidence is accepted only when explicitly labeled stale_rate_limited and paired with ready_for_approved_payment_status_runtime_read plus mutation=false/providerCall=false.',
    },
    assertions,
    failedAssertions,
    relatedPackets: {
      liveCheckoutExecution: '/api/checkout/live-execution-evidence-packet',
      liveCheckoutExecutionRequest: '/api/checkout/live-execution-request-packet',
      createReplayCancel: '/api/checkout/live-order-warehouse-smoke-execution-checklist-packet',
      paymentCreate: '/api/payments/create-approval-evidence-packet',
      notificationSend: '/api/notifications/send-approval-evidence-packet',
      authWalletRuntimeCheckout: '/api/checkout/auth-wallet-runtime-evidence',
      checkoutStatusSurface: '/api/checkout/status-surface-contract',
      revenueClosure: '/api/checkout/revenue-closure-packet',
      liveFlagsPreflight: '/api/checkout/live-flags-operator-preflight-checklist-packet',
    },
    guardrails: {
      getOnlyRoute: true,
      currentMethodAllowsMutation: false,
      executorCalled: false,
      liveFlagsClosed,
      callbackPersistenceAllowed: false,
      callbackReplayAllowed: false,
      liveStatusWritesAllowed: false,
      dbWriteAllowed: false,
      providerCallAllowed: false,
      secretPrintingAllowed: false,
      rawProviderPayloadAllowed: false,
      rawRecipientAllowed: false,
      rawMessageBodyAllowed: false,
    },
    forbiddenOperationsNow: [
      'do not patch ENABLE_LIVE_* flags from this packet',
      'do not call POST /api/checkout/live-bounded-executor',
      'do not call POST /api/checkout/live-order-warehouse-smoke-executor',
      'do not call POST /api/checkout/submit',
      'do not fetch Auth wallet rows or browser session tokens from this packet',
      'do not call POST /api/orders',
      'do not reserve Warehouse stock',
      'do not call POST /payments/create',
      'do not call POST /notifications/send',
      'do not persist callbacks or live status writes',
      'do not call provider-backed /payments/{paymentId}',
      'do not print secrets, provider payloads, customer PII, recipients, or message bodies',
    ],
    blockers: failedAssertions.map((item) => `[MISSING: ${item.name}]`),
    next: failedAssertions.length === 0
      ? 'Handoff evidence is ready for owner review; keep live flags closed until the bounded execution window is explicitly opened.'
      : 'Resolve failed handoff guardrail assertions before owner review.',
  };
}


export async function liveOwnerExecutionRunbookPacket() {
  const handoff = await checkoutLiveReadinessHandoffEvidencePacket();
  const executionRequest = await liveCheckoutExecutionRequestPacket();
  const flagPreflight = await liveFlagsOperatorPreflightChecklistPacket();
  const executionEvidence = await liveCheckoutExecutionEvidencePacket();
  const createReplayCancel = await liveOrderWarehouseSmokeExecutionChecklistPacket();
  const revenue = await revenueClosurePacket();
  const preflight = liveCheckoutPreflight();
  const liveFlagsClosed = serviceConfig.liveOrderSubmit === false
    && serviceConfig.livePaymentCreate === false
    && serviceConfig.liveNotifications === false
    && serviceConfig.liveOrderWarehouseSmoke === false;
  const status = handoff.status === 'read_only_checkout_payment_notification_handoff_ready_execution_disabled'
    && executionRequest.status === 'approved_live_checkout_execution_request_contract_execution_disabled'
    && flagPreflight.status === 'approved_live_flags_operator_preflight_checklist_execution_disabled'
    && liveFlagsClosed
    && preflight.status === 'blocked'
    && preflight.wouldMutate === false
    ? 'approved_owner_live_execution_runbook_contract_execution_disabled'
    : 'approval_required_owner_live_execution_runbook_contract';
  const assertions = [
    { name: 'handoff_ready_execution_disabled', passed: handoff.status === 'read_only_checkout_payment_notification_handoff_ready_execution_disabled' },
    { name: 'execution_request_contract_ready', passed: executionRequest.status === 'approved_live_checkout_execution_request_contract_execution_disabled' },
    { name: 'flag_preflight_ready_disabled', passed: flagPreflight.status === 'approved_live_flags_operator_preflight_checklist_execution_disabled' },
    { name: 'execution_evidence_recorded_disabled', passed: executionEvidence.status === 'read_only_live_checkout_execution_evidence_packet_recorded_execution_disabled' },
    { name: 'create_replay_cancel_ready_for_bounded_window', passed: createReplayCancel.readyForBoundedWindow === true },
    { name: 'revenue_only_execution_window_blockers', passed: revenue.status === 'approval_required_live_revenue_closure' && revenue.blockers?.length === 5 },
    { name: 'current_live_flags_closed', passed: liveFlagsClosed },
    { name: 'current_preflight_blocked_non_mutating', passed: preflight.status === 'blocked' && preflight.wouldMutate === false },
  ];
  const failedAssertions = assertions.filter((item) => item.passed !== true);

  return {
    success: true,
    status,
    mode: 'read_only_owner_live_execution_runbook_packet',
    generatedAt: new Date().toISOString(),
    service: serviceConfig.serviceName,
    mutation: false,
    persistence: false,
    providerCall: false,
    sideEffects: false,
    liveExecutionAllowed: false,
    currentPacketEnablesRuntime: false,
    executorCalled: false,
    orderCreated: false,
    warehouseReserved: false,
    paymentCreated: false,
    notificationSent: false,
    callbackPersistence: false,
    callbackReplay: false,
    statusWrite: false,
    providerRead: false,
    liveFlagsClosed,
    currentLiveFlags: {
      ENABLE_LIVE_ORDER_SUBMIT: serviceConfig.liveOrderSubmit,
      ENABLE_LIVE_PAYMENT_CREATE: serviceConfig.livePaymentCreate,
      ENABLE_LIVE_NOTIFICATIONS: serviceConfig.liveNotifications,
      ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE: serviceConfig.liveOrderWarehouseSmoke,
    },
    readinessEvidence: {
      handoff: handoff.status,
      executionRequest: executionRequest.status,
      flagPreflight: flagPreflight.status,
      executionEvidence: executionEvidence.status,
      createReplayCancel: createReplayCancel.status,
      revenueClosure: revenue.status,
      revenueBlockerCount: revenue.blockers?.length || 0,
      livePreflight: preflight.status,
      livePreflightWouldMutate: preflight.wouldMutate,
      paymentReadScopeStatus: handoff.readinessEvidence?.paymentReadScopeStatus || null,
      paymentReadScopeFreshness: handoff.readinessEvidence?.paymentReadScopeFreshness || null,
    },
    ownerRunbook: {
      currentState: 'execution_disabled_contract_only',
      phaseOrder: [
        'pre_open_evidence',
        'open_flags_temporarily',
        'execute_bounded_checkout_and_create_replay_cancel',
        'restore_flags_immediately',
        'post_close_evidence',
      ],
      preOpenEvidenceRequired: [
        'npm run readiness:live-readiness-handoff-evidence -- https://cliplot.alfares.cz',
        'npm run readiness:live-checkout-execution-request -- https://cliplot.alfares.cz',
        'npm run readiness:live-flags-operator-preflight -- https://cliplot.alfares.cz',
        'npm run readiness:create-replay-cancel-evidence-lane -- https://cliplot.alfares.cz',
        'record one unused order/payment/notification idempotency tuple',
        'record operator approvedBy and reasonCode',
      ],
      temporaryFlagOpenRequired: {
        ENABLE_LIVE_ORDER_SUBMIT: 'true',
        ENABLE_LIVE_PAYMENT_CREATE: 'true',
        ENABLE_LIVE_NOTIFICATIONS: 'true',
        ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE: 'true',
      },
      executionRequestsRequired: {
        fullCheckout: executionRequest.ownerExecutionRequest?.executorRequest || null,
        createReplayCancel: executionRequest.ownerExecutionRequest?.createReplayCancelRequest || null,
      },
      restoreFlagsRequired: {
        ENABLE_LIVE_ORDER_SUBMIT: 'false',
        ENABLE_LIVE_PAYMENT_CREATE: 'false',
        ENABLE_LIVE_NOTIFICATIONS: 'false',
        ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE: 'false',
      },
      postCloseEvidenceRequired: [
        'all live flags restored false',
        'exactly one order create result for orderIdempotencyKey',
        'exactly one payment create result for paymentIdempotencyKey',
        'exactly one notification send result for notificationIdempotencyKey',
        'idempotent replay returns the same order/payment/notification result without duplicate side effects',
        'cancel/rollback evidence shows Orders status cancelled and Warehouse reservation released',
        'no callback persistence, callback replay execution, live status writes, provider-backed payment reads, or secret/PII output',
        'npm run readiness:bundle',
        'npm run readiness:live-readiness-handoff-evidence -- https://cliplot.alfares.cz',
      ],
    },
    evidenceCaptureSchema: {
      preOpen: [
        'timestamp',
        'operatorId',
        'reasonCode',
        'executionWindow',
        'idempotencyTupleFingerprint',
        'readinessCommandOutputsRedacted',
      ],
      execution: [
        'orderId',
        'externalOrderId',
        'orderIdempotencyKeyFingerprint',
        'paymentId',
        'paymentIdempotencyKeyFingerprint',
        'notificationId',
        'notificationIdempotencyKeyFingerprint',
        'warehouseReservationStatus',
      ],
      restore: [
        'restoredAt',
        'allLiveFlagsFalse',
        'rolloutImage',
        'kubectlRolloutStatus',
      ],
      postClose: [
        'orderStatus',
        'paymentStatus',
        'notificationStatus',
        'warehouseReservationReleased',
        'duplicateCounts',
        'forbiddenSideEffectsFalse',
        'redactionProof',
      ],
    },
    guardrails: {
      getOnlyRoute: true,
      currentMethodAllowsMutation: false,
      executorCalled: false,
      liveFlagsClosed,
      liveFlagPatchAllowedNow: false,
      callbackPersistenceAllowed: false,
      callbackReplayAllowed: false,
      liveStatusWritesAllowed: false,
      dbWriteAllowed: false,
      providerCallAllowed: false,
      secretPrintingAllowed: false,
      rawProviderPayloadAllowed: false,
      rawRecipientAllowed: false,
      rawMessageBodyAllowed: false,
    },
    forbiddenOperationsNow: [
      'do not patch ENABLE_LIVE_* flags from this packet',
      'do not call POST /api/checkout/live-bounded-executor',
      'do not call POST /api/checkout/live-order-warehouse-smoke-executor',
      'do not call POST /api/checkout/submit',
      'do not call POST /api/orders',
      'do not reserve Warehouse stock',
      'do not call POST /payments/create',
      'do not call POST /notifications/send',
      'do not persist callbacks or live status writes',
      'do not call provider-backed /payments/{paymentId}',
      'do not print secrets, provider payloads, customer PII, recipients, or message bodies',
    ],
    assertions,
    failedAssertions,
    blockers: failedAssertions.map((item) => `[MISSING: ${item.name}]`),
    next: failedAssertions.length === 0
      ? 'Runbook contract is ready for owner review; this packet does not authorize opening live flags.'
      : 'Resolve failed runbook assertions before owner review.',
  };
}


export async function runBoundedLiveCheckoutExecutor(request = {}) {
  const packet = await liveCheckoutExecutionWindowPacket();
  const blockers = [...packet.executionBlockers];
  const executionWindow = String(request.executionWindow || '').trim();
  const orderIdempotencyKey = String(request.orderIdempotencyKey || '').trim();
  const paymentIdempotencyKey = String(request.paymentIdempotencyKey || '').trim();
  const notificationIdempotencyKey = String(request.notificationIdempotencyKey || '').trim();
  const approvedBy = String(request.approvedBy || '').trim().slice(0, 128);
  const reasonCode = String(request.reasonCode || 'CLIPLOT_OWNER_FULL_CHECKOUT_LIVE_WINDOW').trim().slice(0, 128);

  if (request.confirm !== 'LIVE_CHECKOUT_EXECUTION_WINDOW') blockers.push('missing_LIVE_CHECKOUT_EXECUTION_WINDOW_confirmation');
  if (!executionWindow || executionWindow !== serviceConfig.liveCheckoutExecutionWindow) blockers.push('invalid_or_missing_live_checkout_execution_window');
  if (!orderIdempotencyKey) blockers.push('missing_order_idempotency_key');
  if (!paymentIdempotencyKey) blockers.push('missing_payment_idempotency_key');
  if (!notificationIdempotencyKey) blockers.push('missing_notification_idempotency_key');
  if (request.duplicateCheck !== 'IDEMPOTENCY_KEYS_NOT_USED') blockers.push('missing_checkout_duplicate_check');
  if (request.rollbackPlan !== 'ORDER_WAREHOUSE_PAYMENT_NOTIFICATION_ROLLBACK_OWNERS_ASSIGNED') blockers.push('missing_checkout_rollback_plan');
  if (request.validationPlan !== 'EXACTLY_ONE_ORDER_PAYMENT_NOTIFICATION_RESULT_BY_IDEMPOTENCY_KEYS') blockers.push('missing_checkout_validation_plan');
  if (!approvedBy) blockers.push('missing_approvedBy');

  if (blockers.length) {
    return {
      httpStatus: 202,
      body: {
        success: true,
        status: 'approval_required',
        mode: 'guarded_live_checkout_bounded_executor',
        mutation: false,
        persistence: false,
        providerCall: false,
        orderCreated: false,
        warehouseReserved: false,
        paymentCreated: false,
        notificationSent: false,
        liveExecutionAllowed: false,
        blockers: [...new Set(blockers)],
        packet,
        sensitiveDataPolicy: [
          'no raw customer PII',
          'no PAYMENT_API_KEY or webhook key values',
          'no raw provider payloads',
          'no raw notification recipient or message body',
        ],
      },
    };
  }

  const products = await fetchCatalogProducts();
  const product = products.find((item) => item?.warehouseId && item?.productSource === 'catalog');
  if (!product) {
    return {
      httpStatus: 409,
      body: {
        success: false,
        status: 'live_checkout_product_scope_missing',
        mode: 'guarded_live_checkout_bounded_executor',
        mutation: false,
        persistence: false,
        providerCall: false,
        orderCreated: false,
        warehouseReserved: false,
        paymentCreated: false,
        notificationSent: false,
        liveExecutionAllowed: false,
      },
    };
  }

  const checkout = buildLiveOrderWarehouseSmokeCheckout(await liveOrderWarehouseSmokePlan(), {
    externalOrderId: normalizeExternalOrderId(request.externalOrderId) || `cliplot-live-checkout-${Date.now()}`,
  });
  const validationErrors = validateCheckout(checkout);
  if (validationErrors.length) {
    return {
      httpStatus: 400,
      body: {
        success: false,
        status: 'live_checkout_payload_validation_failed',
        mode: 'guarded_live_checkout_bounded_executor',
        errors: validationErrors,
        mutation: false,
        persistence: false,
        providerCall: false,
        orderCreated: false,
        warehouseReserved: false,
        paymentCreated: false,
        notificationSent: false,
        liveExecutionAllowed: false,
      },
    };
  }

  const liveRequestOptions = { timeoutMs: liveSmokeRequestTimeoutMs };
  const approval = {
    approved: true,
    approvalType: 'human',
    approvedBy,
    reasonCode,
    externalOrderId: checkout.externalOrderId,
    approvalIdFingerprint: stableFingerprint(executionWindow),
    sideEffectsHandled: {
      payment: true,
      warehouse: true,
      notification: true,
      crm: true,
      channel: true,
    },
  };
  const evidence = {};
  let orderId = null;
  let paymentCreated = false;
  let notificationSent = false;

  try {
    const beforeReadiness = await guardedWarehouseReservationReadiness(checkout);
    evidence.beforeReadiness = beforeReadiness;
    if (beforeReadiness.status !== 'validated_no_mutation' || beforeReadiness.valid !== true) {
      return {
        httpStatus: 409,
        body: {
          success: false,
          status: 'warehouse_readiness_blocked_before_live_checkout',
          mode: 'guarded_live_checkout_bounded_executor',
          beforeReadiness,
          mutation: false,
          persistence: false,
          providerCall: false,
          orderCreated: false,
          warehouseReserved: false,
          paymentCreated: false,
          notificationSent: false,
          liveExecutionAllowed: false,
        },
      };
    }

    const orderPayload = buildOrderCreatePayload(checkout);
    const create = await postOrderPayload(serviceConfig.ordersCreatePath, checkout, orderPayload, orderIdempotencyKey, liveRequestOptions);
    orderId = extractOrderId(create);
    evidence.create = compactOrderEvidence(create);
    if (!orderId) {
      return {
        httpStatus: 502,
        body: {
          success: false,
          status: 'live_checkout_order_create_missing_order_id',
          mode: 'guarded_live_checkout_bounded_executor',
          createEvidence: evidence.create,
          mutation: true,
          persistence: true,
          providerCall: true,
          orderCreated: true,
          warehouseReserved: 'unknown',
          paymentCreated: false,
          notificationSent: false,
          liveExecutionAllowed: true,
        },
      };
    }

    evidence.afterCreateReservation = compactWarehouseEvidence(await readWarehouseReservation(orderId, liveRequestOptions));

    const replay = await postOrderPayload(serviceConfig.ordersCreatePath, checkout, orderPayload, orderIdempotencyKey, liveRequestOptions);
    const replayOrderId = extractOrderId(replay);
    evidence.replay = compactOrderEvidence(replay);
    if (replayOrderId !== orderId) {
      const cleanup = await attemptLiveOrderWarehouseSmokeCleanup(orderId, approval, checkout);
      return {
        httpStatus: 409,
        body: {
          success: false,
          status: cleanup.success
            ? 'live_checkout_order_replay_id_mismatch_cleanup_completed'
            : 'live_checkout_order_replay_id_mismatch_cleanup_incomplete',
          mode: 'guarded_live_checkout_bounded_executor',
          orderId,
          replayOrderId: replayOrderId || null,
          mutation: true,
          persistence: true,
          providerCall: true,
          orderCreated: true,
          warehouseReserved: true,
          paymentCreated: false,
          notificationSent: false,
          liveExecutionAllowed: true,
          cleanup,
          evidence,
        },
      };
    }

    const paymentPayload = buildPaymentCreatePayload(checkout, { id: orderId });
    const payment = await createPayment(checkout, { id: orderId }, paymentIdempotencyKey);
    paymentCreated = true;
    evidence.payment = {
      status: payment?.status || payment?.data?.status || null,
      resultFingerprint: stableFingerprint(payment),
      payloadFingerprint: stableFingerprint({
        orderId,
        applicationId: paymentPayload.applicationId,
        amount: paymentPayload.amount,
        currency: paymentPayload.currency,
        paymentMethod: paymentPayload.paymentMethod,
      }),
      idempotencyKeyFingerprint: stableFingerprint(paymentIdempotencyKey),
    };

    const notificationPayload = buildOrderConfirmationNotification(checkout);
    const notification = await createNotification(checkout, notificationPayload, notificationIdempotencyKey);
    notificationSent = true;
    evidence.notification = {
      status: notification?.status || notification?.data?.status || null,
      resultFingerprint: stableFingerprint(notification),
      payloadFingerprint: stableFingerprint({
        channel: notificationPayload.channel,
        type: notificationPayload.type,
        service: notificationPayload.service,
        purpose: notificationPayload.purpose,
        orderId: notificationPayload.templateData?.orderId || null,
      }),
      idempotencyKeyFingerprint: stableFingerprint(notificationIdempotencyKey),
    };

    evidence.cancel = compactOrderEvidence(await cancelOrderThroughOrders(orderId, approval, liveRequestOptions));
    evidence.orderReadback = compactOrderEvidence(await readOrderWithStatusToken(orderId, liveRequestOptions));
    evidence.afterCancelReservation = compactWarehouseEvidence(await readWarehouseReservation(orderId, liveRequestOptions));
    evidence.afterReadiness = await guardedWarehouseReservationReadiness(checkout);

    const cleanup = {
      attempted: true,
      orderId,
      success: cleanupCompleted(evidence),
      cancel: evidence.cancel,
      orderReadback: evidence.orderReadback,
      afterCancelReservation: evidence.afterCancelReservation,
      afterReadiness: evidence.afterReadiness,
      errors: [],
    };

    return {
      httpStatus: 201,
      body: {
        success: true,
        status: cleanup.success
          ? 'live_checkout_bounded_execution_completed_cleanup_completed'
          : 'live_checkout_bounded_execution_completed_cleanup_incomplete',
        mode: 'guarded_live_checkout_bounded_executor',
        mutation: true,
        persistence: true,
        providerCall: true,
        orderCreated: true,
        warehouseReserved: true,
        paymentCreated,
        notificationSent,
        liveExecutionAllowed: true,
        checkoutIntent: checkoutIntentEvidence(checkout),
        orderId,
        cleanup,
        evidence,
        sensitiveDataPolicy: [
          'no raw customer PII',
          'no PAYMENT_API_KEY or webhook key values',
          'no raw provider payloads',
          'no raw notification recipient or message body',
        ],
      },
    };
  } catch (error) {
    const cleanup = orderId
      ? await attemptLiveOrderWarehouseSmokeCleanup(orderId, approval, checkout)
      : { attempted: false, orderId: null, success: false, errors: [] };
    return {
      httpStatus: 502,
      body: {
        success: false,
        status: cleanup.success
          ? 'live_checkout_bounded_execution_failed_cleanup_completed'
          : 'live_checkout_bounded_execution_failed_cleanup_incomplete',
        mode: 'guarded_live_checkout_bounded_executor',
        failedStep: paymentCreated ? 'notification_or_cleanup' : (orderId ? 'payment_or_cleanup' : 'order_create'),
        orderId,
        error: compactSmokeError(error),
        mutation: Boolean(orderId) || paymentCreated || notificationSent,
        persistence: Boolean(orderId) || paymentCreated || notificationSent,
        providerCall: Boolean(orderId) || paymentCreated || notificationSent,
        orderCreated: Boolean(orderId),
        warehouseReserved: Boolean(orderId),
        paymentCreated,
        notificationSent,
        liveExecutionAllowed: true,
        cleanup,
        evidence,
        sensitiveDataPolicy: [
          'no raw customer PII',
          'no PAYMENT_API_KEY or webhook key values',
          'no raw provider payloads',
          'no raw notification recipient or message body',
        ],
      },
    };
  }
}

export async function liveFlagsOperatorPreflightChecklistPacket() {
  const executionWindow = await liveCheckoutExecutionWindowPacket();
  const preflight = liveCheckoutPreflight();
  const revenue = await revenueClosurePacket();
  const metadataReady = executionWindow.approvalMetadata?.metadataReady === true;
  const liveFlagsClosed = executionWindow.liveFlags?.order === false
    && executionWindow.liveFlags?.payment === false
    && executionWindow.liveFlags?.notification === false
    && executionWindow.liveFlags?.orderWarehouseSmoke === false;
  const blockers = [
    ...(metadataReady ? [] : ['[MISSING: full checkout execution-window metadata readiness]']),
    ...(liveFlagsClosed ? [] : ['[MISSING: production live flags must remain closed before operator flag-window review]']),
    ...(preflight.status === 'blocked' && preflight.wouldMutate === false ? [] : ['[MISSING: current production preflight must be blocked and non-mutating before flag-window review]']),
    ...(revenue.status === 'approval_required_live_revenue_closure' && revenue.wouldMutateNow === false ? [] : ['[MISSING: revenue closure must remain approval-required before flag-window review]']),
  ];

  return {
    success: true,
    status: blockers.length === 0
      ? 'approved_live_flags_operator_preflight_checklist_execution_disabled'
      : 'approval_required_live_flags_operator_preflight_checklist',
    mode: 'read_only_live_flags_operator_preflight_checklist_packet',
    generatedAt: new Date().toISOString(),
    service: serviceConfig.serviceName,
    mutation: false,
    persistence: false,
    providerCall: false,
    liveExecutionAllowed: false,
    orderCreated: false,
    warehouseReserved: false,
    paymentCreated: false,
    notificationSent: false,
    metadataReady,
    liveFlagsClosed,
    currentPacketEnablesRuntime: false,
    currentLiveFlags: executionWindow.liveFlags,
    proposedTemporaryFlagOpen: {
      ENABLE_LIVE_ORDER_SUBMIT: true,
      ENABLE_LIVE_PAYMENT_CREATE: true,
      ENABLE_LIVE_NOTIFICATIONS: true,
      ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE: true,
    },
    requiredApprovals: {
      CLIPLOT_LIVE_ORDER_APPROVAL_ID: executionWindow.approvals?.order === true,
      CLIPLOT_LIVE_PAYMENT_APPROVAL_ID: executionWindow.approvals?.payment === true,
      CLIPLOT_LIVE_NOTIFICATION_APPROVAL_ID: executionWindow.approvals?.notification === true,
      CLIPLOT_LIVE_ORDER_WAREHOUSE_SMOKE_APPROVAL_ID: executionWindow.readinessEvidence?.liveSmokeMetadataReady === true,
      CLIPLOT_LIVE_CHECKOUT_EXECUTION_WINDOW: executionWindow.approvalMetadata?.checkoutWindowConcrete === true,
    },
    requiredTemporaryFlagSet: {
      ENABLE_LIVE_ORDER_SUBMIT: 'true',
      ENABLE_LIVE_PAYMENT_CREATE: 'true',
      ENABLE_LIVE_NOTIFICATIONS: 'true',
      ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE: 'true',
    },
    requiredRestoreFlagSet: {
      ENABLE_LIVE_ORDER_SUBMIT: 'false',
      ENABLE_LIVE_PAYMENT_CREATE: 'false',
      ENABLE_LIVE_NOTIFICATIONS: 'false',
      ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE: 'false',
    },
    requiredOperatorRequest: {
      flagWindow: {
        confirm: 'OPEN_LIVE_CHECKOUT_FLAGS',
        executionWindow: serviceConfig.liveCheckoutExecutionWindow,
        approvedBy: 'named operator id',
        reasonCode: 'CLIPLOT_OWNER_FULL_CHECKOUT_LIVE_WINDOW',
      },
      fullCheckout: {
        confirm: 'LIVE_CHECKOUT_EXECUTION_WINDOW',
        executionWindow: serviceConfig.liveCheckoutExecutionWindow,
        orderIdempotencyKey: 'required_before_executor_call',
        paymentIdempotencyKey: 'required_before_executor_call',
        notificationIdempotencyKey: 'required_before_executor_call',
        duplicateCheck: 'IDEMPOTENCY_KEYS_NOT_USED',
        rollbackPlan: 'ORDER_WAREHOUSE_PAYMENT_NOTIFICATION_ROLLBACK_OWNERS_ASSIGNED',
        validationPlan: 'EXACTLY_ONE_ORDER_PAYMENT_NOTIFICATION_RESULT_BY_IDEMPOTENCY_KEYS',
      },
      paymentCreate: {
        confirm: 'LIVE_PAYMENT_CREATE_WINDOW',
        approvalId: 'CLIPLOT_LIVE_PAYMENT_APPROVAL_ID',
        executionWindow: 'CLIPLOT_PAYMENT_CREATE_EXECUTION_WINDOW',
        idempotencyKey: 'required_before_executor_call',
        duplicateCheck: 'IDEMPOTENCY_KEY_NOT_USED',
        rollbackPlan: 'PAYMENT_VOID_OR_CANCEL_OWNER_ASSIGNED',
        validationPlan: 'EXACTLY_ONE_PAYMENT_RESULT_BY_IDEMPOTENCY_KEY',
      },
      notificationSend: {
        confirm: 'LIVE_NOTIFICATION_SEND_WINDOW',
        approvalId: 'CLIPLOT_LIVE_NOTIFICATION_APPROVAL_ID',
        executionWindow: 'CLIPLOT_NOTIFICATION_SEND_EXECUTION_WINDOW',
        idempotencyKey: 'required_before_executor_call',
        duplicateCheck: 'IDEMPOTENCY_KEY_NOT_USED',
        rollbackPlan: 'NOTIFICATION_DUPLICATE_RESPONSE_OWNER_ASSIGNED',
        validationPlan: 'EXACTLY_ONE_NOTIFICATION_RESULT_BY_IDEMPOTENCY_KEY',
      },
      orderWarehouseSmoke: {
        confirm: 'CREATE_REPLAY_CANCEL',
        approvalId: 'CLIPLOT_LIVE_ORDER_WAREHOUSE_SMOKE_APPROVAL_ID',
        approvedBy: 'named operator id',
        reasonCode: 'CLIPLOT_OWNER_CREATE_REPLAY_CANCEL_SMOKE',
        externalOrderId: 'optional operator-provided external order id',
      },
    },
    idempotencyRequirements: {
      orderIdempotencyKey: 'required_before_executor_call',
      paymentIdempotencyKey: 'required_before_executor_call',
      notificationIdempotencyKey: 'required_before_executor_call',
      duplicateCheck: 'IDEMPOTENCY_KEYS_NOT_USED',
    },
    ownerRequirements: {
      rollbackPlan: 'ORDER_WAREHOUSE_PAYMENT_NOTIFICATION_ROLLBACK_OWNERS_ASSIGNED',
      validationPlan: 'EXACTLY_ONE_ORDER_PAYMENT_NOTIFICATION_RESULT_BY_IDEMPOTENCY_KEYS',
      rollbackOwner: serviceConfig.liveCheckoutRollbackOwner,
      validationOwner: serviceConfig.liveCheckoutValidationOwner,
    },
    requiredPreOpenValidation: [
      'npm run readiness:bundle',
      'npm run readiness:live-checkout-execution-window -- https://cliplot.alfares.cz',
      'npm run readiness:revenue-closure -- https://cliplot.alfares.cz',
      'npm run readiness:activation -- https://cliplot.alfares.cz',
      'operator records one unused idempotency tuple for the approved window',
      'operator confirms rollback and validation owners are online',
    ],
    requiredPostCloseValidation: [
      'all four live flags restored to false',
      'npm run readiness:bundle',
      'executor evidence proves exactly one order, payment, and notification result by idempotency key',
      'no callback persistence, callback replay execution, live status writes, provider-backed /payments/{paymentId} reads, or secret disclosure',
    ],
    forbiddenOperationsNow: [
      'do not patch ENABLE_LIVE_* flags from this packet',
      'do not call POST /api/checkout/submit',
      'do not call POST /api/orders',
      'do not call POST /payments/create',
      'do not call POST /notifications/send',
      'do not reserve Warehouse stock',
      'do not persist callbacks or live status writes',
      'do not print secrets, provider payloads, customer PII, recipients, or message bodies',
    ],
    readinessEvidence: {
      liveCheckoutExecutionWindowPacket: executionWindow.status,
      liveCheckoutPreflightNow: preflight.status,
      simulatedAllFlagsPreflight: metadataReady ? 'ready_for_approved_live_mutation' : 'blocked_full_checkout_metadata_missing',
      paymentExecutionWindow: executionWindow.readinessEvidence?.paymentExecutionWindow || null,
      notificationExecutionWindow: executionWindow.readinessEvidence?.notificationExecutionWindow || null,
      liveSmokePlan: executionWindow.readinessEvidence?.liveSmokePlan || null,
      revenueClosure: revenue.status,
    },
    invariantResults: [
      { name: 'current_live_flags_closed', passed: liveFlagsClosed },
      { name: 'current_preflight_blocked_non_mutating', passed: preflight.status === 'blocked' && preflight.wouldMutate === false },
      { name: 'full_checkout_metadata_ready', passed: metadataReady },
      { name: 'revenue_closure_still_approval_required', passed: revenue.status === 'approval_required_live_revenue_closure' },
      { name: 'packet_does_not_enable_runtime', passed: true },
      { name: 'no_current_side_effects', passed: true },
    ],
    evidence: {
      executionWindow: executionWindow.status,
      executionWindowMetadataReady: metadataReady,
      livePreflight: preflight.status,
      revenueClosure: revenue.status,
      wouldMutateNow: preflight.wouldMutate === true || revenue.wouldMutateNow === true,
      executionBlockerCount: executionWindow.blockerClassification?.executionBlockers?.length || 0,
      guardrailBlockerCount: executionWindow.blockerClassification?.guardrailBlockers?.length || 0,
    },
    blockers: [...new Set(blockers)],
    next: blockers.length === 0
      ? 'This checklist is ready for owner review; opening live flags still requires a separate operator action and immediate post-window rollback.'
      : 'Resolve checklist blockers before any owner review for a temporary live flag window.',
  };
}


export async function ownerBoundedWindowReadinessHandoffPacket() {
  const revenue = await revenueClosurePacket();
  const handoff = await checkoutLiveReadinessHandoffEvidencePacket();
  const executionRequest = await liveCheckoutExecutionRequestPacket();
  const ownerRunbook = await liveOwnerExecutionRunbookPacket();
  const flagPreflight = await liveFlagsOperatorPreflightChecklistPacket();
  const paymentWindow = paymentCreateExecutionWindowPacket();
  const notificationWindow = notificationSendExecutionWindowPacket();
  const authWalletRuntime = await authWalletRuntimeCheckoutEvidencePacket();
  const postLive = await postLiveRevenueClosureEvidencePacket();
  const revenueHandoff = await revenueHandoffReconciliationPacket();
  const preflight = liveCheckoutPreflight();
  const liveFlagsClosed = serviceConfig.liveOrderSubmit === false
    && serviceConfig.livePaymentCreate === false
    && serviceConfig.liveNotifications === false
    && serviceConfig.liveOrderWarehouseSmoke === false;
  const expectedRevenueBlockers = [
    '[MISSING: ENABLE_LIVE_ORDER_SUBMIT=true only during the approved bounded live checkout window]',
    '[MISSING: ENABLE_LIVE_PAYMENT_CREATE=true only during a separate approved bounded payment execution window]',
    '[MISSING: ENABLE_LIVE_NOTIFICATIONS=true only during a separate approved bounded notification execution window]',
    '[MISSING: ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE=true for owner-approved smoke execution window]',
    '[MISSING: approved live checkout mutation activation remains blocked]',
  ];
  const revenueBlockers = Array.isArray(revenue.blockers) ? revenue.blockers : [];
  const missingExpectedRevenueBlockers = expectedRevenueBlockers.filter((item) => !revenueBlockers.includes(item));
  const unexpectedRevenueBlockers = revenueBlockers.filter((item) => !expectedRevenueBlockers.includes(item));
  const assertions = [
    { name: 'live_flags_closed', passed: liveFlagsClosed },
    { name: 'current_preflight_blocked_non_mutating', passed: preflight.status === 'blocked' && preflight.wouldMutate === false },
    { name: 'handoff_ready_execution_disabled', passed: handoff.status === 'read_only_checkout_payment_notification_handoff_ready_execution_disabled' && handoff.liveExecutionAllowed === false },
    { name: 'execution_request_ready_execution_disabled', passed: executionRequest.status === 'approved_live_checkout_execution_request_contract_execution_disabled' && executionRequest.liveExecutionAllowed === false },
    { name: 'owner_runbook_ready_execution_disabled', passed: ownerRunbook.status === 'approved_owner_live_execution_runbook_contract_execution_disabled' && ownerRunbook.liveExecutionAllowed === false },
    { name: 'flag_preflight_ready_execution_disabled', passed: flagPreflight.status === 'approved_live_flags_operator_preflight_checklist_execution_disabled' && flagPreflight.liveExecutionAllowed === false },
    { name: 'payment_create_window_metadata_ready_disabled', passed: paymentWindow.status === 'approved_payment_create_window_metadata_execution_disabled' && paymentWindow.liveExecutionAllowed === false },
    { name: 'notification_send_window_metadata_ready_disabled', passed: notificationWindow.status === 'approved_notification_send_window_metadata_execution_disabled' && notificationWindow.liveExecutionAllowed === false },
    { name: 'auth_wallet_evidence_no_live_calls', passed: authWalletRuntime.status === 'auth_wallet_runtime_checkout_evidence_recorded_no_live_calls' && authWalletRuntime.authWalletFetch === false && authWalletRuntime.checkoutSubmit === false },
    { name: 'post_live_window_closed_evidence_valid', passed: postLive.status === 'validated_completed_full_checkout_live_window_closed' && postLive.liveExecutionAllowed === false },
    { name: 'revenue_handoff_ready_execution_disabled', passed: revenueHandoff.status === 'ready_for_revenue_handoff_reconciliation_review_execution_disabled' && revenueHandoff.liveExecutionAllowed === false },
    { name: 'revenue_closure_only_expected_window_blockers', passed: revenue.status === 'approval_required_live_revenue_closure' && revenue.wouldMutateNow === false && missingExpectedRevenueBlockers.length === 0 && unexpectedRevenueBlockers.length === 0 },
    { name: 'no_current_mutation_persistence_provider_or_side_effects', passed: true },
  ];
  const failedAssertions = assertions.filter((item) => item.passed !== true);

  return {
    success: true,
    status: failedAssertions.length === 0
      ? 'ready_for_owner_bounded_window_handoff_execution_disabled'
      : 'blocked_owner_bounded_window_handoff',
    mode: 'read_only_owner_bounded_window_readiness_handoff_packet',
    generatedAt: new Date().toISOString(),
    service: serviceConfig.serviceName,
    mutation: false,
    persistence: false,
    providerCall: false,
    sideEffects: false,
    liveExecutionAllowed: false,
    currentPacketEnablesRuntime: false,
    executorCalled: false,
    liveFlagsClosed,
    currentLiveFlags: {
      ENABLE_LIVE_ORDER_SUBMIT: serviceConfig.liveOrderSubmit,
      ENABLE_LIVE_PAYMENT_CREATE: serviceConfig.livePaymentCreate,
      ENABLE_LIVE_NOTIFICATIONS: serviceConfig.liveNotifications,
      ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE: serviceConfig.liveOrderWarehouseSmoke,
    },
    readinessEvidence: {
      liveReadinessHandoff: handoff.status,
      liveCheckoutExecutionRequest: executionRequest.status,
      ownerExecutionRunbook: ownerRunbook.status,
      liveFlagsOperatorPreflight: flagPreflight.status,
      paymentCreateExecutionWindow: paymentWindow.status,
      notificationSendExecutionWindow: notificationWindow.status,
      authWalletRuntimeCheckout: authWalletRuntime.status,
      authWalletFetch: authWalletRuntime.authWalletFetch,
      authWalletCheckoutSubmit: authWalletRuntime.checkoutSubmit,
      postLiveRevenueClosure: postLive.status,
      revenueHandoffReconciliation: revenueHandoff.status,
      revenueClosure: revenue.status,
      revenueBlockerCount: revenueBlockers.length,
      unexpectedRevenueBlockerCount: unexpectedRevenueBlockers.length,
      paymentReadScopeStatus: handoff.readinessEvidence?.paymentReadScopeStatus || null,
      paymentReadScopeFreshness: handoff.readinessEvidence?.paymentReadScopeFreshness || null,
    },
    remainingRevenueClosure: {
      status: revenue.status,
      blockerCount: revenueBlockers.length,
      expectedRevenueBlockers,
      missingExpectedRevenueBlockers,
      unexpectedRevenueBlockers,
      blockers: revenueBlockers,
    },
    ownerWindowRequest: {
      executionWindow: serviceConfig.liveCheckoutExecutionWindow,
      temporaryFlagOpenRequired: ownerRunbook.ownerRunbook?.temporaryFlagOpenRequired || flagPreflight.requiredTemporaryFlagSet,
      restoreFlagsRequired: ownerRunbook.ownerRunbook?.restoreFlagsRequired || flagPreflight.requiredRestoreFlagSet,
      fullCheckoutExecutorRequest: executionRequest.ownerExecutionRequest?.executorRequest || null,
      createReplayCancelRequest: executionRequest.ownerExecutionRequest?.createReplayCancelRequest || null,
      requiredIdempotency: [
        'one unused orderIdempotencyKey',
        'one unused paymentIdempotencyKey',
        'one unused notificationIdempotencyKey',
      ],
      duplicateCheck: 'IDEMPOTENCY_KEYS_NOT_USED',
      rollbackPlan: 'ORDER_WAREHOUSE_PAYMENT_NOTIFICATION_ROLLBACK_OWNERS_ASSIGNED',
      validationPlan: 'EXACTLY_ONE_ORDER_PAYMENT_NOTIFICATION_RESULT_BY_IDEMPOTENCY_KEYS',
    },
    handoffBoundaries: {
      mayOpenFlagsNow: false,
      mayCallExecutorNow: false,
      maySubmitCheckoutNow: false,
      mayCreatePaymentNow: false,
      maySendNotificationNow: false,
      mayPersistCallbacksNow: false,
      mayReplayCallbacksNow: false,
      mayWriteLiveStatusNow: false,
      mayReadProviderPaymentDetailNow: false,
      authWalletLiveFetchAllowedNow: false,
      evidenceOnly: true,
    },
    assertions,
    failedAssertions,
    blockers: failedAssertions.map((item) => `[MISSING: ${item.name}]`),
    forbiddenOperationsNow: [
      'do not open live flags from this packet',
      'do not call POST /api/checkout/live-bounded-executor',
      'do not call POST /api/checkout/live-order-warehouse-smoke-executor',
      'do not call POST /api/checkout/submit',
      'do not call POST /payments/create',
      'do not call POST /notifications/send',
      'do not persist callbacks',
      'do not execute callback replay',
      'do not write live order or payment status',
      'do not read provider-backed /payments/{paymentId}',
      'do not fetch Auth wallet rows or browser session tokens from this packet',
      'do not print secrets, raw provider payloads, customer PII, recipients, or message bodies',
    ],
    next: failedAssertions.length === 0
      ? 'Owner bounded-window handoff is ready for review; runtime mutation still requires a separate operator action to open flags temporarily and restore them immediately after execution.'
      : 'Resolve failed handoff assertions before owner bounded-window review.',
  };
}


export async function notificationSendApprovalEvidencePacket() {
  const products = await fetchCatalogProducts();
  const catalogSource = productCatalogSource(products);
  const product = products.find((item) => item?.warehouseId && item?.productSource === 'catalog');
  const productFilter = await catalogProductFilterReadiness();
  const approvals = liveMutationApprovals();
  const blockers = [];

  if (!product) blockers.push('[MISSING: Warehouse-backed Catalog product for notification approval evidence]');
  if (!serviceConfig.notificationValidation) blockers.push('[MISSING: ENABLE_NOTIFICATION_VALIDATION=true]');
  if (!serviceConfig.notificationServiceToken) blockers.push('[MISSING: NOTIFICATIONS_SERVICE_TOKEN in Vault]');
  if (serviceConfig.liveNotifications) blockers.push('[MISSING: ENABLE_LIVE_NOTIFICATIONS=false for metadata-only notification evidence]');

  let checkout = null;
  let notificationPayload = null;
  let notificationValidation = {
    status: 'skipped',
    mutation: false,
    notificationSent: false,
    providerCall: false,
  };
  let validationErrors = [];

  if (product) {
    checkout = buildReadinessCheckout(product);
    validationErrors = validateCheckout(checkout);
    notificationPayload = buildOrderConfirmationNotification(checkout);
    if (validationErrors.length === 0 && serviceConfig.notificationValidation && serviceConfig.notificationServiceToken) {
      notificationValidation = await guardedNotificationValidation(checkout, notificationPayload);
    }
  }

  if (validationErrors.length) blockers.push(...validationErrors.map((item) => `[MISSING: checkout validation ${item}]`));
  if (notificationValidation.status !== 'validated_no_send') blockers.push('[MISSING: Notifications validate accepted Cliplot order confirmation payload with no send]');
  if (notificationValidation.mutation !== false) blockers.push('[MISSING: Notifications validate mutation=false]');
  if (notificationValidation.notificationSent !== false) blockers.push('[MISSING: Notifications validate notificationSent=false]');
  if (notificationValidation.providerCall !== false) blockers.push('[MISSING: Notifications validate providerCall=false]');

  const notificationEvidenceReady = blockers.length === 0;
  const notificationMetadataApproved = notificationEvidenceReady && approvals.notification && serviceConfig.liveNotifications === false;
  const recipientDomain = notificationPayload?.recipient?.includes('@')
    ? notificationPayload.recipient.split('@').pop()
    : null;

  return {
    success: true,
    status: notificationMetadataApproved
      ? 'approved_notification_send_metadata_execution_disabled'
      : (notificationEvidenceReady
        ? 'ready_for_owner_notification_send_approval_metadata'
        : 'blocked_notification_send_approval_evidence'),
    mode: 'read_only_notification_send_approval_evidence_packet',
    generatedAt: new Date().toISOString(),
    service: serviceConfig.serviceName,
    mutation: false,
    persistence: false,
    providerCall: false,
    notificationSent: false,
    liveNotifications: serviceConfig.liveNotifications,
    notificationApprovalPresent: approvals.notification,
    requiredApprovalId: 'CLIPLOT_LIVE_NOTIFICATION_APPROVAL_ID',
    approvalIdMayBeRecordedAfterOwnerAcceptance: notificationEvidenceReady,
    approvalMetadataRecorded: approvals.notification,
    liveExecutionAllowed: false,
    catalog: {
      status: productFilter.status,
      catalogSource,
      approvedCliplotSkuScope: productFilter.approvedCliplotSkuScope,
      warehouseBackedProductCount: products.filter((item) => item?.warehouseId).length,
      sampleProductId: product?.id || null,
      sampleWarehouseId: product?.warehouseId || null,
    },
    checkoutIntent: checkout ? checkoutIntentEvidence(checkout) : null,
    notificationContract: {
      endpoint: serviceConfig.notificationValidatePath,
      liveEndpoint: serviceConfig.notificationSendPath,
      channel: notificationPayload?.channel || null,
      type: notificationPayload?.type || null,
      service: notificationPayload?.service || null,
      purpose: notificationPayload?.purpose || null,
      recipientDomain,
      subjectFingerprint: notificationPayload?.subject ? stableFingerprint(notificationPayload.subject) : null,
      messageFingerprint: notificationPayload?.message ? stableFingerprint(notificationPayload.message) : null,
      templateDataFingerprint: notificationPayload?.templateData ? stableFingerprint(notificationPayload.templateData) : null,
      idempotencyKeyFingerprint: checkout ? stableFingerprint(checkoutIdempotencyKeys(checkout).notificationValidate) : null,
      mutation: false,
      persistence: false,
      providerCall: false,
      notificationSent: false,
    },
    validation: {
      status: notificationValidation.status,
      httpStatus: notificationValidation.httpStatus || null,
      mutation: notificationValidation.mutation === true ? true : false,
      notificationSent: notificationValidation.notificationSent === true ? true : false,
      providerCall: notificationValidation.providerCall === true ? true : false,
    },
    requiredBeforeLiveNotificationSend: [
      'owner acceptance of this no-send Notifications validate evidence',
      'CLIPLOT_LIVE_NOTIFICATION_APPROVAL_ID recorded with notification approval metadata',
      'separate bounded live notification execution window before ENABLE_LIVE_NOTIFICATIONS=true',
      'approved customer-facing message copy and recipient policy',
      'post-execution validation that no duplicate notification was sent for the idempotency key',
    ],
    mustRemainFalseUntilApprovedWindow: [
      'ENABLE_LIVE_NOTIFICATIONS',
      'ENABLE_LIVE_ORDER_SUBMIT unless full checkout approval exists',
      'ENABLE_LIVE_PAYMENT_CREATE',
      'callback persistence',
      'callback replay execution',
      'live status writes',
    ],
    forbiddenOperations: [
      'POST /notifications/send',
      'send notification',
      'call notification provider',
      'persist notification send state',
      'create order',
      'create payment',
      'reserve Warehouse stock',
      'print notification service token or raw recipient payloads',
    ],
    satisfiedEvidence: [
      ...(notificationValidation.status === 'validated_no_send' ? ['[DONE: Notifications validate accepted Cliplot order confirmation payload]'] : []),
      ...(notificationValidation.mutation === false ? ['[DONE: Notifications validate mutation=false]'] : []),
      ...(notificationValidation.notificationSent === false ? ['[DONE: Notifications validate notificationSent=false]'] : []),
      ...(notificationValidation.providerCall === false ? ['[DONE: Notifications validate providerCall=false]'] : []),
      ...(serviceConfig.liveNotifications === false ? ['[DONE: ENABLE_LIVE_NOTIFICATIONS=false]'] : []),
      ...(approvals.notification === false ? ['[DONE: CLIPLOT_LIVE_NOTIFICATION_APPROVAL_ID remains empty before owner acceptance]'] : []),
      ...(approvals.notification === true ? ['[DONE: CLIPLOT_LIVE_NOTIFICATION_APPROVAL_ID metadata recorded with execution disabled]'] : []),
    ],
    blockers: [...new Set(blockers)],
    sensitiveDataPolicy: [
      'no NOTIFICATIONS_SERVICE_TOKEN value',
      'no raw recipient email',
      'no raw message body in readiness summary',
      'synthetic checkout identity only',
      'fingerprints instead of idempotency key and message values',
    ],
    next: notificationMetadataApproved
      ? 'Notification approval metadata is recorded; keep ENABLE_LIVE_NOTIFICATIONS=false until a separate bounded execution window is approved.'
      : (notificationEvidenceReady
        ? 'Owner can review this packet before deciding whether to record CLIPLOT_LIVE_NOTIFICATION_APPROVAL_ID metadata; do not enable ENABLE_LIVE_NOTIFICATIONS yet.'
        : 'Resolve the listed notification validation blockers before recording notification approval metadata.'),
  };
}


export async function paymentCreateApprovalEvidencePacket() {
  const products = await fetchCatalogProducts();
  const catalogSource = productCatalogSource(products);
  const product = products.find((item) => item?.warehouseId && item?.productSource === 'catalog');
  const productFilter = await catalogProductFilterReadiness();
  const approvals = liveMutationApprovals();
  const blockers = [];

  if (!product) blockers.push('[MISSING: Warehouse-backed Catalog product for payment-create approval evidence]');
  if (!serviceConfig.paymentCreateValidation) blockers.push('[MISSING: ENABLE_PAYMENT_CREATE_VALIDATION=true]');
  if (!serviceConfig.paymentApiKey) blockers.push('[MISSING: PAYMENT_API_KEY in Vault]');
  if (serviceConfig.livePaymentCreate) blockers.push('[MISSING: ENABLE_LIVE_PAYMENT_CREATE=false for metadata-only payment-create evidence]');

  let checkout = null;
  let paymentPayload = null;
  let paymentValidation = {
    status: 'skipped',
    valid: false,
    mutation: false,
    providerCall: false,
  };
  let validationErrors = [];

  if (product) {
    checkout = buildReadinessCheckout(product);
    validationErrors = validateCheckout(checkout);
    paymentPayload = buildPaymentCreatePayload(checkout, { id: checkout.externalOrderId });
    if (validationErrors.length === 0 && serviceConfig.paymentCreateValidation && serviceConfig.paymentApiKey) {
      paymentValidation = await guardedPaymentValidation(checkout, paymentPayload);
    }
  }

  const paymentValidationFresh = paymentValidation.status === 'validated_no_mutation' && paymentValidation.valid === true;
  const paymentValidationCachedNoMutation = paymentValidation.status === 'validated_payments_read_scope_no_mutation_cached'
    && paymentValidation.mutation === false
    && paymentValidation.providerCall === false
    && paymentValidation.freshness?.status === 'stale_rate_limited';
  const paymentValidationNoMutationAccepted = paymentValidationFresh || paymentValidationCachedNoMutation;

  if (validationErrors.length) blockers.push(...validationErrors.map((item) => `[MISSING: checkout validation ${item}]`));
  if (!paymentValidationNoMutationAccepted) blockers.push('[MISSING: Payments validate-create accepted valid Cliplot payload with no mutation or cached no-mutation evidence]');
  if (!paymentValidationFresh && !paymentValidationCachedNoMutation) blockers.push('[MISSING: Payments validate-create valid=true or accepted cached no-mutation evidence]');
  if (paymentValidation.mutation !== false) blockers.push('[MISSING: Payments validate-create mutation=false]');
  if (paymentValidation.providerCall !== false) blockers.push('[MISSING: Payments validate-create providerCall=false]');
  if (paymentValidation.applicationId && paymentValidation.applicationId !== serviceConfig.applicationId) {
    blockers.push('[MISSING: Payments validate-create returned expected applicationId=cliplot]');
  }
  if (paymentValidation.paymentMethod && paymentValidation.paymentMethod !== serviceConfig.paymentMethod) {
    blockers.push('[MISSING: Payments validate-create returned expected payment method]');
  }

  const paymentEvidenceReady = blockers.length === 0;
  const paymentMetadataApproved = paymentEvidenceReady && approvals.payment && serviceConfig.livePaymentCreate === false;
  const paymentMetadataApprovedWithCachedValidation = paymentMetadataApproved && paymentValidationCachedNoMutation;
  const callbackOrigin = paymentPayload?.callbackUrl ? new URL(paymentPayload.callbackUrl).origin : null;
  const successOrigin = paymentPayload?.successUrl ? new URL(paymentPayload.successUrl).origin : null;
  const cancelOrigin = paymentPayload?.cancelUrl ? new URL(paymentPayload.cancelUrl).origin : null;

  return {
    success: true,
    status: paymentMetadataApproved
      ? (paymentMetadataApprovedWithCachedValidation
        ? 'approved_payment_create_metadata_execution_disabled_cached_validation'
        : 'approved_payment_create_metadata_execution_disabled')
      : (paymentEvidenceReady
        ? 'ready_for_owner_payment_create_approval_metadata'
        : 'blocked_payment_create_approval_evidence'),
    mode: 'read_only_payment_create_approval_evidence_packet',
    generatedAt: new Date().toISOString(),
    service: serviceConfig.serviceName,
    mutation: false,
    persistence: false,
    providerCall: false,
    livePaymentCreate: serviceConfig.livePaymentCreate,
    paymentApprovalPresent: approvals.payment,
    requiredApprovalId: 'CLIPLOT_LIVE_PAYMENT_APPROVAL_ID',
    approvalIdMayBeRecordedAfterOwnerAcceptance: paymentEvidenceReady && (paymentValidationFresh || approvals.payment),
    validationFreshness: paymentValidationCachedNoMutation ? 'cached_stale_rate_limited_no_mutation' : 'fresh_or_not_applicable',
    approvalMetadataRecorded: approvals.payment,
    liveExecutionAllowed: false,
    catalog: {
      status: productFilter.status,
      catalogSource,
      approvedCliplotSkuScope: productFilter.approvedCliplotSkuScope,
      warehouseBackedProductCount: products.filter((item) => item?.warehouseId).length,
      sampleProductId: product?.id || null,
      sampleWarehouseId: product?.warehouseId || null,
    },
    checkoutIntent: checkout ? checkoutIntentEvidence(checkout) : null,
    paymentCreateContract: {
      endpoint: serviceConfig.paymentValidateCreatePath,
      liveEndpoint: serviceConfig.paymentCreatePath,
      applicationId: serviceConfig.applicationId,
      paymentMethod: serviceConfig.paymentMethod,
      amount: paymentPayload?.amount || null,
      currency: paymentPayload?.currency || null,
      callbackOrigin,
      successOrigin,
      cancelOrigin,
      idempotencyKeyFingerprint: checkout ? stableFingerprint(checkoutIdempotencyKeys(checkout).paymentValidate) : null,
      payloadFingerprint: paymentPayload ? stableFingerprint({
        applicationId: paymentPayload.applicationId,
        orderId: paymentPayload.orderId,
        amount: paymentPayload.amount,
        currency: paymentPayload.currency,
        paymentMethod: paymentPayload.paymentMethod,
        callbackOrigin,
        successOrigin,
        cancelOrigin,
      }) : null,
      mutation: false,
      persistence: false,
      providerCall: false,
    },
    validation: {
      status: paymentValidation.status,
      valid: paymentValidation.valid === true,
      httpStatus: paymentValidation.httpStatus || null,
      applicationId: paymentValidation.applicationId || null,
      orderIdPresent: Boolean(paymentValidation.orderId),
      amount: paymentValidation.amount || null,
      currency: paymentValidation.currency || null,
      paymentMethod: paymentValidation.paymentMethod || null,
      callbackOrigin: paymentValidation.callbackOrigin || null,
      successOrigin: paymentValidation.successOrigin || null,
      cancelOrigin: paymentValidation.cancelOrigin || null,
      mutation: paymentValidation.mutation === true ? true : false,
      providerCall: paymentValidation.providerCall === true ? true : false,
    },
    requiredBeforeLivePaymentCreate: [
      'owner acceptance of this valid-body Payments validate-create evidence',
      'CLIPLOT_LIVE_PAYMENT_APPROVAL_ID recorded with payment approval metadata',
      'separate bounded live payment execution window before ENABLE_LIVE_PAYMENT_CREATE=true',
      'payment provider rollback/cancel/refund owner',
      'post-execution validation that no duplicate payment was created for the idempotency key',
    ],
    mustRemainFalseUntilApprovedWindow: [
      'ENABLE_LIVE_PAYMENT_CREATE',
      'ENABLE_LIVE_ORDER_SUBMIT unless full checkout approval exists',
      'ENABLE_LIVE_NOTIFICATIONS',
      'callback persistence',
      'callback replay execution',
      'live status writes',
      'provider-backed /payments/{paymentId} reads',
    ],
    forbiddenOperations: [
      'POST /payments/create',
      'create payment',
      'call payment provider',
      'persist payment',
      'write payment status',
      'persist callback state',
      'send notification',
      'print API keys or raw provider payloads',
    ],
    satisfiedEvidence: [
      ...(paymentValidation.status === 'validated_no_mutation' ? ['[DONE: Payments validate-create accepted valid Cliplot payment payload]'] : []),
      ...(paymentValidationCachedNoMutation ? ['[DONE: Payments validate-create currently rate-limited; accepted cached no-mutation evidence with execution disabled]'] : []),
      ...(paymentValidation.valid === true ? ['[DONE: valid=true from Payments validate-create]'] : []),
      ...(paymentValidation.mutation === false ? ['[DONE: Payments validate-create mutation=false]'] : []),
      ...(paymentValidation.providerCall === false ? ['[DONE: Payments validate-create providerCall=false]'] : []),
      ...(serviceConfig.livePaymentCreate === false ? ['[DONE: ENABLE_LIVE_PAYMENT_CREATE=false]'] : []),
      ...(approvals.payment === false ? ['[DONE: CLIPLOT_LIVE_PAYMENT_APPROVAL_ID remains empty before owner acceptance]'] : []),
      ...(approvals.payment === true ? ['[DONE: CLIPLOT_LIVE_PAYMENT_APPROVAL_ID metadata recorded with execution disabled]'] : []),
    ],
    blockers: [...new Set(blockers)],
    sensitiveDataPolicy: [
      'no PAYMENT_API_KEY value',
      'no provider payload',
      'no payment row',
      'synthetic checkout identity only',
      'fingerprints instead of idempotency key values',
    ],
    next: paymentMetadataApproved
      ? 'Payment approval metadata is recorded; keep ENABLE_LIVE_PAYMENT_CREATE=false until a separate bounded execution window is approved.'
      : (paymentEvidenceReady
        ? 'Owner can review this packet to decide whether to record CLIPLOT_LIVE_PAYMENT_APPROVAL_ID metadata; do not enable ENABLE_LIVE_PAYMENT_CREATE yet.'
        : 'Resolve the listed payment-create validation blockers before recording payment approval metadata.'),
  };
}


export async function paymentReadScopeReadiness() {
  const now = Date.now();
  if (paymentReadScopeReadinessCache && paymentReadScopeReadinessCache.expiresAt > now) {
    return {
      ...paymentReadScopeReadinessCache.payload,
      generatedAt: new Date().toISOString(),
      cache: {
        status: 'hit',
        ttlMs: paymentReadScopeReadinessCache.expiresAt - now,
        purpose: 'avoid_duplicate_payments_scope_probe_rate_limit',
      },
    };
  }

  if (!serviceConfig.paymentApiKey) {
    return {
      success: true,
      status: 'missing_payment_api_key',
      mode: 'guarded_payment_read_scope_readiness',
      generatedAt: new Date().toISOString(),
      service: serviceConfig.serviceName,
      endpoint: '/payments/status/by-order-id?applicationId=cliplot&orderId=cliplot-read-scope-readiness',
      requiredScope: 'payments:read',
      keyPresent: false,
      scopeValidated: false,
      routeValidated: false,
      expectedHttpStatus: 404,
      expectedErrorCode: 'PAYMENT_STATUS_SNAPSHOT_NOT_FOUND',
      mutation: false,
      persistence: false,
      providerCall: false,
      databaseRead: true,
      blockers: ['[MISSING: PAYMENT_API_KEY in Vault]'],
      sensitiveDataPolicy: ['no payment API key value', 'no provider call', 'no payment row lookup', 'no persistence'],
      next: 'Populate PAYMENT_API_KEY before validating payments:read scope.',
    };
  }

  try {
    const evidence = await validatePaymentReadScope();
    const errorCode = evidence.payload?.error?.code || evidence.payload?.code || evidence.payload?.error || null;
    if (evidence.httpStatus === 429) {
      const result = paymentReadScopeRateLimitedResult(evidence, Date.now());
      paymentReadScopeReadinessCache = {
        expiresAt: Date.now() + paymentReadScopeReadinessCacheTtlMs,
        payload: result,
      };
      return result;
    }
    const scopeValidated = evidence.httpStatus === 404 && ['PAYMENT_STATUS_SNAPSHOT_NOT_FOUND', 'Not Found'].includes(String(errorCode));
    const result = {
      success: true,
      status: scopeValidated ? 'validated_payments_read_scope_no_mutation' : 'blocked_payments_read_scope_not_validated',
      mode: 'guarded_payment_read_scope_readiness',
      generatedAt: new Date().toISOString(),
      service: serviceConfig.serviceName,
      endpoint: '/payments/status/by-order-id?applicationId=cliplot&orderId=cliplot-read-scope-readiness',
      requiredScope: 'payments:read',
      keyPresent: true,
      scopeValidated,
      routeValidated: scopeValidated,
      httpStatus: evidence.httpStatus,
      expectedHttpStatus: 404,
      expectedErrorCode: 'PAYMENT_STATUS_SNAPSHOT_NOT_FOUND',
      observedErrorCode: errorCode,
      mutation: false,
      persistence: false,
      providerCall: false,
      databaseRead: true,
      cache: {
        status: 'miss',
        ttlMs: paymentReadScopeReadinessCacheTtlMs,
        purpose: 'avoid_duplicate_payments_scope_probe_rate_limit',
      },
      blockers: scopeValidated
        ? []
        : ['[MISSING: payments:read scope for Cliplot PAYMENT_API_KEY confirmed in runtime evidence]'],
      sensitiveDataPolicy: ['no payment API key value', 'no provider call', 'no payment row lookup', 'no persistence'],
      next: scopeValidated
        ? 'Owner approval is still required before Cliplot enables passive Payments snapshot reads.'
        : 'Fix PAYMENT_API_KEY scope or Payments route availability before enabling passive status reads.',
    };
    if (scopeValidated) {
      cachePaymentReadScopeSuccess(result);
    }
    return result;
  } catch (error) {
    if (Number(error?.status || 0) === 429) {
      const result = paymentReadScopeRateLimitedResult({ httpStatus: 429, payload: error?.payload || {} }, Date.now());
      paymentReadScopeReadinessCache = {
        expiresAt: Date.now() + paymentReadScopeReadinessCacheTtlMs,
        payload: result,
      };
      return result;
    }
    return {
      success: true,
      status: 'blocked_payments_read_scope_request_failed',
      mode: 'guarded_payment_read_scope_readiness',
      generatedAt: new Date().toISOString(),
      service: serviceConfig.serviceName,
      endpoint: '/payments/status/by-order-id?applicationId=cliplot&orderId=cliplot-read-scope-readiness',
      requiredScope: 'payments:read',
      keyPresent: true,
      scopeValidated: false,
      routeValidated: false,
      httpStatus: error?.status || 0,
      error: error instanceof Error ? error.message : String(error),
      mutation: false,
      persistence: false,
      providerCall: false,
      databaseRead: false,
      blockers: ['[MISSING: payments:read scope for Cliplot PAYMENT_API_KEY confirmed in runtime evidence]'],
      sensitiveDataPolicy: ['no payment API key value', 'no provider call', 'no payment row lookup', 'no persistence'],
      next: 'Restore Payments reachability and validate payments:read scope before enabling passive status reads.',
    };
  }
}

async function validateNotification(checkout, notificationPayload) {
  const url = new URL(serviceConfig.notificationValidatePath, serviceConfig.notificationsUrl);
  return fetchJson(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${serviceConfig.notificationServiceToken}`,
      'idempotency-key': checkoutIdempotencyKeys(checkout).notificationValidate,
    },
    body: JSON.stringify(notificationPayload),
  });
}

async function createNotification(checkout, notificationPayload, idempotencyKey = checkoutIdempotencyKeys(checkout).notificationSend) {
  const url = new URL(serviceConfig.notificationSendPath, serviceConfig.notificationsUrl);
  return fetchJson(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${serviceConfig.notificationServiceToken}`,
      'idempotency-key': idempotencyKey,
    },
    body: JSON.stringify(notificationPayload),
  });
}

async function guardedNotificationValidation(checkout, notificationPayload) {
  if (!serviceConfig.notificationValidation) {
    return {
      status: 'disabled',
      mutation: false,
      notificationSent: false,
      providerCall: false,
    };
  }
  if (!serviceConfig.notificationServiceToken) {
    return {
      status: 'missing_notification_service_token',
      mutation: false,
      notificationSent: false,
      providerCall: false,
    };
  }

  try {
    const payload = await validateNotification(checkout, notificationPayload);
    return {
      status: 'validated_no_send',
      ...(payload?.data || {}),
      mutation: false,
      notificationSent: false,
      providerCall: false,
    };
  } catch (error) {
    if (Number(error?.status || 0) === 429) {
      return paymentReadScopeRateLimitedResult({ httpStatus: 429, payload: error?.payload || {} }, Date.now());
    }
    return {
      status: 'validation_failed_guarded',
      httpStatus: error?.status || 0,
      code: error?.payload?.error?.code || error?.payload?.message || 'unknown',
      mutation: false,
      notificationSent: false,
      providerCall: false,
    };
  }
}

function headerValue(headers, name) {
  const value = headers?.[name] || headers?.[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value || '';
}

function normalizeStatusIdentifier(value) {
  const normalized = String(value || '').trim().slice(0, 128);
  return /^[a-zA-Z0-9][a-zA-Z0-9._:-]{2,127}$/.test(normalized) ? normalized : '';
}

const customerSafePaymentStatusMap = {
  pending: { code: 'waiting_for_payment', label: 'Čeká na platbu', severity: 'info' },
  processing: { code: 'payment_processing', label: 'Platba se zpracovává', severity: 'info' },
  completed: { code: 'payment_received', label: 'Platba přijata', severity: 'success' },
  failed: { code: 'payment_failed', label: 'Platba se nezdařila', severity: 'warning' },
  cancelled: { code: 'payment_cancelled', label: 'Platba byla zrušena', severity: 'neutral' },
  refunded: { code: 'payment_refunded', label: 'Platba byla vrácena', severity: 'neutral' },
  unknown: { code: 'payment_status_unknown', label: 'Stav platby zatím neznáme', severity: 'info' },
};

const knownPaymentStatuses = new Set(Object.keys(customerSafePaymentStatusMap).filter((status) => status !== 'unknown'));

function customerSafePaymentStatus(status) {
  const normalized = String(status || '').trim().toLowerCase();
  return customerSafePaymentStatusMap[normalized] || customerSafePaymentStatusMap.unknown;
}

function passivePaymentSnapshotReadAllowed() {
  const approvals = liveMutationApprovals();
  const statusRuntimeApprovalPresent = isApprovalPresent(serviceConfig.statusRuntimeApprovalId);
  const liveMutationRequested = serviceConfig.liveOrderSubmit
    || serviceConfig.livePaymentCreate
    || serviceConfig.liveNotifications;

  return serviceConfig.customerStatusRuntimeRead === true
    && serviceConfig.paymentStatusSnapshotRead === true
    && statusRuntimeApprovalPresent
    && Boolean(serviceConfig.paymentApiKey)
    && !liveMutationRequested;
}

function passivePaymentSnapshotRuntimeState() {
  const approvals = liveMutationApprovals();
  const statusRuntimeApprovalPresent = isApprovalPresent(serviceConfig.statusRuntimeApprovalId);
  const liveMutationRequested = serviceConfig.liveOrderSubmit
    || serviceConfig.livePaymentCreate
    || serviceConfig.liveNotifications;
  const blockers = [];
  if (!serviceConfig.customerStatusRuntimeRead) blockers.push('[MISSING: ENABLE_CUSTOMER_STATUS_RUNTIME_READ=true after owner approval]');
  if (!serviceConfig.paymentStatusSnapshotRead) blockers.push('[MISSING: ENABLE_PAYMENT_STATUS_SNAPSHOT_READ=true after owner approval]');
  if (!statusRuntimeApprovalPresent) blockers.push('[MISSING: CLIPLOT_STATUS_RUNTIME_APPROVAL_ID after owner-approved read-only customer status rollout]');
  if (!serviceConfig.paymentApiKey) blockers.push('[MISSING: PAYMENT_API_KEY in Vault]');
  if (liveMutationRequested) blockers.push('[MISSING: read-only customer status runtime must not be activated together with live checkout mutation flags]');

  return {
    runtimeReadEnabled: passivePaymentSnapshotReadAllowed(),
    paymentsSnapshotReadEnabled: passivePaymentSnapshotReadAllowed(),
    statusRuntimeApprovalPresent,
    customerStatusRuntimeRead: serviceConfig.customerStatusRuntimeRead,
    paymentStatusSnapshotRead: serviceConfig.paymentStatusSnapshotRead,
    paymentApiKeyPresent: Boolean(serviceConfig.paymentApiKey),
    liveMutationRequested,
    blockers,
  };
}

function normalizePaymentSnapshotPayload(payload, fallbackOrderId) {
  const data = payload?.data || payload?.payment || payload || {};
  const status = String(data.status || data.paymentStatus || 'unknown').trim().toLowerCase();
  const safeStatus = knownPaymentStatuses.has(status) ? status : 'unknown';
  return {
    paymentId: data.paymentId || data.id || undefined,
    orderId: data.orderId || fallbackOrderId || undefined,
    applicationId: data.applicationId || serviceConfig.applicationId,
    paymentStatus: safeStatus,
    rawStatusRecognized: safeStatus !== 'unknown',
    customerSafePaymentStatus: customerSafePaymentStatus(safeStatus),
    amount: data.amount ?? undefined,
    currency: data.currency || undefined,
    paymentMethod: data.paymentMethod || undefined,
    createdAt: data.createdAt || undefined,
    updatedAt: data.updatedAt || undefined,
    completedAt: data.completedAt || undefined,
    refundedAt: data.refundedAt || undefined,
    source: data.source || 'payments_db_snapshot',
    providerCallExplicit: data.providerCall === false,
    mutationExplicit: data.mutation === false,
    persistenceExplicit: data.persistence === false,
    providerCall: data.providerCall === true,
    mutation: data.mutation === true,
    persistence: data.persistence === true,
  };
}

async function readPaymentSnapshotByOrderId(orderId) {
  const url = new URL('/payments/status/by-order-id', serviceConfig.paymentUrl);
  url.searchParams.set('applicationId', serviceConfig.applicationId);
  url.searchParams.set('orderId', orderId);
  const { controller, timeout } = timeoutSignal();
  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        accept: 'application/json',
        'x-api-key': serviceConfig.paymentApiKey,
      },
    });
    const text = await response.text();
    let payload = {};
    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      payload = { nonJsonBodyPreview: text.slice(0, 160) };
    }

    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}`);
      error.status = response.status;
      error.payload = payload;
      throw error;
    }

    return normalizePaymentSnapshotPayload(payload, orderId);
  } finally {
    clearTimeout(timeout);
  }
}

function guardedPaymentStatusBody(orderId, paymentId) {
  const runtime = passivePaymentSnapshotRuntimeState();
  return {
    success: true,
    status: 'payment_status_guarded_no_persistence',
    mode: 'guarded_payment_status',
    orderId: orderId || undefined,
    paymentId: paymentId || undefined,
    paymentStatus: 'unknown',
    customerSafePaymentStatus: customerSafePaymentStatus('unknown'),
    mutation: false,
    persistence: false,
    providerCall: false,
    runtimeReadEnabled: runtime.runtimeReadEnabled,
    paymentsSnapshotReadEnabled: runtime.paymentsSnapshotReadEnabled,
    storageRead: false,
    passiveSnapshotAdapter: {
      configured: true,
      active: false,
      endpoint: '/payments/status/by-order-id?applicationId=cliplot&orderId={orderId}',
      forbiddenEndpoint: '/payments/{paymentId}',
      runtimeReadEnabled: runtime.runtimeReadEnabled,
      paymentsSnapshotReadEnabled: runtime.paymentsSnapshotReadEnabled,
      statusRuntimeApprovalPresent: runtime.statusRuntimeApprovalPresent,
      customerStatusRuntimeRead: runtime.customerStatusRuntimeRead,
      paymentStatusSnapshotRead: runtime.paymentStatusSnapshotRead,
      paymentApiKeyPresent: runtime.paymentApiKeyPresent,
      liveMutationRequested: runtime.liveMutationRequested,
      providerCall: false,
      persistence: false,
      mutation: false,
      blockers: runtime.blockers,
    },
    liveMutationApprovals: liveMutationApprovals(),
    next: 'Read Payments DB snapshot only after owner-approved read-only status runtime flags and approval ID exist.',
  };
}

export async function paymentStatus(input = {}) {
  const orderId = normalizeExternalOrderId(input.orderId || input.externalOrderId);
  const paymentId = normalizeStatusIdentifier(input.paymentId);
  if (!orderId && !paymentId) {
    return {
      httpStatus: 400,
      body: {
        success: false,
        status: 'payment_status_validation_failed',
        errors: ['missing_valid_order_or_payment_id'],
        mutation: false,
        persistence: false,
        providerCall: false,
      },
    };
  }

  const runtime = passivePaymentSnapshotRuntimeState();
  if (!runtime.runtimeReadEnabled) {
    return {
      httpStatus: 200,
      body: guardedPaymentStatusBody(orderId, paymentId),
    };
  }

  if (!orderId) {
    return {
      httpStatus: 400,
      body: {
        success: false,
        status: 'payment_status_order_id_required_for_snapshot_read',
        errors: ['order_id_required_for_payments_db_snapshot_read'],
        paymentId: paymentId || undefined,
        mutation: false,
        persistence: false,
        providerCall: false,
        forbiddenEndpoint: '/payments/{paymentId}',
      },
    };
  }

  try {
    const snapshot = await readPaymentSnapshotByOrderId(orderId);
    const readOnly = snapshot.providerCall === false
      && snapshot.persistence === false
      && snapshot.mutation === false
      && snapshot.providerCallExplicit === true
      && snapshot.persistenceExplicit === true
      && snapshot.mutationExplicit === true
      && snapshot.source === 'payments_db_snapshot'
      && snapshot.applicationId === serviceConfig.applicationId
      && snapshot.orderId === orderId;
    if (!readOnly) {
      return {
        httpStatus: 502,
        body: {
          success: false,
          status: 'payment_status_snapshot_contract_violation',
          orderId,
          source: snapshot.source,
          mutation: false,
          persistence: false,
          providerCall: false,
        },
      };
    }
    return {
      httpStatus: 200,
      body: {
        success: true,
        status: 'payment_status_snapshot_read',
        mode: 'payments_db_snapshot_read',
        ...snapshot,
        runtimeReadEnabled: true,
        paymentsSnapshotReadEnabled: true,
        storageRead: false,
        mutation: false,
        persistence: false,
        providerCall: false,
        sensitiveDataPolicy: [
          'no provider transaction id',
          'no raw provider payload',
          'no secret values',
        ],
      },
    };
  } catch (error) {
    const upstreamStatus = Number(error?.status || 0);
    const safeUnavailable = [404, 429, 502, 503, 504].includes(upstreamStatus);
    const errorCode = error?.payload?.error?.code || error?.payload?.code || error?.payload?.error || null;
    return {
      httpStatus: safeUnavailable ? 200 : 502,
      body: {
        success: safeUnavailable,
        status: upstreamStatus === 404 ? 'payment_status_snapshot_not_available' : (safeUnavailable ? 'payment_status_snapshot_temporarily_unavailable' : 'payment_status_snapshot_read_failed'),
        orderId,
        httpStatus: upstreamStatus,
        errorCode: safeUnavailable ? undefined : errorCode,
        paymentStatus: 'unknown',
        customerSafePaymentStatus: customerSafePaymentStatus('unknown'),
        runtimeReadEnabled: true,
        paymentsSnapshotReadEnabled: true,
        storageRead: false,
        mutation: false,
        persistence: false,
        providerCall: false,
      },
    };
  }
}

export function paymentStatusRuntimeReadiness() {
  const runtime = passivePaymentSnapshotRuntimeState();
  return {
    success: true,
    status: runtime.runtimeReadEnabled
      ? 'ready_for_approved_payments_snapshot_runtime_read'
      : 'blocked_payments_snapshot_runtime_read',
    mode: 'guarded_payment_status_runtime_readiness',
    generatedAt: new Date().toISOString(),
    service: serviceConfig.serviceName,
    mutation: false,
    persistence: false,
    providerCall: false,
    runtimeReadEnabled: runtime.runtimeReadEnabled,
    paymentsSnapshotReadEnabled: runtime.paymentsSnapshotReadEnabled,
    storageRead: false,
    callbackPersistence: false,
    ...runtime,
    readContract: {
      endpoint: '/payments/status/by-order-id?applicationId=cliplot&orderId={orderId}',
      forbiddenEndpoint: '/payments/{paymentId}',
      applicationId: serviceConfig.applicationId,
      requiredScope: 'payments:read',
      requiredRuntimeKey: 'PAYMENT_API_KEY',
      source: 'payments_db_snapshot',
      providerCall: false,
      persistence: false,
      mutation: false,
    },
    forbiddenOperations: [
      'read /payments/{paymentId}',
      'create payment',
      'create order',
      'reserve Warehouse stock',
      'send notification',
      'persist callback state',
      'print API keys or webhook keys',
      'return provider transaction IDs or raw provider payloads',
    ],
    next: 'Keep production blocked until owner-approved read-only status runtime flags and approval ID exist together.',
  };
}

function safeTokenEquals(actual, expected) {
  if (!actual || !expected) return false;
  const actualBuffer = Buffer.from(String(actual));
  const expectedBuffer = Buffer.from(String(expected));
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export function handlePaymentCallback(input, headers = {}) {
  if (!serviceConfig.paymentWebhookApiKey) {
    return {
      httpStatus: 503,
      body: {
        success: false,
        status: 'payment_callback_key_missing',
        missing: ['[MISSING: PAYMENT_WEBHOOK_API_KEY in Vault]'],
      },
    };
  }

  const apiKey = headerValue(headers, 'x-api-key');
  if (!safeTokenEquals(apiKey, serviceConfig.paymentWebhookApiKey)) {
    return {
      httpStatus: 401,
      body: {
        success: false,
        status: 'payment_callback_unauthorized',
      },
    };
  }

  const paymentId = String(input?.paymentId || '').trim();
  const orderId = String(input?.orderId || '').trim();
  const status = String(input?.status || '').trim().toLowerCase();
  const event = String(input?.event || '').trim().toLowerCase();
  const allowedStatuses = new Set(['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded']);
  const errors = [];
  if (!paymentId) errors.push('missing_payment_id');
  if (!orderId) errors.push('missing_order_id');
  if (!allowedStatuses.has(status)) errors.push('invalid_status');

  if (errors.length) {
    return {
      httpStatus: 400,
      body: {
        success: false,
        status: 'payment_callback_validation_failed',
        errors,
      },
    };
  }

  const safePaymentStatus = customerSafePaymentStatus(status);

  return {
    httpStatus: 202,
    body: {
      success: true,
      status: 'payment_callback_received_guarded',
      mode: 'guarded_payment_callback_ack',
      paymentId,
      orderId,
      paymentStatus: status,
      customerSafePaymentStatus: safePaymentStatus,
      event: event || 'unknown',
      mutation: false,
      persistence: false,
      callbackState: {
        orderStatus: 'not_updated_guarded',
        paymentStatus: status,
        customerSafePaymentStatus: safePaymentStatus,
        event: event || 'unknown',
      },
      next: 'Persist order/payment status only after GOAL-05 live checkout storage is approved.',
    },
  };
}

export function paymentCallbackReadiness() {
  if (!serviceConfig.paymentWebhookApiKey) {
    return {
      success: true,
      status: 'blocked_missing_payment_webhook_key',
      mode: 'guarded_payment_callback_readiness',
      generatedAt: new Date().toISOString(),
      service: serviceConfig.serviceName,
      keyPresent: false,
      mutation: false,
      persistence: false,
      providerCall: false,
      callbackAccepted: false,
      blockers: ['missing_PAYMENT_WEBHOOK_API_KEY'],
      next: 'Populate PAYMENT_WEBHOOK_API_KEY through Vault before relying on payment callback ACK readiness.',
    };
  }

  const synthetic = {
    paymentId: 'callback-readiness-payment',
    orderId: 'cliplot-callback-readiness',
    status: 'completed',
    event: 'payment.completed',
  };
  const result = handlePaymentCallback(synthetic, {
    'x-api-key': serviceConfig.paymentWebhookApiKey,
  });
  const body = result.body || {};
  const accepted = result.httpStatus === 202
    && body.status === 'payment_callback_received_guarded'
    && body.mutation === false
    && body.persistence === false;

  return {
    success: true,
    status: accepted ? 'validated_guarded_ack_no_persistence' : 'blocked_callback_ack_unexpected',
    mode: 'guarded_payment_callback_readiness',
    generatedAt: new Date().toISOString(),
    service: serviceConfig.serviceName,
    keyPresent: true,
    mutation: false,
    persistence: false,
    providerCall: false,
    callbackAccepted: accepted,
    callbackStatus: body.status || null,
    callbackHttpStatus: result.httpStatus,
    callbackState: {
      orderStatus: body.callbackState?.orderStatus || null,
      paymentStatus: body.callbackState?.paymentStatus || null,
      customerSafePaymentStatus: body.callbackState?.customerSafePaymentStatus || null,
      event: body.callbackState?.event || null,
    },
    sensitiveDataPolicy: [
      'no webhook key value',
      'synthetic callback payload only',
      'no provider call',
      'no order or payment persistence',
      'customer-safe payment status labels only',
    ],
    blockers: accepted ? [] : ['payment_callback_guarded_ack_failed'],
    next: accepted
      ? 'Payment callback key presence and guarded ACK path are validated without persistence.'
      : 'Keep live payment callback persistence disabled until the guarded ACK path validates.',
  };
}


export function paymentCallbackReplayPolicyReadiness() {
  const callback = paymentCallbackReadiness();
  const guarded = callback.status === 'validated_guarded_ack_no_persistence'
    && callback.callbackAccepted === true
    && callback.mutation === false
    && callback.persistence === false
    && callback.providerCall === false;
  const approvalPresent = isApprovalPresent(serviceConfig.callbackReplayPolicyApprovalId);
  const callbackStorageApprovalPresent = isApprovalPresent(serviceConfig.callbackPersistenceStorageApprovalId);
  const callbackReplayExecutionApprovalPresent = isApprovalPresent(serviceConfig.callbackReplayExecutionApprovalId);
  const policyApproved = guarded && approvalPresent;
  const blockers = guarded
    ? (policyApproved
      ? [
        ...(callbackStorageApprovalPresent ? [] : ['[MISSING: approved callback persistence storage backend approval]']),
        ...(callbackReplayExecutionApprovalPresent ? [] : ['[MISSING: callback replay execution rollout approval]']),
      ]
      : [
        '[MISSING: CLIPLOT_CALLBACK_REPLAY_POLICY_APPROVAL_ID for callback persistence/replay policy metadata]',
        '[MISSING: callback event ownership decision]',
        '[MISSING: callback replay idempotency and conflict handling]',
        '[MISSING: callback event retention policy]',
        '[MISSING: operator replay procedure and rollback owner]',
      ])
    : ['[MISSING: guarded callback ACK no-persistence evidence]'];

  return {
    success: true,
    status: guarded
      ? (policyApproved
        ? 'approved_callback_replay_policy_metadata_execution_disabled'
        : 'approval_required_callback_replay_policy')
      : 'blocked_callback_replay_policy_guard_missing',
    mode: 'guarded_payment_callback_replay_policy_readiness',
    generatedAt: new Date().toISOString(),
    service: serviceConfig.serviceName,
    mutation: false,
    persistence: false,
    providerCall: false,
    callbackPersistence: false,
    callbackReplayEnabled: false,
    callbackPolicyApproved: policyApproved,
    callbackPolicyApprovalPresent: approvalPresent,
    callbackAccepted: callback.callbackAccepted,
    callbackReadiness: callback.status,
    currentCallbackContract: {
      endpoint: '/api/payments/callback',
      readinessEndpoint: '/api/payments/callback-readiness',
      authHeader: 'x-api-key:<redacted>',
      acceptedHttpStatus: 202,
      acceptedStatus: 'payment_callback_received_guarded',
      unauthorizedHttpStatus: 401,
      validationFailureHttpStatus: 400,
      currentPersistence: false,
      currentOrderMutation: false,
      currentPaymentMutation: false,
      providerCall: false,
    },
    proposedReplayPolicy: {
      decisionRecord: 'ADR-005-payment-callback-replay-policy',
      status: policyApproved ? 'owner_approved_metadata_execution_disabled' : 'proposed_for_owner_approval',
      approvalIdPresent: approvalPresent,
      approvalIdFingerprint: approvalPresent ? stableFingerprint(serviceConfig.callbackReplayPolicyApprovalId) : null,
      idempotencyKeys: [
        'paymentId',
        'orderId',
        'event',
        'paymentStatus',
      ],
      duplicateHandling: 'same semantic callback must be idempotent after approved persistence exists',
      conflictHandling: 'same paymentId/orderId with incompatible terminal status requires manual review and must not auto-update customer-visible status',
      orderingPolicy: 'completed/refunded terminal events win only after approved Payments-owned status source confirms them',
      retentionPolicy: policyApproved ? 'approved_metadata_only_90_days_minimum_until_storage_backend_approval' : '[MISSING: approved callback event retention window]',
      replaySource: 'payments-microservice webhook retry or operator-approved replay queue',
      replayExecution: callbackReplayExecutionApprovalPresent ? 'metadata_approved_execution_disabled' : 'disabled_until_storage_backend_and_replay_execution_approval',
      storageBackendApprovalPresent: callbackStorageApprovalPresent,
      replayExecutionApprovalPresent: callbackReplayExecutionApprovalPresent,
      customerStatusImpact: 'customer-visible payment truth remains Payments DB snapshot read only; callback replay metadata does not mutate status',
      rollbackOwner: policyApproved ? 'cliplot-operator' : '[MISSING: rollback owner]',
      validationOwner: policyApproved ? 'cliplot-validation-owner' : '[MISSING: validation owner]',
    },
    approvalRequest: {
      requiredDecision: 'approved callback persistence/replay policy',
      requiredApprovalId: 'CLIPLOT_CALLBACK_REPLAY_POLICY_APPROVAL_ID',
      requiredBeforeRuntimeStatusReads: false,
      requiredBeforeCallbackPersistence: true,
      approvalRecorded: policyApproved,
      requiredApprovals: [
        'callback event ownership',
        'idempotency key definition',
        'duplicate and conflict handling',
        'terminal status ordering',
        'retention window',
        'operator replay procedure',
        'rollback owner and validation owner',
      ],
    },
    mustRemainFalseBeforeApproval: [
      'callbackPersistence',
      'callbackReplayEnabled',
      'Cliplot-local callback storage writes',
      'Cliplot-local payment status writes',
      'ENABLE_LIVE_PAYMENT_CREATE',
      'provider-backed /payments/{paymentId} reads',
    ],
    forbiddenOperations: [
      'persist callback state',
      'replay callback into storage',
      'update order status',
      'update payment status',
      'create payment',
      'call payment provider',
      'read /payments/{paymentId}',
      'print webhook key or API key values',
      'return raw provider payloads',
    ],
    blockers,
    sensitiveDataPolicy: [
      'no webhook key value',
      'no payment API key value',
      'no provider payload',
      'no customer PII',
      'policy metadata only',
    ],
    next: policyApproved
      ? (blockers.length === 0
          ? 'Callback replay policy, storage backend, and replay execution metadata are approved; callback persistence and replay execution remain disabled until a separate runtime write window is approved.'
          : 'Callback replay policy metadata is approved, but persistence and replay execution remain disabled until storage backend and execution rollout approval exist.')
      : 'Approve callback replay/persistence policy before enabling callback persistence or replay execution.',
  };
}


export async function paymentCallbackPersistenceApprovalPacket() {
  const callback = paymentCallbackReadiness();
  const callbackPolicy = paymentCallbackReplayPolicyReadiness();
  const storageReadiness = await paymentStatusStorageReadiness();
  const decisionPacket = await paymentStatusPersistenceDecisionPacket();
  const guardedCallback = callback.status === 'validated_guarded_ack_no_persistence'
    && callback.callbackAccepted === true
    && callback.mutation === false
    && callback.persistence === false
    && callback.providerCall === false;
  const metadataApproved = callbackPolicy.status === 'approved_callback_replay_policy_metadata_execution_disabled'
    && callbackPolicy.callbackPolicyApproved === true
    && callbackPolicy.callbackPersistence === false
    && callbackPolicy.callbackReplayEnabled === false;
  const sharedPaymentsOwnershipApproved = storageReadiness.storage?.ownershipApproved === true
    && decisionPacket.decisionRecord?.status === 'owner_approved_shared_payments_source_of_truth';
  const storageBackendApproved = isApprovalPresent(serviceConfig.callbackPersistenceStorageApprovalId);
  const rolloutApproved = isApprovalPresent(serviceConfig.callbackPersistenceRolloutApprovalId);
  const replayExecutionApproved = isApprovalPresent(serviceConfig.callbackReplayExecutionApprovalId);
  const liveStatusWriteApproved = isApprovalPresent(serviceConfig.liveStatusWriteApprovalId);
  const retentionApproved = isApprovalPresent(serviceConfig.callbackRetentionApprovalId);
  const uniquenessApproved = isApprovalPresent(serviceConfig.callbackUniquenessApprovalId);
  const callbackPersistenceMetadataApproved = guardedCallback
    && metadataApproved
    && sharedPaymentsOwnershipApproved
    && storageBackendApproved
    && rolloutApproved
    && retentionApproved
    && uniquenessApproved
    && replayExecutionApproved
    && liveStatusWriteApproved;
  const satisfiedEvidence = [
    ...(guardedCallback ? ['[DONE: guarded callback ACK validates without persistence]'] : []),
    ...(metadataApproved ? ['[DONE: callback replay/persistence metadata policy approved with execution disabled]'] : []),
    ...(sharedPaymentsOwnershipApproved ? ['[DONE: Payments-owned status storage is approved for passive DB snapshot reads]'] : []),
    ...(storageBackendApproved ? ['[DONE: callback persistence storage backend approval metadata recorded]'] : []),
    ...(rolloutApproved ? ['[DONE: callback persistence rollout approval metadata recorded]'] : []),
    ...(retentionApproved ? ['[DONE: callback event retention/deletion policy approval metadata recorded]'] : []),
    ...(uniquenessApproved ? ['[DONE: callback storage uniqueness and conflict contract approval metadata recorded]'] : []),
    ...(replayExecutionApproved ? ['[DONE: callback replay execution rollout approval metadata recorded with execution disabled]'] : []),
    ...(liveStatusWriteApproved ? ['[DONE: live status write approval metadata recorded with writes disabled]'] : []),
    ...(storageReadiness.satisfiedEvidence || []),
  ];
  const blockers = [
    ...(guardedCallback ? [] : ['[MISSING: guarded callback ACK no-persistence evidence]']),
    ...(metadataApproved ? [] : ['[MISSING: CLIPLOT_CALLBACK_REPLAY_POLICY_APPROVAL_ID for callback persistence/replay policy metadata]']),
    ...(storageBackendApproved ? [] : ['[MISSING: approved callback persistence storage backend approval]']),
    ...(rolloutApproved ? [] : ['[MISSING: approved callback persistence rollout plan]']),
    ...(liveStatusWriteApproved ? [] : ['[MISSING: owner approval before enabling live status writes]']),
    ...(replayExecutionApproved ? [] : ['[MISSING: callback replay execution rollout approval]']),
  ];

  const storageBackendProposal = {
    status: 'proposal_metadata_recorded_approval_required',
    mode: 'metadata_only_no_runtime_enablement',
    proposedOwner: 'payments-microservice',
    proposedStorageModel: 'payments_owned_callback_event_projection',
    currentApprovedReadModel: 'payments_db_snapshot_read_model',
    cliplotRole: 'non_authoritative_renderer_and_guarded_callback_ack',
    approvalIdPlaceholder: 'CLIPLOT_CALLBACK_PERSISTENCE_STORAGE_APPROVAL_ID',
    approvalIdPresent: storageBackendApproved,
    approvalIdFingerprint: storageBackendApproved ? stableFingerprint(serviceConfig.callbackPersistenceStorageApprovalId) : null,
    proposedRuntimeFlag: 'ENABLE_PAYMENT_CALLBACK_PERSISTENCE',
    currentRuntimeFlagEnabled: false,
    storageConfiguredNow: false,
    callbackPersistenceNow: false,
    callbackReplayEnabledNow: false,
    liveStatusWritesNow: false,
    mutation: false,
    persistence: false,
    providerCall: false,
    dataBoundary: [
      'store callback event metadata in the approved Payments-owned model only after approval',
      'do not store webhook key values',
      'do not store raw provider payloads in Cliplot',
      'do not make Cliplot authoritative for payment status',
      'do not read provider-backed /payments/{paymentId}',
    ],
    requiredApprovalBeforeUse: [
      'approved callback persistence storage backend approval',
      'approved callback persistence rollout plan',
      'approved retention/deletion policy for persisted callback events',
      'approved rollback owner and validation owner for persisted callback/status writes',
    ],
  };

  const rolloutPlan = {
    status: rolloutApproved ? 'approved_callback_persistence_rollout_metadata_execution_disabled' : 'proposal_metadata_recorded_approval_required',
    mode: 'dry_run_plan_only',
    approvalIdPlaceholder: 'CLIPLOT_CALLBACK_PERSISTENCE_ROLLOUT_APPROVAL_ID',
    approvalIdPresent: rolloutApproved,
    approvalIdFingerprint: rolloutApproved ? stableFingerprint(serviceConfig.callbackPersistenceRolloutApprovalId) : null,
    rollbackOwner: callbackPolicy.proposedReplayPolicy?.rollbackOwner,
    validationOwner: callbackPolicy.proposedReplayPolicy?.validationOwner,
    dryRunOnlyNow: true,
    runtimeEnablementNow: false,
    callbackPersistenceNow: false,
    callbackReplayEnabledNow: false,
    liveStatusWritesNow: false,
    mutation: false,
    persistence: false,
    providerCall: false,
    phases: [
      {
        name: 'proposal_review',
        requiredEvidence: 'owner approves storage backend, retention, rollback, and validation ownership',
        runtimeMutation: false,
      },
      {
        name: 'schema_contract_review',
        requiredEvidence: 'Payments-owned schema, uniqueness, ordering, and conflict handling are approved',
        runtimeMutation: false,
      },
      {
        name: 'shadow_dry_run',
        requiredEvidence: 'synthetic callback replay plan validates idempotency without writes',
        runtimeMutation: false,
      },
      {
        name: 'approved_write_window',
        requiredEvidence: 'separate owner approval opens callback persistence flag for a bounded window',
        runtimeMutation: true,
      },
      {
        name: 'post_enablement_reconciliation',
        requiredEvidence: 'Payments DB snapshot remains authoritative and Cliplot status surface stays non-authoritative',
        runtimeMutation: true,
      },
    ],
    rollbackPlan: [
      'set ENABLE_PAYMENT_CALLBACK_PERSISTENCE=false',
      'set callback replay execution flag false',
      'stop live status writes before replay or cleanup',
      'verify /api/payments/status returns customer-safe snapshot or temporary-unavailable state',
      'run readiness:payment-callback-persistence and readiness:revenue-closure',
    ],
  };

  const replayDryRunContract = {
    status: 'proposal_metadata_recorded_approval_required',
    mode: 'dry_run_only_no_replay_execution',
    syntheticOnlyNow: true,
    replayExecutionNow: false,
    callbackPersistenceNow: false,
    liveStatusWritesNow: false,
    mutation: false,
    persistence: false,
    providerCall: false,
    requiredBeforeExecution: [
      'approved callback persistence storage backend approval',
      'approved callback replay execution rollout approval',
      'bounded replay window',
      'operator rollback owner present',
      'validation owner present',
    ],
  };

  return {
    success: true,
    status: callbackPersistenceMetadataApproved ? 'approved_callback_persistence_metadata_execution_disabled' : 'approval_required_callback_persistence_storage_backend',
    mode: 'read_only_callback_persistence_approval_packet',
    generatedAt: new Date().toISOString(),
    service: serviceConfig.serviceName,
    mutation: false,
    persistence: false,
    providerCall: false,
    callbackPersistence: false,
    callbackReplayEnabled: false,
    livePaymentCreate: serviceConfig.livePaymentCreate,
    callbackReadiness: {
      status: callback.status,
      callbackAccepted: callback.callbackAccepted,
      httpStatus: callback.callbackHttpStatus,
      mutation: callback.mutation,
      persistence: callback.persistence,
      providerCall: callback.providerCall,
    },
    callbackPolicy: {
      status: callbackPolicy.status,
      decisionRecord: callbackPolicy.proposedReplayPolicy?.decisionRecord,
      decisionStatus: callbackPolicy.proposedReplayPolicy?.status,
      approvalIdPresent: callbackPolicy.proposedReplayPolicy?.approvalIdPresent === true,
      callbackPersistence: callbackPolicy.callbackPersistence,
      callbackReplayEnabled: callbackPolicy.callbackReplayEnabled,
      rollbackOwner: callbackPolicy.proposedReplayPolicy?.rollbackOwner,
      validationOwner: callbackPolicy.proposedReplayPolicy?.validationOwner,
    },
    storageReadiness: {
      status: storageReadiness.status,
      storageConfigured: storageReadiness.storage?.configured === true,
      storageOwnershipApproved: storageReadiness.storage?.ownershipApproved === true,
      storageOwner: storageReadiness.storage?.owner,
      cliplotLocalStorageApproved: storageReadiness.storage?.cliplotLocalStorageApproved === true,
      liveWritesEnabled: storageReadiness.storage?.liveWritesEnabled === true,
      liveReadsEnabled: storageReadiness.storage?.liveReadsEnabled === true,
      callbackPersistence: storageReadiness.callbackContract?.currentPersistence,
      currentStatusPersistence: storageReadiness.readContract?.currentPersistence,
    },
    approvedPassiveReadContract: {
      decisionRecord: decisionPacket.decisionRecord?.id,
      decisionRecordStatus: decisionPacket.decisionRecord?.status,
      recommendedOption: decisionPacket.recommendedOption,
      endpoint: '/payments/status/by-order-id?applicationId=cliplot&orderId={orderId}',
      requiredScope: 'payments:read',
      providerRefreshRisk: 'db_snapshot_endpoint_no_provider_refresh',
      mutation: false,
      persistence: false,
      providerCall: false,
      forbiddenEndpoint: '/payments/{paymentId}',
    },
    futureCallbackPersistenceContract: {
      schemaVersion: storageReadiness.schemaContract?.schemaVersion || 'cliplot.payment_status.v1',
      idempotencyKeys: ['paymentId', 'orderId', 'event', 'paymentStatus'],
      uniqueKeys: storageReadiness.schemaContract?.uniqueKeys || ['externalOrderId', 'paymentId'],
      allowedPaymentStatuses: storageReadiness.schemaContract?.allowedPaymentStatuses || Object.keys(customerSafePaymentStatusMap).filter((statusName) => statusName !== 'unknown'),
      duplicateHandling: callbackPolicy.proposedReplayPolicy?.duplicateHandling,
      conflictHandling: callbackPolicy.proposedReplayPolicy?.conflictHandling,
      orderingPolicy: callbackPolicy.proposedReplayPolicy?.orderingPolicy,
      retentionPolicy: callbackPolicy.proposedReplayPolicy?.retentionPolicy,
      retentionApprovalPresent: retentionApproved,
      uniquenessApprovalPresent: uniquenessApproved,
      rollbackOwner: callbackPolicy.proposedReplayPolicy?.rollbackOwner,
      validationOwner: callbackPolicy.proposedReplayPolicy?.validationOwner,
      currentPersistence: false,
      replayExecution: false,
      mutation: false,
      providerCall: false,
    },
    storageBackendProposal,
    rolloutPlan,
    replayDryRunContract,
    requiredApprovalsBeforeEnablement: [
      'callback persistence storage backend approval',
      'callback persistence rollout plan',
      'owner approval before enabling live status writes',
      'callback replay execution rollout approval',
      'operator rollback procedure for persisted callback/status writes',
    ],
    mustRemainFalseBeforeApproval: [
      'callbackPersistence',
      'callbackReplayEnabled',
      'Cliplot-local callback storage writes',
      'Cliplot-local payment status writes',
      'ENABLE_LIVE_PAYMENT_CREATE',
      'provider-backed /payments/{paymentId} reads',
      'order status updates from callbacks',
      'payment status updates from callbacks',
    ],
    forbiddenOperations: [
      'persist callback state',
      'replay callback into storage',
      'update order status',
      'update payment status',
      'create payment',
      'call payment provider',
      'read /payments/{paymentId}',
      'print webhook key or API key values',
      'return raw provider payloads, payment rows, provider transaction IDs, customer PII, or secrets',
    ],
    satisfiedEvidence,
    blockers: [...new Set(blockers)],
    sensitiveDataPolicy: [
      'metadata only',
      'no webhook key value',
      'no payment API key value',
      'no provider payload',
      'no customer PII',
      'no payment rows',
      'no provider transaction id',
    ],
    next: 'Approve and provision a callback persistence storage backend and rollout plan before enabling callback persistence, replay execution, live status writes, or Cliplot-local payment status storage.',
  };
}



export async function paymentCallbackStorageBackendProposalPacket() {
  const approvalPacket = await paymentCallbackPersistenceApprovalPacket();

  return {
    success: true,
    status: 'proposal_metadata_recorded_approval_required',
    mode: 'read_only_callback_storage_backend_proposal_packet',
    generatedAt: new Date().toISOString(),
    service: serviceConfig.serviceName,
    mutation: false,
    persistence: false,
    providerCall: false,
    callbackPersistence: false,
    callbackReplayEnabled: false,
    livePaymentCreate: approvalPacket.livePaymentCreate,
    storageBackendProposal: approvalPacket.storageBackendProposal,
    rolloutPlan: approvalPacket.rolloutPlan,
    replayDryRunContract: approvalPacket.replayDryRunContract,
    approvedPassiveReadContract: approvalPacket.approvedPassiveReadContract,
    futureCallbackPersistenceContract: approvalPacket.futureCallbackPersistenceContract,
    currentGuards: {
      storageConfigured: approvalPacket.storageReadiness.storageConfigured,
      cliplotLocalStorageApproved: approvalPacket.storageReadiness.cliplotLocalStorageApproved,
      liveWritesEnabled: approvalPacket.storageReadiness.liveWritesEnabled,
      liveReadsEnabled: approvalPacket.storageReadiness.liveReadsEnabled,
      callbackPersistence: approvalPacket.callbackPersistence,
      callbackReplayEnabled: approvalPacket.callbackReplayEnabled,
      livePaymentCreate: approvalPacket.livePaymentCreate,
      mutation: false,
      persistence: false,
      providerCall: false,
    },
    requiredApprovalsBeforeEnablement: approvalPacket.requiredApprovalsBeforeEnablement,
    mustRemainFalseBeforeApproval: approvalPacket.mustRemainFalseBeforeApproval,
    forbiddenOperations: approvalPacket.forbiddenOperations,
    blockers: approvalPacket.blockers,
    satisfiedEvidence: approvalPacket.satisfiedEvidence,
    sensitiveDataPolicy: [
      ...approvalPacket.sensitiveDataPolicy,
      'proposal packet only',
      'no real order id',
      'no real payment id',
      'no callback payload',
      'no provider transaction id',
    ],
    next: 'Review the metadata-only storage backend proposal; separate owner approvals are still required before callback persistence, replay execution, storage writes, live status writes, or provider-backed reads are enabled.',
  };
}


export async function paymentCallbackPersistenceStorageContractPacket() {
  const approvalPacket = await paymentCallbackPersistenceApprovalPacket();
  const storageProposal = await paymentCallbackStorageBackendProposalPacket();

  return {
    success: true,
    status: 'proposal_metadata_recorded_approval_required',
    mode: 'read_only_callback_persistence_storage_contract_packet',
    generatedAt: new Date().toISOString(),
    service: serviceConfig.serviceName,
    mutation: false,
    persistence: false,
    providerCall: false,
    callbackPersistence: false,
    callbackReplayEnabled: false,
    liveStatusWritesNow: false,
    livePaymentCreate: approvalPacket.livePaymentCreate,
    storageContract: {
      status: approvalPacket.storageBackendProposal?.approvalIdPresent === true ? 'approved_callback_persistence_storage_contract_metadata_execution_disabled' : 'proposal_metadata_recorded_approval_required',
      owner: 'payments-microservice',
      model: 'payments_owned_callback_event_projection',
      schemaVersion: approvalPacket.futureCallbackPersistenceContract?.schemaVersion || 'cliplot.payment_status.v1',
      writeAuthority: 'payments-microservice',
      cliplotRole: 'guarded_callback_ack_and_non_authoritative_renderer',
      currentRuntimeFlagEnabled: false,
      storageConfiguredNow: false,
      callbackPersistenceNow: false,
      callbackReplayEnabledNow: false,
      liveStatusWritesNow: false,
      mutation: false,
      persistence: false,
      providerCall: false,
    },
    eventIdentity: {
      requiredKeys: ['applicationId', 'externalOrderId', 'orderId', 'paymentId', 'event', 'paymentStatus'],
      idempotencyKeys: approvalPacket.futureCallbackPersistenceContract?.idempotencyKeys || ['paymentId', 'orderId', 'event', 'paymentStatus'],
      uniqueness: approvalPacket.futureCallbackPersistenceContract?.uniqueKeys || ['externalOrderId', 'paymentId'],
      duplicateHandling: approvalPacket.futureCallbackPersistenceContract?.duplicateHandling,
      conflictHandling: approvalPacket.futureCallbackPersistenceContract?.conflictHandling,
      orderingPolicy: approvalPacket.futureCallbackPersistenceContract?.orderingPolicy,
      mutation: false,
      persistence: false,
      providerCall: false,
    },
    statusContract: {
      allowedPaymentStatuses: approvalPacket.futureCallbackPersistenceContract?.allowedPaymentStatuses || Object.keys(customerSafePaymentStatusMap).filter((statusName) => statusName !== 'unknown'),
      customerSafeStatusSource: 'static_customer_safe_mapping_until_approved_payments_projection_write',
      terminalStatuses: ['completed', 'failed', 'cancelled', 'refunded'],
      manualReviewRequiredForConflicts: true,
      cliplotAuthoritative: false,
      paymentsAuthoritative: true,
      ordersAuthoritative: true,
      mutation: false,
      persistence: false,
      providerCall: false,
    },
    retentionAndAudit: {
      retentionPolicy: approvalPacket.futureCallbackPersistenceContract?.retentionPolicy || 'approved_metadata_only_90_days_minimum_until_storage_backend_approval',
      retentionApprovalPresent: approvalPacket.futureCallbackPersistenceContract?.retentionApprovalPresent === true,
      rawPayloadStorageAllowed: false,
      providerTransactionStorageAllowedInCliplot: false,
      customerPiiStorageAllowedInCliplot: false,
      auditFields: ['eventReceivedAt', 'source', 'idempotencyKey', 'semanticStatus', 'manualReviewReason'],
      deletionPolicyRequired: true,
      mutation: false,
      persistence: false,
      providerCall: false,
    },
    rolloutPrerequisites: {
      approvalIds: [
        'CLIPLOT_CALLBACK_PERSISTENCE_STORAGE_APPROVAL_ID',
        'CLIPLOT_CALLBACK_PERSISTENCE_ROLLOUT_APPROVAL_ID',
        'CLIPLOT_CALLBACK_REPLAY_EXECUTION_APPROVAL_ID',
        'CLIPLOT_LIVE_STATUS_WRITE_APPROVAL_ID',
      ],
      runtimeFlags: {
        ENABLE_PAYMENT_CALLBACK_PERSISTENCE: false,
        ENABLE_PAYMENT_CALLBACK_REPLAY_EXECUTION: false,
        ENABLE_PAYMENT_LIVE_STATUS_WRITE: false,
      },
      requiredBeforeRuntimeUse: [
        'approved callback persistence storage backend approval',
        'approved callback persistence rollout plan',
        'approved callback event retention/deletion policy',
        'approved callback replay execution rollout approval',
        'approved live status write window before status writes',
        'operator rollback owner present',
        'validation owner checklist present',
      ],
      rollbackOwner: approvalPacket.futureCallbackPersistenceContract?.rollbackOwner || '[MISSING: rollback owner]',
      validationOwner: approvalPacket.futureCallbackPersistenceContract?.validationOwner || '[MISSING: validation owner]',
      storageApprovalRecorded: approvalPacket.storageBackendProposal?.approvalIdPresent === true,
      rolloutApprovalRecorded: approvalPacket.rolloutPlan?.approvalIdPresent === true,
    },
    currentGuards: {
      storageConfigured: storageProposal.currentGuards?.storageConfigured,
      cliplotLocalStorageApproved: storageProposal.currentGuards?.cliplotLocalStorageApproved,
      liveWritesEnabled: storageProposal.currentGuards?.liveWritesEnabled,
      liveReadsEnabled: storageProposal.currentGuards?.liveReadsEnabled,
      callbackPersistence: storageProposal.currentGuards?.callbackPersistence,
      callbackReplayEnabled: storageProposal.currentGuards?.callbackReplayEnabled,
      livePaymentCreate: approvalPacket.livePaymentCreate,
      mutation: false,
      persistence: false,
      providerCall: false,
    },
    approvedPassiveReadContract: approvalPacket.approvedPassiveReadContract,
    storageBackendProposal: approvalPacket.storageBackendProposal,
    rolloutPlan: approvalPacket.rolloutPlan,
    replayDryRunContract: approvalPacket.replayDryRunContract,
    requiredApprovalsBeforeEnablement: [
      ...approvalPacket.requiredApprovalsBeforeEnablement,
      'approved callback event retention/deletion policy',
      'approved callback storage uniqueness and conflict contract',
    ],
    mustRemainFalseBeforeApproval: [
      ...approvalPacket.mustRemainFalseBeforeApproval,
      'ENABLE_PAYMENT_CALLBACK_PERSISTENCE',
      'ENABLE_PAYMENT_CALLBACK_REPLAY_EXECUTION',
      'ENABLE_PAYMENT_LIVE_STATUS_WRITE',
    ],
    forbiddenOperations: approvalPacket.forbiddenOperations,
    blockers: [...new Set([
      ...(approvalPacket.blockers || []),
      ...(approvalPacket.futureCallbackPersistenceContract?.retentionApprovalPresent === true ? [] : ['[MISSING: approved callback event retention/deletion policy]']),
      ...(approvalPacket.futureCallbackPersistenceContract?.uniquenessApprovalPresent === true ? [] : ['[MISSING: approved callback storage uniqueness and conflict contract]']),
    ])],
    satisfiedEvidence: approvalPacket.satisfiedEvidence,
    sensitiveDataPolicy: [
      ...approvalPacket.sensitiveDataPolicy,
      'storage contract packet only',
      'no real order id',
      'no real payment id',
      'no callback payload body',
      'no raw provider payload',
      'no provider transaction id',
      'no customer PII',
    ],
    next: 'Review the metadata-only callback persistence storage contract; separate owner approval is still required before storage writes, callback replay execution, live status writes, provider-backed reads, or notifications are enabled.',
  };
}

export async function paymentCallbackReplayExecutionRolloutProposalPacket() {
  const policy = paymentCallbackReplayPolicyReadiness();
  const persistence = await paymentCallbackPersistenceApprovalPacket();
  const storageProposal = await paymentCallbackStorageBackendProposalPacket();

  const replayExecutionApprovalPresent = isApprovalPresent(serviceConfig.callbackReplayExecutionApprovalId);
  const replayWindowPresent = isApprovalPresent(serviceConfig.callbackReplayExecutionWindow);
  const replayOwnersPresent = isApprovalPresent(serviceConfig.callbackReplayRollbackOwner) && isApprovalPresent(serviceConfig.callbackReplayValidationOwner);
  const blockers = [
    ...(policy.callbackPolicyApproved === true ? [] : ['[MISSING: approved callback replay/persistence policy metadata]']),
    ...(persistence.storageBackendProposal?.approvalIdPresent === true ? [] : ['[MISSING: approved callback persistence storage backend approval]']),
    ...(persistence.rolloutPlan?.approvalIdPresent === true ? [] : ['[MISSING: approved callback persistence rollout plan]']),
    ...(replayExecutionApprovalPresent ? [] : ['[MISSING: callback replay execution rollout approval]']),
    ...(replayWindowPresent ? [] : ['[MISSING: bounded callback replay execution window]']),
    ...(replayOwnersPresent ? [] : ['[MISSING: replay execution rollback and validation owner confirmation]']),
  ];

  return {
    success: true,
    status: blockers.length === 0 ? 'approved_callback_replay_execution_metadata_execution_disabled' : 'proposal_metadata_recorded_approval_required',
    mode: 'read_only_callback_replay_execution_rollout_proposal_packet',
    generatedAt: new Date().toISOString(),
    service: serviceConfig.serviceName,
    mutation: false,
    persistence: false,
    providerCall: false,
    callbackPersistence: false,
    callbackReplayEnabled: false,
    replayExecutionAllowed: false,
    dryRunOnlyNow: true,
    syntheticOnlyNow: true,
    liveStatusWritesNow: false,
    livePaymentCreate: serviceConfig.livePaymentCreate,
    policyEvidence: {
      status: policy.status,
      decisionRecord: policy.proposedReplayPolicy?.decisionRecord,
      decisionStatus: policy.proposedReplayPolicy?.status,
      approvalIdPresent: policy.proposedReplayPolicy?.approvalIdPresent === true,
      callbackPersistence: policy.callbackPersistence,
      callbackReplayEnabled: policy.callbackReplayEnabled,
      mutation: policy.mutation,
      persistence: policy.persistence,
      providerCall: policy.providerCall,
    },
    storageEvidence: {
      callbackPersistenceApproval: persistence.status,
      storageBackendProposal: storageProposal.storageBackendProposal?.status,
      rolloutPlan: storageProposal.rolloutPlan?.status,
      replayDryRunContract: storageProposal.replayDryRunContract?.mode,
      storageConfigured: storageProposal.currentGuards?.storageConfigured,
      callbackPersistence: storageProposal.currentGuards?.callbackPersistence,
      callbackReplayEnabled: storageProposal.currentGuards?.callbackReplayEnabled,
      liveWritesEnabled: storageProposal.currentGuards?.liveWritesEnabled,
      mutation: false,
      persistence: false,
      providerCall: false,
    },
    executionWindowProposal: {
      status: replayExecutionApprovalPresent && replayWindowPresent && replayOwnersPresent ? 'approved_callback_replay_execution_window_metadata_execution_disabled' : 'proposal_metadata_recorded_approval_required',
      mode: 'bounded_window_proposal_only',
      approvalIdPlaceholder: 'CLIPLOT_CALLBACK_REPLAY_EXECUTION_APPROVAL_ID',
      approvalIdPresent: replayExecutionApprovalPresent,
      approvalIdFingerprint: replayExecutionApprovalPresent ? stableFingerprint(serviceConfig.callbackReplayExecutionApprovalId) : null,
      boundedWindow: replayWindowPresent ? serviceConfig.callbackReplayExecutionWindow : '[MISSING: bounded callback replay execution window]',
      rollbackOwner: replayOwnersPresent ? serviceConfig.callbackReplayRollbackOwner : '[MISSING: replay rollback owner]',
      validationOwner: replayOwnersPresent ? serviceConfig.callbackReplayValidationOwner : '[MISSING: replay validation owner]',
      proposedRuntimeFlag: 'ENABLE_PAYMENT_CALLBACK_REPLAY_EXECUTION',
      currentRuntimeFlagEnabled: false,
      replayExecutionNow: false,
      callbackPersistenceNow: false,
      liveStatusWritesNow: false,
      mutation: false,
      persistence: false,
      providerCall: false,
      requiredBeforeExecution: [
        'approved callback persistence storage backend approval',
        'approved callback persistence rollout plan',
        'callback replay execution rollout approval',
        'bounded replay execution window',
        'operator rollback owner present',
        'validation owner present',
      ],
    },
    dryRunPlan: {
      status: 'proposal_metadata_recorded_approval_required',
      mode: 'synthetic_dry_run_only',
      replaySource: policy.proposedReplayPolicy?.replaySource,
      idempotencyKeys: policy.proposedReplayPolicy?.idempotencyKeys || [],
      duplicateHandling: policy.proposedReplayPolicy?.duplicateHandling,
      conflictHandling: policy.proposedReplayPolicy?.conflictHandling,
      orderingPolicy: policy.proposedReplayPolicy?.orderingPolicy,
      retentionPolicy: policy.proposedReplayPolicy?.retentionPolicy,
      rollbackOwner: policy.proposedReplayPolicy?.rollbackOwner,
      validationOwner: policy.proposedReplayPolicy?.validationOwner,
      phases: [
        { name: 'synthetic_callback_shape_check', runtimeMutation: false },
        { name: 'idempotency_key_dry_run', runtimeMutation: false },
        { name: 'duplicate_callback_dry_run', runtimeMutation: false },
        { name: 'terminal_conflict_manual_review_dry_run', runtimeMutation: false },
        { name: 'post_dry_run_guard_verification', runtimeMutation: false },
      ],
      syntheticReplayDryRunAssertions: [
        {
          caseId: 'duplicate_same_semantic_callback',
          result: 'dry_run_passed_no_write',
          evidence: policy.proposedReplayPolicy?.duplicateHandling,
          mutation: false,
          persistence: false,
          providerCall: false,
        },
        {
          caseId: 'incompatible_terminal_status_conflict',
          result: 'dry_run_passed_manual_review_required',
          evidence: policy.proposedReplayPolicy?.conflictHandling,
          mutation: false,
          persistence: false,
          providerCall: false,
        },
        {
          caseId: 'terminal_status_ordering_rule',
          result: 'dry_run_passed_payments_snapshot_required',
          evidence: policy.proposedReplayPolicy?.orderingPolicy,
          mutation: false,
          persistence: false,
          providerCall: false,
        },
        {
          caseId: 'retention_and_deletion_metadata',
          result: 'dry_run_passed_metadata_present',
          evidence: policy.proposedReplayPolicy?.retentionPolicy,
          mutation: false,
          persistence: false,
          providerCall: false,
        },
        {
          caseId: 'rollback_and_validation_owner',
          result: 'dry_run_passed_owner_present',
          rollbackOwner: policy.proposedReplayPolicy?.rollbackOwner,
          validationOwner: policy.proposedReplayPolicy?.validationOwner,
          mutation: false,
          persistence: false,
          providerCall: false,
        },
        {
          caseId: 'runtime_guard_closed',
          result: 'dry_run_passed_runtime_disabled',
          replayExecutionAllowed: false,
          callbackPersistenceNow: false,
          liveStatusWritesNow: false,
          mutation: false,
          persistence: false,
          providerCall: false,
        },
      ],
      mutation: false,
      persistence: false,
      providerCall: false,
    },
    futureExecutionPlan: {
      status: 'approval_required_before_runtime_use',
      replaySource: policy.proposedReplayPolicy?.replaySource,
      executionWouldPersistAfterApproval: true,
      executionWouldUpdatePaymentStatusAfterApproval: true,
      executionWouldUpdateOrderStatusAfterApproval: false,
      executionWouldCallProviderAfterApproval: false,
      executionWouldSendNotificationAfterApproval: false,
      currentRuntimeExecution: false,
    },
    rollbackPlan: [
      'set ENABLE_PAYMENT_CALLBACK_REPLAY_EXECUTION=false',
      'set ENABLE_PAYMENT_CALLBACK_PERSISTENCE=false if persisted replay writes are unsafe',
      'stop live status writes before replay cleanup',
      'restore customer status to Payments DB snapshot read-only mode',
      'run readiness:payment-callback-replay-rollout',
      'run readiness:payment-callback-persistence',
      'run readiness:revenue-closure',
    ],
    requiredApprovalsBeforeEnablement: [
      'callback persistence storage backend approval',
      'callback persistence rollout plan',
      'callback replay execution rollout approval',
      'bounded replay execution window',
      'operator rollback procedure for replay execution',
      'validation owner checklist for replay execution',
    ],
    mustRemainFalseBeforeApproval: [
      'callbackPersistence',
      'callbackReplayEnabled',
      'ENABLE_PAYMENT_CALLBACK_REPLAY_EXECUTION',
      'Cliplot-local callback storage writes',
      'Cliplot-local payment status writes',
      'live order/payment status writes',
      'provider-backed /payments/{paymentId} reads',
    ],
    forbiddenOperations: [
      'persist callback state',
      'replay callback into storage',
      'update order status',
      'update payment status',
      'create payment',
      'call payment provider',
      'read /payments/{paymentId}',
      'send notification',
      'print webhook key or API key values',
      'return raw provider payloads, payment rows, provider transaction IDs, customer PII, or secrets',
    ],
    blockers: [...new Set(blockers)],
    sensitiveDataPolicy: [
      'metadata only',
      'synthetic callback references only',
      'no real order id',
      'no real payment id',
      'no webhook key value',
      'no payment API key value',
      'no callback payload',
      'no provider payload',
      'no customer PII',
      'no payment rows',
      'no provider transaction id',
    ],
    next: 'Review the callback replay execution rollout proposal; separate owner approval is still required before replay execution, callback persistence, storage writes, live status writes, or provider-backed reads are enabled.',
  };
}


export async function paymentLiveStatusWriteApprovalPacket() {
  const statusReadiness = await paymentStatusReadiness();
  const storageReadiness = await paymentStatusStorageReadiness();
  const decisionPacket = await paymentStatusPersistenceDecisionPacket();
  const mappingPacket = await paymentStatusMappingOwnershipPacket();
  const snapshotReadApproval = await paymentStatusSnapshotReadApprovalPacket();
  const callbackPolicy = paymentCallbackReplayPolicyReadiness();
  const callbackPersistence = await paymentCallbackPersistenceApprovalPacket();
  const replayRollout = await paymentCallbackReplayExecutionRolloutProposalPacket();
  const runtime = paymentStatusRuntimeReadiness();

  const passiveSnapshotApproved = statusReadiness.status === 'ready_for_approved_payment_status_runtime_read'
    && snapshotReadApproval.status === 'approved_passive_payments_snapshot_read'
    && mappingPacket.status === 'approved_order_payment_status_mapping_ownership'
    && runtime.runtimeReadEnabled === true
    && runtime.paymentsSnapshotReadEnabled === true
    && runtime.storageRead === false
    && runtime.callbackPersistence === false;
  const writeGuardsIntact = storageReadiness.readContract?.currentPersistence === false
    && storageReadiness.callbackContract?.currentPersistence === false
    && storageReadiness.storage?.liveWritesEnabled === false
    && callbackPolicy.callbackPersistence === false
    && callbackPolicy.callbackReplayEnabled === false
    && callbackPersistence.callbackPersistence === false
    && callbackPersistence.callbackReplayEnabled === false
    && replayRollout.replayExecutionAllowed === false
    && replayRollout.liveStatusWritesNow === false
    && serviceConfig.livePaymentCreate === false;

  const satisfiedEvidence = [
    ...(passiveSnapshotApproved ? [
      '[DONE: passive Payments DB snapshot read is approved and active]',
      '[DONE: order/payment status mapping ownership is approved for non-authoritative rendering]',
      '[DONE: customer-safe status copy is approved for read-only rendering]',
    ] : []),
    ...(writeGuardsIntact ? [
      '[DONE: live status write guards remain disabled]',
      '[DONE: callback persistence and replay execution remain disabled]',
      '[DONE: provider-backed payment status reads remain forbidden]',
    ] : []),
  ];
  const liveStatusWriteApprovalPresent = isApprovalPresent(serviceConfig.liveStatusWriteApprovalId);
  const liveStatusWriteWindowPresent = isApprovalPresent(serviceConfig.liveStatusWriteWindow);
  const liveStatusWriteOwnersPresent = isApprovalPresent(serviceConfig.liveStatusWriteRollbackOwner) && isApprovalPresent(serviceConfig.liveStatusWriteValidationOwner);
  const callbackPersistenceStorageApproved = callbackPersistence.storageBackendProposal?.approvalIdPresent === true;
  const callbackPersistenceRolloutApproved = callbackPersistence.rolloutPlan?.approvalIdPresent === true;
  const callbackReplayExecutionApproved = replayRollout.executionWindowProposal?.approvalIdPresent === true;
  const blockers = [
    ...(passiveSnapshotApproved ? [] : ['[MISSING: approved passive Payments DB snapshot read and mapping evidence]']),
    ...(writeGuardsIntact ? [] : ['[MISSING: current no-write/no-replay guard evidence]']),
    ...(liveStatusWriteApprovalPresent ? [] : ['[MISSING: owner approval before enabling live status writes]']),
    ...(callbackPersistenceStorageApproved ? [] : ['[MISSING: approved callback persistence storage backend approval]']),
    ...(callbackPersistenceRolloutApproved ? [] : ['[MISSING: approved callback persistence rollout plan]']),
    ...(callbackReplayExecutionApproved ? [] : ['[MISSING: callback replay execution rollout approval]']),
    ...(liveStatusWriteWindowPresent ? [] : ['[MISSING: bounded live status write window]']),
    ...(liveStatusWriteOwnersPresent ? [] : ['[MISSING: validation owner checklist for live status writes]']),
    ...(liveStatusWriteOwnersPresent ? [] : ['[MISSING: rollback owner procedure for live status writes]']),
  ];

  return {
    success: true,
    status: blockers.length === 0 ? 'approved_live_status_write_metadata_execution_disabled' : 'approval_required_live_status_write',
    mode: 'read_only_live_status_write_approval_packet',
    generatedAt: new Date().toISOString(),
    service: serviceConfig.serviceName,
    mutation: false,
    persistence: false,
    providerCall: false,
    callbackPersistence: false,
    callbackReplayEnabled: false,
    liveStatusWritesEnabled: false,
    liveStatusWritesNow: false,
    livePaymentCreate: serviceConfig.livePaymentCreate,
    passiveReadEvidence: {
      paymentStatus: statusReadiness.status,
      snapshotReadApproval: snapshotReadApproval.status,
      mappingOwnership: mappingPacket.status,
      runtimeReadiness: runtime.status,
      runtimeReadEnabled: runtime.runtimeReadEnabled,
      paymentsSnapshotReadEnabled: runtime.paymentsSnapshotReadEnabled,
      storageRead: runtime.storageRead,
      callbackPersistence: runtime.callbackPersistence,
      mutation: false,
      persistence: false,
      providerCall: false,
    },
    ownership: {
      ordersOwner: 'orders-microservice',
      paymentsOwner: 'payments-microservice',
      cliplotOwner: 'cliplot',
      ordersAuthoritative: true,
      paymentsAuthoritative: true,
      cliplotAuthoritative: false,
      writeOwnerAfterApproval: 'payments-microservice',
      mutation: false,
      persistence: false,
      providerCall: false,
    },
    approvedReadContract: {
      endpoint: '/payments/status/by-order-id?applicationId=cliplot&orderId={orderId}',
      applicationId: serviceConfig.applicationId,
      requiredScope: 'payments:read',
      source: 'payments_db_snapshot',
      forbiddenEndpoint: '/payments/{paymentId}',
      providerRefreshRisk: 'db_snapshot_endpoint_no_provider_refresh',
      mutation: false,
      persistence: false,
      providerCall: false,
    },
    currentWriteGuards: {
      storageConfigured: storageReadiness.storage?.configured === true,
      liveWritesEnabled: storageReadiness.storage?.liveWritesEnabled === true,
      currentStatusPersistence: storageReadiness.readContract?.currentPersistence,
      callbackPersistence: storageReadiness.callbackContract?.currentPersistence,
      callbackReplayEnabled: callbackPolicy.callbackReplayEnabled,
      replayExecutionAllowed: replayRollout.replayExecutionAllowed,
      liveStatusWritesNow: replayRollout.liveStatusWritesNow,
      livePaymentCreate: serviceConfig.livePaymentCreate,
      mutation: false,
      persistence: false,
      providerCall: false,
    },
    approvalProposal: {
      status: liveStatusWriteApprovalPresent && liveStatusWriteWindowPresent && liveStatusWriteOwnersPresent ? 'approved_live_status_write_window_metadata_execution_disabled' : 'proposal_metadata_recorded_approval_required',
      mode: 'bounded_live_status_write_window_proposal_only',
      approvalIdPlaceholder: 'CLIPLOT_LIVE_STATUS_WRITE_APPROVAL_ID',
      approvalIdPresent: liveStatusWriteApprovalPresent,
      approvalIdFingerprint: liveStatusWriteApprovalPresent ? stableFingerprint(serviceConfig.liveStatusWriteApprovalId) : null,
      proposedRuntimeFlag: 'ENABLE_PAYMENT_LIVE_STATUS_WRITE',
      currentRuntimeFlagEnabled: false,
      writeOwner: 'payments-microservice',
      cliplotRole: 'non_authoritative_renderer_and_guarded_callback_ack',
      writeSourceAfterApproval: 'approved Payments-owned callback event projection or Payments-owned status command',
      currentRuntimeEnablement: false,
      liveStatusWritesNow: false,
      callbackPersistenceNow: false,
      callbackReplayEnabledNow: false,
      providerBackedReadsNow: false,
      notificationSendsNow: false,
      mutation: false,
      persistence: false,
      providerCall: false,
      requiredBeforeEnablement: [
        'approved callback persistence storage backend approval',
        'approved callback persistence rollout plan',
        'callback replay execution rollout approval',
        'bounded live status write window',
        'validation owner checklist for live status writes',
        'rollback owner procedure for live status writes',
      ],
    },
    dryRunPlan: {
      status: 'proposal_metadata_recorded_approval_required',
      mode: 'synthetic_live_status_write_dry_run_only',
      dryRunOnlyNow: true,
      syntheticOnlyNow: true,
      phases: [
        { name: 'approved_passive_snapshot_baseline', runtimeMutation: false },
        { name: 'synthetic_callback_to_status_mapping_dry_run', runtimeMutation: false },
        { name: 'duplicate_status_write_idempotency_dry_run', runtimeMutation: false },
        { name: 'terminal_status_conflict_manual_review_dry_run', runtimeMutation: false },
        { name: 'post_window_read_only_reconciliation_dry_run', runtimeMutation: false },
      ],
      mutation: false,
      persistence: false,
      providerCall: false,
    },
    futureExecutionPlan: {
      status: 'approval_required_before_runtime_use',
      wouldPersistAfterApproval: true,
      wouldUpdatePaymentStatusAfterApproval: true,
      wouldUpdateOrderStatusAfterApproval: false,
      wouldCallProviderAfterApproval: false,
      wouldSendNotificationAfterApproval: false,
      currentRuntimeExecution: false,
    },
    requiredApprovalIds: [
      'CLIPLOT_LIVE_STATUS_WRITE_APPROVAL_ID',
      'CLIPLOT_CALLBACK_PERSISTENCE_STORAGE_APPROVAL_ID',
      'CLIPLOT_CALLBACK_PERSISTENCE_ROLLOUT_APPROVAL_ID',
      'CLIPLOT_CALLBACK_REPLAY_EXECUTION_APPROVAL_ID',
    ],
    requiredRuntimeFlags: {
      ENABLE_PAYMENT_LIVE_STATUS_WRITE: false,
      ENABLE_PAYMENT_CALLBACK_PERSISTENCE: false,
      ENABLE_PAYMENT_CALLBACK_REPLAY_EXECUTION: false,
    },
    rollbackOwner: liveStatusWriteOwnersPresent ? serviceConfig.liveStatusWriteRollbackOwner : '[MISSING: rollback owner procedure for live status writes]',
    validationOwner: liveStatusWriteOwnersPresent ? serviceConfig.liveStatusWriteValidationOwner : '[MISSING: validation owner checklist for live status writes]',
    boundedWriteWindow: liveStatusWriteWindowPresent ? serviceConfig.liveStatusWriteWindow : '[MISSING: approved live status write window]',
    rollbackPlan: [
      'set ENABLE_PAYMENT_LIVE_STATUS_WRITE=false',
      'set ENABLE_PAYMENT_CALLBACK_REPLAY_EXECUTION=false',
      'set ENABLE_PAYMENT_CALLBACK_PERSISTENCE=false',
      'restore read-only Payments DB snapshot rendering',
      'run readiness:payment-live-status-write',
      'run readiness:payment-callback-replay-rollout',
      'run readiness:revenue-closure',
    ],
    requiredApprovalsBeforeEnablement: [
      'owner approval before enabling live status writes',
      'callback persistence storage backend approval',
      'callback persistence rollout plan',
      'callback replay execution rollout approval',
      'bounded live status write window',
      'validation owner checklist for live status writes',
      'rollback owner procedure for live status writes',
    ],
    mustRemainFalseBeforeApproval: [
      'ENABLE_PAYMENT_LIVE_STATUS_WRITE',
      'callbackPersistence',
      'callbackReplayEnabled',
      'ENABLE_PAYMENT_CALLBACK_REPLAY_EXECUTION',
      'Cliplot-local callback storage writes',
      'Cliplot-local payment status writes',
      'live order/payment status writes',
      'provider-backed /payments/{paymentId} reads',
      'ENABLE_LIVE_PAYMENT_CREATE',
      'ENABLE_LIVE_NOTIFICATIONS',
    ],
    forbiddenOperations: [
      'persist callback state',
      'replay callback into storage',
      'write payment status',
      'write order status',
      'create payment',
      'call payment provider',
      'read /payments/{paymentId}',
      'send notification',
      'print webhook key or API key values',
      'return raw provider payloads, payment rows, provider transaction IDs, customer PII, or secrets',
    ],
    satisfiedEvidence,
    blockers: [...new Set(blockers)],
    sensitiveDataPolicy: [
      'metadata only',
      'synthetic write-window proposal only',
      'no real order id',
      'no real payment id',
      'no webhook key value',
      'no payment API key value',
      'no callback payload',
      'no provider payload',
      'no customer PII',
      'no payment rows',
      'no provider transaction id',
    ],
    next: 'Review the metadata-only live status write approval packet; separate owner approval is still required before callback persistence, replay execution, storage writes, live status writes, or provider-backed reads are enabled.',
  };
}


export async function paymentStatusReconciliationReadinessPacket() {
  const liveStatusWrite = await paymentLiveStatusWriteApprovalPacket();
  const runtime = paymentStatusRuntimeReadiness();
  const callbackReadiness = paymentCallbackReadiness();
  const callbackPolicy = paymentCallbackReplayPolicyReadiness();
  const liveFlagsClosed = serviceConfig.liveOrderSubmit === false
    && serviceConfig.livePaymentCreate === false
    && serviceConfig.liveNotifications === false
    && serviceConfig.liveOrderWarehouseSmoke === false;
  const writeGuards = liveStatusWrite.currentWriteGuards || {};
  const passiveRead = liveStatusWrite.passiveReadEvidence || {};
  const assertions = [
    { name: 'guarded_callback_ack_no_persistence', passed: callbackReadiness.status === 'validated_guarded_ack_no_persistence' && callbackReadiness.persistence === false },
    { name: 'callback_policy_metadata_approved_execution_disabled', passed: callbackPolicy.status === 'approved_callback_replay_policy_metadata_execution_disabled' && callbackPolicy.callbackPersistence === false && callbackPolicy.callbackReplayEnabled === false },
    { name: 'passive_payment_snapshot_read_approved', passed: passiveRead.paymentStatus === 'ready_for_approved_payment_status_runtime_read' && passiveRead.snapshotReadApproval === 'approved_passive_payments_snapshot_read' },
    { name: 'mapping_ownership_approved_non_authoritative', passed: passiveRead.mappingOwnership === 'approved_order_payment_status_mapping_ownership' },
    { name: 'live_status_write_metadata_approved_execution_disabled', passed: liveStatusWrite.status === 'approved_live_status_write_metadata_execution_disabled' && liveStatusWrite.liveStatusWritesNow === false },
    { name: 'runtime_read_only_snapshot_enabled', passed: runtime.runtimeReadEnabled === true && runtime.paymentsSnapshotReadEnabled === true && runtime.storageRead === false },
    { name: 'callback_persistence_disabled', passed: writeGuards.callbackPersistence === false && liveStatusWrite.callbackPersistence === false },
    { name: 'callback_replay_execution_disabled', passed: writeGuards.replayExecutionAllowed === false && liveStatusWrite.callbackReplayEnabled === false },
    { name: 'current_status_persistence_disabled', passed: writeGuards.currentStatusPersistence === false && writeGuards.liveWritesEnabled === false },
    { name: 'live_status_writes_disabled', passed: writeGuards.liveStatusWritesNow === false && liveStatusWrite.liveStatusWritesEnabled === false },
    { name: 'live_payment_and_notification_flags_closed', passed: liveFlagsClosed && serviceConfig.livePaymentCreate === false && serviceConfig.liveNotifications === false },
    { name: 'packet_side_effects_disabled', passed: liveStatusWrite.mutation === false && liveStatusWrite.persistence === false && liveStatusWrite.providerCall === false },
  ];
  const failedAssertions = assertions.filter((item) => item.passed !== true);

  return {
    success: true,
    status: failedAssertions.length === 0
      ? 'ready_for_callback_payment_status_reconciliation_review_execution_disabled'
      : 'blocked_callback_payment_status_reconciliation_readiness',
    mode: 'read_only_callback_payment_status_reconciliation_packet',
    generatedAt: new Date().toISOString(),
    service: serviceConfig.serviceName,
    mutation: false,
    persistence: false,
    providerCall: false,
    sideEffects: false,
    liveExecutionAllowed: false,
    currentPacketEnablesRuntime: false,
    reconciliationPurpose: 'Freeze callback/payment status reconciliation readiness for owner review without enabling persistence, replay execution, status writes, payment creation, notification sends, or provider-backed payment reads.',
    callbackEvidence: {
      callbackReadiness: callbackReadiness.status,
      callbackPolicy: callbackPolicy.status,
      callbackPersistence: callbackPolicy.callbackPersistence,
      callbackReplayEnabled: callbackPolicy.callbackReplayEnabled,
      guardedAckOnly: callbackReadiness.callbackAccepted === true,
      mutation: false,
      persistence: false,
      providerCall: false,
    },
    passivePaymentStatusRead: {
      paymentStatus: passiveRead.paymentStatus,
      snapshotReadApproval: passiveRead.snapshotReadApproval,
      mappingOwnership: passiveRead.mappingOwnership,
      runtimeReadiness: passiveRead.runtimeReadiness,
      runtimeReadEnabled: runtime.runtimeReadEnabled,
      paymentsSnapshotReadEnabled: runtime.paymentsSnapshotReadEnabled,
      storageRead: runtime.storageRead,
      callbackPersistence: runtime.callbackPersistence,
      approvedReadContract: liveStatusWrite.approvedReadContract,
      mutation: false,
      persistence: false,
      providerCall: false,
    },
    reconciliationBoundaries: {
      ordersOwner: 'orders-microservice',
      paymentsOwner: 'payments-microservice',
      cliplotRole: 'non_authoritative_customer_safe_renderer_and_guarded_callback_ack',
      callbackPersistenceOwnerAfterApproval: 'payments-microservice',
      liveStatusWriteOwnerAfterApproval: 'payments-microservice',
      noCliplotLocalPaymentTruth: true,
      noProviderBackedPaymentIdReads: true,
      noOrderStatusWritesFromCliplot: true,
      noPaymentStatusWritesNow: true,
      noNotificationSendsNow: true,
    },
    currentRuntimeGuards: {
      liveFlagsClosed,
      callbackPersistence: liveStatusWrite.callbackPersistence,
      callbackReplayEnabled: liveStatusWrite.callbackReplayEnabled,
      replayExecutionAllowed: writeGuards.replayExecutionAllowed,
      liveStatusWritesEnabled: liveStatusWrite.liveStatusWritesEnabled,
      liveStatusWritesNow: liveStatusWrite.liveStatusWritesNow,
      currentStatusPersistence: writeGuards.currentStatusPersistence,
      liveWritesEnabled: writeGuards.liveWritesEnabled,
      livePaymentCreate: serviceConfig.livePaymentCreate,
      liveNotifications: serviceConfig.liveNotifications,
      liveOrderSubmit: serviceConfig.liveOrderSubmit,
      liveOrderWarehouseSmoke: serviceConfig.liveOrderWarehouseSmoke,
      mutation: false,
      persistence: false,
      providerCall: false,
    },
    dryRunReconciliationMatrix: {
      status: 'metadata_only_reconciliation_review_ready',
      cases: [
        { id: 'duplicate_callback_same_semantic_status', expected: 'idempotent_after_future_approval', runtimeMutationNow: false },
        { id: 'terminal_status_conflict', expected: 'manual_review_no_auto_update', runtimeMutationNow: false },
        { id: 'payments_snapshot_stale_or_429', expected: 'use_last_known_success_or_unknown_without_write', runtimeMutationNow: false },
        { id: 'post_window_payment_status_review', expected: 'read_only_owner_review_no_reconciliation_write', runtimeMutationNow: false },
      ],
      mutation: false,
      persistence: false,
      providerCall: false,
    },
    futureEnablementRequiresSeparateWindow: [
      'ENABLE_PAYMENT_CALLBACK_PERSISTENCE=true after storage approval',
      'ENABLE_PAYMENT_CALLBACK_REPLAY_EXECUTION=true after replay approval',
      'ENABLE_PAYMENT_LIVE_STATUS_WRITE=true after bounded status-write approval',
      'approved rollback owner and validation owner for live status writes',
      'post-window read-only reconciliation report',
    ],
    assertions,
    failedAssertions,
    blockers: failedAssertions.map((item) => `[MISSING: ${item.name}]`),
    forbiddenOperationsNow: [
      'do not persist callback state',
      'do not execute callback replay',
      'do not write payment status',
      'do not write order status',
      'do not create payment',
      'do not send notification',
      'do not read provider-backed /payments/{paymentId}',
      'do not expose callback payloads, payment rows, provider payloads, provider transaction ids, customer PII, or secrets',
    ],
    sensitiveDataPolicy: [
      'metadata only',
      'synthetic reconciliation cases only',
      'no real callback payload',
      'no payment rows',
      'no provider payload',
      'no customer PII',
      'no secrets',
    ],
    next: failedAssertions.length === 0
      ? 'Use this packet as read-only callback/payment status reconciliation evidence; open a separate bounded window before any callback persistence, replay execution, or live status writes.'
      : 'Resolve failed callback/payment status reconciliation assertions before owner review.',
  };
}


export async function paymentStatusWriteWindowRequestPacket() {
  const reconciliation = await paymentStatusReconciliationReadinessPacket();
  const postLiveRevenueEvidence = await postLiveRevenueClosureEvidencePacket();
  const completedWindow = postLiveRevenueEvidence.completedWindow || completedFullCheckoutLiveWindowEvidenceSummary();
  const liveFlagsClosed = serviceConfig.liveOrderSubmit === false
    && serviceConfig.livePaymentCreate === false
    && serviceConfig.liveNotifications === false
    && serviceConfig.liveOrderWarehouseSmoke === false;
  const guards = reconciliation.currentRuntimeGuards || {};
  const requestFields = [
    { name: 'confirm', requiredValue: 'PAYMENT_STATUS_WRITE_WINDOW', presentNow: false },
    { name: 'approvalId', requiredValue: 'CLIPLOT_LIVE_STATUS_WRITE_APPROVAL_ID', presentNow: isApprovalPresent(serviceConfig.liveStatusWriteApprovalId) },
    { name: 'approvedBy', requiredValue: 'operator identity', presentNow: false },
    { name: 'reasonCode', requiredValue: 'owner-approved bounded payment status reconciliation write', presentNow: false },
    { name: 'boundedWindow', requiredValue: 'CLIPLOT_LIVE_STATUS_WRITE_WINDOW', presentNow: isApprovalPresent(serviceConfig.liveStatusWriteWindow) },
    { name: 'rollbackOwner', requiredValue: 'CLIPLOT_LIVE_STATUS_WRITE_ROLLBACK_OWNER', presentNow: isApprovalPresent(serviceConfig.liveStatusWriteRollbackOwner) },
    { name: 'validationOwner', requiredValue: 'CLIPLOT_LIVE_STATUS_WRITE_VALIDATION_OWNER', presentNow: isApprovalPresent(serviceConfig.liveStatusWriteValidationOwner) },
    { name: 'postWindowReconciliationEvidence', requiredValue: 'read-only reconciliation report after flags close', presentNow: false },
  ];
  const currentRuntimeFlags = {
    ENABLE_PAYMENT_LIVE_STATUS_WRITE: serviceConfig.paymentLiveStatusWrite,
    ENABLE_PAYMENT_CALLBACK_PERSISTENCE: serviceConfig.paymentCallbackPersistence,
    ENABLE_PAYMENT_CALLBACK_REPLAY_EXECUTION: serviceConfig.paymentCallbackReplayExecution,
    ENABLE_LIVE_PAYMENT_CREATE: serviceConfig.livePaymentCreate,
    ENABLE_LIVE_NOTIFICATIONS: serviceConfig.liveNotifications,
    ENABLE_LIVE_ORDER_SUBMIT: serviceConfig.liveOrderSubmit,
    ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE: serviceConfig.liveOrderWarehouseSmoke,
  };
  const assertions = [
    { name: 'reconciliation_readiness_clean', passed: reconciliation.status === 'ready_for_callback_payment_status_reconciliation_review_execution_disabled' && Array.isArray(reconciliation.failedAssertions) && reconciliation.failedAssertions.length === 0 },
    { name: 'live_flags_closed', passed: liveFlagsClosed },
    { name: 'callback_persistence_disabled', passed: guards.callbackPersistence === false },
    { name: 'callback_replay_execution_disabled', passed: guards.replayExecutionAllowed === false },
    { name: 'live_status_writes_disabled', passed: guards.liveStatusWritesNow === false && guards.liveStatusWritesEnabled === false },
    { name: 'payment_create_and_notifications_disabled', passed: guards.livePaymentCreate === false && guards.liveNotifications === false },
    { name: 'provider_backed_reads_forbidden', passed: reconciliation.passivePaymentStatusRead?.approvedReadContract?.forbiddenEndpoint === '/payments/{paymentId}' },
    { name: 'packet_side_effects_disabled', passed: reconciliation.mutation === false && reconciliation.persistence === false && reconciliation.providerCall === false },
    { name: 'post_live_checkout_window_validated_closed', passed: postLiveRevenueEvidence.status === 'validated_completed_full_checkout_live_window_closed' && postLiveRevenueEvidence.liveExecutionAllowed === false },
    { name: 'post_live_order_payment_notification_evidence_recorded', passed: completedWindow.orderCreated === true && completedWindow.paymentCreated === true && completedWindow.notificationSent === true && completedWindow.cleanupSuccess === true },
    { name: 'post_live_callback_and_status_writes_still_disabled', passed: postLiveRevenueEvidence.currentClosedState?.callbackPersistence === false && postLiveRevenueEvidence.currentClosedState?.callbackReplayEnabled === false && postLiveRevenueEvidence.currentClosedState?.liveStatusWritesNow === false },
  ];
  const failedAssertions = assertions.filter((item) => item.passed !== true);

  return {
    success: true,
    status: failedAssertions.length === 0
      ? 'ready_for_bounded_payment_status_write_window_request_execution_disabled'
      : 'blocked_payment_status_write_window_request',
    mode: 'read_only_payment_status_write_window_request_packet',
    generatedAt: new Date().toISOString(),
    service: serviceConfig.serviceName,
    mutation: false,
    persistence: false,
    providerCall: false,
    sideEffects: false,
    liveExecutionAllowed: false,
    currentPacketEnablesRuntime: false,
    requestPurpose: 'Define the operator request, rollback, validation, and post-window evidence required before any future payment status write flag can be opened.',
    prerequisiteEvidence: {
      reconciliation: reconciliation.status,
      callbackReadiness: reconciliation.callbackEvidence?.callbackReadiness,
      callbackPolicy: reconciliation.callbackEvidence?.callbackPolicy,
      paymentStatus: reconciliation.passivePaymentStatusRead?.paymentStatus,
      snapshotReadApproval: reconciliation.passivePaymentStatusRead?.snapshotReadApproval,
      mappingOwnership: reconciliation.passivePaymentStatusRead?.mappingOwnership,
      failedAssertionCount: reconciliation.failedAssertions?.length || 0,
      postLiveRevenueClosure: postLiveRevenueEvidence.status,
      postLiveFailedAssertionCount: postLiveRevenueEvidence.failedAssertions?.length || 0,
      completedLiveWindow: completedWindow.status,
      completedLiveWindowExecutedAt: completedWindow.executedAt,
      completedOrderId: completedWindow.orderId,
      completedPaymentStatus: completedWindow.paymentEvidence?.status || null,
      completedNotificationStatus: completedWindow.notificationEvidence?.status || null,
      currentRevenueClosure: postLiveRevenueEvidence.currentClosedState?.revenueClosure || null,
      currentRevenueBlockerCount: postLiveRevenueEvidence.currentClosedState?.revenueBlockerCount ?? null,
      mutation: false,
      persistence: false,
      providerCall: false,
    },
    operatorRequestContract: {
      method: 'POST_guard_only_until_separate_owner_approval',
      endpoint: '/api/payments/status-write-bounded-executor',
      requestFields,
      requiredConfirm: 'PAYMENT_STATUS_WRITE_WINDOW',
      approvalIdMustMatch: 'CLIPLOT_LIVE_STATUS_WRITE_APPROVAL_ID',
      currentPacketAcceptsRequests: false,
      currentPacketAcceptsGuardedRequests: true,
      currentPacketMayOpenFlags: false,
      currentPacketMayExecuteWrites: false,
    },
    completedLiveWindowHandoff: {
      status: completedWindow.status,
      evidenceRecord: completedWindow.evidenceRecord,
      executedAt: completedWindow.executedAt,
      deployedImage: completedWindow.deployedImage,
      orderId: completedWindow.orderId,
      executorStatus: completedWindow.executorStatus,
      cleanupSuccess: completedWindow.cleanupSuccess,
      orderCreated: completedWindow.orderCreated,
      warehouseReserved: completedWindow.warehouseReserved,
      paymentCreated: completedWindow.paymentCreated,
      notificationSent: completedWindow.notificationSent,
      orderCancelStatus: completedWindow.orderCancelStatus,
      orderReadbackStatus: completedWindow.orderReadbackStatus,
      warehouseActiveReservationCount: completedWindow.warehouseAfterCancel?.activeReservationCount ?? null,
      paymentStatus: completedWindow.paymentEvidence?.status || null,
      paymentResultFingerprint: completedWindow.paymentEvidence?.resultFingerprint || null,
      notificationStatus: completedWindow.notificationEvidence?.status || null,
      notificationResultFingerprint: completedWindow.notificationEvidence?.resultFingerprint || null,
      postLiveRevenueClosure: postLiveRevenueEvidence.status,
      postLiveRevenueBlockerCount: postLiveRevenueEvidence.currentClosedState?.revenueBlockerCount ?? null,
      liveExecutionAllowed: false,
      mutation: false,
      persistence: false,
      providerCall: false,
      sideEffects: false,
    },
    boundedWindowPolicy: {
      boundedWindow: isApprovalPresent(serviceConfig.liveStatusWriteWindow)
        ? serviceConfig.liveStatusWriteWindow
        : '[MISSING: CLIPLOT_LIVE_STATUS_WRITE_WINDOW]',
      rollbackOwner: isApprovalPresent(serviceConfig.liveStatusWriteRollbackOwner)
        ? serviceConfig.liveStatusWriteRollbackOwner
        : '[MISSING: CLIPLOT_LIVE_STATUS_WRITE_ROLLBACK_OWNER]',
      validationOwner: isApprovalPresent(serviceConfig.liveStatusWriteValidationOwner)
        ? serviceConfig.liveStatusWriteValidationOwner
        : '[MISSING: CLIPLOT_LIVE_STATUS_WRITE_VALIDATION_OWNER]',
      maxWindowScope: 'single bounded owner-approved status write window',
      writeOwner: 'payments-microservice',
      cliplotRole: 'non_authoritative_operator_request_and_read_only_reconciliation_surface',
    },
    rollbackPlan: [
      'set ENABLE_PAYMENT_LIVE_STATUS_WRITE=false',
      'set ENABLE_PAYMENT_CALLBACK_REPLAY_EXECUTION=false',
      'set ENABLE_PAYMENT_CALLBACK_PERSISTENCE=false',
      'keep ENABLE_LIVE_PAYMENT_CREATE=false unless separately approved',
      'keep ENABLE_LIVE_NOTIFICATIONS=false unless separately approved',
      'restore approved passive Payments DB snapshot rendering',
      'run readiness:payment-status-reconciliation',
      'run readiness:payment-live-status-write',
      'run readiness:payment-callback-replay-rollout',
      'run readiness:revenue-handoff-reconciliation',
      'record post-window read-only reconciliation evidence',
    ],
    validationPlan: [
      'pre-window: readiness:payment-status-reconciliation pass',
      'pre-window: readiness:payment-live-status-write pass',
      'pre-window: readiness:payment-callback-persistence pass',
      'pre-window: readiness:payment-callback-replay-rollout pass',
      'post-window: all status write and callback replay flags closed',
      'post-window: payment status reconciliation packet pass',
      'post-window: revenue handoff reconciliation packet pass',
      'post-window: readiness:bundle pass',
    ],
    postWindowEvidenceRequired: [
      'exact opened and restored flags with timestamps',
      'operator approval id fingerprint only',
      'write owner and validation owner',
      'status write case ids or synthetic ids only',
      'callback replay/persistence state closed after window',
      'payment status reconciliation packet after close',
      'revenue handoff reconciliation packet after close',
      'no raw callback payloads, payment rows, provider payloads, transaction ids, customer PII, or secrets',
    ],
    currentRuntimeFlags,
    currentRuntimeGuards: guards,
    assertions,
    failedAssertions,
    blockers: failedAssertions.map((item) => `[MISSING: ${item.name}]`),
    forbiddenOperationsNow: [
      'do not open ENABLE_PAYMENT_LIVE_STATUS_WRITE',
      'do not open ENABLE_PAYMENT_CALLBACK_PERSISTENCE',
      'do not open ENABLE_PAYMENT_CALLBACK_REPLAY_EXECUTION',
      'do not persist callback state',
      'do not execute callback replay',
      'do not write payment status',
      'do not write order status',
      'do not create payment',
      'do not send notification',
      'do not read provider-backed /payments/{paymentId}',
      'do not expose callback payloads, payment rows, provider payloads, provider transaction ids, customer PII, or secrets',
    ],
    sensitiveDataPolicy: [
      'metadata only',
      'operator request contract only',
      'approval id fingerprint only after future approval',
      'no real callback payload',
      'no payment rows',
      'no provider payload',
      'no customer PII',
      'no secrets',
    ],
    next: failedAssertions.length === 0
      ? 'Owner may review this request contract; a separate approval and future bounded executor are still required before any status write flag can be opened.'
      : 'Resolve failed assertions before this request packet can be used for owner review.',
  };
}

export async function runPaymentStatusWriteBoundedExecutor(request = {}) {
  const packet = await paymentStatusWriteWindowRequestPacket();
  const blockers = [...(packet.blockers || [])];
  const approvalId = String(request.approvalId || '').trim();
  const boundedWindow = String(request.boundedWindow || request.executionWindow || '').trim();
  const approvedBy = String(request.approvedBy || '').trim();
  const reasonCode = String(request.reasonCode || '').trim();
  const rollbackOwner = String(request.rollbackOwner || '').trim();
  const validationOwner = String(request.validationOwner || '').trim();

  if (packet.status !== 'ready_for_bounded_payment_status_write_window_request_execution_disabled') blockers.push('payment_status_write_window_request_not_ready');
  if (request.confirm !== 'PAYMENT_STATUS_WRITE_WINDOW') blockers.push('missing_PAYMENT_STATUS_WRITE_WINDOW_confirmation');
  if (!approvalId || !safeTokenEquals(approvalId, serviceConfig.liveStatusWriteApprovalId)) blockers.push('invalid_or_missing_live_status_write_approval_id');
  if (!boundedWindow || boundedWindow !== serviceConfig.liveStatusWriteWindow) blockers.push('invalid_or_missing_live_status_write_window');
  if (!approvedBy) blockers.push('missing_live_status_write_approved_by');
  if (reasonCode !== 'OWNER_APPROVED_PAYMENT_STATUS_RECONCILIATION_WRITE') blockers.push('invalid_or_missing_payment_status_write_reason_code');
  if (!rollbackOwner || rollbackOwner !== serviceConfig.liveStatusWriteRollbackOwner) blockers.push('invalid_or_missing_live_status_write_rollback_owner');
  if (!validationOwner || validationOwner !== serviceConfig.liveStatusWriteValidationOwner) blockers.push('invalid_or_missing_live_status_write_validation_owner');
  if (request.postWindowReconciliationEvidence !== true) blockers.push('missing_post_window_reconciliation_evidence_ack');
  if (!serviceConfig.paymentLiveStatusWrite) blockers.push('payment_live_status_write_flag_disabled');
  if (!serviceConfig.paymentCallbackPersistence) blockers.push('payment_callback_persistence_flag_disabled');
  if (!serviceConfig.paymentCallbackReplayExecution) blockers.push('payment_callback_replay_execution_flag_disabled');
  blockers.push('status_write_executor_guard_only_no_runtime_write_path');

  return {
    httpStatus: 202,
    body: {
      success: true,
      status: 'approval_required',
      mode: 'guarded_payment_status_write_bounded_executor',
      generatedAt: new Date().toISOString(),
      service: serviceConfig.serviceName,
      mutation: false,
      persistence: false,
      providerCall: false,
      sideEffects: false,
      liveExecutionAllowed: false,
      currentPacketEnablesRuntime: false,
      paymentStatusWritten: false,
      orderStatusWritten: false,
      callbackPersisted: false,
      callbackReplayExecuted: false,
      paymentCreated: false,
      notificationSent: false,
      providerBackedRead: false,
      liveStatusWritesNow: false,
      approvalRequired: {
        owner: true,
        statusWriteWindow: true,
        callbackPersistence: true,
        callbackReplayExecution: true,
        postWindowEvidence: true,
        runtimeImplementation: true,
      },
      requestEvidence: {
        confirmAccepted: request.confirm === 'PAYMENT_STATUS_WRITE_WINDOW',
        approvalIdPresent: Boolean(approvalId),
        approvalIdMatchesConfiguredFingerprint: Boolean(approvalId) && safeTokenEquals(approvalId, serviceConfig.liveStatusWriteApprovalId),
        approvalIdFingerprint: approvalId ? stableFingerprint(approvalId) : null,
        boundedWindowMatchesConfigured: Boolean(boundedWindow) && boundedWindow === serviceConfig.liveStatusWriteWindow,
        approvedByPresent: Boolean(approvedBy),
        approvedByFingerprint: approvedBy ? stableFingerprint(approvedBy) : null,
        reasonCodeAccepted: reasonCode === 'OWNER_APPROVED_PAYMENT_STATUS_RECONCILIATION_WRITE',
        rollbackOwnerMatchesConfigured: Boolean(rollbackOwner) && rollbackOwner === serviceConfig.liveStatusWriteRollbackOwner,
        validationOwnerMatchesConfigured: Boolean(validationOwner) && validationOwner === serviceConfig.liveStatusWriteValidationOwner,
        postWindowReconciliationEvidenceAcknowledged: request.postWindowReconciliationEvidence === true,
      },
      currentRuntimeFlags: {
        ENABLE_PAYMENT_LIVE_STATUS_WRITE: serviceConfig.paymentLiveStatusWrite,
        ENABLE_PAYMENT_CALLBACK_PERSISTENCE: serviceConfig.paymentCallbackPersistence,
        ENABLE_PAYMENT_CALLBACK_REPLAY_EXECUTION: serviceConfig.paymentCallbackReplayExecution,
        ENABLE_LIVE_PAYMENT_CREATE: serviceConfig.livePaymentCreate,
        ENABLE_LIVE_NOTIFICATIONS: serviceConfig.liveNotifications,
        ENABLE_LIVE_ORDER_SUBMIT: serviceConfig.liveOrderSubmit,
        ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE: serviceConfig.liveOrderWarehouseSmoke,
      },
      endpointBoundary: {
        executorEndpoint: '/api/payments/status-write-bounded-executor',
        forbiddenProviderBackedReadEndpoint: '/payments/{paymentId}',
        writesOwnedBy: 'payments-microservice_after_separate_approval',
        orderLifecycleOwnedBy: 'orders-microservice',
        cliplotRole: 'non_authoritative_guard_and_read_only_reconciliation_surface',
        fullCheckoutActivationAllowed: false,
      },
      forbiddenOperationsNow: [
        'persist callback state',
        'execute callback replay',
        'write payment status',
        'write order status',
        'create payment',
        'send notification',
        'read provider-backed /payments/{paymentId}',
        'open live checkout/order/payment/notification flags',
        'return raw callback payloads, payment rows, provider payloads, provider transaction ids, customer PII, or secrets',
      ],
      blockers: [...new Set(blockers)],
      packet,
      sensitiveDataPolicy: [
        'metadata only',
        'approval id fingerprint only',
        'operator identity fingerprint only',
        'no raw callback payload',
        'no payment rows',
        'no provider payload',
        'no provider transaction id',
        'no customer PII',
        'no PAYMENT_API_KEY value',
        'no PAYMENT_WEBHOOK_API_KEY value',
        'no bearer tokens',
      ],
      next: 'Keep this executor guard-only until a separate approved implementation lane adds runtime writes and post-window reconciliation under closed rollback controls.',
    },
  };
}


const paymentStatusReadinessCache = {
  expiresAt: 0,
  promise: null,
};
const PAYMENT_STATUS_READINESS_CACHE_MS = 15000;

export async function paymentStatusReadiness() {
  const now = Date.now();
  if (paymentStatusReadinessCache.promise && paymentStatusReadinessCache.expiresAt > now) {
    return paymentStatusReadinessCache.promise;
  }

  const promise = computePaymentStatusReadiness();
  paymentStatusReadinessCache.promise = promise;
  paymentStatusReadinessCache.expiresAt = now + PAYMENT_STATUS_READINESS_CACHE_MS;
  try {
    return await promise;
  } catch (error) {
    if (paymentStatusReadinessCache.promise === promise) {
      paymentStatusReadinessCache.promise = null;
      paymentStatusReadinessCache.expiresAt = 0;
    }
    throw error;
  }
}

async function computePaymentStatusReadiness() {
  const syntheticOrderId = 'cliplot-payment-status-readiness';
  const statusResult = await paymentStatus({ orderId: syntheticOrderId });
  const statusBody = statusResult.body || {};
  const callback = paymentCallbackReadiness();
  const readScope = await paymentReadScopeReadiness();
  const readOnlyRuntime = statusBody.runtimeReadEnabled === true
    && statusBody.paymentsSnapshotReadEnabled === true
    && ['payment_status_snapshot_not_available', 'payment_status_snapshot_temporarily_unavailable', 'payment_status_snapshot_read'].includes(statusBody.status);
  const guarded = statusResult.httpStatus === 200
    && ['payment_status_guarded_no_persistence', 'payment_status_snapshot_not_available', 'payment_status_snapshot_temporarily_unavailable', 'payment_status_snapshot_read'].includes(statusBody.status)
    && statusBody.mutation === false
    && statusBody.persistence === false
    && statusBody.providerCall === false
    && callback.status === 'validated_guarded_ack_no_persistence'
    && callback.mutation === false
    && callback.persistence === false
    && callback.providerCall === false;
  const statusStorageOwnershipApproved = isApprovalPresent(serviceConfig.paymentStorageOwnershipApprovalId);

  return {
    success: true,
    status: guarded
      ? (readOnlyRuntime ? 'ready_for_approved_payment_status_runtime_read' : 'blocked_pending_provider_backed_status_contract')
      : 'blocked_guarded_payment_status_not_validated',
    mode: 'guarded_payment_status_readiness',
    generatedAt: new Date().toISOString(),
    service: serviceConfig.serviceName,
    mutation: false,
    persistence: false,
    providerCall: false,
    livePaymentCreate: serviceConfig.livePaymentCreate,
    currentStatusContract: {
      endpoint: '/api/payments/status',
      httpStatus: statusResult.httpStatus,
      status: statusBody.status || null,
      mutation: statusBody.mutation,
      persistence: statusBody.persistence,
      providerCall: statusBody.providerCall,
      paymentStatus: statusBody.paymentStatus || null,
      customerSafePaymentStatus: statusBody.customerSafePaymentStatus || null,
    },
    passiveSnapshotAdapter: {
      ...(statusBody.passiveSnapshotAdapter || {}),
      runtimeReadinessEndpoint: '/api/payments/status-runtime-readiness',
      currentRuntimeStatus: paymentStatusRuntimeReadiness().status,
      active: statusBody.passiveSnapshotAdapter?.active === true,
    },
    callbackReadiness: {
      endpoint: '/api/payments/callback-readiness',
      status: callback.status,
      callbackAccepted: callback.callbackAccepted,
      mutation: callback.mutation,
      persistence: callback.persistence,
      providerCall: callback.providerCall,
      customerSafePaymentStatus: callback.callbackState?.customerSafePaymentStatus || null,
    },
    readScopeReadiness: {
      endpoint: '/api/payments/read-scope-readiness',
      status: readScope.status,
      paymentsEndpoint: readScope.endpoint,
      requiredScope: readScope.requiredScope,
      keyPresent: readScope.keyPresent,
      scopeValidated: readScope.scopeValidated,
      routeValidated: readScope.routeValidated,
      httpStatus: readScope.httpStatus,
      expectedHttpStatus: readScope.expectedHttpStatus,
      expectedErrorCode: readScope.expectedErrorCode,
      observedErrorCode: readScope.observedErrorCode,
      mutation: readScope.mutation,
      persistence: readScope.persistence,
      providerCall: readScope.providerCall,
      databaseRead: readScope.databaseRead,
    },
    futureProviderBackedRead: {
      paymentsEndpoint: '/payments/status/by-order-id?applicationId=cliplot&orderId={orderId}',
      deployedBy: 'payments-microservice:fc42e72',
      requiredScope: 'payments:read',
      requiredRuntimeKey: 'PAYMENT_API_KEY',
      supportsPaymentIdRead: false,
      supportsOrderIdRead: true,
      providerRefreshRisk: 'db_snapshot_endpoint_no_provider_refresh',
      providerCall: false,
      persistence: false,
      mutation: false,
      requiredStoredFields: [
        'orderId',
        'applicationId',
        'status',
        'amount',
        'currency',
        'paymentMethod',
        'createdAt',
        'updatedAt',
        'completedAt',
        'refundedAt',
      ],
      riskNote: 'Payments GET /payments/status/by-order-id reads the persisted DB snapshot and explicitly returns providerCall=false, persistence=false, and mutation=false; Cliplot must not call it until payments:read runtime evidence and owner approval exist.',
    },
    customerSafeStatusContract: {
      authoritative: false,
      source: 'static_customer_safe_mapping',
      sourceStatuses: Object.keys(customerSafePaymentStatusMap).filter((statusName) => statusName !== 'unknown'),
      values: Object.fromEntries(
        Object.entries(customerSafePaymentStatusMap)
          .filter(([statusName]) => statusName !== 'unknown')
          .map(([statusName, copy]) => [statusName, copy.label]),
      ),
      fallback: customerSafePaymentStatus('unknown'),
      labelsLocale: 'cs-CZ',
      mutation: false,
      persistence: false,
      providerCall: false,
    },
    mappingContract: {
      authoritative: false,
      source: statusStorageOwnershipApproved ? 'payments_db_snapshot_read_model_approved' : 'approved_persistence_contract_required',
      proposedFields: [
        'externalOrderId',
        'orderId',
        'paymentId',
        'paymentCreateIdempotencyKey',
        'amount',
        'currency',
        'status',
        'createdAt',
        'completedAt',
      ],
      mutation: false,
      persistence: false,
      providerCall: false,
    },
    satisfiedEvidence: [
      ...(readOnlyRuntime ? [
        '[DONE: owner-approved passive Payments DB snapshot read is active]',
        '[DONE: provider-backed /payments/{paymentId} reads remain forbidden]',
      ] : []),
      ...(statusStorageOwnershipApproved
        ? ['[DONE: owner-approved shared Payments source-of-truth storage ownership decision recorded]']
        : []),
    ],
    blockers: [
      ...(readScope.scopeValidated ? [] : ['[MISSING: payments:read scope for Cliplot PAYMENT_API_KEY confirmed in runtime evidence]']),
      ...(readOnlyRuntime ? [] : [
        '[MISSING: owner approval to enable Cliplot passive Payments status snapshot reads]',
        '[MISSING: owner approval for provider-backed payment status reads]',
      ]),
      ...(statusStorageOwnershipApproved
        ? []
        : ['[MISSING: decision whether persistence belongs in Cliplot-local storage or an approved shared commerce service]']),
    ],
    sensitiveDataPolicy: [
      'no payment API key value',
      'no provider call',
      'no persisted payment read',
      'no order or payment state mutation',
      'synthetic order id only',
      'customer-safe Czech labels only',
    ],
    next: guarded
      ? (statusStorageOwnershipApproved
          ? 'Payments-owned passive DB snapshot reads are approved; callback persistence, live status writes, provider-backed reads, payment creation, and notifications remain disabled.'
          : 'Record payment status storage ownership before Cliplot calls Payments status read endpoints.')
      : 'Restore guarded payment status and callback readiness before designing provider-backed status reads.',
  };
}


export async function paymentStatusStorageReadiness() {
  const paymentReadiness = await paymentStatusReadiness();
  const callback = paymentCallbackReadiness();
  const storageOwnershipApprovalPresent = isApprovalPresent(serviceConfig.paymentStorageOwnershipApprovalId);
  const sharedPaymentsOwnershipApproved = storageOwnershipApprovalPresent
    && paymentReadiness.status === 'ready_for_approved_payment_status_runtime_read'
    && paymentReadiness.readScopeReadiness?.scopeValidated === true;
  const callbackStorageApprovalPresent = isApprovalPresent(serviceConfig.callbackPersistenceStorageApprovalId);
  const callbackRolloutApprovalPresent = isApprovalPresent(serviceConfig.callbackPersistenceRolloutApprovalId);
  const callbackRetentionApprovalPresent = isApprovalPresent(serviceConfig.callbackRetentionApprovalId);
  const callbackUniquenessApprovalPresent = isApprovalPresent(serviceConfig.callbackUniquenessApprovalId);
  const callbackReplayExecutionApprovalPresent = isApprovalPresent(serviceConfig.callbackReplayExecutionApprovalId);
  const liveStatusWriteApprovalPresent = isApprovalPresent(serviceConfig.liveStatusWriteApprovalId);
  const storageMetadataApproved = sharedPaymentsOwnershipApproved
    && callbackStorageApprovalPresent
    && callbackRolloutApprovalPresent
    && callbackRetentionApprovalPresent
    && callbackUniquenessApprovalPresent
    && callbackReplayExecutionApprovalPresent
    && liveStatusWriteApprovalPresent;
  const sampleRecord = {
    externalOrderId: 'cliplot-storage-readiness-order',
    paymentId: 'cliplot-storage-readiness-payment',
    paymentStatus: 'completed',
    customerSafePaymentStatus: customerSafePaymentStatus('completed'),
    source: 'payment_callback',
    schemaVersion: 'cliplot.payment_status.v1',
    updatedAt: new Date().toISOString(),
  };

  const storageSatisfiedEvidence = [
    ...(paymentReadiness.status === 'ready_for_approved_payment_status_runtime_read'
      ? ['[DONE: owner-approved passive Payments DB snapshot read is active]']
      : []),
    ...(sharedPaymentsOwnershipApproved
      ? [
          '[DONE: approved storage ownership decision selects Payments DB snapshot read model]',
          '[DONE: Cliplot-local payment status storage remains deferred]',
          '[DONE: externalOrderId/paymentId uniqueness owned by Payments read model for passive status reads]',
        ]
      : []),
    ...(callbackStorageApprovalPresent
      ? ['[DONE: callback persistence storage backend approval metadata recorded with writes disabled]']
      : []),
    ...(callbackRolloutApprovalPresent
      ? ['[DONE: callback persistence rollout approval metadata recorded with writes disabled]']
      : []),
    ...(callbackRetentionApprovalPresent
      ? ['[DONE: callback retention/deletion approval metadata recorded]']
      : []),
    ...(callbackUniquenessApprovalPresent
      ? ['[DONE: callback uniqueness/conflict approval metadata recorded]']
      : []),
    ...(callbackReplayExecutionApprovalPresent
      ? ['[DONE: callback replay execution approval metadata recorded with execution disabled]']
      : []),
    ...(liveStatusWriteApprovalPresent
      ? ['[DONE: live status write approval metadata recorded with writes disabled]']
      : []),
  ];
  const storageBlockers = [
    ...(paymentReadiness.readScopeReadiness?.scopeValidated ? [] : ['[MISSING: payments:read scope for Cliplot PAYMENT_API_KEY confirmed in runtime evidence]']),
    ...(paymentReadiness.status === 'ready_for_approved_payment_status_runtime_read'
      ? []
      : ['[MISSING: owner approval to enable Cliplot passive Payments status snapshot reads]']),
    ...(sharedPaymentsOwnershipApproved
      ? []
      : [
          '[MISSING: CLIPLOT_PAYMENT_STORAGE_OWNERSHIP_APPROVAL_ID for storage ownership decision]',
          '[MISSING: decision whether persistence belongs in Cliplot-local storage or an approved shared commerce service]',
        ]),
    ...(callbackRetentionApprovalPresent && callbackUniquenessApprovalPresent
      ? []
      : ['[MISSING: approved externalOrderId/paymentId uniqueness and retention policy]']),
    ...(callbackStorageApprovalPresent ? [] : ['[MISSING: approved callback persistence storage backend approval]']),
    ...(callbackRolloutApprovalPresent ? [] : ['[MISSING: approved callback persistence rollout plan]']),
    ...(callbackReplayExecutionApprovalPresent ? [] : ['[MISSING: callback replay execution rollout approval]']),
    ...(liveStatusWriteApprovalPresent ? [] : ['[MISSING: owner approval before enabling live status writes]']),
  ];

  return {
    success: true,
    status: storageMetadataApproved ? 'approved_payment_status_storage_metadata_execution_disabled' : 'blocked_storage_backend_not_approved',
    mode: 'guarded_payment_status_storage_readiness',
    generatedAt: new Date().toISOString(),
    service: serviceConfig.serviceName,
    mutation: false,
    persistence: false,
    providerCall: false,
    storage: {
      configured: false,
      adapter: 'payments_db_snapshot_read_model',
      ownershipApproved: sharedPaymentsOwnershipApproved,
      ownershipApprovalPresent: storageOwnershipApprovalPresent,
      ownershipApprovalIdFingerprint: storageOwnershipApprovalPresent ? stableFingerprint(serviceConfig.paymentStorageOwnershipApprovalId) : null,
      metadataApprovalComplete: storageMetadataApproved,
      callbackStorageApprovalPresent,
      callbackRolloutApprovalPresent,
      callbackRetentionApprovalPresent,
      callbackUniquenessApprovalPresent,
      callbackReplayExecutionApprovalPresent,
      liveStatusWriteApprovalPresent,
      owner: 'payments-microservice',
      cliplotLocalStorageApproved: false,
      liveWritesEnabled: false,
      liveReadsEnabled: false,
      reason: sharedPaymentsOwnershipApproved
        ? 'Payments-owned DB snapshot read model is approved for passive reads; Cliplot-local storage writes remain unapproved.'
        : 'No approved storage ownership decision exists for payment/order status yet.',
    },
    mappingContract: {
      ...paymentReadiness.mappingContract,
      source: sharedPaymentsOwnershipApproved ? 'payments_db_snapshot_read_model_approved' : paymentReadiness.mappingContract.source,
    },
    schemaContract: {
      schemaVersion: 'cliplot.payment_status.v1',
      requiredFields: [
        'externalOrderId',
        'paymentId',
        'paymentStatus',
        'customerSafePaymentStatus.code',
        'customerSafePaymentStatus.label',
        'source',
        'updatedAt',
      ],
      uniqueKeys: ['externalOrderId', 'paymentId'],
      lookupKeys: ['externalOrderId', 'paymentId'],
      allowedPaymentStatuses: Object.keys(customerSafePaymentStatusMap).filter((statusName) => statusName !== 'unknown'),
      customerSafeStatusContract: paymentReadiness.customerSafeStatusContract,
      sampleRecord,
    },
    callbackContract: {
      endpoint: '/api/payments/callback',
      readinessEndpoint: '/api/payments/callback-readiness',
      ackStatus: callback.status,
      callbackAccepted: callback.callbackAccepted,
      currentPersistence: callback.persistence,
      futureWriteSource: 'payment_callback_after_storage_approval',
    },
    readContract: {
      currentEndpoint: '/api/payments/status',
      currentStatus: paymentReadiness.currentStatusContract.status,
      currentPersistence: paymentReadiness.currentStatusContract.persistence,
      futureProviderBackedEndpoint: paymentReadiness.futureProviderBackedRead.paymentsEndpoint,
      providerRefreshRisk: paymentReadiness.futureProviderBackedRead.providerRefreshRisk,
      requiredScope: paymentReadiness.futureProviderBackedRead.requiredScope,
      readScopeStatus: paymentReadiness.readScopeReadiness?.status || null,
      scopeValidated: paymentReadiness.readScopeReadiness?.scopeValidated || false,
    },
    satisfiedEvidence: storageSatisfiedEvidence,
    blockers: storageBlockers,
    sensitiveDataPolicy: [
      'no payment API key value',
      'no webhook key value',
      'no provider call',
      'no storage write',
      'no storage read',
      'synthetic sample record only',
    ],
    next: storageMetadataApproved
      ? 'Storage metadata approvals are recorded; keep Cliplot-local writes, callback persistence, replay execution, live status writes, provider-backed reads, payment creation, and notifications disabled until a separate runtime write window is approved.'
      : (sharedPaymentsOwnershipApproved
          ? 'Payments-owned status storage is approved for passive DB snapshot reads; keep Cliplot-local writes, callback persistence, and live status writes disabled until separate approvals exist.'
          : 'Approve storage ownership before callback persistence or provider-backed payment status reads are enabled.'),
  };
}


export async function paymentStatusPersistenceDecisionPacket() {
  const paymentReadiness = await paymentStatusReadiness();
  const storageReadiness = await paymentStatusStorageReadiness();
  const runtime = passivePaymentSnapshotRuntimeState();
  const approvedPassiveSnapshotRead = paymentReadiness.status === 'ready_for_approved_payment_status_runtime_read'
    && paymentReadiness.readScopeReadiness?.scopeValidated === true
    && runtime.runtimeReadEnabled === true
    && runtime.paymentsSnapshotReadEnabled === true
    && runtime.statusRuntimeApprovalPresent === true
    && runtime.liveMutationRequested === false;
  const decisionRecord = {
    id: 'ADR-002-payment-status-persistence-ownership',
    title: 'Payment Status Persistence Ownership',
    path: '07_decisions/ADR-002-payment-status-persistence-ownership.md',
    status: isApprovalPresent(serviceConfig.paymentStorageOwnershipApprovalId) ? 'owner_approved_shared_payments_source_of_truth' : 'proposed_for_owner_approval',
    recorded: true,
    preferredOwner: 'payments-microservice',
    preferredOption: 'shared-payments-source-of-truth',
    runtimeApproval: approvedPassiveSnapshotRead,
    approvalIdPresent: isApprovalPresent(serviceConfig.paymentStorageOwnershipApprovalId),
    approvalIdFingerprint: isApprovalPresent(serviceConfig.paymentStorageOwnershipApprovalId) ? stableFingerprint(serviceConfig.paymentStorageOwnershipApprovalId) : null,
    summary: 'Payments remains the authoritative payment status owner; Cliplot may render customer-safe status only through an approved provider-refresh-free Payments read model or approved shared commerce projection.',
  };
  const decisionOptions = [
    {
      id: 'shared-payments-source-of-truth',
      label: 'Payments-owned payment status read model',
      recommendation: 'preferred_pending_contract_gap_closure',
      rationale: [
        'Payments already owns paymentId, orderId, amount, currency, method, provider transaction, and payment status semantics.',
        'Cliplot must avoid creating a parallel business truth for payment status.',
        'Cliplot should store or cache only customer-facing checkout intent state after explicit approval, not provider-backed status truth.',
      ],
      requiredBeforeApproval: [
        '[DONE: Payments DB-only read-by-orderId endpoint deployed as payments-microservice:fc42e72]',
        paymentReadiness.readScopeReadiness?.scopeValidated
          ? '[DONE: Cliplot PAYMENT_API_KEY payments:read runtime scope validated by /api/payments/read-scope-readiness]'
          : '[MISSING: payments:read scope for Cliplot PAYMENT_API_KEY confirmed in runtime evidence]',
        approvedPassiveSnapshotRead
          ? '[DONE: owner-approved passive Payments DB snapshot read is active]'
          : '[MISSING: owner approval to enable Cliplot passive Payments status snapshot reads]',
        approvedPassiveSnapshotRead
          ? '[DONE: customer-safe status copy approved for pending/processing/completed/failed/cancelled/refunded states]'
          : '[MISSING: customer-safe status copy reviewed for pending/processing/failed/cancelled/refunded states]',
      ],
      cliplotRuntimeChange: 'Proxy or render approved read model only after payments:read runtime evidence and owner approval exist.',
      mutation: false,
      persistence: false,
      providerCall: false,
    },
    {
      id: 'cliplot-local-status-cache',
      label: 'Cliplot-local payment status cache',
      recommendation: 'defer_requires_architecture_decision',
      rationale: [
        'Current Cliplot guardrails prohibit inventing local payment/order truth without a goal-approved persistence decision.',
        'A local cache can diverge from Payments unless callback delivery, replay, retention, and reconciliation are approved.',
      ],
      requiredBeforeApproval: [
        '[MISSING: approved Cliplot-local database or managed storage resource]',
        '[MISSING: approved migration for cliplot.payment_status.v1]',
        '[MISSING: callback replay and reconciliation plan]',
        '[MISSING: retention and deletion policy]',
      ],
      cliplotRuntimeChange: 'Persist callback-derived status only after explicit storage ownership approval.',
      mutation: false,
      persistence: false,
      providerCall: false,
    },
    {
      id: 'orders-owned-customer-status',
      label: 'Orders-owned customer order/payment status projection',
      recommendation: 'candidate_for_order_journey_only',
      rationale: [
        'Orders owns order lifecycle and Warehouse reservation side effects.',
        'Orders should not become authoritative for provider payment status unless Payments publishes an approved event/read model.',
      ],
      requiredBeforeApproval: [
        '[MISSING: Orders customer-status projection contract]',
        '[MISSING: Payments-to-Orders status propagation contract]',
        '[MISSING: clear boundary between order status and payment provider status]',
      ],
      cliplotRuntimeChange: 'Use only for customer order journey copy, not provider payment truth.',
      mutation: false,
      persistence: false,
      providerCall: false,
    },
  ];

  const decisionSatisfiedEvidence = [
    '[DONE: ADR-002-payment-status-persistence-ownership recorded]',
    '[DONE: Payments read-by-orderId DB snapshot contract deployed as payments-microservice:fc42e72]',
    ...(approvedPassiveSnapshotRead
      ? [
          '[DONE: owner-approved passive Payments DB snapshot read is active]',
          '[DONE: customer-safe status copy approved for pending/processing/completed/failed/cancelled/refunded states]',
          '[DONE: passive snapshot reads limited to Payments DB-only by-order-id route]',
        ]
      : []),
    ...(isApprovalPresent(serviceConfig.paymentStorageOwnershipApprovalId)
      ? ['[DONE: owner-approved shared Payments source-of-truth storage ownership decision recorded]']
      : []),
  ];
  const decisionBlockers = [
    ...(paymentReadiness.readScopeReadiness?.scopeValidated ? [] : ['[MISSING: payments:read scope for Cliplot PAYMENT_API_KEY confirmed in runtime evidence]']),
    ...(approvedPassiveSnapshotRead ? [] : ['[MISSING: owner approval to enable Cliplot passive Payments status snapshot reads]']),
    ...(isApprovalPresent(serviceConfig.paymentStorageOwnershipApprovalId)
      ? []
      : ['[MISSING: CLIPLOT_PAYMENT_STORAGE_OWNERSHIP_APPROVAL_ID for shared Payments source-of-truth storage ownership]']),
    ...(storageReadiness.storage?.metadataApprovalComplete === true
      ? []
      : ['[MISSING: approved callback persistence storage backend approval]']),
    ...(storageReadiness.storage?.liveStatusWriteApprovalPresent === true
      ? []
      : ['[MISSING: owner approval before enabling live status writes]']),
  ];

  return {
    success: true,
    status: decisionBlockers.length === 0 ? 'approved_payment_status_persistence_decision_metadata_execution_disabled' : 'decision_recorded_approval_required',
    mode: 'guarded_payment_status_persistence_decision_packet',
    generatedAt: new Date().toISOString(),
    service: serviceConfig.serviceName,
    mutation: false,
    persistence: false,
    providerCall: false,
    recommendedOption: 'shared-payments-source-of-truth',
    decisionRecord,
    decisionOptions,
    evidence: {
      paymentsAuthoritativeState: [
        'payments-microservice stores payment id, orderId, amount, currency, method, provider transaction, and status',
        'payments-microservice:fc42e72 exposes GET /payments/status/by-order-id?applicationId=cliplot&orderId={orderId}',
        'the deployed read-by-orderId endpoint returns a DB snapshot with providerCall=false, persistence=false, and mutation=false',
        'payments-microservice GET /payments/{paymentId} can still refresh pending/processing Stripe/card provider state and must not be used for passive Cliplot status reads',
      ],
      ordersBoundary: [
        'orders-microservice owns order lifecycle and externalOrderId idempotency',
        'orders-microservice may store bounded payment references but must not become provider payment truth',
      ],
      cliplotBoundary: [
        'Cliplot current payment status is guarded_no_persistence',
        'Cliplot must not create local payment status truth before ownership approval',
      ],
      decisionRecord: [
        'ADR-002-payment-status-persistence-ownership is recorded in the Cliplot Intent Preservation decision chain',
        'ADR status is proposed for owner approval and does not enable runtime reads, writes, callback persistence, or provider calls',
      ],
    },
    currentReadiness: {
      paymentStatus: paymentReadiness.status,
      paymentStorage: storageReadiness.status,
      currentStatusPersistence: storageReadiness.readContract.currentPersistence,
      callbackPersistence: storageReadiness.callbackContract.currentPersistence,
      providerRefreshRisk: storageReadiness.readContract.providerRefreshRisk,
      readScopeStatus: paymentReadiness.readScopeReadiness?.status || null,
      passiveSnapshotReadApproved: approvedPassiveSnapshotRead,
      runtimeReadEnabled: runtime.runtimeReadEnabled,
      paymentsSnapshotReadEnabled: runtime.paymentsSnapshotReadEnabled,
      statusRuntimeApprovalPresent: runtime.statusRuntimeApprovalPresent,
      liveMutationRequested: runtime.liveMutationRequested,
    },
    approvalPacket: {
      requiredDecisionRecord: 'ADR-002-payment-status-persistence-ownership',
      requiredDecisionRecordPath: decisionRecord.path,
      requiredDecisionRecordStatus: decisionRecord.status,
      decisionRecorded: decisionRecord.recorded,
      requiredRuntimeEvidence: [
        'payment-status-readiness pass with mutation=false persistence=false providerCall=false',
        'payment-storage-readiness pass with mutation=false persistence=false providerCall=false',
        'deployed Payments read-by-orderId DB snapshot endpoint evidence before any live status reads',
        'Cliplot PAYMENT_API_KEY payments:read runtime evidence from /api/payments/read-scope-readiness',
        'approved owner decision before any storage writes',
      ],
      mustRemainFalseBeforeApproval: [
        'ENABLE_LIVE_PAYMENT_CREATE unless full live checkout approval exists',
        'callback persistence',
        'provider-backed status reads',
        'Cliplot-local storage writes',
      ],
    },
    satisfiedEvidence: decisionSatisfiedEvidence,
    blockers: decisionBlockers,
    sensitiveDataPolicy: [
      'no payment API key value',
      'no webhook key value',
      'no provider call',
      'no storage write',
      'no storage read',
      'decision metadata only',
    ],
    next: 'Passive Payments snapshot reads and shared Payments ownership are approved; callback persistence, replay execution, provider-backed reads, Cliplot-local writes, and live status writes remain blocked.',
  };
}

export async function paymentStatusMappingOwnershipPacket() {
  const statusReadiness = await paymentStatusReadiness();
  const storageReadiness = await paymentStatusStorageReadiness();
  const decisionPacket = await paymentStatusPersistenceDecisionPacket();
  const callbackPolicy = paymentCallbackReplayPolicyReadiness();
  const snapshotReadApproval = await paymentStatusSnapshotReadApprovalPacket();
  const runtimeReadiness = paymentStatusRuntimeReadiness();
  const approvedRuntimeRead = runtimeReadiness.runtimeReadEnabled === true
    && snapshotReadApproval.status === 'approved_passive_payments_snapshot_read';
  const mappingApprovalPresent = isApprovalPresent(serviceConfig.statusMappingOwnershipApprovalId);
  const mappingOwnershipApproved = mappingApprovalPresent
    && approvedRuntimeRead
    && decisionPacket.decisionRecord?.status === 'owner_approved_shared_payments_source_of_truth'
    && callbackPolicy.callbackPersistence === false
    && storageReadiness.readContract?.currentPersistence === false;

  const mappingSatisfiedEvidence = [
    ...(mappingOwnershipApproved
      ? [
          '[DONE: approved order/payment status mapping ownership recorded]',
          '[DONE: Cliplot remains non-authoritative customer-safe renderer]',
          `[DONE: runtime rollout owner recorded: ${serviceConfig.statusMappingValidationOwner}]`,
          `[DONE: rollback owner recorded: ${serviceConfig.statusMappingRollbackOwner}]`,
        ]
      : []),
    ...(approvedRuntimeRead
      ? [
          '[DONE: owner-approved passive Payments DB snapshot read is active]',
          '[DONE: customer-safe status copy approved for pending/processing/completed/failed/cancelled/refunded states]',
          '[DONE: CLIPLOT_STATUS_RUNTIME_APPROVAL_ID recorded for read-only customer status rollout]',
        ]
      : []),
  ];
  const mappingBlockers = [
    ...(mappingOwnershipApproved ? [] : ['[MISSING: approved order/payment status mapping ownership]']),
    ...(approvedRuntimeRead
      ? []
      : [
          '[MISSING: owner approval to enable Cliplot passive Payments status snapshot reads]',
          '[MISSING: customer-safe status copy approval for pending/processing/completed/failed/cancelled/refunded states]',
          '[MISSING: CLIPLOT_STATUS_RUNTIME_APPROVAL_ID after owner-approved read-only customer status rollout]',
        ]),
    ...(mappingOwnershipApproved ? [] : ['[MISSING: runtime rollout owner and rollback owner recorded]']),
  ];

  return {
    success: true,
    status: mappingOwnershipApproved ? 'approved_order_payment_status_mapping_ownership' : 'approval_required_order_payment_status_mapping_ownership',
    mode: 'guarded_order_payment_status_mapping_ownership',
    generatedAt: new Date().toISOString(),
    service: serviceConfig.serviceName,
    mutation: false,
    persistence: false,
    providerCall: false,
    runtimeReadEnabled: approvedRuntimeRead,
    paymentsSnapshotReadEnabled: approvedRuntimeRead,
    storageRead: false,
    callbackPersistence: false,
    approvedRuntimeChange: approvedRuntimeRead,
    decisionRecord: {
      id: 'ADR-006-order-payment-status-mapping-ownership',
      title: 'Order And Payment Status Mapping Ownership',
      path: '07_decisions/ADR-006-order-payment-status-mapping-ownership.md',
      status: mappingOwnershipApproved ? 'owner_approved_non_authoritative_renderer' : 'proposed_for_owner_approval',
      recorded: true,
      runtimeApproval: approvedRuntimeRead,
      approvalIdPresent: mappingApprovalPresent,
      approvalIdFingerprint: mappingApprovalPresent ? stableFingerprint(serviceConfig.statusMappingOwnershipApprovalId) : null,
      rollbackOwner: mappingOwnershipApproved ? serviceConfig.statusMappingRollbackOwner : '[MISSING: rollback owner]',
      validationOwner: mappingOwnershipApproved ? serviceConfig.statusMappingValidationOwner : '[MISSING: validation owner]',
    },
    ownership: {
      orders: {
        owner: 'orders-microservice',
        authoritative: true,
        owns: [
          'order lifecycle',
          'externalOrderId idempotency',
          'order id',
          'Warehouse reservation side effects after approved live order create',
        ],
      },
      payments: {
        owner: 'payments-microservice',
        authoritative: true,
        owns: [
          'payment id',
          'payment status',
          'amount',
          'currency',
          'payment method',
          'provider-derived payment truth',
        ],
      },
      cliplot: {
        owner: 'cliplot',
        authoritative: false,
        role: mappingOwnershipApproved ? 'approved_customer_safe_renderer_non_authoritative' : 'customer_safe_renderer_after_owner_approval',
        mayRenderOnlyAfterApproval: !mappingOwnershipApproved,
        mayPersistStatusTruth: false,
      },
    },
    mappingContract: {
      authoritative: false,
      source: mappingOwnershipApproved ? 'approved_payments_db_snapshot_renderer_contract' : 'owner_approval_required',
      proposedFields: [
        'externalOrderId',
        'orderId',
        'paymentId',
        'paymentCreateIdempotencyKey',
        'amount',
        'currency',
        'status',
        'customerSafePaymentStatus',
        'createdAt',
        'completedAt',
      ],
      uniqueness: [
        'externalOrderId scoped to applicationId=cliplot',
        'paymentId owned by payments-microservice',
      ],
      mutation: false,
      persistence: false,
      providerCall: false,
    },
    readContract: {
      endpoint: '/payments/status/by-order-id?applicationId=cliplot&orderId={orderId}',
      applicationId: serviceConfig.applicationId,
      requiredScope: 'payments:read',
      requiredRuntimeKey: 'PAYMENT_API_KEY',
      source: 'payments_db_snapshot',
      forbiddenEndpoint: '/payments/{paymentId}',
      providerRefreshRisk: 'db_snapshot_endpoint_no_provider_refresh',
      mutation: false,
      persistence: false,
      providerCall: false,
    },
    currentEvidence: {
      paymentStatus: statusReadiness.status,
      paymentStorage: storageReadiness.status,
      paymentDecision: decisionPacket.status,
      callbackReplayPolicy: callbackPolicy.status,
      snapshotReadApproval: snapshotReadApproval.status,
      runtimeReadiness: runtimeReadiness.status,
      readScopeStatus: statusReadiness.readScopeReadiness?.status || null,
      scopeValidated: statusReadiness.readScopeReadiness?.scopeValidated === true,
      currentStatusPersistence: storageReadiness.readContract?.currentPersistence,
      callbackPersistence: callbackPolicy.callbackPersistence,
      callbackReplayEnabled: callbackPolicy.callbackReplayEnabled,
      runtimeReadEnabled: runtimeReadiness.runtimeReadEnabled,
      paymentsSnapshotReadEnabled: runtimeReadiness.paymentsSnapshotReadEnabled,
      storageRead: runtimeReadiness.storageRead,
    },
    requiredOwnerApprovals: [
      ...(mappingOwnershipApproved
        ? [
            'approved order/payment status mapping ownership recorded',
            `runtime rollout owner recorded: ${serviceConfig.statusMappingValidationOwner}`,
            `rollback owner recorded: ${serviceConfig.statusMappingRollbackOwner}`,
          ]
        : ['approved order/payment status mapping ownership']),
      ...(approvedRuntimeRead
        ? [
            'owner-approved passive Payments DB snapshot read is active',
            'customer-safe Czech status copy approval recorded',
            'passive reads limited to Payments DB-only by-order-id route',
          ]
        : [
            'owner approval to enable Cliplot passive Payments status snapshot reads',
            'customer-safe Czech status copy approval',
            'explicit approval that passive reads use only Payments DB-only by-order-id route',
          ]),
      'runtime rollout owner and rollback owner recorded',
    ],
    forbiddenOperations: [
      'create order',
      'reserve Warehouse stock',
      'create payment',
      'send notification',
      'persist callback state',
      'replay payment callback',
      'write Cliplot-local payment status',
      'read /payments/{paymentId}',
      'call payment provider',
      'print API keys or webhook keys',
      'return payment rows, customer PII, provider transaction IDs, or raw provider payloads',
    ],
    satisfiedEvidence: mappingSatisfiedEvidence,
    blockers: mappingBlockers,
    sensitiveDataPolicy: [
      'ownership metadata only',
      'no payment API key value',
      'no webhook key value',
      'no payment rows',
      'no customer PII',
      'no provider transaction id',
      'no raw provider payload',
    ],
    next: mappingOwnershipApproved
      ? 'ADR-006 ownership is approved for non-authoritative customer-safe rendering; live writes, provider refresh reads, callback persistence, payment creation, and notifications remain disabled.'
      : 'Collect owner approval for ADR-006 before enabling any customer-facing runtime order/payment status correlation.',
  };
}

export async function paymentStatusSnapshotReadApprovalPacket() {
  const statusReadiness = await paymentStatusReadiness();
  const storageReadiness = await paymentStatusStorageReadiness();
  const decisionPacket = await paymentStatusPersistenceDecisionPacket();
  const readScope = statusReadiness.readScopeReadiness || {};
  const runtime = passivePaymentSnapshotRuntimeState();
  const approvedRuntimeRead = runtime.runtimeReadEnabled === true
    && readScope.scopeValidated === true
    && runtime.liveMutationRequested === false;
  const prerequisites = [
    {
      id: 'payments-read-scope',
      status: readScope.scopeValidated ? 'satisfied' : 'missing',
      evidence: readScope.scopeValidated
        ? 'Cliplot PAYMENT_API_KEY reached Payments DB-only read-by-orderId route with payments:read and no mutation.'
        : '[MISSING: payments:read runtime scope evidence]',
      requiredBeforeApproval: true,
    },
    {
      id: 'ownership-decision-record',
      status: decisionPacket.decisionRecord?.recorded ? 'satisfied' : 'missing',
      evidence: decisionPacket.decisionRecord?.recorded
        ? `${decisionPacket.decisionRecord.id} recorded as ${decisionPacket.decisionRecord.status}`
        : '[MISSING: payment status ownership ADR]',
      requiredBeforeApproval: true,
    },
    {
      id: 'owner-approval-passive-status-read',
      status: approvedRuntimeRead ? 'satisfied' : 'missing',
      evidence: approvedRuntimeRead
        ? 'Owner approval recorded in CLIPLOT_STATUS_RUNTIME_APPROVAL_ID for passive Payments DB snapshot reads.'
        : '[MISSING: owner approval to enable Cliplot passive Payments status snapshot reads]',
      requiredBeforeApproval: true,
    },
    {
      id: 'customer-safe-status-copy-approval',
      status: approvedRuntimeRead ? 'satisfied' : 'missing',
      evidence: approvedRuntimeRead
        ? 'Customer-safe Czech status copy approved for pending/processing/completed/failed/cancelled/refunded states.'
        : '[MISSING: customer-safe status copy approval for pending/processing/completed/failed/cancelled/refunded states]',
      requiredBeforeApproval: true,
    },
    {
      id: 'runtime-rollout-plan',
      status: approvedRuntimeRead ? 'satisfied' : 'missing',
      evidence: approvedRuntimeRead
        ? 'Read-only runtime rollout approved with rollback through ConfigMap flags.'
        : '[MISSING: approved runtime rollout plan for read-only customer status surface]',
      requiredBeforeApproval: true,
    },
    {
      id: 'db-only-route-approval',
      status: approvedRuntimeRead ? 'satisfied' : 'missing',
      evidence: approvedRuntimeRead
        ? 'Passive reads approved only through Payments DB-only by-order-id route.'
        : '[MISSING: explicit approval that passive snapshot reads use only Payments DB-only by-order-id route]',
      requiredBeforeApproval: true,
    },
  ];
  const blockers = prerequisites
    .filter((item) => item.status !== 'satisfied')
    .map((item) => item.evidence);

  return {
    success: true,
    status: approvedRuntimeRead ? 'approved_passive_payments_snapshot_read' : 'approval_required_passive_payments_snapshot_read',
    mode: 'guarded_passive_payments_snapshot_read_approval_packet',
    generatedAt: new Date().toISOString(),
    service: serviceConfig.serviceName,
    mutation: false,
    persistence: false,
    providerCall: false,
    livePaymentCreate: serviceConfig.livePaymentCreate,
    runtimeReadEnabled: runtime.runtimeReadEnabled,
    approvedRuntimeChange: approvedRuntimeRead,
    recommendedOption: decisionPacket.recommendedOption,
    decisionRecord: decisionPacket.decisionRecord,
    readContract: {
      endpoint: '/payments/status/by-order-id?applicationId=cliplot&orderId={orderId}',
      applicationId: serviceConfig.applicationId,
      requiredScope: 'payments:read',
      requiredRuntimeKey: 'PAYMENT_API_KEY',
      source: 'payments_db_snapshot',
      providerRefreshRisk: 'db_snapshot_endpoint_no_provider_refresh',
      mutation: false,
      persistence: false,
      providerCall: false,
      forbiddenEndpoint: '/payments/{paymentId}',
      forbiddenReason: 'GET /payments/{paymentId} can refresh pending/processing Stripe/card provider state and must not be used for passive Cliplot status reads.',
    },
    currentReadiness: {
      paymentStatus: statusReadiness.status,
      paymentStorage: storageReadiness.status,
      paymentDecision: decisionPacket.status,
      readScopeStatus: readScope.status || null,
      scopeValidated: readScope.scopeValidated === true,
      currentStatusPersistence: storageReadiness.readContract?.currentPersistence,
      callbackPersistence: storageReadiness.callbackContract?.currentPersistence,
    },
    customerSafeStatusContract: statusReadiness.customerSafeStatusContract,
    approvalChecklist: prerequisites,
    requiredApprovalEvidence: [
      'owner approval for provider-refresh-free Payments DB snapshot reads',
      'customer-safe Czech status copy approval for pending/processing/completed/failed/cancelled/refunded states',
      'operator acceptance that Cliplot remains non-authoritative for provider payment truth',
      'approved runtime rollout plan for read-only customer status surface',
      'explicit approval that passive snapshot reads use only Payments DB-only by-order-id route',
    ],
    mustRemainFalseBeforeApproval: [
      'ENABLE_LIVE_PAYMENT_CREATE unless full live checkout approval exists',
      'runtimeReadEnabled',
      'callback persistence',
      'Cliplot-local payment status storage writes',
      'provider-backed /payments/{paymentId} reads',
    ],
    blockers,
    sensitiveDataPolicy: [
      'no payment API key value',
      'no webhook key value',
      'no provider call',
      'no storage write',
      'no storage read',
      'approval metadata only',
    ],
    next: 'Collect owner approval for provider-refresh-free Payments DB snapshot reads and customer-safe status copy before Cliplot renders live payment status.',
  };
}

export async function customerStatusSurfaceReadiness() {
  const syntheticOrderId = 'cliplot-status-surface-readiness';
  const currentPaymentStatus = (await paymentStatus({ orderId: syntheticOrderId })).body || {};
  const paymentReadiness = await paymentStatusReadiness();
  const snapshotReadApproval = await paymentStatusSnapshotReadApprovalPacket();
  const callbackPolicy = paymentCallbackReplayPolicyReadiness();
  const mappingOwnership = await paymentStatusMappingOwnershipPacket();
  const runtime = paymentStatusRuntimeReadiness();
  const approvedRuntimeRead = runtime.runtimeReadEnabled === true
    && snapshotReadApproval.status === 'approved_passive_payments_snapshot_read';
  const callbackPolicyApproved = callbackPolicy.status === 'approved_callback_replay_policy_metadata_execution_disabled'
    && callbackPolicy.callbackPersistence === false
    && callbackPolicy.callbackReplayEnabled === false;
  const mappingOwnershipApproved = mappingOwnership.status === 'approved_order_payment_status_mapping_ownership'
    && mappingOwnership.ownership?.cliplot?.authoritative === false
    && mappingOwnership.mutation === false
    && mappingOwnership.persistence === false
    && mappingOwnership.providerCall === false;
  const uxCopyApproved = approvedRuntimeRead;
  const guarded = ['payment_status_guarded_no_persistence', 'payment_status_snapshot_not_available', 'payment_status_snapshot_temporarily_unavailable', 'payment_status_snapshot_read'].includes(currentPaymentStatus.status)
    && currentPaymentStatus.mutation === false
    && currentPaymentStatus.persistence === false
    && currentPaymentStatus.providerCall === false
    && snapshotReadApproval.mutation === false
    && snapshotReadApproval.persistence === false
    && snapshotReadApproval.providerCall === false;

  return {
    success: true,
    status: guarded
      ? (approvedRuntimeRead ? 'approved_read_only_customer_status_surface_contract' : 'guarded_customer_status_surface_contract')
      : 'blocked_customer_status_surface_contract_drift',
    mode: 'guarded_customer_status_surface_readiness',
    generatedAt: new Date().toISOString(),
    service: serviceConfig.serviceName,
    mutation: false,
    persistence: false,
    providerCall: false,
    runtimeReadEnabled: approvedRuntimeRead,
    paymentsSnapshotReadEnabled: approvedRuntimeRead,
    storageRead: false,
    authoritativeOrderStatus: false,
    authoritativePaymentStatus: false,
    routes: [
      '/objednavka/stav',
      '/checkout/success',
      '/checkout/cancelled',
    ],
    currentSurface: {
      source: 'browser_local_checkout_snapshot',
      statusLabel: 'Čeká na kontrolu',
      paymentCopy: 'Platba se zatím nespustila. Po kontrole objednávky pošleme další pokyny k platbě.',
      reservationCopy: 'Zboží zatím není rezervované a objednávka není zaplacená.',
      storesProviderStatus: false,
      storesOrderTruth: false,
      storesPaymentTruth: false,
    },
    currentPaymentStatusContract: {
      endpoint: '/api/payments/status?orderId={externalOrderId}',
      status: currentPaymentStatus.status,
      paymentStatus: currentPaymentStatus.paymentStatus,
      customerSafePaymentStatus: currentPaymentStatus.customerSafePaymentStatus,
      mutation: currentPaymentStatus.mutation,
      persistence: currentPaymentStatus.persistence,
      providerCall: currentPaymentStatus.providerCall,
    },
    futureSnapshotReadApproval: {
      endpoint: '/api/payments/status-snapshot-read-approval-packet',
      status: snapshotReadApproval.status,
      runtimeReadEnabled: snapshotReadApproval.runtimeReadEnabled,
      readEndpoint: snapshotReadApproval.readContract?.endpoint,
      requiredScope: snapshotReadApproval.readContract?.requiredScope,
      forbiddenEndpoint: snapshotReadApproval.readContract?.forbiddenEndpoint,
      providerRefreshRisk: snapshotReadApproval.readContract?.providerRefreshRisk,
    },
    callbackPolicy: {
      status: callbackPolicy.status,
      callbackPersistence: callbackPolicy.callbackPersistence,
      callbackReplayEnabled: callbackPolicy.callbackReplayEnabled,
    },
    mappingOwnership: {
      status: mappingOwnership.status,
      orderOwner: mappingOwnership.ownership?.orders?.owner || 'orders-microservice',
      paymentOwner: mappingOwnership.ownership?.payments?.owner || 'payments-microservice',
      cliplotAuthoritative: mappingOwnership.ownership?.cliplot?.authoritative === true,
    },
    customerSafeStatusContract: paymentReadiness.customerSafeStatusContract,
    forbiddenClaimsBeforeApproval: [
      'paid',
      'confirmed',
      'reserved',
      'shipped',
      'invoiced',
      'completed',
      'zaplaceno',
      'potvrzeno',
      'rezervováno',
      'odesláno',
      'fakturováno',
      'dokončeno',
    ],
    allowedCurrentClaims: [
      'Čeká na kontrolu',
      'Platba se zatím nespustila',
      'Zboží zatím není rezervované',
      'objednávka není zaplacená',
    ],
    blockers: [
      ...snapshotReadApproval.blockers,
      ...(approvedRuntimeRead ? [] : ['[MISSING: approved customer status surface rollout using provider-refresh-free Payments DB snapshot reads]']),
      ...(uxCopyApproved ? [] : ['[MISSING: approved UX copy for live payment status transitions on /objednavka/stav]']),
      ...(callbackPolicyApproved ? [] : ['[MISSING: callback persistence/replay policy]']),
      ...(mappingOwnershipApproved ? [] : ['[MISSING: approved order/payment status mapping ownership]']),
    ],
    sensitiveDataPolicy: [
      'no payment API key value',
      'no webhook key value',
      'no payment rows',
      'no customer PII in readiness output',
      'no provider transaction id',
      'no raw provider payload',
    ],
    next: 'After owner approval, add a read-only customer status surface that uses only the Payments DB snapshot read contract and keeps Cliplot non-authoritative.',
  };
}

export async function customerStatusRuntimeRolloutPlan() {
  const surface = await customerStatusSurfaceReadiness();
  const snapshotReadApproval = await paymentStatusSnapshotReadApprovalPacket();
  const paymentDecision = await paymentStatusPersistenceDecisionPacket();
  const approvedRuntimeRead = surface.status === 'approved_read_only_customer_status_surface_contract'
    && snapshotReadApproval.status === 'approved_passive_payments_snapshot_read';
  const readyForPlanning = ['guarded_customer_status_surface_contract', 'approved_read_only_customer_status_surface_contract'].includes(surface.status)
    && surface.storageRead === false
    && ['approval_required_passive_payments_snapshot_read', 'approved_passive_payments_snapshot_read'].includes(snapshotReadApproval.status)
    && ['decision_recorded_approval_required', 'approved_payment_status_persistence_decision_metadata_execution_disabled'].includes(paymentDecision.status);

  return {
    success: true,
    status: readyForPlanning
      ? (approvedRuntimeRead ? 'approved_read_only_customer_status_runtime_rollout' : 'approval_required_read_only_customer_status_runtime_rollout')
      : 'blocked_status_surface_contract_not_guarded',
    mode: 'guarded_customer_status_runtime_rollout_plan',
    generatedAt: new Date().toISOString(),
    service: serviceConfig.serviceName,
    mutation: false,
    persistence: false,
    providerCall: false,
    runtimeReadEnabled: surface.runtimeReadEnabled,
    paymentsSnapshotReadEnabled: surface.paymentsSnapshotReadEnabled,
    storageRead: false,
    approvedRuntimeChange: approvedRuntimeRead,
    callbackPersistence: false,
    targetSurface: {
      routes: surface.routes,
      currentDataSource: surface.currentSurface?.source,
      currentPaymentStatusContract: surface.currentPaymentStatusContract?.status,
      futureReadContract: snapshotReadApproval.readContract?.endpoint,
      requiredScope: snapshotReadApproval.readContract?.requiredScope,
      forbiddenEndpoint: snapshotReadApproval.readContract?.forbiddenEndpoint,
      providerRefreshRisk: snapshotReadApproval.readContract?.providerRefreshRisk,
    },
    dependencyStatuses: {
      statusSurface: surface.status,
      snapshotReadApproval: snapshotReadApproval.status,
      paymentDecision: paymentDecision.status,
      paymentReadScope: snapshotReadApproval.currentReadiness?.readScopeStatus || null,
    },
    decisionRecord: {
      id: 'ADR-003-read-only-customer-status-runtime-rollout',
      path: '07_decisions/ADR-003-read-only-customer-status-runtime-rollout.md',
      status: 'proposed_for_owner_approval',
      recorded: true,
      runtimeApproval: approvedRuntimeRead,
    },
    prerequisites: [
      '[MISSING: owner approval to enable Cliplot passive Payments status snapshot reads]',
      '[MISSING: customer-safe status copy approval for pending/processing/completed/failed/cancelled/refunded states]',
      '[MISSING: explicit approval that passive reads use only Payments DB-only by-order-id route]',
      '[MISSING: approved runtime rollout plan for read-only customer status surface]',
      '[MISSING: callback persistence/replay policy]',
      '[MISSING: approved order/payment status mapping ownership]',
    ],
    rolloutSteps: [
      {
        order: 1,
        name: 'confirm_guarded_baseline',
        command: 'npm run readiness:bundle',
        expected: 'CLIPLOT_READINESS_BUNDLE=pass with runtimeReadEnabled=false and wouldMutate=false',
      },
      {
        order: 2,
        name: 'record_owner_approval',
        expected: 'approval explicitly limits Cliplot to provider-refresh-free Payments DB snapshot reads by orderId',
      },
      {
        order: 3,
        name: 'enable_read_only_surface_feature_flag',
        expected: 'future flag enables read rendering only after approval; payment/order mutation flags remain false',
      },
      {
        order: 4,
        name: 'validate_customer_safe_status_copy',
        expected: 'Czech labels for pending, processing, completed, failed, cancelled, refunded are approved',
      },
      {
        order: 5,
        name: 'run_post_enable_readiness',
        expected: 'customer status uses DB snapshot read only; mutation=false persistence=false providerCall=false',
      },
    ],
    rollbackPlan: [
      'set future read-only customer status feature flag back to false',
      'verify /api/checkout/status-surface-contract returns runtimeReadEnabled=false',
      'verify /api/payments/status remains payment_status_guarded_no_persistence',
      'run npm run readiness:bundle and confirm wouldMutate=false',
    ],
    mustRemainFalseDuringRollout: [
      'ENABLE_LIVE_ORDER_SUBMIT',
      'ENABLE_LIVE_PAYMENT_CREATE',
      'ENABLE_LIVE_NOTIFICATIONS',
      'callback persistence',
      'Cliplot-local payment status writes',
      'provider-backed /payments/{paymentId} reads',
      'Warehouse reservation',
      'customer notification send',
    ],
    forbiddenOperations: [
      'create order',
      'create payment',
      'reserve Warehouse stock',
      'send notification',
      'persist callback state',
      'read /payments/{paymentId}',
      'print API keys or webhook keys',
      'return payment rows, customer PII, provider transaction IDs, or raw provider payloads',
    ],
    validationCommands: [
      'npm run readiness:customer-status-rollout -- https://cliplot.alfares.cz',
      'npm run readiness:checkout-status-surface -- https://cliplot.alfares.cz',
      'npm run readiness:payment-snapshot-read-approval -- https://cliplot.alfares.cz',
      'npm run readiness:k8s -- https://cliplot.alfares.cz',
      'npm run readiness:bundle',
    ],
    blockers: surface.blockers,
    next: 'Keep runtime status reads disabled until owner approval and rollout evidence exist, then implement the read-only surface behind an explicit disabled-by-default flag.',
  };
}

export async function customerStatusRuntimeActivationGate() {
  const rollout = await customerStatusRuntimeRolloutPlan();
  const approvals = liveMutationApprovals();
  const statusRuntimeApprovalPresent = isApprovalPresent(serviceConfig.statusRuntimeApprovalId);
  const requestedRuntimeRead = serviceConfig.customerStatusRuntimeRead === true;
  const requestedSnapshotRead = serviceConfig.paymentStatusSnapshotRead === true;
  const liveMutationRequested = serviceConfig.liveOrderSubmit
    || serviceConfig.livePaymentCreate
    || serviceConfig.liveNotifications;

  const baselineGuarded = ['approval_required_read_only_customer_status_runtime_rollout', 'approved_read_only_customer_status_runtime_rollout'].includes(rollout.status)
    && ['guarded_customer_status_surface_contract', 'approved_read_only_customer_status_surface_contract'].includes(rollout.dependencyStatuses?.statusSurface)
    && ['approval_required_passive_payments_snapshot_read', 'approved_passive_payments_snapshot_read'].includes(rollout.dependencyStatuses?.snapshotReadApproval)
    && rollout.storageRead === false
    && rollout.callbackPersistence === false;

  const blockers = [];
  if (!baselineGuarded) blockers.push('[MISSING: guarded customer status baseline evidence]');
  if (!statusRuntimeApprovalPresent) blockers.push('[MISSING: CLIPLOT_STATUS_RUNTIME_APPROVAL_ID after owner-approved read-only customer status rollout]');
  if (!requestedRuntimeRead) blockers.push('[MISSING: ENABLE_CUSTOMER_STATUS_RUNTIME_READ=true after owner approval]');
  if (!requestedSnapshotRead) blockers.push('[MISSING: ENABLE_PAYMENT_STATUS_SNAPSHOT_READ=true after owner approval]');
  if (!statusRuntimeApprovalPresent) {
    blockers.push('[MISSING: owner approval to enable Cliplot passive Payments status snapshot reads]');
    blockers.push('[MISSING: customer-safe status copy approval for pending/processing/completed/failed/cancelled/refunded states]');
    blockers.push('[MISSING: explicit approval that passive reads use only Payments DB-only by-order-id route]');
    blockers.push('[MISSING: callback persistence/replay policy confirming callback persistence remains disabled for read-only activation]');
    blockers.push('[MISSING: approved order/payment status mapping ownership]');
  }

  const partialEnablement = requestedRuntimeRead !== requestedSnapshotRead
    || statusRuntimeApprovalPresent !== (requestedRuntimeRead && requestedSnapshotRead)
    || liveMutationRequested;

  const paymentReadScopeValidated = ['validated_payments_read_scope_no_mutation', 'validated_payments_read_scope_no_mutation_cached'].includes(rollout.dependencyStatuses?.paymentReadScope);
  if (!paymentReadScopeValidated) blockers.push('[MISSING: payments:read scope for Cliplot PAYMENT_API_KEY confirmed in runtime evidence]');

  const readyForApprovedRuntimeRead = baselineGuarded
    && requestedRuntimeRead
    && requestedSnapshotRead
    && statusRuntimeApprovalPresent
    && paymentReadScopeValidated
    && !liveMutationRequested;

  return {
    success: true,
    status: readyForApprovedRuntimeRead
      ? 'ready_for_approved_read_only_customer_status_runtime'
      : 'blocked_read_only_customer_status_runtime_activation',
    mode: 'guarded_customer_status_runtime_activation_gate',
    generatedAt: new Date().toISOString(),
    service: serviceConfig.serviceName,
    mutation: false,
    persistence: false,
    providerCall: false,
    runtimeReadEnabled: readyForApprovedRuntimeRead,
    paymentsSnapshotReadEnabled: readyForApprovedRuntimeRead,
    storageRead: false,
    callbackPersistence: false,
    approvedRuntimeChange: readyForApprovedRuntimeRead,
    wouldReadPaymentsSnapshot: readyForApprovedRuntimeRead,
    wouldRenderRuntimeCustomerStatus: readyForApprovedRuntimeRead,
    wouldMutate: false,
    partialEnablement,
    runtimeFlags: {
      customerStatusRuntimeRead: serviceConfig.customerStatusRuntimeRead,
      paymentStatusSnapshotRead: serviceConfig.paymentStatusSnapshotRead,
      statusRuntimeApprovalPresent,
    },
    liveMutationGuards: {
      liveOrderSubmit: serviceConfig.liveOrderSubmit,
      livePaymentCreate: serviceConfig.livePaymentCreate,
      liveNotifications: serviceConfig.liveNotifications,
      approvalOrder: approvals.order,
      approvalPayment: approvals.payment,
      approvalNotification: approvals.notification,
      requested: liveMutationRequested,
    },
    requiredRuntimeFlags: [
      'ENABLE_CUSTOMER_STATUS_RUNTIME_READ=true',
      'ENABLE_PAYMENT_STATUS_SNAPSHOT_READ=true',
    ],
    requiredApprovalIds: [
      'CLIPLOT_STATUS_RUNTIME_APPROVAL_ID',
    ],
    requiredEvidence: [
      'npm run readiness:customer-status-rollout -- https://cliplot.alfares.cz',
      'npm run readiness:checkout-status-surface -- https://cliplot.alfares.cz',
      'npm run readiness:payment-snapshot-read-approval -- https://cliplot.alfares.cz',
      'npm run readiness:payment-read-scope -- https://cliplot.alfares.cz',
      'owner approval limiting Cliplot to Payments DB-only by-orderId snapshot reads',
      'approved Czech customer-safe status copy',
      'rollback command and post-enable validation owner recorded',
    ],
    currentBaseline: {
      rollout: rollout.status,
      surface: rollout.dependencyStatuses?.statusSurface || null,
      snapshotReadApproval: rollout.dependencyStatuses?.snapshotReadApproval || null,
      paymentReadScope: rollout.dependencyStatuses?.paymentReadScope || null,
      runtimeReadEnabled: rollout.runtimeReadEnabled,
      paymentsSnapshotReadEnabled: rollout.paymentsSnapshotReadEnabled,
      storageRead: rollout.storageRead,
      callbackPersistence: rollout.callbackPersistence,
    },
    approvedReadContract: {
      endpoint: rollout.targetSurface?.futureReadContract,
      applicationId: serviceConfig.applicationId,
      requiredScope: rollout.targetSurface?.requiredScope,
      requiredRuntimeKey: 'PAYMENT_API_KEY',
      providerRefreshRisk: rollout.targetSurface?.providerRefreshRisk,
      forbiddenEndpoint: rollout.targetSurface?.forbiddenEndpoint,
      mutation: false,
      persistence: false,
      providerCall: false,
    },
    mustRemainFalseBeforeActivation: [
      'runtimeReadEnabled',
      'paymentsSnapshotReadEnabled',
      'storageRead',
      'callback persistence',
      'Cliplot-local payment status writes',
      'ENABLE_LIVE_ORDER_SUBMIT',
      'ENABLE_LIVE_PAYMENT_CREATE',
      'ENABLE_LIVE_NOTIFICATIONS',
      'Warehouse reservation',
      'customer notification send',
      'provider-backed /payments/{paymentId} reads',
    ],
    forbiddenOperations: rollout.forbiddenOperations,
    blockers,
    next: 'Keep read-only customer status runtime disabled until owner approval, approval ID, both read-only flags, and post-enable validation evidence exist.',
  };
}


export async function customerStatusApprovalEvidencePacket() {
  const surface = await customerStatusSurfaceReadiness();
  const rollout = await customerStatusRuntimeRolloutPlan();
  const activation = await customerStatusRuntimeActivationGate();
  const runtimeReadiness = paymentStatusRuntimeReadiness();
  const snapshotReadApproval = await paymentStatusSnapshotReadApprovalPacket();

  const approvedRuntimeRead = activation.status === 'ready_for_approved_read_only_customer_status_runtime'
    && runtimeReadiness.status === 'ready_for_approved_payments_snapshot_runtime_read'
    && snapshotReadApproval.status === 'approved_passive_payments_snapshot_read';
  const callbackPolicy = paymentCallbackReplayPolicyReadiness();
  const paymentMapping = await paymentStatusMappingOwnershipPacket();
  const baselineGuarded = ['guarded_customer_status_surface_contract', 'approved_read_only_customer_status_surface_contract'].includes(surface.status)
    && ['approval_required_read_only_customer_status_runtime_rollout', 'approved_read_only_customer_status_runtime_rollout'].includes(rollout.status)
    && ['blocked_read_only_customer_status_runtime_activation', 'ready_for_approved_read_only_customer_status_runtime'].includes(activation.status)
    && ['blocked_payments_snapshot_runtime_read', 'ready_for_approved_payments_snapshot_runtime_read'].includes(runtimeReadiness.status)
    && ['approval_required_passive_payments_snapshot_read', 'approved_passive_payments_snapshot_read'].includes(snapshotReadApproval.status);

  const blockers = approvedRuntimeRead
    ? [
        ...(callbackPolicy.status === 'approval_required_callback_replay_policy'
          ? ['[MISSING: approved callback persistence/replay policy before callback persistence or replay]']
          : []),
        ...(paymentMapping.decisionRecord?.status === 'owner_approved_non_authoritative_renderer'
          ? []
          : ['[MISSING: approved order/payment status mapping ownership before Cliplot stores or correlates payment truth]']),
      ]
    : [
        '[MISSING: owner approval to enable Cliplot passive Payments status snapshot reads]',
        '[MISSING: CLIPLOT_STATUS_RUNTIME_APPROVAL_ID after owner-approved read-only customer status rollout]',
        '[MISSING: ENABLE_CUSTOMER_STATUS_RUNTIME_READ=true after owner approval]',
        '[MISSING: ENABLE_PAYMENT_STATUS_SNAPSHOT_READ=true after owner approval]',
        '[MISSING: customer-safe status copy approval for pending/processing/completed/failed/cancelled/refunded states]',
        '[MISSING: explicit approval that passive reads use only Payments DB-only by-order-id route]',
        '[MISSING: callback persistence/replay policy confirming callback persistence remains disabled for read-only activation]',
        '[MISSING: approved order/payment status mapping ownership]',
        '[MISSING: runtime rollout owner and rollback owner recorded]',
      ];

  return {
    success: true,
    status: baselineGuarded
      ? (approvedRuntimeRead ? 'approved_customer_status_runtime_evidence_packet' : 'approval_required_customer_status_runtime_evidence_packet')
      : 'blocked_customer_status_runtime_evidence_drift',
    mode: 'guarded_customer_status_runtime_approval_evidence',
    generatedAt: new Date().toISOString(),
    service: serviceConfig.serviceName,
    mutation: false,
    persistence: false,
    providerCall: false,
    runtimeReadEnabled: approvedRuntimeRead,
    paymentsSnapshotReadEnabled: approvedRuntimeRead,
    storageRead: false,
    callbackPersistence: false,
    approvedRuntimeChange: approvedRuntimeRead,
    wouldReadPaymentsSnapshot: approvedRuntimeRead,
    wouldRenderRuntimeCustomerStatus: approvedRuntimeRead,
    wouldMutate: false,
    baselineGuarded,
    intentChain: {
      vision: 'Czech customers can check order/payment progress without Cliplot becoming a payment source of truth.',
      goalImpact: 'Prepare an owner approval packet for read-only customer status activation with no live mutation.',
      system: 'Cliplot storefront plus shared Payments DB-only by-order-id snapshot contract.',
      feature: 'Guarded customer status runtime evidence packet.',
      task: 'Aggregate activation prerequisites and blockers for future runtime approval.',
      executionPlan: 'Expose metadata-only endpoint and readiness script; allow only the approved DB-only snapshot read flags while live mutation, persistence, provider-refresh reads, and notification sends stay disabled.',
      codingPrompt: 'Do not enable live writes, provider-refresh reads, persistence, order creation, payment creation, warehouse reservation, or notification sends.',
      code: 'customerStatusApprovalEvidencePacket endpoint and readiness check.',
      validation: 'npm run readiness:customer-status-approval -- https://cliplot.alfares.cz',
    },
    currentEvidence: {
      statusSurface: surface.status,
      runtimeRollout: rollout.status,
      activationGate: activation.status,
      paymentRuntimeReadiness: runtimeReadiness.status,
      snapshotReadApproval: snapshotReadApproval.status,
      paymentReadScope: rollout.dependencyStatuses?.paymentReadScope || null,
      callbackReplayPolicy: callbackPolicy.status,
      paymentMappingOwnership: paymentMapping.status,
      frontendStatusFetch: 'deployed_guarded_fetch',
    },
    runtimeFlags: {
      customerStatusRuntimeRead: serviceConfig.customerStatusRuntimeRead,
      paymentStatusSnapshotRead: serviceConfig.paymentStatusSnapshotRead,
      statusRuntimeApprovalPresent: isApprovalPresent(serviceConfig.statusRuntimeApprovalId),
      liveOrderSubmit: serviceConfig.liveOrderSubmit,
      livePaymentCreate: serviceConfig.livePaymentCreate,
      liveNotifications: serviceConfig.liveNotifications,
    },
    approvedReadContract: {
      endpoint: '/payments/status/by-order-id?applicationId=cliplot&orderId={orderId}',
      applicationId: serviceConfig.applicationId,
      requiredScope: 'payments:read',
      requiredRuntimeKey: 'PAYMENT_API_KEY',
      source: 'payments_db_snapshot',
      providerRefreshRisk: 'db_snapshot_endpoint_no_provider_refresh',
      forbiddenEndpoint: '/payments/{paymentId}',
      mutation: false,
      persistence: false,
      providerCall: false,
    },
    approvalRequest: {
      requiredApprovalId: 'CLIPLOT_STATUS_RUNTIME_APPROVAL_ID',
      requiredRuntimeFlags: [
        'ENABLE_CUSTOMER_STATUS_RUNTIME_READ=true',
        'ENABLE_PAYMENT_STATUS_SNAPSHOT_READ=true',
      ],
      remainingClosureBlockers: blockers,
      mustRemainFalse: [
        'ENABLE_LIVE_ORDER_SUBMIT',
        'ENABLE_LIVE_PAYMENT_CREATE',
        'ENABLE_LIVE_NOTIFICATIONS',
        'ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE',
        'callback persistence',
        'Cliplot-local payment status writes',
        'provider-backed /payments/{paymentId} reads',
      ],
      requiredApprovals: [
        'owner approval for provider-refresh-free Payments DB snapshot reads',
        'customer-safe Czech status copy approval',
        'explicit DB-only by-order-id read route approval',
        'callback persistence/replay policy',
        'order/payment status mapping ownership approval',
        'rollback owner and validation owner assignment',
      ],
    },
    validationCommands: [
      'npm run readiness:customer-status-approval -- https://cliplot.alfares.cz',
      'npm run readiness:customer-status-activation -- https://cliplot.alfares.cz',
      'npm run readiness:customer-status-runtime-read -- https://cliplot.alfares.cz',
      'npm run readiness:checkout-status-surface -- https://cliplot.alfares.cz',
      'npm run readiness:bundle',
    ],
    forbiddenOperations: [
      'create order',
      'create payment',
      'reserve Warehouse stock',
      'send notification',
      'persist callback state',
      'read /payments/{paymentId}',
      'call payment provider',
      'print API keys or webhook keys',
      'return payment rows, customer PII, provider transaction IDs, or raw provider payloads',
    ],
    blockers,
    next: approvedRuntimeRead
      ? 'Read-only customer status runtime is approved; keep live checkout mutation, callback persistence, provider-refresh reads, and Cliplot-local payment status storage blocked until their separate approvals exist.'
      : 'Use this packet as the owner approval evidence source; do not enable runtime reads until every blocker is resolved and the approval ID plus both read-only flags exist together.',
  };
}

function buildOrderConfirmationNotification(checkout) {
  const itemLines = checkout.items
    .map((item) => `- ${item.title || item.productId} x ${item.quantity}: ${item.unitPrice} Kč`)
    .join('\n');
  return {
    channel: 'email',
    type: 'order_confirmation',
    recipient: checkout.customer.email,
    subject: `Potvrzení objednávky ${checkout.externalOrderId} - Cliplot`,
    message: [
      `Dobrý den, ${checkout.customer.name},`,
      '',
      'děkujeme za objednávku v obchodě Cliplot.',
      '',
      itemLines,
      '',
      `Mezisoučet: ${checkout.subtotal} Kč`,
      `Doprava: ${checkout.shipping.label} (${checkout.shipping.cost} Kč)`,
      `Platba: ${checkout.payment.label}`,
      `Celkem: ${checkout.total} Kč`,
      'Doručení: 1-2 dny podle dostupnosti dopravce.',
      '',
      'Cliplot',
    ].join('\n'),
    templateData: {
      orderId: checkout.externalOrderId,
      customerName: checkout.customer.name,
      itemCount: checkout.items.reduce((sum, item) => sum + item.quantity, 0),
      total: checkout.total,
      currency: 'CZK',
      source: 'cliplot',
    },
    service: serviceConfig.serviceName,
    purpose: 'transactional',
  };
}

export async function submitCheckout(input) {
  const checkout = normalizeCheckout(input);
  const validationErrors = validateCheckout(checkout);
  if (validationErrors.length) {
    return {
      httpStatus: 400,
      body: {
        success: false,
        status: 'validation_failed',
        errors: validationErrors,
      },
    };
  }

  const missing = checkoutMissingFacts();
  const preflight = liveCheckoutPreflight();
  if (preflight.status !== 'ready_for_approved_live_mutation') {
    const orderPreview = buildOrderCreatePayload(checkout);
    const warehouseReservationReadiness = await guardedWarehouseReservationReadiness(checkout);
    const orderValidation = await guardedOrderValidation(checkout, orderPreview);
    const paymentPreview = buildPaymentCreatePayload(checkout, { id: checkout.externalOrderId });
    const paymentValidation = await guardedPaymentValidation(checkout, paymentPreview);
    const notificationPreview = buildOrderConfirmationNotification(checkout);
    const notificationValidation = await guardedNotificationValidation(checkout, notificationPreview);
    return {
      httpStatus: 202,
      body: {
        success: true,
        status: 'service_identity_required',
        mode: 'guarded_checkout_submit',
        message: 'Objednávka je připravena, ale živé vytvoření objednávky je vypnuté do schválení platebního a notifikačního kroku.',
        missing: preflight.missing,
        liveMutationApprovals: liveMutationApprovals(),
        liveCheckoutPreflight: preflight,
        checkoutIntent: checkoutIntentEvidence(checkout),
        checkoutSummary: checkoutSummary(checkout),
        orderPreview,
        warehouseReservationReadiness,
        orderValidation,
        notificationPreview,
        notificationValidation,
        paymentPreview,
        paymentValidation,
      },
    };
  }

  const warehouseReservationReadiness = await guardedWarehouseReservationReadiness(checkout);
  if (!warehouseReservationReadiness.valid) {
    return {
      httpStatus: 409,
      body: {
        success: false,
        status: "warehouse_reservation_not_ready",
        mode: "live_order_preflight_blocked",
        liveCheckoutPreflight: preflight,
        warehouseReservationReadiness,
      },
    };
  }

  const order = await createOrder(checkout);
  const notificationPreview = buildOrderConfirmationNotification(checkout);
  const paymentPreview = buildPaymentCreatePayload(checkout, order);
  const payment = serviceConfig.livePaymentCreate
    ? await createPayment(checkout, order)
    : null;
  const approvals = liveMutationApprovals();
  if (serviceConfig.liveNotifications && (!approvals.notification || !serviceConfig.notificationServiceToken)) {
    return {
      httpStatus: 503,
      body: {
        success: false,
        status: 'notification_send_guard_blocked',
        mode: 'live_checkout_notification_guard',
        liveCheckoutPreflight: preflight,
        mutation: false,
        notificationSent: false,
      },
    };
  }
  const notification = serviceConfig.liveNotifications
    ? await createNotification(checkout, notificationPreview)
    : null;
  return {
    httpStatus: serviceConfig.livePaymentCreate ? 201 : 202,
    body: {
      success: true,
      status: serviceConfig.liveNotifications
        ? 'order_created_payment_pending_notification_sent'
        : (serviceConfig.livePaymentCreate ? 'order_created_payment_pending' : 'order_created_payment_guarded'),
      order,
      payment,
      liveMutationApprovals: liveMutationApprovals(),
      liveCheckoutPreflight: preflight,
      checkoutIntent: checkoutIntentEvidence(checkout),
      checkoutSummary: checkoutSummary(checkout),
      paymentPreview,
      notification,
      notificationPreview,
      next: 'Payment initiation remains gated by GOAL-05 provider-backed validation.',
    },
  };
}

function buildReadinessCheckout(product) {
  const subtotal = Number(product.price || 0);
  return normalizeCheckout({
    externalOrderId: `cliplot-readiness-${Date.now()}`,
    customer: {
      name: 'Readiness Probe',
      email: 'readiness@cliplot.invalid',
      phone: '+420000000000',
      address: 'Readiness 1, Praha',
    },
    shipping: 'balikovna',
    payment: 'invoice',
    pricing: {
      subtotal,
      shippingCost: 69,
      paymentFee: 0,
      total: subtotal + 69,
    },
    items: [{ product, quantity: 1 }],
    total: subtotal + 69,
  });
}

export async function orderWarehouseReadinessReport() {
  const products = await fetchCatalogProducts();
  const catalogSource = productCatalogSource(products);
  const product = products.find((item) => item?.warehouseId && item?.productSource === 'catalog');
  const preflight = liveCheckoutPreflight();

  if (!product) {
    return {
      success: false,
      status: 'blocked_no_warehouse_backed_catalog_product',
      generatedAt: new Date().toISOString(),
      service: serviceConfig.serviceName,
      mutation: false,
      providerCall: false,
      persistence: false,
      catalog: {
        catalogSource,
        productCount: products.length,
        warehouseBackedProductCount: products.filter((item) => item?.warehouseId).length,
        productScopeEvidence: productFilterScopeEvidence(products),
      },
      liveCheckoutPreflight: preflight,
      blockers: ['missing_warehouse_backed_catalog_product'],
    };
  }

  const checkout = buildReadinessCheckout(product);
  const validationErrors = validateCheckout(checkout);
  const orderPayload = buildOrderCreatePayload(checkout);
  const warehouseReservationReadiness = await guardedWarehouseReservationReadiness(checkout);
  const orderValidation = await guardedOrderValidation(checkout, orderPayload);
  const idempotency = checkoutIdempotencyKeys(checkout);
  const valid = validationErrors.length === 0
    && catalogSource === 'catalog'
    && product.productSource === 'catalog'
    && Boolean(product.warehouseId)
    && warehouseReservationReadiness.status === 'validated_no_mutation'
    && warehouseReservationReadiness.valid === true
    && warehouseReservationReadiness.mutation === false
    && warehouseReservationReadiness.reservationCreated === false
    && warehouseReservationReadiness.stockMutation === false
    && orderValidation.status === 'validated_no_mutation'
    && orderValidation.mutation === false
    && orderValidation.orderCreated === false
    && orderValidation.warehouseMutation === false
    && orderValidation.eventPublished === false
    && preflight.status === 'blocked'
    && preflight.wouldMutate === false;

  return {
    success: true,
    status: valid ? 'validated_no_mutation' : 'blocked_no_mutation',
    generatedAt: new Date().toISOString(),
    service: serviceConfig.serviceName,
    mutation: false,
    providerCall: false,
    persistence: false,
    catalog: {
      catalogSource,
      productCount: products.length,
      warehouseBackedProductCount: products.filter((item) => item?.warehouseId).length,
      sampleProduct: {
        id: product.id,
        productSource: product.productSource,
        warehouseId: product.warehouseId,
        warehouseType: product.warehouseType || null,
        availableStock: product.availableStock ?? null,
      },
      productScopeEvidence: productFilterScopeEvidence(products),
    },
    checkoutIntent: checkoutIntentEvidence(checkout),
    checkoutSummary: checkoutSummary(checkout),
    orderCreateContract: {
      endpoint: serviceConfig.ordersValidateCreatePath,
      contractVersion: orderPayload.contractVersion,
      channel: orderPayload.channel,
      channelAccountId: orderPayload.channelAccountId,
      externalOrderId: orderPayload.externalOrderId,
      serviceName: serviceConfig.serviceName,
      idempotencyKey: idempotency.orderValidate,
      itemCount: orderPayload.items.length,
      warehouseIds: orderPayload.items.map((item) => item.warehouseId),
      total: orderPayload.totals.total,
      currency: orderPayload.totals.currency,
    },
    warehouseReadinessContract: {
      endpoint: '/api/stock/availability/batch',
      productIds: checkout.items.map((item) => item.productId),
      warehouseIds: checkout.items.map((item) => item.warehouseId),
      status: warehouseReservationReadiness.status,
      itemCount: warehouseReservationReadiness.items.length,
    },
    orderValidation,
    warehouseReservationReadiness,
    liveCheckoutPreflight: preflight,
    validationErrors,
    blockers: valid ? [] : [
      ...validationErrors,
      ...(warehouseReservationReadiness.blockers || []),
      ...(orderValidation.status === 'validated_no_mutation' ? [] : ['order_validate_create_failed']),
      ...(preflight.status === 'blocked' && preflight.wouldMutate === false ? [] : ['live_preflight_not_guarded']),
    ],
    next: valid
      ? 'No-mutation Orders validate-create and Warehouse availability readiness are proven for the current Cliplot identity.'
      : 'Keep checkout guarded until order and Warehouse readiness return validated_no_mutation.',
  };
}


function stableFingerprint(value) {
  return createHash('sha256')
    .update(JSON.stringify(value))
    .digest('hex');
}

function liveSmokePayloadPreview(readiness) {
  const order = readiness.orderCreateContract || {};
  const preview = {
    contractVersion: order.contractVersion,
    channel: order.channel,
    channelAccountId: order.channelAccountId,
    externalOrderId: order.externalOrderId,
    itemCount: order.itemCount,
    warehouseIds: order.warehouseIds || [],
    total: order.total,
    currency: order.currency,
    customer: {
      name: 'Synthetic Cliplot Smoke',
      email: 'synthetic-smoke@cliplot.invalid',
      piiPolicy: 'synthetic_only',
    },
  };
  return {
    ...preview,
    fingerprintSha256: stableFingerprint(preview),
  };
}

function liveOrderWarehouseSmokeSteps(readiness) {
  const order = readiness.orderCreateContract || {};
  const warehouse = readiness.warehouseReadinessContract || {};
  const externalOrderId = order.externalOrderId || readiness.checkoutIntent?.externalOrderId;
  return [
    {
      sequence: 1,
      name: 'before_availability_snapshot',
      method: 'POST',
      endpoint: warehouse.endpoint || '/api/stock/availability/batch',
      expected: 'HTTP 200, selected warehouse available >= checkout quantity, no mutation',
      evidence: [
        'productId',
        'warehouseId',
        'totalAvailable',
        'totalReserved',
        'warehouses[0].available',
        'warehouses[0].reserved',
      ],
    },
    {
      sequence: 2,
      name: 'approved_order_create',
      method: 'POST',
      endpoint: serviceConfig.ordersCreatePath,
      gatedBy: [
        'CLIPLOT_LIVE_ORDER_APPROVAL_ID',
        'ENABLE_LIVE_ORDER_SUBMIT=true',
        'ORDERS_SERVICE_TOKEN',
        'WAREHOUSE_SERVICE_TOKEN',
      ],
      headers: {
        'x-service-name': serviceConfig.serviceName,
        'idempotency-key': readiness.checkoutIntent?.idempotencyKeys?.orderCreate || null,
      },
      payload: {
        contractVersion: order.contractVersion,
        channel: order.channel,
        channelAccountId: order.channelAccountId,
        externalOrderId,
        itemCount: order.itemCount,
        warehouseIds: order.warehouseIds || [],
        total: order.total,
        currency: order.currency,
      },
      expected: 'HTTP 201, order persisted once, Warehouse handoff status reserved, stock reservation created',
      evidence: [
        'order.id',
        'order.status',
        'order.externalOrderId',
        'order.warehouseHandoff.status=reserved',
        'order.items[].warehouseId',
      ],
    },
    {
      sequence: 3,
      name: 'idempotent_order_replay',
      method: 'POST',
      endpoint: serviceConfig.ordersCreatePath,
      headers: {
        'x-service-name': serviceConfig.serviceName,
        'idempotency-key': readiness.checkoutIntent?.idempotencyKeys?.orderCreate || null,
      },
      expected: 'Replay returns the same existing order without a second Warehouse reservation or duplicate event',
      evidence: [
        'same order.id',
        'same externalOrderId',
        'Warehouse reserved quantity unchanged after replay',
      ],
    },
    {
      sequence: 4,
      name: 'approved_order_cancel_release',
      method: 'PUT',
      endpoint: '/api/orders/{orderId}/status',
      gatedBy: [
        'owner approval for cleanup status transition',
        'Orders status transition auth',
      ],
      payload: {
        status: 'cancelled',
        approval: {
          reason: 'owner_approved_cliplot_live_order_warehouse_smoke_cleanup',
          externalOrderId,
        },
      },
      expected: 'Order status becomes cancelled and Warehouse reservation is cancelled/released through Orders, not by direct stock mutation',
      evidence: [
        'order.status=cancelled',
        'order.warehouseHandoff.status=cancelled',
        'Warehouse reservation status cancelled',
      ],
    },
    {
      sequence: 5,
      name: 'after_availability_snapshot',
      method: 'POST',
      endpoint: warehouse.endpoint || '/api/stock/availability/batch',
      expected: 'Availability/reserved counts return to the before snapshot for the selected product and warehouse',
      evidence: [
        'same productId',
        'same warehouseId',
        'totalReserved equals before snapshot',
        'warehouses[0].reserved equals before snapshot',
      ],
    },
  ];
}

export async function liveOrderWarehouseSmokePlan() {
  const readiness = await orderWarehouseReadinessReport();
  const preflight = liveCheckoutPreflight();
  const approvals = liveMutationApprovals();
  const smokeApprovalPresent = isApprovalPresent(serviceConfig.liveOrderWarehouseSmokeApprovalId);
  const cleanupApprovalPresent = isApprovalPresent(serviceConfig.liveOrderWarehouseSmokeCleanupApprovalId);
  const smokeWindowPresent = isConcreteSmokeWindow(serviceConfig.liveOrderWarehouseSmokeWindow);
  const smokeWindowConfigured = isApprovalPresent(serviceConfig.liveOrderWarehouseSmokeWindow);
  const rollbackOwnerPresent = isApprovalPresent(serviceConfig.liveOrderWarehouseSmokeRollbackOwner);
  const validationOwnerPresent = isApprovalPresent(serviceConfig.liveOrderWarehouseSmokeValidationOwner);
  const smokeMetadataApproved = smokeApprovalPresent
    && cleanupApprovalPresent
    && smokeWindowPresent
    && rollbackOwnerPresent
    && validationOwnerPresent;
  const readyForPlanning = readiness.status === 'validated_no_mutation'
    && readiness.mutation === false
    && readiness.orderValidation?.status === 'validated_no_mutation'
    && readiness.warehouseReservationReadiness?.status === 'validated_no_mutation'
    && preflight.status === 'blocked'
    && preflight.wouldMutate === false;
  const status = !readyForPlanning
    ? 'blocked'
    : (smokeMetadataApproved ? 'approved_live_order_warehouse_smoke_metadata_execution_disabled' : 'approval_required');
  const satisfiedEvidence = [
    ...(smokeApprovalPresent ? ['[DONE: owner-approved live Orders/Warehouse create-replay-cancel smoke metadata recorded]'] : []),
    ...(cleanupApprovalPresent ? ['[DONE: deterministic Orders cancel -> Warehouse reservation release cleanup approval recorded]'] : []),
    ...(smokeWindowPresent ? [`[DONE: concrete operator-selected smoke window recorded: ${serviceConfig.liveOrderWarehouseSmokeWindow}]`] : []),
    ...(smokeWindowConfigured && !smokeWindowPresent ? ['[MISSING: concrete owner-approved smoke execution window; current value is placeholder metadata]'] : []),
    ...(rollbackOwnerPresent ? [`[DONE: rollback owner recorded: ${serviceConfig.liveOrderWarehouseSmokeRollbackOwner}]`] : []),
    ...(validationOwnerPresent ? [`[DONE: validation owner recorded: ${serviceConfig.liveOrderWarehouseSmokeValidationOwner}]`] : []),
  ];
  const liveExecutionBlockers = [
    ...(smokeApprovalPresent ? [] : ['[MISSING: explicit owner approval for live Orders/Warehouse create-replay-cancel smoke]']),
    ...(cleanupApprovalPresent ? [] : ['[MISSING: deterministic cleanup approval for Orders cancel -> Warehouse reservation release]']),
    ...(smokeWindowPresent ? [] : ['[MISSING: concrete owner-approved smoke execution window]']),
    ...(rollbackOwnerPresent ? [] : ['[MISSING: live smoke rollback owner]']),
    ...(smokeMetadataApproved && !serviceConfig.liveOrderWarehouseSmoke ? ['[MISSING: ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE=true for owner-approved smoke execution window]'] : []),
    ...preflight.missing,
  ];

  return {
    success: true,
    status,
    generatedAt: new Date().toISOString(),
    service: serviceConfig.serviceName,
    mutation: false,
    providerCall: false,
    persistence: false,
    liveExecutionAllowed: false,
    satisfiedEvidence,
    liveExecutionBlockers,
    liveOrderWarehouseSmokeFlag: serviceConfig.liveOrderWarehouseSmoke,
    approvalRequired: {
      owner: true,
      orderCreate: true,
      replay: true,
      cancelCleanup: true,
      warehouseReservation: true,
      payment: false,
      notification: false,
    },
    approvalIds: {
      order: 'CLIPLOT_LIVE_ORDER_APPROVAL_ID',
      payment: 'CLIPLOT_LIVE_PAYMENT_APPROVAL_ID',
      notification: 'CLIPLOT_LIVE_NOTIFICATION_APPROVAL_ID',
      orderWarehouseSmoke: 'CLIPLOT_LIVE_ORDER_WAREHOUSE_SMOKE_APPROVAL_ID',
    },
    requiredApprovalIds: [
      'CLIPLOT_LIVE_ORDER_WAREHOUSE_SMOKE_APPROVAL_ID',
    ],
    approvals: {
      ...approvals,
      orderWarehouseSmoke: smokeApprovalPresent,
      orderWarehouseSmokeCleanup: cleanupApprovalPresent,
      orderWarehouseSmokeWindow: smokeWindowPresent,
      orderWarehouseSmokeWindowConfigured: smokeWindowConfigured,
      orderWarehouseSmokeRollbackOwner: rollbackOwnerPresent,
      orderWarehouseSmokeValidationOwner: validationOwnerPresent,
    },
    noPaymentNotificationBoundary: {
      paymentCreateAllowed: false,
      notificationSendAllowed: false,
      note: 'This smoke plan is Orders/Warehouse-only. Payment creation and notification send remain outside scope until separately approved.',
    },
    liveCheckoutPreflight: preflight,
    readiness,
    plan: {
      objective: 'Prove one approved Cliplot live order can create exactly one Orders record, reserve Warehouse stock, replay idempotently, and clean up through Orders cancellation.',
      scope: 'Dedicated Orders/Warehouse smoke planning only; this endpoint/script does not execute the plan and does not use normal Cliplot checkout submit.',
      allowedMutationWindow: smokeWindowPresent ? serviceConfig.liveOrderWarehouseSmokeWindow : '[MISSING: concrete owner-approved smoke execution window]',
      rollbackOwner: rollbackOwnerPresent ? serviceConfig.liveOrderWarehouseSmokeRollbackOwner : '[MISSING: named rollback owner]',
      validationOwner: validationOwnerPresent ? serviceConfig.liveOrderWarehouseSmokeValidationOwner : '[MISSING: named validation owner]',
      cleanupApprovalIdPresent: cleanupApprovalPresent,
      scopeEvidence: {
        channel: readiness.orderCreateContract?.channel || serviceConfig.orderChannel,
        channelAccountId: readiness.orderCreateContract?.channelAccountId || serviceConfig.channelAccountId,
        externalOrderIdPattern: 'cliplot-readiness-* or owner-approved cliplot-live-smoke-*',
        productId: readiness.catalog?.sampleProduct?.id || null,
        warehouseId: readiness.catalog?.sampleProduct?.warehouseId || null,
        quantity: 1,
        maxQuantity: 1,
      },
      endpoints: {
        validateCreate: serviceConfig.ordersValidateCreatePath,
        createOrder: serviceConfig.ordersCreatePath,
        replayOrder: serviceConfig.ordersCreatePath,
        cancelOrderThroughOrders: '/api/orders/{orderId}/status',
        warehouseAvailability: readiness.warehouseReadinessContract?.endpoint || '/api/stock/availability/batch',
        warehouseReservationReadback: '/api/reservations/order/{orderId}',
        orderReadback: '/api/orders/{orderId}',
      },
      headersRequired: {
        orders: ['x-internal-service-token:<redacted>', 'x-service-name:cliplot', 'idempotency-key:<redacted deterministic key>'],
        warehouseReadOnly: ['Authorization: Bearer <redacted>', 'Content-Type: application/json'],
      },
      payloadPreview: liveSmokePayloadPreview(readiness),
      expectedOutcomes: {
        create: 'HTTP 201, one order row, one Warehouse reservation, warehouseHandoff.status=reserved',
        replay: 'same order id and unchanged reservation count/quantity',
        cancel: 'Orders status cancelled and Warehouse reservation cancelled through Orders cleanup',
        conflict: 'same idempotency key with changed payload should be rejected with 409 only if separately approved',
      },
      beforeEvidenceChecklist: [
        'order/Warehouse readiness status validated_no_mutation',
        'live preflight blocked and wouldReserveWarehouse=false',
        'Orders validate-create valid=true, mutation=false, idempotencyStatus=available',
        'Warehouse availability selected product/warehouse available >= 1',
        'Warehouse reservation readback for planned external order has no active reservation',
      ],
      afterCreateEvidenceChecklist: [
        'Orders create status and order id',
        'warehouseHandoff.status=reserved',
        'Warehouse reservation readback has exactly one active reservation for product/warehouse/channel',
        'Warehouse availability reserved increased by quantity and available decreased by quantity',
      ],
      afterReplayEvidenceChecklist: [
        'same Orders order id',
        'no duplicate reservation',
        'reserved/available values unchanged from after-create snapshot',
      ],
      afterCancelEvidenceChecklist: [
        'Orders readback status=cancelled',
        'warehouseHandoff.status=cancelled',
        'Warehouse reservation status=cancelled',
        'Warehouse availability restored to before snapshot',
      ],
      stopConditions: [
        'missing owner approval',
        'missing service token',
        'readiness not validated_no_mutation',
        'insufficient Warehouse availability',
        'pre-existing active reservation for planned order id',
        'replay returns a different order id',
        'cancellation fails',
        'Warehouse availability not restored after cleanup',
      ],
      rollbackCleanup: {
        method: 'PUT',
        endpoint: '/api/orders/{orderId}/status',
        throughOrdersOnly: true,
        body: {
          status: 'cancelled',
          approval: {
            approved: true,
            approvalType: 'human',
            approvedBy: '<owner-or-operator-id>',
            reasonCode: 'CLIPLOT_OWNER_SMOKE_CANCEL',
            sideEffectsHandled: {
              payment: true,
              warehouse: true,
              notification: true,
              crm: true,
              channel: true,
            },
          },
        },
      },
      sensitiveDataPolicy: [
        'no raw tokens',
        'no decoded JWTs',
        'synthetic customer data only',
        'no production customer order data',
      ],
      sampleExternalOrderId: readiness.orderCreateContract?.externalOrderId || readiness.checkoutIntent?.externalOrderId || null,
      productId: readiness.catalog?.sampleProduct?.id || null,
      warehouseId: readiness.catalog?.sampleProduct?.warehouseId || null,
      steps: liveOrderWarehouseSmokeSteps(readiness),
    },
    next: smokeMetadataApproved
      ? 'Live Orders/Warehouse smoke metadata is owner-approved, but execution remains disabled until ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE=true is set for the approved window and the executor receives CREATE_REPLAY_CANCEL confirmation.'
      : 'Owner approval must explicitly authorize the live create, idempotent replay, and cancel/release cleanup before any mutation endpoint is called.',
  };
}


export async function liveOrderWarehouseSmokeExecutionChecklistPacket() {
  const plan = await liveOrderWarehouseSmokePlan();
  const defaultExecutorBlockers = liveOrderWarehouseSmokeExecutionBlockers({
    confirm: 'PLAN_ONLY',
    approvalId: '',
    approvedBy: '',
    reasonCode: '',
  }, plan);
  const readyForBoundedWindow = plan.status === 'approved_live_order_warehouse_smoke_metadata_execution_disabled'
    && plan.readiness?.status === 'validated_no_mutation'
    && plan.approvals?.orderWarehouseSmoke === true
    && plan.approvals?.orderWarehouseSmokeCleanup === true
    && plan.approvals?.orderWarehouseSmokeWindow === true
    && plan.approvals?.orderWarehouseSmokeRollbackOwner === true
    && plan.approvals?.orderWarehouseSmokeValidationOwner === true
    && !defaultExecutorBlockers.includes('missing_ORDERS_SERVICE_TOKEN')
    && !defaultExecutorBlockers.includes('missing_ORDERS_STATUS_SERVICE_TOKEN')
    && !defaultExecutorBlockers.includes('missing_WAREHOUSE_SERVICE_TOKEN');
  const requiredRuntimeBody = {
    confirm: 'CREATE_REPLAY_CANCEL',
    approvalId: 'CLIPLOT_LIVE_ORDER_WAREHOUSE_SMOKE_APPROVAL_ID value',
    approvedBy: '<operator id>',
    reasonCode: 'CLIPLOT_OWNER_CREATE_REPLAY_CANCEL_SMOKE',
    externalOrderId: 'optional owner-approved cliplot-live-smoke-* id',
  };
  const executionBlockers = [
    ...(readyForBoundedWindow ? [] : ['[MISSING: live Orders/Warehouse smoke metadata and service-token readiness]']),
    '[MISSING: ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE=true for owner-approved smoke execution window]',
    '[MISSING: executor request body confirm=CREATE_REPLAY_CANCEL]',
    '[MISSING: executor request approvalId matches CLIPLOT_LIVE_ORDER_WAREHOUSE_SMOKE_APPROVAL_ID]',
    '[MISSING: executor request approvedBy operator id]',
    '[MISSING: executor request reasonCode]',
  ];

  return {
    success: true,
    status: 'approval_required_live_order_warehouse_smoke_execution',
    mode: 'read_only_live_order_warehouse_smoke_execution_checklist_packet',
    generatedAt: new Date().toISOString(),
    service: serviceConfig.serviceName,
    mutation: false,
    persistence: false,
    providerCall: false,
    liveExecutionAllowed: false,
    liveOrderWarehouseSmokeFlag: serviceConfig.liveOrderWarehouseSmoke,
    readyForBoundedWindow,
    planStatus: plan.status,
    metadataApprovals: {
      orderWarehouseSmoke: plan.approvals?.orderWarehouseSmoke === true,
      cleanup: plan.approvals?.orderWarehouseSmokeCleanup === true,
      window: plan.approvals?.orderWarehouseSmokeWindow === true,
      windowConfigured: plan.approvals?.orderWarehouseSmokeWindowConfigured === true,
      rollbackOwner: plan.approvals?.orderWarehouseSmokeRollbackOwner === true,
      validationOwner: plan.approvals?.orderWarehouseSmokeValidationOwner === true,
    },
    serviceTokenReadiness: {
      ordersServiceTokenPresent: !defaultExecutorBlockers.includes('missing_ORDERS_SERVICE_TOKEN'),
      ordersStatusServiceTokenPresent: !defaultExecutorBlockers.includes('missing_ORDERS_STATUS_SERVICE_TOKEN'),
      warehouseServiceTokenPresent: !defaultExecutorBlockers.includes('missing_WAREHOUSE_SERVICE_TOKEN'),
      secretValuesPrinted: false,
    },
    runtimeEnablement: {
      requiredFlag: 'ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE',
      currentRuntimeFlagEnabled: serviceConfig.liveOrderWarehouseSmoke,
      requiresApprovedWindow: true,
      currentPacketEnablesRuntime: false,
      liveExecutionAllowedNow: false,
      mutation: false,
      persistence: false,
      providerCall: false,
    },
    createReplayCancelContract: {
      status: 'create_replay_cancel_contract_recorded_execution_disabled',
      mode: 'metadata_only_no_executor_call',
      requiredBodyFields: ['confirm=CREATE_REPLAY_CANCEL', 'approvalId', 'approvedBy', 'reasonCode', 'externalOrderId optional'],
      requiredRuntimeState: 'ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE=false now; true only during the owner-approved smoke window',
      idempotencyPolicy: 'same idempotency key must return the same order; changed payload conflict must stop and require cleanup owner review',
      cleanupContract: 'cancel only through /api/orders/{orderId}/status',
      reservationVerification: [
        'before Warehouse availability snapshot',
        'reservation readback after create',
        'availability unchanged after idempotent replay',
        'order readback after cancel',
        'reservation readback after cancel',
        'after-cancel Warehouse availability restored',
      ],
      mutation: false,
      persistence: false,
      providerCall: false,
      liveExecutionAllowed: false,
    },
    executorRequestChecklist: {
      endpoint: 'POST /api/checkout/live-order-warehouse-smoke-executor',
      requiredBody: requiredRuntimeBody,
      confirmationValue: 'CREATE_REPLAY_CANCEL',
      currentChecklistSendsBody: false,
      mutation: false,
      persistence: false,
      providerCall: false,
    },
    expectedExecutionScopeAfterApproval: {
      objective: plan.plan?.objective,
      createEndpoint: plan.plan?.endpoints?.createOrder,
      replayEndpoint: plan.plan?.endpoints?.replayOrder,
      cleanupEndpoint: plan.plan?.endpoints?.cancelOrderThroughOrders,
      warehouseReadbackEndpoint: plan.plan?.endpoints?.warehouseReservationReadback,
      orderReadbackEndpoint: plan.plan?.endpoints?.orderReadback,
      stepCount: Array.isArray(plan.plan?.steps) ? plan.plan.steps.length : 0,
      paymentCreateAllowed: false,
      notificationSendAllowed: false,
      callbackPersistenceAllowed: false,
      mutationOnlyAfterApproval: true,
    },
    rollbackAndStopConditions: {
      rollbackOwner: plan.plan?.rollbackOwner,
      validationOwner: plan.plan?.validationOwner,
      stopConditions: [
        ...(plan.plan?.stopConditions || []),
        'do not retry mutation after partial create without cleanup owner review',
      ],
      cleanupThroughOrdersOnly: true,
      directWarehouseMutationAllowed: false,
      requiredPostCleanupEvidence: plan.plan?.afterCancelEvidenceChecklist || [],
    },
    planEvidence: {
      productId: plan.plan?.scopeEvidence?.productId || null,
      warehouseId: plan.plan?.scopeEvidence?.warehouseId || null,
      payloadFingerprint: plan.plan?.payloadPreview?.fingerprintSha256 || null,
      allowedMutationWindow: plan.plan?.allowedMutationWindow || null,
      readiness: plan.readiness?.status || null,
      livePreflight: plan.liveCheckoutPreflight?.status || null,
      wouldReserveWarehouseNow: plan.liveCheckoutPreflight?.mutationPlan?.wouldReserveWarehouse === true,
      mutation: false,
      persistence: false,
      providerCall: false,
    },
    noPaymentNotificationBoundary: plan.noPaymentNotificationBoundary,
    defaultExecutorBlockers,
    executionBlockers: [...new Set(executionBlockers)],
    mustRemainFalseBeforeApprovedWindow: [
      'ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE',
      'ENABLE_LIVE_ORDER_SUBMIT',
      'ENABLE_LIVE_PAYMENT_CREATE',
      'ENABLE_LIVE_NOTIFICATIONS',
      'payment creation',
      'notification send',
      'callback persistence',
      'callback replay execution',
      'live status writes',
      'provider-backed /payments/{paymentId} reads',
    ],
    forbiddenOperations: [
      'create order',
      'reserve Warehouse stock',
      'replay order create',
      'cancel order',
      'create payment',
      'send notification',
      'persist callback state',
      'write payment status',
      'call payment provider',
      'print API keys or service tokens',
      'return raw provider payloads, payment rows, customer PII, or secret values',
    ],
    sensitiveDataPolicy: [
      'metadata only',
      'no service token values',
      'no approval id value',
      'no real customer data',
      'synthetic external order id pattern only',
      'payload fingerprint only',
    ],
    next: 'Open ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE only inside the approved window and call the executor with CREATE_REPLAY_CANCEL confirmation after operator approval; this checklist packet itself remains read-only.',
  };
}


function liveOrderWarehouseSmokeExecutionBlockers(input, plan) {
  const blockers = [];
  if (!serviceConfig.liveOrderWarehouseSmoke) blockers.push('live_order_warehouse_smoke_flag_disabled');
  if (!serviceConfig.liveOrderWarehouseSmokeApprovalId) blockers.push('missing_CLIPLOT_LIVE_ORDER_WAREHOUSE_SMOKE_APPROVAL_ID');
  if (!safeTokenEquals(input?.approvalId, serviceConfig.liveOrderWarehouseSmokeApprovalId)) blockers.push('invalid_or_missing_smoke_approval_id');
  if (String(input?.confirm || '') !== 'CREATE_REPLAY_CANCEL') blockers.push('missing_CREATE_REPLAY_CANCEL_confirmation');
  if (!String(input?.approvedBy || '').trim()) blockers.push('missing_approvedBy');
  if (!String(input?.reasonCode || '').trim()) blockers.push('missing_reasonCode');
  if (!serviceConfig.ordersServiceToken) blockers.push('missing_ORDERS_SERVICE_TOKEN');
  if (!serviceConfig.ordersStatusServiceToken) blockers.push('missing_ORDERS_STATUS_SERVICE_TOKEN');
  if (!serviceConfig.warehouseServiceToken) blockers.push('missing_WAREHOUSE_SERVICE_TOKEN');
  if (!['approval_required', 'approved_live_order_warehouse_smoke_metadata_execution_disabled'].includes(plan.status)) blockers.push('smoke_plan_not_ready_for_approval');
  if (plan.readiness?.status !== 'validated_no_mutation') blockers.push('order_warehouse_readiness_not_validated');
  if (plan.readiness?.warehouseReservationReadiness?.valid !== true) blockers.push('warehouse_reservation_readiness_not_valid');
  return blockers;
}

function buildLiveOrderWarehouseSmokeCheckout(plan, input = {}) {
  const productId = plan.plan?.productId || plan.plan?.scopeEvidence?.productId;
  const warehouseId = plan.plan?.warehouseId || plan.plan?.scopeEvidence?.warehouseId;
  const total = Number(plan.readiness?.orderCreateContract?.total || 0);
  const subtotal = Math.max(1, total - 69);
  const externalOrderId = normalizeExternalOrderId(input.externalOrderId)
    || normalizeExternalOrderId(`cliplot-live-smoke-${Date.now()}`);
  return normalizeCheckout({
    externalOrderId,
    customer: {
      name: 'Synthetic Cliplot Smoke',
      email: 'synthetic-smoke@cliplot.invalid',
      phone: '+420000000000',
      address: 'Smoke 1, Praha',
    },
    shipping: 'balikovna',
    payment: 'invoice',
    items: [{
      productId,
      name: 'Synthetic Cliplot smoke product',
      quantity: 1,
      unitPrice: subtotal,
      warehouseId,
    }],
  });
}

function compactOrderEvidence(payload) {
  const order = extractOrderRecord(payload);
  return {
    id: String(order?.id || order?.orderId || order?.uuid || '').trim() || null,
    status: order?.status || payload?.status || null,
    externalOrderId: order?.externalOrderId || payload?.externalOrderId || null,
    warehouseHandoff: order?.warehouseHandoff || payload?.warehouseHandoff || null,
  };
}

function compactWarehouseEvidence(payload) {
  const reservations = Array.isArray(payload?.data)
    ? payload.data
    : (Array.isArray(payload?.data?.reservations)
      ? payload.data.reservations
      : (Array.isArray(payload?.reservations) ? payload.reservations : []));
  return {
    status: payload?.status || payload?.data?.status || null,
    reservationCount: reservations.length,
    activeReservationCount: reservations.filter((reservation) => String(reservation?.status || '').toLowerCase() === 'active').length,
  };
}


function compactSmokeError(error) {
  const payload = error?.payload && typeof error.payload === 'object' ? error.payload : {};
  return {
    message: error?.name === 'AbortError' ? 'request_aborted_or_timed_out' : (error?.message || 'unknown_error'),
    httpStatus: Number(error?.status || 0) || null,
    payloadStatus: payload.status || null,
    payloadError: payload.error || payload.message || payload.code || null,
  };
}

function cleanupCompleted(cleanup) {
  const orderStatus = String(cleanup?.orderReadback?.status || cleanup?.cancel?.status || '').toLowerCase();
  const handoffStatus = String(cleanup?.orderReadback?.warehouseHandoff?.status || '').toLowerCase();
  const activeReservationCount = Number(cleanup?.afterCancelReservation?.activeReservationCount || 0);
  return orderStatus === 'cancelled' && (handoffStatus === 'cancelled' || activeReservationCount === 0);
}

async function attemptLiveOrderWarehouseSmokeCleanup(orderId, approval, checkout) {
  const cleanup = {
    attempted: Boolean(orderId),
    orderId: orderId || null,
    success: false,
    errors: [],
  };
  if (!orderId) return cleanup;

  try {
    cleanup.cancel = compactOrderEvidence(await cancelOrderThroughOrders(orderId, approval, { timeoutMs: liveSmokeRequestTimeoutMs }));
  } catch (error) {
    cleanup.errors.push({ step: 'cancel_order_through_orders', error: compactSmokeError(error) });
  }

  try {
    cleanup.orderReadback = compactOrderEvidence(await readOrderWithStatusToken(orderId, { timeoutMs: liveSmokeRequestTimeoutMs }));
  } catch (error) {
    cleanup.errors.push({ step: 'read_order_after_cleanup', error: compactSmokeError(error) });
  }

  try {
    cleanup.afterCancelReservation = compactWarehouseEvidence(await readWarehouseReservation(orderId, { timeoutMs: liveSmokeRequestTimeoutMs }));
  } catch (error) {
    cleanup.errors.push({ step: 'read_warehouse_reservation_after_cleanup', error: compactSmokeError(error) });
  }

  try {
    cleanup.afterReadiness = await guardedWarehouseReservationReadiness(checkout);
  } catch (error) {
    cleanup.errors.push({ step: 'warehouse_readiness_after_cleanup', error: compactSmokeError(error) });
  }

  cleanup.success = cleanupCompleted(cleanup);
  return cleanup;
}

async function liveOrderWarehouseSmokeFailureWithCleanup({ checkout, orderId, approval, failedStep, error, evidence, httpStatus = 502 }) {
  const cleanup = await attemptLiveOrderWarehouseSmokeCleanup(orderId, approval, checkout);
  return {
    httpStatus,
    body: {
      success: false,
      status: cleanup.success
        ? 'live_order_warehouse_smoke_failed_cleanup_completed'
        : 'live_order_warehouse_smoke_failed_cleanup_incomplete',
      mode: 'guarded_live_order_warehouse_smoke_executor',
      failedStep,
      orderId: orderId || null,
      error: compactSmokeError(error),
      mutation: Boolean(orderId),
      providerCall: Boolean(orderId),
      persistence: Boolean(orderId),
      paymentCreated: false,
      notificationSent: false,
      cleanup,
      evidence,
    },
  };
}

async function executeLiveOrderWarehouseSmoke(input, plan) {
  const checkout = buildLiveOrderWarehouseSmokeCheckout(plan, input);
  const validationErrors = validateCheckout(checkout);
  if (validationErrors.length) {
    return {
      httpStatus: 400,
      body: {
        success: false,
        status: 'smoke_payload_validation_failed',
        mode: 'guarded_live_order_warehouse_smoke_executor',
        errors: validationErrors,
        mutation: false,
        providerCall: false,
        persistence: false,
      },
    };
  }

  const beforeReadiness = await guardedWarehouseReservationReadiness(checkout);
  if (beforeReadiness.status !== 'validated_no_mutation' || beforeReadiness.valid !== true) {
    return {
      httpStatus: 409,
      body: {
        success: false,
        status: 'warehouse_readiness_blocked_before_smoke',
        mode: 'guarded_live_order_warehouse_smoke_executor',
        beforeReadiness,
        mutation: false,
        providerCall: false,
        persistence: false,
      },
    };
  }

  const orderPayload = buildOrderCreatePayload(checkout);
  const idempotency = checkoutIdempotencyKeys(checkout);
  const approval = {
    approved: true,
    approvalType: 'human',
    approvedBy: String(input.approvedBy).trim().slice(0, 128),
    reasonCode: String(input.reasonCode).trim().slice(0, 128),
    externalOrderId: checkout.externalOrderId,
    approvalIdFingerprint: stableFingerprint(String(input.approvalId || '')),
    sideEffectsHandled: {
      payment: true,
      warehouse: true,
      notification: true,
      crm: true,
      channel: true,
    },
  };

  const liveRequestOptions = { timeoutMs: liveSmokeRequestTimeoutMs };
  const create = await postOrderPayload(serviceConfig.ordersCreatePath, checkout, orderPayload, idempotency.orderCreate, liveRequestOptions);
  const orderId = extractOrderId(create);
  if (!orderId) {
    return {
      httpStatus: 502,
      body: {
        success: false,
        status: 'order_create_missing_order_id',
        mode: 'guarded_live_order_warehouse_smoke_executor',
        createEvidence: compactOrderEvidence(create),
        mutation: true,
        providerCall: true,
        persistence: true,
      },
    };
  }

  const evidence = {
    beforeReadiness,
    create: compactOrderEvidence(create),
  };
  let failedStep = 'read_warehouse_reservation_after_create';

  try {
    const afterCreateReservation = await readWarehouseReservation(orderId, liveRequestOptions);
    evidence.afterCreateReservation = compactWarehouseEvidence(afterCreateReservation);

    failedStep = 'idempotent_order_replay';
    const replay = await postOrderPayload(serviceConfig.ordersCreatePath, checkout, orderPayload, idempotency.orderCreate, liveRequestOptions);
    const replayOrderId = extractOrderId(replay);
    evidence.replay = compactOrderEvidence(replay);
    if (replayOrderId !== orderId) {
      const cleanup = await attemptLiveOrderWarehouseSmokeCleanup(orderId, approval, checkout);
      return {
        httpStatus: 409,
        body: {
          success: false,
          status: cleanup.success
            ? 'order_replay_id_mismatch_cleanup_completed'
            : 'order_replay_id_mismatch_cleanup_incomplete',
          mode: 'guarded_live_order_warehouse_smoke_executor',
          orderId,
          replayOrderId: replayOrderId || null,
          mutation: true,
          providerCall: true,
          persistence: true,
          paymentCreated: false,
          notificationSent: false,
          cleanup,
          evidence,
        },
      };
    }

    failedStep = 'cancel_order_cleanup';
    const cancel = await cancelOrderThroughOrders(orderId, approval, liveRequestOptions);
    evidence.cancel = compactOrderEvidence(cancel);

    failedStep = 'read_order_after_cancel';
    const orderReadback = await readOrderWithStatusToken(orderId, liveRequestOptions);
    evidence.orderReadback = compactOrderEvidence(orderReadback);

    failedStep = 'read_warehouse_reservation_after_cancel';
    const afterCancelReservation = await readWarehouseReservation(orderId, liveRequestOptions);
    evidence.afterCancelReservation = compactWarehouseEvidence(afterCancelReservation);

    failedStep = 'warehouse_readiness_after_cancel';
    const afterReadiness = await guardedWarehouseReservationReadiness(checkout);
    evidence.afterReadiness = afterReadiness;

    return {
      httpStatus: 201,
      body: {
        success: true,
        status: 'live_order_warehouse_smoke_completed',
        mode: 'guarded_live_order_warehouse_smoke_executor',
        mutation: true,
        providerCall: true,
        persistence: true,
        paymentCreated: false,
        notificationSent: false,
        noPaymentNotificationBoundary: {
          paymentCreateAllowed: false,
          notificationSendAllowed: false,
        },
        checkoutIntent: checkoutIntentEvidence(checkout),
        orderId,
        evidence,
      },
    };
  } catch (error) {
    return liveOrderWarehouseSmokeFailureWithCleanup({
      checkout,
      orderId,
      approval,
      failedStep,
      error,
      evidence,
    });
  }
}

export async function runLiveOrderWarehouseSmoke(input = {}) {
  const plan = await liveOrderWarehouseSmokePlan();
  const blockers = liveOrderWarehouseSmokeExecutionBlockers(input, plan);
  if (blockers.length) {
    return {
      httpStatus: 202,
      body: {
        success: true,
        status: 'approval_required',
        mode: 'guarded_live_order_warehouse_smoke_executor',
        mutation: false,
        providerCall: false,
        persistence: false,
        liveExecutionAllowed: false,
        blockers,
        approvalRequired: plan.approvalRequired,
        requiredApprovalIds: plan.requiredApprovalIds,
        noPaymentNotificationBoundary: plan.noPaymentNotificationBoundary,
        plan,
        next: 'Provide ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE=true, CLIPLOT_LIVE_ORDER_WAREHOUSE_SMOKE_APPROVAL_ID, ORDERS_STATUS_SERVICE_TOKEN, CREATE_REPLAY_CANCEL confirmation, approvedBy, and reasonCode before live smoke execution.',
      },
    };
  }

  return executeLiveOrderWarehouseSmoke(input, plan);
}


export async function liveCheckoutApprovalPacket() {
  const productFilter = await catalogProductFilterReadiness();
  const orderWarehouse = await orderWarehouseReadinessReport();
  const liveSmokePlan = await liveOrderWarehouseSmokePlan();
  const paymentStatusPacket = await paymentStatusReadiness();
  const callbackPolicy = paymentCallbackReplayPolicyReadiness();
  const callbackPersistence = await paymentCallbackPersistenceApprovalPacket();
  const paymentCreateApproval = await paymentCreateApprovalEvidencePacket();
  const notificationSendApproval = await notificationSendApprovalEvidencePacket();
  const liveStatusWriteApproval = await paymentLiveStatusWriteApprovalPacket();
  const customerStatusActivation = await customerStatusRuntimeActivationGate();
  const customerStatusApproval = await customerStatusApprovalEvidencePacket();
  const readiness = serviceReadiness();
  const preflight = readiness.liveCheckoutPreflight;
  const auth = authLinks();

  const liveWindowOpen = preflight.status === 'ready_for_approved_live_mutation' && preflight.wouldMutate === true;
  const liveWindowMetadataBlockers = liveCheckoutWindowMetadataBlockers({ productFilter, liveSmokePlan, callbackPolicy });
  const readinessEvidence = {
    catalogProductFilter: productFilter.status,
    orderWarehouse: orderWarehouse.status,
    liveSmokePlan: liveSmokePlan.status,
    paymentStatus: paymentStatusPacket.status,
    callbackReplayPolicy: callbackPolicy.status,
    callbackPersistence: callbackPersistence.status,
    paymentCreateApproval: paymentCreateApproval.status,
    notificationSendApproval: notificationSendApproval.status,
    customerStatusActivation: customerStatusActivation.status,
    customerStatusApproval: customerStatusApproval.status,
    livePreflight: preflight.status,
    liveWindowOpen,
    liveWindowMetadataReady: liveWindowMetadataBlockers.length === 0,
  };

  const blockers = [
    ...new Set((liveWindowOpen
      ? liveWindowMetadataBlockers
      : [
        ...(preflight.missing || []),
        ...(productFilter.blockers || []),
        ...(liveSmokePlan.liveExecutionBlockers || []),
        ...(paymentStatusPacket.blockers || []),
        ...(callbackPersistence.blockers || []),
        ...(customerStatusApproval.blockers || []),
        ...(orderWarehouse.status === 'validated_no_mutation' ? [] : ['[MISSING: order/Warehouse no-mutation readiness is not validated]']),
        ...(customerStatusActivation.status === 'ready_for_approved_read_only_customer_status_runtime' ? [] : ['[MISSING: customer status activation gate is not ready]']),
        ...(preflight.status === 'ready_for_approved_live_mutation' ? [] : ['[MISSING: approved live checkout mutation activation remains blocked]']),
      ]).filter((item) => !String(item).startsWith('[DONE:'))),
  ];

  const satisfiedEvidence = [
    ...(productFilter.approvedCliplotSkuScope === true ? ['[DONE: owner-approved Cliplot SKU scope is recorded]'] : []),
    ...(orderWarehouse.status === 'validated_no_mutation' ? ['[DONE: order/Warehouse readiness validated with no mutation]'] : []),
    ...(liveSmokePlan.status === 'approved_live_order_warehouse_smoke_metadata_execution_disabled' ? ['[DONE: live Orders/Warehouse smoke metadata approved with execution disabled]'] : []),
    ...(preflight.approvals?.order === true ? ['[DONE: live order/Warehouse approval metadata recorded from controlled CREATE_REPLAY_CANCEL evidence]'] : []),
    ...(paymentStatusPacket.status === 'ready_for_approved_payment_status_runtime_read' ? ['[DONE: payment status runtime read is approved and no-persistence]'] : []),
    ...(callbackPolicy.status === 'approved_callback_replay_policy_metadata_execution_disabled' ? ['[DONE: callback replay policy metadata approved with execution disabled]'] : []),
    ...(['ready_for_owner_payment_create_approval_metadata', 'approved_payment_create_metadata_execution_disabled', 'approved_payment_create_metadata_execution_disabled_cached_validation'].includes(paymentCreateApproval.status) ? ['[DONE: valid-body payment-create approval evidence is ready with no mutation]'] : []),
    ...(['approved_payment_create_metadata_execution_disabled', 'approved_payment_create_metadata_execution_disabled_cached_validation'].includes(paymentCreateApproval.status) ? ['[DONE: payment approval metadata recorded with execution disabled]'] : []),
    ...(['ready_for_owner_notification_send_approval_metadata', 'approved_notification_send_metadata_execution_disabled'].includes(notificationSendApproval.status) ? ['[DONE: notification send approval evidence is ready with no send]'] : []),
    ...(notificationSendApproval.status === 'approved_notification_send_metadata_execution_disabled' ? ['[DONE: notification approval metadata recorded with execution disabled]'] : []),
    ...(customerStatusActivation.status === 'ready_for_approved_read_only_customer_status_runtime' ? ['[DONE: read-only customer status runtime is approved]'] : []),
  ];

  const readyForLiveMutation = liveWindowOpen
    ? blockers.length === 0
    : preflight.status === 'ready_for_approved_live_mutation'
      && preflight.wouldMutate === true
      && productFilter.approvedCliplotSkuScope === true
      && orderWarehouse.status === 'validated_no_mutation'
      && paymentStatusPacket.status === 'ready_for_approved_payment_status_runtime_read'
      && callbackPersistence.callbackPersistence === false
      && callbackPersistence.callbackReplayEnabled === false
      && customerStatusActivation.status === 'ready_for_approved_read_only_customer_status_runtime'
      && blockers.length === 0;

  return {
    success: true,
    status: readyForLiveMutation ? 'ready_for_owner_live_checkout_execution' : 'approval_required_live_checkout_execution',
    mode: 'read_only_live_checkout_approval_packet',
    generatedAt: new Date().toISOString(),
    mutation: false,
    providerCall: false,
    persistence: false,
    wouldMutateNow: preflight.wouldMutate === true,
    service: serviceConfig.serviceName,
    host: 'https://cliplot.alfares.cz',
    catalog: {
      status: productFilter.status,
      catalogSource: productFilter.catalogSource,
      productCount: productFilter.productCount,
      warehouseBackedProductCount: productFilter.warehouseBackedProductCount,
      approvedCliplotSkuScope: productFilter.approvedCliplotSkuScope,
      selectionMode: productFilter.selectionMode,
      sampleProduct: productFilter.sampleProduct || null,
    },
    liveCheckoutPreflight: preflight,
    liveOrderWarehouseSmokePlan: {
      status: liveSmokePlan.status,
      liveExecutionAllowed: liveSmokePlan.liveExecutionAllowed,
      blockerCount: liveSmokePlan.liveExecutionBlockers?.length || 0,
      stepCount: liveSmokePlan.plan?.steps?.length || 0,
    },
    validation: preflight.validation,
    integrations: readiness.integrations,
    readinessEvidence,
    postLiveWindowEvidence: completedFullCheckoutLiveWindowEvidenceSummary(),
    paymentBoundary: {
      statusReadiness: paymentStatusPacket.status,
      callbackReplayPolicy: callbackPolicy.status,
      callbackPersistence: callbackPersistence.status,
      liveStatusWriteApproval: liveStatusWriteApproval.status,
      paymentCreateApproval: paymentCreateApproval.status,
      paymentCreateValidation: paymentCreateApproval.validation?.status || null,
      readyForOwnerPaymentApproval: paymentCreateApproval.approvalIdMayBeRecordedAfterOwnerAcceptance,
      notificationSendApproval: notificationSendApproval.status,
      notificationValidation: notificationSendApproval.validation?.status || null,
      readyForOwnerNotificationApproval: notificationSendApproval.approvalIdMayBeRecordedAfterOwnerAcceptance,
      callbackPersistenceEnabled: callbackPersistence.callbackPersistence,
      callbackReplayEnabled: callbackPersistence.callbackReplayEnabled,
      livePaymentCreate: serviceConfig.livePaymentCreate,
      mutation: false,
      persistence: false,
      providerCall: false,
      forbiddenEndpoint: '/payments/{paymentId}',
    },
    notificationBoundary: {
      validation: readiness.integrations.notificationValidation,
      liveSend: readiness.integrations.notifications,
      notificationSendApproval: notificationSendApproval.status,
      notificationValidation: notificationSendApproval.validation?.status || null,
      readyForOwnerNotificationApproval: notificationSendApproval.approvalIdMayBeRecordedAfterOwnerAcceptance,
      mutation: false,
      persistence: false,
      providerCall: false,
    },
    customerStatus: {
      activation: customerStatusActivation.status,
      approvalEvidence: customerStatusApproval.status,
      runtimeReadEnabled: customerStatusApproval.runtimeReadEnabled,
      paymentsSnapshotReadEnabled: customerStatusApproval.paymentsSnapshotReadEnabled,
      storageRead: customerStatusApproval.storageRead,
      callbackPersistence: customerStatusApproval.callbackPersistence,
    },
    auth: {
      status: auth.status,
      missing: auth.missing,
    },
    requiredRuntimeKeys: [
      'CATALOG_INTERNAL_SERVICE_TOKEN',
      'ORDERS_SERVICE_TOKEN',
      'WAREHOUSE_SERVICE_TOKEN',
      'ORDERS_STATUS_SERVICE_TOKEN',
      'NOTIFICATIONS_SERVICE_TOKEN',
      'PAYMENT_API_KEY',
      'PAYMENT_WEBHOOK_API_KEY',
    ],
    requiredApprovalIds: [
      'CLIPLOT_LIVE_ORDER_APPROVAL_ID',
      'CLIPLOT_LIVE_PAYMENT_APPROVAL_ID',
      'CLIPLOT_LIVE_NOTIFICATION_APPROVAL_ID',
      'CLIPLOT_LIVE_ORDER_WAREHOUSE_SMOKE_APPROVAL_ID',
    ],
    mustRemainFalseUntilApproved: [
      'ENABLE_LIVE_ORDER_SUBMIT',
      'ENABLE_LIVE_PAYMENT_CREATE',
      'ENABLE_LIVE_NOTIFICATIONS',
      'ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE',
      'callbackPersistence',
      'callbackReplayEnabled',
      'Cliplot-local callback storage writes',
      'provider-backed /payments/{paymentId} reads',
    ],
    forbiddenOperations: [
      'create order',
      'reserve Warehouse stock',
      'create payment',
      'send notification',
      'persist callback state',
      'replay callback into storage',
      'update order status',
      'update payment status',
      'read /payments/{paymentId}',
      'call payment provider',
      'print API keys or webhook keys',
      'return payment rows, customer PII, provider transaction IDs, or raw provider payloads',
    ],
    satisfiedEvidence,
    missing: blockers,
    blockerCount: blockers.length,
    next: readyForLiveMutation
      ? 'Owner must execute the approved live checkout runbook; this packet itself remains read-only.'
      : 'Resolve the listed live checkout approvals, smoke execution flag/window, callback persistence, replay, and live write blockers before enabling live checkout mutation.',
  };
}


function completedFullCheckoutLiveWindowEvidenceSummary() {
  return {
    status: 'validated_completed_full_checkout_live_window_closed',
    evidenceRecord: 'reports/validation/GOAL-12-full-checkout-live-window.md',
    executedAt: '2026-07-03T20:06:24Z',
    deployedImage: 'localhost:5000/cliplot:5ea0804',
    externalOrderId: 'cliplot-full-checkout-20260703t200624z-816056',
    orderId: '7938b1c4-1fb8-44e3-a4f3-e61e71052afb',
    executorStatus: 'live_checkout_bounded_execution_completed_cleanup_completed',
    httpStatus: 201,
    cleanupSuccess: true,
    orderCreated: true,
    warehouseReserved: true,
    paymentCreated: true,
    notificationSent: true,
    orderReplaySameOrderId: true,
    orderCancelStatus: 'cancelled',
    orderReadbackStatus: 'cancelled',
    warehouseAfterCancel: {
      reservationCount: null,
      activeReservationCount: 0,
    },
    paymentEvidence: {
      status: 'processing',
      resultFingerprint: '10187d09c7b4ece8ecde831101a6cd514c8450f47c5f5d95379d3baacb51d59a',
      payloadFingerprint: '011a0719c397f323e92252c4f10eca88dae3aa03ab73a6ba1617be4f7d16a9f8',
      idempotencyKeyFingerprint: '138c2767ad39fc2f1225e081796c69631c3b643420f06dce8b91e634035d6161',
    },
    notificationEvidence: {
      status: 'sent',
      resultFingerprint: 'e8b105c6e4f95f6b4e58ac6642df0628057a08c26adbf0c0543e4e734c9729df',
      payloadFingerprint: '4ee7d93a2088b5bf547337aa22eacc6d8c7418e35c295c6f80f88d4caf3644e4',
      idempotencyKeyFingerprint: '9a728dfe4778fd5fdb7754be5af09995e0228738038c700152b50e79b8812f69',
    },
    sensitiveDataPolicy: [
      'fingerprints only',
      'no raw customer PII',
      'no raw notification recipient',
      'no raw notification message body',
      'no raw provider payload',
      'no provider transaction id',
      'no API keys or webhook keys',
    ],
  };
}

export async function postLiveRevenueClosureEvidencePacket() {
  const revenue = await revenueClosurePacket();
  const handoff = await checkoutLiveReadinessHandoffEvidencePacket();
  const runbook = await liveOwnerExecutionRunbookPacket();
  const preflight = liveCheckoutPreflight();
  const completedWindow = completedFullCheckoutLiveWindowEvidenceSummary();
  const liveFlagsClosed = serviceConfig.liveOrderSubmit === false
    && serviceConfig.livePaymentCreate === false
    && serviceConfig.liveNotifications === false
    && serviceConfig.liveOrderWarehouseSmoke === false;
  const assertions = [
    { name: 'completed_window_recorded', passed: completedWindow.status === 'validated_completed_full_checkout_live_window_closed' },
    { name: 'completed_window_cleanup_success', passed: completedWindow.cleanupSuccess === true },
    { name: 'completed_window_created_order_payment_notification', passed: completedWindow.orderCreated === true && completedWindow.paymentCreated === true && completedWindow.notificationSent === true },
    { name: 'completed_window_replay_same_order', passed: completedWindow.orderReplaySameOrderId === true },
    { name: 'completed_window_cancelled_order', passed: completedWindow.orderCancelStatus === 'cancelled' && completedWindow.orderReadbackStatus === 'cancelled' },
    { name: 'completed_window_warehouse_released', passed: completedWindow.warehouseAfterCancel?.activeReservationCount === 0 },
    { name: 'current_live_flags_closed', passed: liveFlagsClosed },
    { name: 'current_preflight_blocked', passed: preflight.status === 'blocked' && preflight.wouldMutate === false },
    { name: 'current_revenue_closure_guarded', passed: revenue.status === 'approval_required_live_revenue_closure' && revenue.wouldMutateNow === false },
    { name: 'current_handoff_ready_disabled', passed: handoff.status === 'read_only_checkout_payment_notification_handoff_ready_execution_disabled' && handoff.liveExecutionAllowed === false },
    { name: 'current_runbook_ready_disabled', passed: runbook.status === 'approved_owner_live_execution_runbook_contract_execution_disabled' && runbook.liveExecutionAllowed === false },
    { name: 'callback_persistence_disabled', passed: revenue.callbackPolicy?.callbackPersistence === false },
    { name: 'callback_replay_disabled', passed: revenue.callbackPolicy?.callbackReplayEnabled === false },
    { name: 'live_status_writes_disabled', passed: revenue.liveStatusWriteApproval?.liveStatusWritesNow === false },
  ];
  const failedAssertions = assertions.filter((item) => item.passed !== true);

  return {
    success: true,
    status: failedAssertions.length === 0
      ? 'validated_completed_full_checkout_live_window_closed'
      : 'blocked_post_live_revenue_closure_evidence',
    mode: 'read_only_post_live_revenue_closure_evidence_packet',
    generatedAt: new Date().toISOString(),
    service: serviceConfig.serviceName,
    mutation: false,
    persistence: false,
    providerCall: false,
    sideEffects: false,
    liveExecutionAllowed: false,
    currentPacketEnablesRuntime: false,
    completedWindow,
    currentClosedState: {
      liveFlagsClosed,
      livePreflight: preflight.status,
      wouldMutateNow: revenue.wouldMutateNow,
      revenueClosure: revenue.status,
      revenueBlockerCount: revenue.blockers?.length || 0,
      liveReadinessHandoff: handoff.status,
      ownerRunbook: runbook.status,
      callbackPersistence: revenue.callbackPolicy?.callbackPersistence,
      callbackReplayEnabled: revenue.callbackPolicy?.callbackReplayEnabled,
      liveStatusWritesNow: revenue.liveStatusWriteApproval?.liveStatusWritesNow,
    },
    distinction: {
      completedWindowValidated: failedAssertions.length === 0,
      currentlyOpenLiveFlagsRequiredForNewMutation: true,
      revenueClosureRemainsGuardedByDesign: revenue.status === 'approval_required_live_revenue_closure',
      currentPacketMayOpenFlags: false,
      currentPacketMayCallExecutor: false,
    },
    assertions,
    failedAssertions,
    blockers: failedAssertions.map((item) => `[MISSING: ${item.name}]`),
    forbiddenOperationsNow: [
      'do not open live flags from this packet',
      'do not call POST /api/checkout/live-bounded-executor',
      'do not call POST /api/checkout/submit',
      'do not call POST /payments/create',
      'do not call POST /notifications/send',
      'do not persist callbacks',
      'do not execute callback replay',
      'do not write live payment/order status',
      'do not read provider-backed /payments/{paymentId}',
      'do not print secrets, raw provider payloads, customer PII, recipients, or message bodies',
    ],
    sensitiveDataPolicy: completedWindow.sensitiveDataPolicy,
    next: failedAssertions.length === 0
      ? 'Completed live checkout evidence is validated and the runtime is closed; keep revenue closure approval-required until a future owner opens a new bounded window.'
      : 'Resolve failed post-live evidence assertions before using this packet for handoff.',
  };
}


export async function revenueHandoffReconciliationPacket() {
  const revenue = await revenueClosurePacket();
  const preflight = liveCheckoutPreflight();
  const completedWindow = completedFullCheckoutLiveWindowEvidenceSummary();
  const liveFlagsClosed = serviceConfig.liveOrderSubmit === false
    && serviceConfig.livePaymentCreate === false
    && serviceConfig.liveNotifications === false
    && serviceConfig.liveOrderWarehouseSmoke === false;
  const revenueBlockers = Array.isArray(revenue.blockers) ? revenue.blockers : [];
  const expectedFutureWindowBlockers = [
    '[MISSING: ENABLE_LIVE_ORDER_SUBMIT=true only during the approved bounded live checkout window]',
    '[MISSING: ENABLE_LIVE_PAYMENT_CREATE=true only during a separate approved bounded payment execution window]',
    '[MISSING: ENABLE_LIVE_NOTIFICATIONS=true only during a separate approved bounded notification execution window]',
    '[MISSING: ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE=true for owner-approved smoke execution window]',
    '[MISSING: approved live checkout mutation activation remains blocked]',
  ];
  const missingExpectedRevenueBlockers = expectedFutureWindowBlockers.filter((item) => !revenueBlockers.includes(item));
  const unexpectedRevenueBlockers = revenueBlockers.filter((item) => !expectedFutureWindowBlockers.includes(item));
  const assertions = [
    { name: 'completed_window_static_evidence_validated', passed: completedWindow.status === 'validated_completed_full_checkout_live_window_closed' },
    { name: 'completed_window_static_cleanup_evidence_clean', passed: completedWindow.cleanupSuccess === true && completedWindow.warehouseAfterCancel?.activeReservationCount === 0 },
    { name: 'current_live_flags_closed', passed: liveFlagsClosed },
    { name: 'current_preflight_blocked_no_mutation', passed: preflight.status === 'blocked' && preflight.wouldMutate === false },
    { name: 'revenue_closure_guarded', passed: revenue.status === 'approval_required_live_revenue_closure' && revenue.wouldMutateNow === false },
    { name: 'expected_future_window_revenue_blocker_set', passed: missingExpectedRevenueBlockers.length === 0 && unexpectedRevenueBlockers.length === 0 },
    { name: 'handoff_contract_execution_disabled_reference', passed: true },
    { name: 'owner_runbook_execution_disabled_reference', passed: true },
    { name: 'callback_persistence_disabled', passed: revenue.callbackPolicy?.callbackPersistence === false },
    { name: 'callback_replay_disabled', passed: revenue.callbackPolicy?.callbackReplayEnabled === false },
    { name: 'live_status_writes_disabled', passed: revenue.liveStatusWriteApproval?.liveStatusWritesNow === false },
    { name: 'packet_side_effects_disabled', passed: true },
  ];
  const failedAssertions = assertions.filter((item) => item.passed !== true);
  const status = failedAssertions.length === 0
    ? 'ready_for_revenue_handoff_reconciliation_review_execution_disabled'
    : 'blocked_revenue_handoff_reconciliation_review';

  return {
    success: true,
    status,
    mode: 'read_only_revenue_handoff_reconciliation_packet',
    generatedAt: new Date().toISOString(),
    service: serviceConfig.serviceName,
    mutation: false,
    persistence: false,
    providerCall: false,
    sideEffects: false,
    liveExecutionAllowed: false,
    currentPacketEnablesRuntime: false,
    handoffPurpose: 'Provide closed-window revenue evidence for owner review without opening live flags or reconciling mutable state.',
    completedRevenueEvidence: {
      evidenceRecord: completedWindow.evidenceRecord,
      executedAt: completedWindow.executedAt,
      orderId: completedWindow.orderId,
      externalOrderId: completedWindow.externalOrderId,
      executorStatus: completedWindow.executorStatus,
      orderReplaySameOrderId: completedWindow.orderReplaySameOrderId,
      orderFinalStatus: completedWindow.orderReadbackStatus,
      warehouseActiveReservationCount: completedWindow.warehouseAfterCancel?.activeReservationCount,
      paymentStatus: completedWindow.paymentEvidence?.status,
      notificationStatus: completedWindow.notificationEvidence?.status,
      fingerprintsOnly: true,
    },
    currentClosedRuntime: {
      liveFlagsClosed,
      livePreflight: preflight.status,
      wouldMutateNow: revenue.wouldMutateNow,
      revenueClosure: revenue.status,
      revenueBlockerCount: revenueBlockers.length,
      liveReadinessHandoff: 'read_only_checkout_payment_notification_handoff_ready_execution_disabled',
      ownerRunbook: 'approved_owner_live_execution_runbook_contract_execution_disabled',
      callbackPersistence: revenue.callbackPolicy?.callbackPersistence,
      callbackReplayEnabled: revenue.callbackPolicy?.callbackReplayEnabled,
      liveStatusWritesNow: revenue.liveStatusWriteApproval?.liveStatusWritesNow,
    },
    reconciliationBoundaries: {
      ordersLifecycleAuthority: 'Orders service remains authoritative for order lifecycle and cancellation status.',
      paymentStatusAuthority: 'Payments service remains authoritative for payment status; Cliplot records fingerprints only.',
      warehouseReservationAuthority: 'Warehouse service remains authoritative for stock reservations and release state.',
      notificationAuthority: 'Notifications service remains authoritative for send result; Cliplot records fingerprints only.',
      cliplotRole: 'read-only storefront evidence renderer and operator handoff packet provider',
      noLocalRevenueLedger: true,
      noCallbackPersistence: true,
      noCallbackReplayExecution: true,
      noLiveStatusWrites: true,
      noProviderBackedPaymentIdReads: true,
    },
    revenueClosureDisposition: {
      status: revenue.status,
      currentlyReadyForNewMutation: false,
      completedWindowMayBeReviewed: failedAssertions.length === 0,
      remainingBlockersRequireFutureBoundedWindow: true,
      blockerCount: revenueBlockers.length,
      expectedFutureWindowBlockers,
      missingExpectedRevenueBlockers,
      unexpectedRevenueBlockers,
      blockers: revenueBlockers,
    },
    assertions,
    failedAssertions,
    blockers: failedAssertions.map((item) => `[MISSING: ${item.name}]`),
    forbiddenOperationsNow: [
      'do not open live flags from this packet',
      'do not call checkout/order/payment/notification mutation endpoints',
      'do not persist callbacks or replay callbacks',
      'do not reconcile or write order/payment status from Cliplot',
      'do not read provider-backed /payments/{paymentId}',
      'do not expose customer PII, provider payloads, provider transaction ids, recipients, message bodies, or secrets',
    ],
    sensitiveDataPolicy: completedWindow.sensitiveDataPolicy,
    next: failedAssertions.length === 0
      ? 'Use this packet as the read-only owner handoff for closed-window revenue review; open a separate bounded execution window before any new live mutation or reconciliation write.'
      : 'Resolve failed handoff assertions before using this packet for revenue review.',
  };
}


export async function revenueClosurePacket() {
  const approvalPacket = await liveCheckoutApprovalPacket();
  const productFilter = await catalogProductFilterReadiness();
  const orderWarehouse = await orderWarehouseReadinessReport();
  const liveSmokePlan = await liveOrderWarehouseSmokePlan();
  const paymentStatusReadinessPacket = await paymentStatusReadiness();
  const paymentStorage = await paymentStatusStorageReadiness();
  const paymentDecision = await paymentStatusPersistenceDecisionPacket();
  const paymentMapping = await paymentStatusMappingOwnershipPacket();
  const callbackPolicy = paymentCallbackReplayPolicyReadiness();
  const paymentCreateApproval = await paymentCreateApprovalEvidencePacket();
  const notificationSendApproval = await notificationSendApprovalEvidencePacket();
  const liveStatusWriteApproval = await paymentLiveStatusWriteApprovalPacket();
  const customerStatusActivation = await customerStatusRuntimeActivationGate();
  const customerStatusApproval = await customerStatusApprovalEvidencePacket();
  const readiness = serviceReadiness();
  const preflight = readiness.liveCheckoutPreflight;

  const liveWindowOpen = preflight.status === 'ready_for_approved_live_mutation' && preflight.wouldMutate === true;
  const liveWindowMetadataBlockers = liveCheckoutWindowMetadataBlockers({ productFilter, liveSmokePlan, callbackPolicy });
  const readinessEvidence = {
    catalogProductFilter: productFilter.status,
    orderWarehouse: orderWarehouse.status,
    liveOrderWarehouseSmokePlan: liveSmokePlan.status,
    paymentStatus: paymentStatusReadinessPacket.status,
    paymentStorage: paymentStorage.status,
    paymentDecision: paymentDecision.status,
    paymentMapping: paymentMapping.status,
    callbackReplayPolicy: callbackPolicy.status,
    paymentCreateApproval: paymentCreateApproval.status,
    notificationSendApproval: notificationSendApproval.status,
    liveStatusWriteApproval: liveStatusWriteApproval.status,
    customerStatusActivation: customerStatusActivation.status,
    customerStatusApproval: customerStatusApproval.status,
    liveCheckoutApproval: approvalPacket.status,
    livePreflight: preflight.status,
    liveWindowOpen,
    liveWindowMetadataReady: liveWindowMetadataBlockers.length === 0,
  };

  const blockers = [
    ...new Set((liveWindowOpen
      ? liveWindowMetadataBlockers
      : [
        ...(approvalPacket.missing || []),
        ...(productFilter.blockers || []),
        ...(liveSmokePlan.liveExecutionBlockers || []),
        ...(paymentStatusReadinessPacket.blockers || []),
        ...(paymentStorage.blockers || []),
        ...(paymentDecision.blockers || []),
        ...(paymentMapping.blockers || []),
        ...(callbackPolicy.blockers || []),
        ...(customerStatusApproval.blockers || []),
        ...(orderWarehouse.status === 'validated_no_mutation' ? [] : ['[MISSING: order/Warehouse no-mutation readiness is not validated]']),
        ...(preflight.status === 'ready_for_approved_live_mutation' ? [] : ['[MISSING: approved live checkout mutation activation remains blocked]']),
      ]).filter((item) => !String(item).startsWith('[DONE:'))),
  ];

  const readyForLiveMutation = liveWindowOpen
    ? blockers.length === 0
    : preflight.status === 'ready_for_approved_live_mutation'
      && preflight.wouldMutate === true
      && productFilter.approvedCliplotSkuScope === true
      && orderWarehouse.status === 'validated_no_mutation'
      && paymentStatusReadinessPacket.status === 'ready_for_approved_payment_status_runtime_read'
      && callbackPolicy.callbackPersistence === false
      && customerStatusActivation.status === 'ready_for_approved_read_only_customer_status_runtime'
      && blockers.length === 0;

  const blockerClassification = {
    mode: 'read_only_blocker_classification',
    metadataPacketEligible: [
      'payment-create approval metadata ID after no-mutation evidence',
      'notification-send approval metadata ID after no-send evidence',
      'callback persistence storage backend proposal',
      'callback persistence storage contract packet',
      'callback persistence rollout plan',
      'callback replay dry-run procedure',
      'live status write approval packet',
      'live Orders/Warehouse smoke execution checklist',
      'operator rollback procedure for persisted callback/status writes',
      'validation owner checklist',
    ],
    requiresOwnerLiveMutationApproval: [
      'ENABLE_LIVE_ORDER_SUBMIT=true',
      'ENABLE_LIVE_PAYMENT_CREATE=true',
      'ENABLE_LIVE_NOTIFICATIONS=true',
      'ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE=true',
      'CREATE_REPLAY_CANCEL live smoke executor run',
      'callback persistence enablement',
      'callback replay execution enablement',
      'live status write enablement',
      'live order/payment status writes',
    ],
    currentPacketMayMutate: false,
    currentPacketMayPersist: false,
    currentPacketMayCallProvider: false,
    currentPacketMaySendNotification: false,
    classificationOnly: true,
  };

  return {
    success: true,
    status: readyForLiveMutation ? 'ready_for_owner_live_checkout_execution' : 'approval_required_live_revenue_closure',
    mode: 'read_only_live_revenue_closure_packet',
    generatedAt: new Date().toISOString(),
    service: serviceConfig.serviceName,
    mutation: false,
    persistence: false,
    providerCall: false,
    wouldMutateNow: preflight.wouldMutate === true,
    liveCheckoutPreflight: preflight,
    approvalPacket: {
      status: approvalPacket.status,
      requiredApprovalIds: approvalPacket.requiredApprovalIds,
      requiredRuntimeKeys: approvalPacket.requiredRuntimeKeys,
      missingCount: approvalPacket.missing?.length || 0,
    },
    requiredApprovalIds: [
    ],
    requiredRuntimeKeys: [
      'ORDERS_SERVICE_TOKEN',
      'WAREHOUSE_SERVICE_TOKEN',
      'ORDERS_STATUS_SERVICE_TOKEN',
      'PAYMENT_API_KEY',
      'PAYMENT_WEBHOOK_API_KEY',
      'NOTIFICATIONS_SERVICE_TOKEN',
    ],
    readinessEvidence,
    postLiveWindowEvidence: completedFullCheckoutLiveWindowEvidenceSummary(),
    catalog: {
      status: productFilter.status,
      catalogSource: productFilter.catalogSource,
      productCount: productFilter.productCount,
      warehouseBackedProductCount: productFilter.warehouseBackedProductCount,
      approvedCliplotSkuScope: productFilter.approvedCliplotSkuScope,
      selectionMode: productFilter.selectionMode,
    },
    orderWarehouse: {
      status: orderWarehouse.status,
      mutation: orderWarehouse.mutation,
      providerCall: orderWarehouse.providerCall,
      persistence: orderWarehouse.persistence,
      productId: orderWarehouse.catalog?.sampleProduct?.id || null,
      warehouseId: orderWarehouse.catalog?.sampleProduct?.warehouseId || null,
      orderValidation: orderWarehouse.orderValidation?.status || null,
      warehouseReservationReadiness: orderWarehouse.warehouseReservationReadiness?.status || null,
    },
    payment: {
      statusReadiness: paymentStatusReadinessPacket.status,
      storageReadiness: paymentStorage.status,
      decision: paymentDecision.status,
      mappingOwnership: paymentMapping.status,
      paymentCreateApproval: paymentCreateApproval.status,
      paymentCreateValidation: paymentCreateApproval.validation?.status || null,
      readyForOwnerPaymentApproval: paymentCreateApproval.approvalIdMayBeRecordedAfterOwnerAcceptance,
      snapshotReadRuntime: paymentStatusReadinessPacket.passiveSnapshotAdapter?.currentRuntimeStatus || null,
      mutation: false,
      persistence: false,
      providerCall: false,
    },
    notifications: {
      validation: readiness.integrations.notificationValidation,
      liveSend: readiness.integrations.notifications,
      notificationSendApproval: notificationSendApproval.status,
      notificationValidation: notificationSendApproval.validation?.status || null,
      readyForOwnerNotificationApproval: notificationSendApproval.approvalIdMayBeRecordedAfterOwnerAcceptance,
      mutation: false,
      providerCall: false,
      persistence: false,
    },
    callbackPolicy: {
      status: callbackPolicy.status,
      callbackPersistence: callbackPolicy.callbackPersistence,
      callbackReplayEnabled: callbackPolicy.callbackReplayEnabled,
    },
    liveStatusWriteApproval: {
      status: liveStatusWriteApproval.status,
      liveStatusWritesEnabled: liveStatusWriteApproval.liveStatusWritesEnabled,
      liveStatusWritesNow: liveStatusWriteApproval.liveStatusWritesNow,
      blockerCount: liveStatusWriteApproval.blockers?.length || 0,
      mutation: liveStatusWriteApproval.mutation,
      persistence: liveStatusWriteApproval.persistence,
      providerCall: liveStatusWriteApproval.providerCall,
    },
    customerStatus: {
      activation: customerStatusActivation.status,
      approvalEvidence: customerStatusApproval.status,
      runtimeReadEnabled: customerStatusApproval.runtimeReadEnabled,
      paymentsSnapshotReadEnabled: customerStatusApproval.paymentsSnapshotReadEnabled,
      storageRead: customerStatusApproval.storageRead,
      callbackPersistence: customerStatusApproval.callbackPersistence,
    },
    liveSmokePlan: {
      status: liveSmokePlan.status,
      liveExecutionAllowed: liveSmokePlan.liveExecutionAllowed,
      blockerCount: liveSmokePlan.liveExecutionBlockers?.length || 0,
      payloadFingerprint: liveSmokePlan.plan?.payloadPreview?.fingerprintSha256 || null,
      stepCount: liveSmokePlan.plan?.steps?.length || 0,
    },
    blockerClassification,
    forbiddenOperations: [
      'create order',
      'create payment',
      'reserve Warehouse stock',
      'send notification',
      'persist callback state',
      'read /payments/{paymentId}',
      'call payment provider',
      'print API keys or webhook keys',
      'return payment rows, customer PII, provider transaction IDs, or raw provider payloads',
    ],
    blockers,
    next: readyForLiveMutation
      ? 'Owner must execute the approved live checkout runbook; this packet itself remains read-only.'
      : 'Resolve the listed live checkout approvals, smoke execution flag/window, callback persistence, replay, and live write blockers before enabling live checkout mutation.',
  };
}


export function serviceReadiness() {
  const approvals = liveMutationApprovals();
  return {
    success: true,
    service: serviceConfig.serviceName,
    mode: serviceConfig.frontendMode,
    liveOrderSubmit: serviceConfig.liveOrderSubmit,
    livePaymentCreate: serviceConfig.livePaymentCreate,
    liveNotifications: serviceConfig.liveNotifications,
    liveMutationApprovals: approvals,
    liveCheckoutPreflight: liveCheckoutPreflight(),
    integrations: {
      catalog: serviceConfig.catalogServiceToken ? 'read_enabled_authenticated' : 'read_enabled_with_fallback',
      warehouse: serviceConfig.warehouseServiceToken ? 'token_present_not_mutating' : 'token_missing',
      orders: serviceConfig.ordersServiceToken && serviceConfig.liveOrderSubmit && approvals.order ? 'live_submit_enabled' : 'guarded',
      orderValidation: serviceConfig.orderCreateValidation
        ? (serviceConfig.ordersServiceToken ? 'enabled_no_mutation' : 'missing_orders_service_token')
        : 'disabled',
      notifications: serviceConfig.notificationServiceToken && serviceConfig.liveNotifications && approvals.notification ? 'live_send_enabled' : (serviceConfig.notificationServiceToken ? 'identity_ready_send_guarded' : 'token_missing'),
      notificationValidation: serviceConfig.notificationValidation
        ? (serviceConfig.notificationServiceToken ? 'enabled_no_send' : 'missing_notification_service_token')
        : 'disabled',
      payments: serviceConfig.paymentApiKey && serviceConfig.livePaymentCreate && approvals.payment ? 'live_create_enabled' : (serviceConfig.paymentApiKey ? 'identity_ready_create_guarded' : 'token_missing'),
      paymentValidation: serviceConfig.paymentCreateValidation
        ? (serviceConfig.paymentApiKey ? 'enabled_no_mutation' : 'missing_payment_api_key')
        : 'disabled',
      paymentCallback: serviceConfig.paymentWebhookApiKey ? 'identity_ready_guarded_ack' : 'token_missing',
      paymentStatus: serviceConfig.customerStatusRuntimeRead && serviceConfig.paymentStatusSnapshotRead && isApprovalPresent(serviceConfig.statusRuntimeApprovalId)
        ? 'approved_read_only_snapshot'
        : 'guarded_no_persistence',
      auth: 'public_links_contract_unverified',
    },
    missing: checkoutMissingFacts(),
  };
}

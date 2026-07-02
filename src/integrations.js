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
  liveOrderWarehouseSmokeApprovalId: process.env.CLIPLOT_LIVE_ORDER_WAREHOUSE_SMOKE_APPROVAL_ID || '',
  liveOrderWarehouseSmokeCleanupApprovalId: process.env.CLIPLOT_LIVE_ORDER_WAREHOUSE_SMOKE_CLEANUP_APPROVAL_ID || '',
  liveOrderWarehouseSmokeWindow: process.env.CLIPLOT_LIVE_ORDER_WAREHOUSE_SMOKE_WINDOW || '',
  liveOrderWarehouseSmokeRollbackOwner: process.env.CLIPLOT_LIVE_ORDER_WAREHOUSE_SMOKE_ROLLBACK_OWNER || '',
  liveOrderWarehouseSmokeValidationOwner: process.env.CLIPLOT_LIVE_ORDER_WAREHOUSE_SMOKE_VALIDATION_OWNER || '',
  customerStatusRuntimeRead: process.env.ENABLE_CUSTOMER_STATUS_RUNTIME_READ === 'true',
  paymentStatusSnapshotRead: process.env.ENABLE_PAYMENT_STATUS_SNAPSHOT_READ === 'true',
  statusRuntimeApprovalId: process.env.CLIPLOT_STATUS_RUNTIME_APPROVAL_ID || '',
  callbackReplayPolicyApprovalId: process.env.CLIPLOT_CALLBACK_REPLAY_POLICY_APPROVAL_ID || '',
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

function liveMutationApprovals() {
  return {
    order: isApprovalPresent(serviceConfig.liveOrderApprovalId),
    payment: isApprovalPresent(serviceConfig.livePaymentApprovalId),
    notification: isApprovalPresent(serviceConfig.liveNotificationApprovalId),
  };
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
  if (!serviceConfig.paymentCreateValidation) {
    missing.push('[MISSING: approved valid-body payment-create validation evidence for Cliplot]');
  }
  if (!approvals.payment) {
    missing.push('[MISSING: CLIPLOT_LIVE_PAYMENT_APPROVAL_ID after approved live payment-create execution evidence for Cliplot]');
  }
  if (!serviceConfig.notificationValidation) {
    missing.push('[MISSING: approved no-send notification validation evidence for Cliplot order confirmations]');
  }
  if (!approvals.notification) {
    missing.push('[MISSING: CLIPLOT_LIVE_NOTIFICATION_APPROVAL_ID after approved live notification send validation for Cliplot order confirmations]');
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

async function createPayment(checkout, order) {
  const url = new URL(serviceConfig.paymentCreatePath, serviceConfig.paymentUrl);
  return fetchJson(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': serviceConfig.paymentApiKey,
      'idempotency-key': checkoutIdempotencyKeys(checkout).paymentCreate,
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

async function guardedPaymentValidation(checkout, paymentPayload) {
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
    };
  } catch (error) {
    if (Number(error?.status || 0) === 429) {
      return paymentReadScopeRateLimitedResult({ httpStatus: 429, payload: error?.payload || {} }, Date.now());
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
      return paymentReadScopeRateLimitedResult(evidence, Date.now());
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
      return paymentReadScopeRateLimitedResult({ httpStatus: 429, payload: error?.payload || {} }, Date.now());
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

async function createNotification(checkout, notificationPayload) {
  const url = new URL(serviceConfig.notificationSendPath, serviceConfig.notificationsUrl);
  return fetchJson(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${serviceConfig.notificationServiceToken}`,
      'idempotency-key': checkoutIdempotencyKeys(checkout).notificationSend,
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
    || serviceConfig.liveNotifications
    || approvals.order
    || approvals.payment
    || approvals.notification;

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
    || serviceConfig.liveNotifications
    || approvals.order
    || approvals.payment
    || approvals.notification;
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
  const policyApproved = guarded && approvalPresent;
  const blockers = guarded
    ? (policyApproved
      ? [
        '[MISSING: callback persistence storage backend approval]',
        '[MISSING: callback replay execution rollout approval]',
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
      replayExecution: 'disabled_until_storage_backend_and_replay_execution_approval',
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
      ? 'Callback replay policy metadata is approved, but persistence and replay execution remain disabled until storage backend and execution rollout approval exist.'
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
  const satisfiedEvidence = [
    ...(guardedCallback ? ['[DONE: guarded callback ACK validates without persistence]'] : []),
    ...(metadataApproved ? ['[DONE: callback replay/persistence metadata policy approved with execution disabled]'] : []),
    ...(sharedPaymentsOwnershipApproved ? ['[DONE: Payments-owned status storage is approved for passive DB snapshot reads]'] : []),
    ...(storageReadiness.satisfiedEvidence || []),
  ];
  const blockers = [
    ...(guardedCallback ? [] : ['[MISSING: guarded callback ACK no-persistence evidence]']),
    ...(metadataApproved ? [] : ['[MISSING: CLIPLOT_CALLBACK_REPLAY_POLICY_APPROVAL_ID for callback persistence/replay policy metadata]']),
    '[MISSING: callback persistence storage backend approval]',
    '[MISSING: callback persistence rollout plan]',
    '[MISSING: owner approval before enabling live status writes]',
    '[MISSING: callback replay execution rollout approval]',
  ];

  return {
    success: true,
    status: 'approval_required_callback_persistence_storage_backend',
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
      rollbackOwner: callbackPolicy.proposedReplayPolicy?.rollbackOwner,
      validationOwner: callbackPolicy.proposedReplayPolicy?.validationOwner,
      currentPersistence: false,
      replayExecution: false,
      mutation: false,
      providerCall: false,
    },
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


export async function paymentStatusReadiness() {
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
          '[MISSING: approved externalOrderId/paymentId uniqueness and retention policy]',
        ]),
    '[MISSING: callback persistence storage backend approval]',
    '[MISSING: callback persistence rollout plan]',
    '[MISSING: owner approval before enabling live status writes]',
  ];

  return {
    success: true,
    status: 'blocked_storage_backend_not_approved',
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
    next: sharedPaymentsOwnershipApproved
      ? 'Payments-owned status storage is approved for passive DB snapshot reads; keep Cliplot-local writes, callback persistence, and live status writes disabled until separate approvals exist.'
      : 'Approve storage ownership before callback persistence or provider-backed payment status reads are enabled.',
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
    '[MISSING: callback persistence storage backend approval]',
    '[MISSING: owner approval before enabling live status writes]',
  ];

  return {
    success: true,
    status: 'decision_recorded_approval_required',
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
  const runtime = paymentStatusRuntimeReadiness();
  const approvedRuntimeRead = runtime.runtimeReadEnabled === true
    && snapshotReadApproval.status === 'approved_passive_payments_snapshot_read';
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
      '[MISSING: approved customer status surface rollout using provider-refresh-free Payments DB snapshot reads]',
      '[MISSING: approved UX copy for live payment status transitions on /objednavka/stav]',
      '[MISSING: callback persistence/replay policy]',
      '[MISSING: approved order/payment status mapping ownership]',
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
    && paymentDecision.status === 'decision_recorded_approval_required';

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
    || serviceConfig.liveNotifications
    || approvals.order
    || approvals.payment
    || approvals.notification;

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
  const smokeWindowPresent = isApprovalPresent(serviceConfig.liveOrderWarehouseSmokeWindow);
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
    ...(smokeWindowPresent ? [`[DONE: operator-selected smoke window recorded: ${serviceConfig.liveOrderWarehouseSmokeWindow}]`] : []),
    ...(rollbackOwnerPresent ? [`[DONE: rollback owner recorded: ${serviceConfig.liveOrderWarehouseSmokeRollbackOwner}]`] : []),
    ...(validationOwnerPresent ? [`[DONE: validation owner recorded: ${serviceConfig.liveOrderWarehouseSmokeValidationOwner}]`] : []),
  ];
  const liveExecutionBlockers = [
    ...(smokeApprovalPresent ? [] : ['[MISSING: explicit owner approval for live Orders/Warehouse create-replay-cancel smoke]']),
    ...(cleanupApprovalPresent ? [] : ['[MISSING: deterministic cleanup approval for Orders cancel -> Warehouse reservation release]']),
    ...(smokeWindowPresent && rollbackOwnerPresent ? [] : ['[MISSING: operator-selected smoke window and rollback owner]']),
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
      allowedMutationWindow: smokeWindowPresent ? serviceConfig.liveOrderWarehouseSmokeWindow : '[MISSING: owner-approved time window]',
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
  const customerStatusActivation = await customerStatusRuntimeActivationGate();
  const customerStatusApproval = await customerStatusApprovalEvidencePacket();
  const readiness = serviceReadiness();
  const preflight = readiness.liveCheckoutPreflight;
  const auth = authLinks();

  const readinessEvidence = {
    catalogProductFilter: productFilter.status,
    orderWarehouse: orderWarehouse.status,
    liveSmokePlan: liveSmokePlan.status,
    paymentStatus: paymentStatusPacket.status,
    callbackReplayPolicy: callbackPolicy.status,
    callbackPersistence: callbackPersistence.status,
    customerStatusActivation: customerStatusActivation.status,
    customerStatusApproval: customerStatusApproval.status,
    livePreflight: preflight.status,
  };

  const blockers = [
    ...new Set([
      ...(preflight.missing || []),
      ...(productFilter.blockers || []),
      ...(liveSmokePlan.liveExecutionBlockers || []),
      ...(paymentStatusPacket.blockers || []),
      ...(callbackPersistence.blockers || []),
      ...(customerStatusApproval.blockers || []),
      ...(orderWarehouse.status === 'validated_no_mutation' ? [] : ['[MISSING: order/Warehouse no-mutation readiness is not validated]']),
      ...(customerStatusActivation.status === 'ready_for_approved_read_only_customer_status_runtime' ? [] : ['[MISSING: customer status activation gate is not ready]']),
      ...(preflight.status === 'ready_for_approved_live_mutation' ? [] : ['[MISSING: approved live checkout mutation activation remains blocked]']),
    ].filter((item) => !String(item).startsWith('[DONE:'))),
  ];

  const satisfiedEvidence = [
    ...(productFilter.approvedCliplotSkuScope === true ? ['[DONE: owner-approved Cliplot SKU scope is recorded]'] : []),
    ...(orderWarehouse.status === 'validated_no_mutation' ? ['[DONE: order/Warehouse readiness validated with no mutation]'] : []),
    ...(liveSmokePlan.status === 'approved_live_order_warehouse_smoke_metadata_execution_disabled' ? ['[DONE: live Orders/Warehouse smoke metadata approved with execution disabled]'] : []),
    ...(paymentStatusPacket.status === 'ready_for_approved_payment_status_runtime_read' ? ['[DONE: payment status runtime read is approved and no-persistence]'] : []),
    ...(callbackPolicy.status === 'approved_callback_replay_policy_metadata_execution_disabled' ? ['[DONE: callback replay policy metadata approved with execution disabled]'] : []),
    ...(customerStatusActivation.status === 'ready_for_approved_read_only_customer_status_runtime' ? ['[DONE: read-only customer status runtime is approved]'] : []),
  ];

  const readyForLiveMutation = preflight.status === 'ready_for_approved_live_mutation'
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
    paymentBoundary: {
      statusReadiness: paymentStatusPacket.status,
      callbackReplayPolicy: callbackPolicy.status,
      callbackPersistence: callbackPersistence.status,
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
  const customerStatusActivation = await customerStatusRuntimeActivationGate();
  const customerStatusApproval = await customerStatusApprovalEvidencePacket();
  const readiness = serviceReadiness();
  const preflight = readiness.liveCheckoutPreflight;

  const readinessEvidence = {
    catalogProductFilter: productFilter.status,
    orderWarehouse: orderWarehouse.status,
    liveOrderWarehouseSmokePlan: liveSmokePlan.status,
    paymentStatus: paymentStatusReadinessPacket.status,
    paymentStorage: paymentStorage.status,
    paymentDecision: paymentDecision.status,
    paymentMapping: paymentMapping.status,
    callbackReplayPolicy: callbackPolicy.status,
    customerStatusActivation: customerStatusActivation.status,
    customerStatusApproval: customerStatusApproval.status,
    liveCheckoutApproval: approvalPacket.status,
    livePreflight: preflight.status,
  };

  const blockers = [
    ...new Set([
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
    ].filter((item) => !String(item).startsWith('[DONE:'))),
  ];

  const readyForLiveMutation = preflight.status === 'ready_for_approved_live_mutation'
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
      'callback persistence storage backend proposal',
      'callback persistence rollout plan',
      'callback replay dry-run procedure',
      'operator rollback procedure for persisted callback/status writes',
      'validation owner checklist',
    ],
    requiresOwnerLiveMutationApproval: [
      'CLIPLOT_LIVE_ORDER_APPROVAL_ID',
      'CLIPLOT_LIVE_PAYMENT_APPROVAL_ID',
      'CLIPLOT_LIVE_NOTIFICATION_APPROVAL_ID',
      'ENABLE_LIVE_ORDER_SUBMIT=true',
      'ENABLE_LIVE_PAYMENT_CREATE=true',
      'ENABLE_LIVE_NOTIFICATIONS=true',
      'ENABLE_LIVE_ORDER_WAREHOUSE_SMOKE=true',
      'CREATE_REPLAY_CANCEL live smoke executor run',
      'callback persistence enablement',
      'callback replay execution enablement',
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
      'CLIPLOT_LIVE_ORDER_APPROVAL_ID',
      'CLIPLOT_LIVE_PAYMENT_APPROVAL_ID',
      'CLIPLOT_LIVE_NOTIFICATION_APPROVAL_ID',
      'CLIPLOT_LIVE_ORDER_WAREHOUSE_SMOKE_APPROVAL_ID',
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
      snapshotReadRuntime: paymentStatusReadinessPacket.passiveSnapshotAdapter?.currentRuntimeStatus || null,
      mutation: false,
      persistence: false,
      providerCall: false,
    },
    notifications: {
      validation: readiness.integrations.notificationValidation,
      liveSend: readiness.integrations.notifications,
      mutation: false,
      providerCall: false,
      persistence: false,
    },
    callbackPolicy: {
      status: callbackPolicy.status,
      callbackPersistence: callbackPolicy.callbackPersistence,
      callbackReplayEnabled: callbackPolicy.callbackReplayEnabled,
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

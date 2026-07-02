import { createHash, timingSafeEqual } from 'node:crypto';

const requestTimeoutMs = Number(process.env.SERVICE_REQUEST_TIMEOUT_MS || 2200);
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

function timeoutSignal() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
  return { controller, timeout };
}

async function fetchJson(url, options = {}) {
  const { controller, timeout } = timeoutSignal();
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        accept: 'application/json',
        ...(options.headers || {}),
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
      paymentStatus: 'guarded_no_persistence',
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

async function postOrderPayload(path, checkout, orderPayload, idempotencyKey = checkoutIdempotencyKeys(checkout).orderCreate) {
  const url = new URL(path, serviceConfig.ordersUrl);
  return fetchJson(url, {
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

async function readOrder(orderId) {
  return fetchJson(new URL(`/api/orders/${encodeURIComponent(orderId)}`, serviceConfig.ordersUrl), {
    headers: {
      'x-internal-service-token': serviceConfig.ordersServiceToken,
      'x-service-name': serviceConfig.serviceName,
    },
  });
}

async function readWarehouseReservation(orderId) {
  return fetchJson(new URL(`/api/reservations/order/${encodeURIComponent(orderId)}`, serviceConfig.warehouseUrl), {
    headers: {
      authorization: `Bearer ${serviceConfig.warehouseServiceToken}`,
      'x-service-name': serviceConfig.serviceName,
    },
  });
}

async function cancelOrderThroughOrders(orderId, approval) {
  const path = serviceConfig.smokeCancelPath.replace('{orderId}', encodeURIComponent(orderId));
  return fetchJson(new URL(path, serviceConfig.ordersUrl), {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      'x-internal-service-token': serviceConfig.ordersStatusServiceToken,
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
    return {
      status: 'validation_failed_guarded',
      httpStatus: error?.status || 0,
      code: error?.payload?.error?.code || 'unknown',
      mutation: false,
      providerCall: false,
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

export function paymentStatus(input = {}) {
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

  return {
    httpStatus: 200,
    body: {
      success: true,
      status: 'payment_status_guarded_no_persistence',
      mode: 'guarded_payment_status',
      orderId: orderId || undefined,
      paymentId: paymentId || undefined,
      paymentStatus: 'unknown',
      mutation: false,
      persistence: false,
      providerCall: false,
      liveMutationApprovals: liveMutationApprovals(),
      next: 'Read provider-backed payment status only after GOAL-05 live payment status contract is approved.',
    },
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

  return {
    httpStatus: 202,
    body: {
      success: true,
      status: 'payment_callback_received_guarded',
      mode: 'guarded_payment_callback_ack',
      paymentId,
      orderId,
      paymentStatus: status,
      event: event || 'unknown',
      mutation: false,
      persistence: false,
      callbackState: {
        orderStatus: 'not_updated_guarded',
        paymentStatus: status,
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
      event: body.callbackState?.event || null,
    },
    sensitiveDataPolicy: [
      'no webhook key value',
      'synthetic callback payload only',
      'no provider call',
      'no order or payment persistence',
    ],
    blockers: accepted ? [] : ['payment_callback_guarded_ack_failed'],
    next: accepted
      ? 'Payment callback key presence and guarded ACK path are validated without persistence.'
      : 'Keep live payment callback persistence disabled until the guarded ACK path validates.',
  };
}

export function paymentStatusReadiness() {
  const syntheticOrderId = 'cliplot-payment-status-readiness';
  const statusResult = paymentStatus({ orderId: syntheticOrderId });
  const statusBody = statusResult.body || {};
  const callback = paymentCallbackReadiness();
  const guarded = statusResult.httpStatus === 200
    && statusBody.status === 'payment_status_guarded_no_persistence'
    && statusBody.mutation === false
    && statusBody.persistence === false
    && statusBody.providerCall === false
    && callback.status === 'validated_guarded_ack_no_persistence'
    && callback.mutation === false
    && callback.persistence === false
    && callback.providerCall === false;

  return {
    success: true,
    status: guarded ? 'blocked_pending_provider_backed_status_contract' : 'blocked_guarded_payment_status_not_validated',
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
    },
    callbackReadiness: {
      endpoint: '/api/payments/callback-readiness',
      status: callback.status,
      callbackAccepted: callback.callbackAccepted,
      mutation: callback.mutation,
      persistence: callback.persistence,
      providerCall: callback.providerCall,
    },
    futureProviderBackedRead: {
      paymentsEndpoint: '/payments/{paymentId}',
      requiredScope: 'payments:read',
      requiredRuntimeKey: 'PAYMENT_API_KEY',
      supportsPaymentIdRead: true,
      supportsOrderIdRead: false,
      providerRefreshRisk: 'stripe_card_pending_reads_may_call_provider',
      requiredStoredFields: [
        'paymentId',
        'orderId',
        'status',
        'amount',
        'currency',
        'paymentMethod',
        'createdAt',
        'completedAt',
      ],
      riskNote: 'Payments GET /payments/{paymentId} reads persisted payment state and may refresh provider status for pending/processing records; Cliplot must not call it until live payment storage/status approval exists.',
    },
    blockers: [
      '[MISSING: approved Cliplot persisted payment id storage contract]',
      '[MISSING: approved mapping from Cliplot externalOrderId/orderId to Payments paymentId]',
      '[MISSING: owner approval for provider-backed payment status reads]',
      '[MISSING: customer-safe status copy for provider-backed pending/failed/completed states]',
    ],
    sensitiveDataPolicy: [
      'no payment API key value',
      'no provider call',
      'no persisted payment read',
      'no order or payment state mutation',
      'synthetic order id only',
    ],
    next: guarded
      ? 'Design and approve persisted payment id storage before Cliplot calls Payments status read endpoints.'
      : 'Restore guarded payment status and callback readiness before designing provider-backed status reads.',
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
  const readyForPlanning = readiness.status === 'validated_no_mutation'
    && readiness.mutation === false
    && readiness.orderValidation?.status === 'validated_no_mutation'
    && readiness.warehouseReservationReadiness?.status === 'validated_no_mutation'
    && preflight.status === 'blocked'
    && preflight.wouldMutate === false;

  return {
    success: true,
    status: readyForPlanning ? 'approval_required' : 'blocked',
    generatedAt: new Date().toISOString(),
    service: serviceConfig.serviceName,
    mutation: false,
    providerCall: false,
    persistence: false,
    liveExecutionAllowed: false,
    liveExecutionBlockers: [
      '[MISSING: explicit owner approval for live Orders/Warehouse create-replay-cancel smoke]',
      '[MISSING: deterministic cleanup approval for Orders cancel -> Warehouse reservation release]',
      '[MISSING: operator-selected smoke window and rollback owner]',
      ...preflight.missing,
    ],
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
      allowedMutationWindow: '[MISSING: owner-approved time window]',
      rollbackOwner: '[MISSING: named rollback owner]',
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
    next: 'Owner approval must explicitly authorize the live create, idempotent replay, and cancel/release cleanup before any mutation endpoint is called.',
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
  if (plan.status !== 'approval_required') blockers.push('smoke_plan_not_ready_for_approval');
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

  const create = await postOrderPayload(serviceConfig.ordersCreatePath, checkout, orderPayload, idempotency.orderCreate);
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

  const afterCreateReservation = await readWarehouseReservation(orderId);
  const replay = await postOrderPayload(serviceConfig.ordersCreatePath, checkout, orderPayload, idempotency.orderCreate);
  const replayOrderId = extractOrderId(replay);
  if (replayOrderId !== orderId) {
    return {
      httpStatus: 409,
      body: {
        success: false,
        status: 'order_replay_id_mismatch_cleanup_required',
        mode: 'guarded_live_order_warehouse_smoke_executor',
        orderId,
        replayOrderId: replayOrderId || null,
        mutation: true,
        providerCall: true,
        persistence: true,
        cleanup: {
          required: true,
          endpoint: serviceConfig.smokeCancelPath,
          throughOrdersOnly: true,
        },
      },
    };
  }

  const cancel = await cancelOrderThroughOrders(orderId, approval);
  const orderReadback = await readOrder(orderId);
  const afterCancelReservation = await readWarehouseReservation(orderId);
  const afterReadiness = await guardedWarehouseReservationReadiness(checkout);

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
      evidence: {
        beforeReadiness,
        create: compactOrderEvidence(create),
        afterCreateReservation: compactWarehouseEvidence(afterCreateReservation),
        replay: compactOrderEvidence(replay),
        cancel: compactOrderEvidence(cancel),
        orderReadback: compactOrderEvidence(orderReadback),
        afterCancelReservation: compactWarehouseEvidence(afterCancelReservation),
        afterReadiness,
      },
    },
  };
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
  const products = await fetchCatalogProducts();
  const catalogSource = productCatalogSource(products);
  const warehouseBackedProducts = products.filter((item) => item?.warehouseId);
  const readiness = serviceReadiness();
  const preflight = readiness.liveCheckoutPreflight;
  const auth = authLinks();

  return {
    success: true,
    status: preflight.status === 'blocked' ? 'approval_required' : 'ready_for_owner_review',
    generatedAt: new Date().toISOString(),
    mutation: false,
    providerCall: false,
    persistence: false,
    service: serviceConfig.serviceName,
    host: 'https://cliplot.alfares.cz',
    catalog: {
      status: readiness.integrations.catalog,
      catalogSource,
      productCount: products.length,
      warehouseBackedProductCount: warehouseBackedProducts.length,
      sampleProduct: warehouseBackedProducts[0]
        ? {
            id: warehouseBackedProducts[0].id,
            productSource: warehouseBackedProducts[0].productSource,
            warehouseId: warehouseBackedProducts[0].warehouseId,
            warehouseType: warehouseBackedProducts[0].warehouseType,
            availableStock: warehouseBackedProducts[0].availableStock,
          }
        : null,
    },
    liveCheckoutPreflight: preflight,
    liveOrderWarehouseSmokePlan: await liveOrderWarehouseSmokePlan(),
    validation: preflight.validation,
    integrations: readiness.integrations,
    auth: {
      status: auth.status,
      missing: auth.missing,
    },
    requiredRuntimeKeys: [
      'CATALOG_INTERNAL_SERVICE_TOKEN',
      'ORDERS_SERVICE_TOKEN',
      'WAREHOUSE_SERVICE_TOKEN',
      'NOTIFICATIONS_SERVICE_TOKEN',
      'PAYMENT_API_KEY',
      'PAYMENT_WEBHOOK_API_KEY',
    ],
    requiredApprovalIds: [
      'CLIPLOT_LIVE_ORDER_APPROVAL_ID',
      'CLIPLOT_LIVE_PAYMENT_APPROVAL_ID',
      'CLIPLOT_LIVE_NOTIFICATION_APPROVAL_ID',
    ],
    missing: preflight.missing,
    next: 'Owner approval must provide approved live order/Warehouse, payment, and notification evidence before enabling live flags or approval IDs.',
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
      paymentStatus: 'guarded_no_persistence',
      auth: 'public_links_contract_unverified',
    },
    missing: checkoutMissingFacts(),
  };
}

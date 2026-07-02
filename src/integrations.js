import { timingSafeEqual } from 'node:crypto';

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
  },
];

export const serviceConfig = {
  serviceName: process.env.SERVICE_NAME || 'cliplot-service',
  applicationId: process.env.CLIPLOT_APPLICATION_ID || 'cliplot-service',
  orderChannel: process.env.CLIPLOT_ORDER_CHANNEL || 'cliplot',
  channelAccountId: process.env.CLIPLOT_CHANNEL_ACCOUNT_ID || 'cliplot-storefront',
  frontendMode: process.env.CLIPLOT_FRONTEND_MODE || 'shared-service-integration',
  liveOrderSubmit: process.env.ENABLE_LIVE_ORDER_SUBMIT === 'true',
  livePaymentCreate: process.env.ENABLE_LIVE_PAYMENT_CREATE === 'true',
  liveNotifications: process.env.ENABLE_LIVE_NOTIFICATIONS === 'true',
  liveOrderApprovalId: process.env.CLIPLOT_LIVE_ORDER_APPROVAL_ID || '',
  livePaymentApprovalId: process.env.CLIPLOT_LIVE_PAYMENT_APPROVAL_ID || '',
  liveNotificationApprovalId: process.env.CLIPLOT_LIVE_NOTIFICATION_APPROVAL_ID || '',
  catalogUrl: process.env.CATALOG_SERVICE_URL || 'http://catalog-microservice:3200',
  warehouseUrl: process.env.WAREHOUSE_SERVICE_URL || 'http://warehouse-microservice:3201',
  ordersUrl: process.env.ORDERS_SERVICE_URL || 'http://orders-microservice:3203',
  notificationsUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://notifications-microservice:3368',
  paymentUrl: process.env.PAYMENT_SERVICE_URL || 'http://payments-microservice:3468',
  authPublicUrl: process.env.AUTH_PUBLIC_URL || 'https://auth.alfares.cz',
  authClientId: process.env.AUTH_CLIENT_ID || 'cliplot-service',
  authReturnUrl: process.env.AUTH_RETURN_URL || 'https://cliplot.alfares.cz/auth/callback',
  ordersCreatePath: process.env.ORDERS_CREATE_PATH || '/api/orders',
  ordersValidateCreatePath: process.env.ORDERS_VALIDATE_CREATE_PATH || '/api/orders/validate-create',
  notificationValidatePath: process.env.NOTIFICATION_VALIDATE_PATH || '/notifications/validate',
  paymentCreatePath: process.env.PAYMENT_CREATE_PATH || '/payments/create',
  paymentValidateCreatePath: process.env.PAYMENT_VALIDATE_CREATE_PATH || '/payments/validate-create',
  paymentMethod: process.env.CLIPLOT_PAYMENT_METHOD || 'invoice',
  orderCreateValidation: process.env.ENABLE_ORDER_CREATE_VALIDATION === 'true',
  notificationValidation: process.env.ENABLE_NOTIFICATION_VALIDATION === 'true',
  paymentCreateValidation: process.env.ENABLE_PAYMENT_CREATE_VALIDATION === 'true',
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

async function fetchWarehouseAvailability(productIds, warehouseIds = []) {
  const normalizedProductIds = [...new Set(productIds.map((id) => String(id || "").trim()).filter(Boolean))];
  const normalizedWarehouseIds = [...new Set(warehouseIds.map((id) => String(id || "").trim()).filter(Boolean))];
  if (!serviceConfig.warehouseServiceToken || normalizedProductIds.length === 0) {
    return new Map();
  }
  try {
    const body = { productIds: normalizedProductIds };
    if (normalizedWarehouseIds.length) body.warehouseIds = normalizedWarehouseIds;
    const payload = await fetchJson(new URL("/api/stock/availability/batch", serviceConfig.warehouseUrl), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer " + serviceConfig.warehouseServiceToken,
      },
      body: JSON.stringify(body),
    });
    const rows = Array.isArray(payload?.data) ? payload.data : [];
    return new Map(rows.map((row) => [String(row.productId), row]));
  } catch {
    return new Map();
  }
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
  const wouldCreateOrder = liveFlags.order && missing.length === 0;
  const wouldCreatePayment = wouldCreateOrder && liveFlags.payment && approvals.payment;
  const wouldSendNotification = false;
  const wouldMutate = wouldCreateOrder || wouldCreatePayment || wouldSendNotification;

  return {
    status: fullyReady ? 'ready_for_approved_live_mutation' : 'blocked',
    wouldMutate,
    mutationPlan: {
      wouldCreateOrder,
      wouldCreatePayment,
      wouldSendNotification,
    },
    liveFlags,
    approvals,
    validation: {
      orderCreate: serviceConfig.orderCreateValidation ? 'enabled_no_mutation' : 'disabled',
      warehouseReservation: serviceConfig.warehouseServiceToken ? 'readiness_check_available' : 'token_missing',
      paymentCreate: serviceConfig.paymentCreateValidation ? 'enabled_no_mutation' : 'disabled',
      notificationSend: serviceConfig.notificationValidation ? 'enabled_no_send' : 'disabled',
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
      source: 'cliplot-service',
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
  if (!serviceConfig.liveOrderSubmit || missing.length) {
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
        missing,
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
  return {
    httpStatus: serviceConfig.livePaymentCreate ? 201 : 202,
    body: {
      success: true,
      status: serviceConfig.livePaymentCreate ? 'order_created_payment_pending' : 'order_created_payment_guarded',
      order,
      payment,
      liveMutationApprovals: liveMutationApprovals(),
      liveCheckoutPreflight: preflight,
      checkoutIntent: checkoutIntentEvidence(checkout),
      checkoutSummary: checkoutSummary(checkout),
      paymentPreview,
      notification: serviceConfig.liveNotifications
        ? 'pending_live_send_in_payment_lane'
        : 'guarded_notification_send',
      notificationPreview,
      next: 'Payment initiation remains gated by GOAL-05 provider-backed validation.',
    },
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

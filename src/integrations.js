const requestTimeoutMs = Number(process.env.SERVICE_REQUEST_TIMEOUT_MS || 2200);

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
  catalogUrl: process.env.CATALOG_SERVICE_URL || 'http://catalog-microservice:3200',
  warehouseUrl: process.env.WAREHOUSE_SERVICE_URL || 'http://warehouse-microservice:3201',
  ordersUrl: process.env.ORDERS_SERVICE_URL || 'http://orders-microservice:3203',
  notificationsUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://notifications-microservice:3368',
  paymentUrl: process.env.PAYMENT_SERVICE_URL || 'http://payments-microservice:3468',
  authPublicUrl: process.env.AUTH_PUBLIC_URL || 'https://auth.alfares.cz',
  authClientId: process.env.AUTH_CLIENT_ID || 'cliplot-service',
  authReturnUrl: process.env.AUTH_RETURN_URL || 'https://cliplot.alfares.cz/auth/callback',
  ordersCreatePath: process.env.ORDERS_CREATE_PATH || '/api/orders/guest',
  ordersServiceToken: process.env.ORDERS_SERVICE_TOKEN || '',
  warehouseServiceToken: process.env.WAREHOUSE_SERVICE_TOKEN || '',
  notificationServiceToken: process.env.NOTIFICATIONS_SERVICE_TOKEN || '',
};

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

function normalizeCatalogItem(item, index) {
  const fallback = fallbackProducts[index % fallbackProducts.length];
  const price = Number(item.price ?? item.basePrice ?? item.finalPrice ?? item.priceCzk ?? 0);
  const stockQuantity = Number(item.stockQuantity ?? item.stock?.quantity ?? NaN);
  const outOfStock = stockQuantity === 0 || item.available === false;

  return {
    id: String(item.id ?? item.productId ?? item.catalogProductId ?? `catalog-${index}`),
    name: String(item.name ?? item.title ?? 'Produkt Cliplot'),
    category: String(item.categoryName ?? item.category?.name ?? item.category ?? 'Cliplot'),
    price: Number.isFinite(price) && price > 0 ? price : fallback.price,
    originalPrice: item.originalPrice ? Number(item.originalPrice) : undefined,
    currency: 'Kč',
    stockStatus: outOfStock ? 'Vyprodáno' : 'Skladem',
    delivery: outOfStock ? 'Hlídáme dostupnost' : 'Doručení 1-2 dny',
    image: item.imageUrl || item.image || item.media?.[0]?.url || fallback.image,
    description: String(item.shortDescription ?? item.description ?? fallback.description),
  };
}

export async function fetchCatalogProducts() {
  try {
    const url = new URL('/api/products', serviceConfig.catalogUrl);
    url.searchParams.set('limit', '8');
    url.searchParams.set('marketplace', serviceConfig.orderChannel);
    const payload = await fetchJson(url);
    const items = payload?.data?.items || payload?.items || payload?.data || [];
    if (!Array.isArray(items) || items.length === 0) return fallbackProducts;
    return items.slice(0, 8).map(normalizeCatalogItem);
  } catch {
    return fallbackProducts;
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
  const missing = [
    '[MISSING: Cliplot Orders channel and channelAccountId owner approval]',
    '[MISSING: Cliplot payment applicationId/provider evidence]',
    '[MISSING: Notification sender/template rules for Cliplot order confirmations]',
  ];
  if (!serviceConfig.ordersServiceToken) missing.push('[MISSING: ORDERS_SERVICE_TOKEN in Vault]');
  if (!serviceConfig.warehouseServiceToken) missing.push('[MISSING: WAREHOUSE_SERVICE_TOKEN in Vault]');
  return missing;
}

function normalizeCheckout(input) {
  const items = Array.isArray(input?.items) ? input.items : [];
  const customer = input?.customer && typeof input.customer === 'object' ? input.customer : {};
  const total = Number(input?.total || 0);
  return {
    customer: {
      name: String(customer.name || '').trim(),
      email: String(customer.email || '').trim(),
      phone: String(customer.phone || '').trim(),
      address: String(customer.address || '').trim(),
    },
    items: items.map((entry) => ({
      productId: String(entry?.product?.id || entry?.productId || ''),
      name: String(entry?.product?.name || entry?.name || ''),
      quantity: Number(entry?.quantity || 0),
      unitPrice: Number(entry?.product?.price || entry?.unitPrice || 0),
    })),
    total: Number.isFinite(total) ? total : 0,
    shipping: String(customer.shipping || input?.shipping || ''),
    payment: String(customer.payment || input?.payment || ''),
  };
}

function validateCheckout(checkout) {
  const errors = [];
  if (!checkout.items.length) errors.push('empty_cart');
  if (checkout.items.some((item) => !item.productId || item.quantity < 1)) errors.push('invalid_items');
  if (!checkout.customer.name) errors.push('missing_name');
  if (!checkout.customer.email.includes('@')) errors.push('invalid_email');
  if (!checkout.customer.address) errors.push('missing_address');
  return errors;
}

async function createOrder(checkout) {
  const url = new URL(serviceConfig.ordersCreatePath, serviceConfig.ordersUrl);
  return fetchJson(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-internal-service-token': serviceConfig.ordersServiceToken,
      'x-service-name': serviceConfig.serviceName,
    },
    body: JSON.stringify({
      channel: serviceConfig.orderChannel,
      channelAccountId: serviceConfig.channelAccountId,
      applicationId: serviceConfig.applicationId,
      customer: checkout.customer,
      items: checkout.items,
      totals: {
        currency: 'CZK',
        grandTotal: checkout.total,
      },
      metadata: {
        storefront: 'cliplot.alfares.cz',
        paymentStatus: 'payment_not_started',
      },
    }),
  });
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
  if (!serviceConfig.liveOrderSubmit || missing.length) {
    return {
      httpStatus: 202,
      body: {
        success: true,
        status: 'service_identity_required',
        mode: 'guarded_checkout_submit',
        message: 'Objednávka je připravena, ale živé vytvoření objednávky je vypnuté do doplnění Vault tokenů a schválených Cliplot kontraktů.',
        missing,
        orderPreview: {
          channel: serviceConfig.orderChannel,
          channelAccountId: serviceConfig.channelAccountId,
          applicationId: serviceConfig.applicationId,
          itemCount: checkout.items.reduce((sum, item) => sum + item.quantity, 0),
          total: checkout.total,
          currency: 'CZK',
        },
      },
    };
  }

  const order = await createOrder(checkout);
  return {
    httpStatus: 201,
    body: {
      success: true,
      status: 'order_created_payment_pending',
      order,
      next: 'Payment initiation remains gated by GOAL-05 provider-backed validation.',
    },
  };
}

export function serviceReadiness() {
  return {
    success: true,
    service: serviceConfig.serviceName,
    mode: serviceConfig.frontendMode,
    liveOrderSubmit: serviceConfig.liveOrderSubmit,
    integrations: {
      catalog: 'read_enabled_with_fallback',
      warehouse: serviceConfig.warehouseServiceToken ? 'token_present_not_mutating' : 'token_missing',
      orders: serviceConfig.ordersServiceToken && serviceConfig.liveOrderSubmit ? 'live_submit_enabled' : 'guarded',
      notifications: serviceConfig.notificationServiceToken ? 'token_present_non_blocking' : 'token_missing',
      payments: 'blocked_until_GOAL-05',
      auth: 'public_links_contract_unverified',
    },
    missing: checkoutMissingFacts(),
  };
}

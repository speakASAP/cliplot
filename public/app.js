const fallbackProducts = [
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
    description: 'Praktická sada pro kabely, dekorace a drobné věci doma i v dílně.',
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
    description: 'Pevný organizér s přehlednými přihrádkami pro nářadí a příslušenství.',
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

const cartStorageKey = 'cliplot-cart';
const checkoutIntentStorageKey = 'cliplot-checkout-intent-v1';
const lastCheckoutStorageKey = 'cliplot-last-checkout-v1';

const state = {
  products: fallbackProducts,
  category: 'all',
  search: '',
  cart: JSON.parse(localStorage.getItem(cartStorageKey) || '{}'),
};

const currency = new Intl.NumberFormat('cs-CZ', {
  style: 'currency',
  currency: 'CZK',
  maximumFractionDigits: 0,
});

const shippingOptions = [
  { value: 'balikovna', label: 'Balíkovna', cost: 69 },
  { value: 'zasilkovna', label: 'Zásilkovna', cost: 79 },
  { value: 'ppl', label: 'PPL kurýr', cost: 119 },
];

const paymentOptions = [
  { value: 'invoice', label: 'Kartou online po potvrzení', fee: 0 },
  { value: 'bank_transfer', label: 'Bankovní převod', fee: 0 },
];

const selectors = {
  products: document.querySelector('[data-products]'),
  cartCount: document.querySelector('[data-cart-count]'),
  cartItems: document.querySelector('[data-cart-items]'),
  drawerItems: document.querySelector('[data-drawer-items]'),
  cartTotal: document.querySelector('[data-cart-total]'),
  drawerTotal: document.querySelector('[data-drawer-total]'),
  drawerStatus: document.querySelector('[data-drawer-status]'),
  reviewItems: document.querySelector('[data-review-items]'),
  orderSubtotal: document.querySelector('[data-order-subtotal]'),
  orderShipping: document.querySelector('[data-order-shipping]'),
  orderPayment: document.querySelector('[data-order-payment]'),
  orderTotal: document.querySelector('[data-order-total]'),
  reviewChoice: document.querySelector('[data-review-choice]'),
  drawer: document.querySelector('[data-cart-drawer]'),
  backdrop: document.querySelector('.drawer-backdrop'),
  result: document.querySelector('[data-checkout-result]'),
};

function formatPrice(value) {
  return currency.format(Number(value || 0)).replace('CZK', 'Kč');
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]);
}

function productPath(productId) {
  return `/produkt/${encodeURIComponent(productId)}`;
}

function productIdFromPath() {
  const match = window.location.pathname.match(/^\/produkt\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : '';
}

function plainText(value, maxLength = 680) {
  const text = String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1).trim()}…` : text;
}

function saveCart() {
  localStorage.setItem(cartStorageKey, JSON.stringify(state.cart));
}

function selectedOption(options, value) {
  return options.find((option) => option.value === value) || options[0];
}

function checkoutBreakdown(form = document.querySelector('#checkoutForm')) {
  const data = form ? Object.fromEntries(new FormData(form).entries()) : {};
  const shipping = selectedOption(shippingOptions, data.shipping);
  const payment = selectedOption(paymentOptions, data.payment);
  const subtotal = cartTotal();
  const paymentFee = Number(payment.fee || 0);
  const total = subtotal + Number(shipping.cost || 0) + paymentFee;
  return { subtotal, shipping, payment, paymentFee, total };
}

function createCheckoutIntentId() {
  if (globalThis.crypto?.randomUUID) return `cliplot-${globalThis.crypto.randomUUID()}`;
  return `cliplot-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function cartSignature(entries = cartEntries()) {
  return entries
    .map(({ product, quantity }) => `${product.id}:${quantity}:${product.warehouseId || ''}`)
    .sort()
    .join('|');
}

function saveLastCheckout(payload, formData, breakdown, entries) {
  const snapshot = {
    externalOrderId: payload.checkoutIntent?.externalOrderId || '',
    status: 'Čeká na kontrolu',
    checkoutSummary: payload.checkoutSummary || {
      subtotal: breakdown.subtotal,
      shipping: breakdown.shipping,
      payment: breakdown.payment,
      total: breakdown.total,
      currency: 'CZK',
    },
    customer: {
      name: formData.name || '',
      email: formData.email || '',
    },
    items: entries.map(({ product, quantity }) => ({
      name: product.name,
      quantity,
      lineTotal: product.price * quantity,
    })),
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(lastCheckoutStorageKey, JSON.stringify(snapshot));
  return snapshot;
}

function readLastCheckout() {
  try {
    return JSON.parse(localStorage.getItem(lastCheckoutStorageKey) || '{}');
  } catch {
    localStorage.removeItem(lastCheckoutStorageKey);
    return {};
  }
}

function checkoutIntentFor(entries) {
  const signature = cartSignature(entries);
  if (!signature) return '';
  try {
    const stored = JSON.parse(localStorage.getItem(checkoutIntentStorageKey) || '{}');
    if (stored.signature === signature && typeof stored.externalOrderId === 'string' && stored.externalOrderId.startsWith('cliplot-')) {
      return stored.externalOrderId;
    }
  } catch {
    localStorage.removeItem(checkoutIntentStorageKey);
  }
  const externalOrderId = createCheckoutIntentId();
  localStorage.setItem(checkoutIntentStorageKey, JSON.stringify({ signature, externalOrderId }));
  return externalOrderId;
}

function findProduct(productId) {
  return state.products.find((item) => item.id === productId) || fallbackProducts.find((item) => item.id === productId);
}

function hasWarehouseOrigin(product) {
  return Boolean(product?.warehouseId);
}

function cartEntries() {
  return Object.entries(state.cart)
    .map(([id, quantity]) => {
      const product = findProduct(id);
      return product && hasWarehouseOrigin(product) ? { product, quantity } : null;
    })
    .filter(Boolean);
}

function removeUnreservableCartItems() {
  let changed = false;
  Object.keys(state.cart).forEach((productId) => {
    const product = findProduct(productId);
    if (!product || !hasWarehouseOrigin(product)) {
      delete state.cart[productId];
      changed = true;
    }
  });
  if (changed) saveCart();
}
function cartTotal() {
  return cartEntries().reduce((sum, item) => sum + item.product.price * item.quantity, 0);
}

function renderProducts() {
  const search = state.search.trim().toLowerCase();
  const filtered = state.products.filter((product) => {
    const matchesCategory = state.category === "all" || product.category === state.category;
    const matchesSearch = !search || `${product.name} ${product.description} ${product.category}`.toLowerCase().includes(search);
    return matchesCategory && matchesSearch;
  });

  selectors.products.innerHTML = filtered
    .map((product) => {
      const canReserve = hasWarehouseOrigin(product);
      const stockLabel = canReserve ? product.stockStatus : "Nedostupné";
      const buttonLabel = canReserve ? "Do košíku" : "Nelze objednat";
      const disabledAttributes = canReserve ? "" : "disabled aria-disabled=true";
      return `
        <article class="product-card">
          <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy" />
          <div class="product-meta">
            <span>${escapeHtml(product.category)}</span>
            <span>${escapeHtml(stockLabel)}</span>
          </div>
          <h3><a href="${productPath(product.id)}">${escapeHtml(product.name)}</a></h3>
          <p class="product-description">${escapeHtml(plainText(product.description, 160))}</p>
          <div class="product-meta">
            <span>${escapeHtml(product.delivery)}</span>
          </div>
          <div class="product-price">
            <strong>${formatPrice(product.price)}</strong>
            ${product.originalPrice ? `<del>${formatPrice(product.originalPrice)}</del>` : ""}
          </div>
          <a class="secondary-link product-detail-link" href="${productPath(product.id)}">Detail</a>
          <button class="primary-button" type="button" data-add-to-cart="${canReserve ? escapeHtml(product.id) : ""}" data-warehouse-id="${escapeHtml(product.warehouseId || "")}" ${disabledAttributes}>${buttonLabel}</button>
        </article>
      `;
    })
    .join("");
}
function renderCart() {
  const entries = cartEntries();
  const count = entries.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = formatPrice(cartTotal());
  selectors.cartCount.textContent = count;
  selectors.cartTotal.textContent = subtotal;
  selectors.drawerTotal.textContent = subtotal;

  const markup = entries.length
    ? entries
        .map(
          ({ product, quantity }) => `
            <div class="cart-item">
              <div class="cart-item-copy">
                <strong>${escapeHtml(product.name)}</strong>
                <span>${formatPrice(product.price)} / ks</span>
              </div>
              <strong class="cart-line-total">${formatPrice(product.price * quantity)}</strong>
              <div class="qty-controls" aria-label="Množství pro ${escapeHtml(product.name)}">
                <button type="button" data-decrease="${escapeHtml(product.id)}" aria-label="Snížit množství produktu ${escapeHtml(product.name)}">-</button>
                <span aria-label="Počet kusů">${quantity}</span>
                <button type="button" data-increase="${escapeHtml(product.id)}" aria-label="Zvýšit množství produktu ${escapeHtml(product.name)}">+</button>
              </div>
              <button class="remove-item" type="button" data-remove="${escapeHtml(product.id)}" aria-label="Odebrat produkt ${escapeHtml(product.name)}">Odebrat</button>
            </div>
          `,
        )
        .join('')
    : '<p class="product-description">Košík je zatím prázdný. Vyberte produkt z katalogu.</p>';

  selectors.cartItems.innerHTML = markup;
  selectors.drawerItems.innerHTML = markup;
  saveCart();
  renderCheckoutReview();
}

function renderCheckoutReview() {
  const entries = cartEntries();
  const breakdown = checkoutBreakdown();
  if (!selectors.reviewItems) return;

  selectors.reviewItems.innerHTML = entries.length
    ? entries.map(({ product, quantity }) => `
        <div>
          <span>${escapeHtml(product.name)} × ${quantity}</span>
          <strong>${formatPrice(product.price * quantity)}</strong>
        </div>
      `).join('')
    : '<p class="product-description">Košík je prázdný.</p>';

  selectors.orderSubtotal.textContent = formatPrice(breakdown.subtotal);
  selectors.orderShipping.textContent = formatPrice(breakdown.shipping.cost);
  selectors.orderPayment.textContent = formatPrice(breakdown.paymentFee);
  selectors.orderTotal.textContent = formatPrice(breakdown.total);
  selectors.reviewChoice.textContent = `${breakdown.shipping.label} | ${breakdown.payment.label}`;
}

function addToCart(productId) {
  const product = findProduct(productId);
  if (!hasWarehouseOrigin(product)) {
    if (selectors.result) {
      selectors.result.hidden = false;
      selectors.result.textContent = "Produkt teď nejde objednat. Zkuste prosím jinou položku.";
    }
    return;
  }
  state.cart[productId] = (state.cart[productId] || 0) + 1;
  renderCart();
  if (selectors.drawerStatus) {
    selectors.drawerStatus.hidden = false;
    selectors.drawerStatus.textContent = `${product.name} je v košíku.`;
  }
  setDrawer(true);
}
function changeQuantity(productId, delta) {
  const product = findProduct(productId);
  if (delta > 0 && !hasWarehouseOrigin(product)) return;
  const next = (state.cart[productId] || 0) + delta;
  if (next <= 0) {
    delete state.cart[productId];
  } else {
    state.cart[productId] = next;
  }
  renderCart();
}

function removeFromCart(productId) {
  if (state.cart[productId]) {
    delete state.cart[productId];
    renderCart();
    if (selectors.drawerStatus) {
      selectors.drawerStatus.hidden = false;
      selectors.drawerStatus.textContent = 'Položka byla odebrána z košíku.';
    }
  }
}

function setDrawer(open) {
  selectors.drawer.classList.toggle('is-open', open);
  selectors.backdrop.classList.toggle('is-open', open);
  selectors.drawer.setAttribute('aria-hidden', String(!open));
}

async function loadProducts() {
  try {
    const response = await fetch('/api/products');
    const payload = await response.json();
    if (payload.success && Array.isArray(payload.items) && payload.items.length) {
      state.products = payload.items;
    }
  } catch {
    state.products = fallbackProducts;
  }
  removeUnreservableCartItems();
  if (!renderProductDetailPage()) {
    renderProducts();
    renderCart();
  }
}

function renderProductDetailPage() {
  const productId = productIdFromPath();
  if (!productId) return false;

  const product = findProduct(productId);
  const main = document.querySelector('main');
  if (!product) {
    main.innerHTML = `
      <section class="product-detail-page">
        <div class="section-heading">
          <h1>Produkt nebyl nalezen</h1>
          <p>Vraťte se prosím do katalogu a vyberte jinou položku.</p>
        </div>
        <a class="primary-link" href="/#produkty">Zpět do katalogu</a>
      </section>
    `;
    renderCart();
    return true;
  }

  const canReserve = hasWarehouseOrigin(product);
  const stockLabel = canReserve ? product.stockStatus : 'Nedostupné';
  const buttonLabel = canReserve ? 'Do košíku' : 'Nelze objednat';
  const disabledAttributes = canReserve ? '' : 'disabled aria-disabled=true';
  const description = plainText(product.description, 1200);
  const available = Number.isFinite(Number(product.availableStock)) ? `${Number(product.availableStock)} ks` : 'Skladem';

  document.title = `${product.name} - Cliplot`;
  main.innerHTML = `
    <section class="product-detail-page">
      <a class="secondary-link" href="/#produkty">Zpět do katalogu</a>
      <div class="product-detail-layout">
        <div class="product-detail-media">
          <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" />
        </div>
        <div class="product-detail-info">
          <div class="product-meta">
            <span>${escapeHtml(product.category)}</span>
            <span>${escapeHtml(stockLabel)}</span>
          </div>
          <h1>${escapeHtml(product.name)}</h1>
          <div class="product-price">
            <strong>${formatPrice(product.price)}</strong>
            ${product.originalPrice ? `<del>${formatPrice(product.originalPrice)}</del>` : ''}
          </div>
          <dl class="detail-proof">
            <div>
              <dt>Dostupnost</dt>
              <dd>${escapeHtml(stockLabel)}${canReserve ? ` · ${escapeHtml(available)}` : ''}</dd>
            </div>
            <div>
              <dt>Doručení</dt>
              <dd>${escapeHtml(product.delivery || 'Doručení 1-2 dny')}</dd>
            </div>
            <div>
              <dt>Platba</dt>
              <dd>Kartou online po potvrzení nebo bankovní převod</dd>
            </div>
            <div>
              <dt>Vrácení</dt>
              <dd>14 dní podle českých pravidel</dd>
            </div>
          </dl>
          <div class="product-detail-action">
            <button class="primary-button" type="button" data-add-to-cart="${canReserve ? escapeHtml(product.id) : ''}" data-warehouse-id="${escapeHtml(product.warehouseId || '')}" ${disabledAttributes}>${buttonLabel}</button>
            <a class="secondary-link" href="/#checkout">Přejít k objednávce</a>
          </div>
        </div>
      </div>
      <section class="product-description-full">
        <h2>Popis produktu</h2>
        <p>${escapeHtml(description || 'Popis připravujeme z katalogových dat.')}</p>
      </section>
    </section>
  `;
  renderCart();
  return true;
}

document.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const addId = target.dataset.addToCart;
  const increaseId = target.dataset.increase;
  const decreaseId = target.dataset.decrease;
  const removeId = target.dataset.remove;

  if (addId) addToCart(addId);
  if (increaseId) changeQuantity(increaseId, 1);
  if (decreaseId) changeQuantity(decreaseId, -1);
  if (removeId) removeFromCart(removeId);
  if (target.matches('[data-open-cart]')) setDrawer(true);
  if (target.matches('[data-close-cart]')) setDrawer(false);

  const category = target.dataset.category;
  if (category) {
    state.category = category;
    document.querySelectorAll('[data-category]').forEach((item) => item.classList.toggle('is-active', item.dataset.category === category));
    renderProducts();
  }
});

document.querySelector('#searchInput').addEventListener('input', (event) => {
  state.search = event.target.value;
  renderProducts();
});

document.querySelector('#checkoutForm').addEventListener('change', () => {
  renderCheckoutReview();
});

document.querySelector('#checkoutForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const entries = cartEntries();
  if (!entries.length) {
    selectors.result.hidden = false;
    selectors.result.textContent = 'Nejdříve přidejte do košíku alespoň jeden produkt.';
    return;
  }

  const data = Object.fromEntries(new FormData(event.currentTarget).entries());
  const breakdown = checkoutBreakdown(event.currentTarget);
  selectors.result.hidden = false;
  selectors.result.textContent = 'Kontrolujeme objednávku...';

  const response = await fetch('/api/checkout/submit', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      externalOrderId: checkoutIntentFor(entries),
      customer: data,
      shipping: breakdown.shipping.value,
      payment: breakdown.payment.value,
      pricing: {
        subtotal: breakdown.subtotal,
        shippingCost: breakdown.shipping.cost,
        paymentFee: breakdown.paymentFee,
        total: breakdown.total,
      },
      items: entries,
      total: breakdown.total,
    }),
  });
  const payload = await response.json();

  if (!response.ok || !payload.success) {
    selectors.result.innerHTML = `
      <strong>Objednávku teď nejde připravit.</strong>
      <p>Zkontrolujte prosím kontaktní údaje a položky v košíku.</p>
    `;
    return;
  }

  const snapshot = saveLastCheckout(payload, data, breakdown, entries);
  window.location.href = `/objednavka/stav?externalOrderId=${encodeURIComponent(snapshot.externalOrderId)}`;
});

async function loadAuthLinks() {
  const link = document.querySelector('[data-auth-login]');
  if (!link) return;
  try {
    const response = await fetch('/api/auth/links');
    const payload = await response.json();
    if (payload.success && payload.loginUrl) link.href = payload.loginUrl;
  } catch {
    link.href = '#checkout';
  }
}

function guardedPaymentStatusCopy(statusPayload = {}) {
  if (statusPayload.status === 'payment_status_snapshot_read' && statusPayload.runtimeReadEnabled === true) {
    return {
      label: statusPayload.customerSafePaymentStatus?.label || 'Stav platby zatím neznáme',
      detail: 'Stav platby je načtený z bezpečného přehledu objednávky.',
    };
  }
  if (statusPayload.status === 'payment_status_snapshot_not_available') {
    return {
      label: 'Stav platby zatím neznáme',
      detail: 'Platba k této objednávce ještě není dostupná.',
    };
  }
  return {
    label: 'Platba se zatím nespustila',
    detail: 'Po kontrole objednávky pošleme další pokyny k platbě.',
  };
}

async function refreshCheckoutStatus(externalOrderId) {
  const panel = document.querySelector('[data-payment-status-panel]');
  if (!panel || !externalOrderId) return;
  try {
    const response = await fetch(`/api/payments/status?orderId=${encodeURIComponent(externalOrderId)}`, {
      headers: { accept: 'application/json' },
    });
    const payload = await response.json();
    if (!response.ok || payload.success === false) return;
    const copy = guardedPaymentStatusCopy(payload);
    const guarded = payload.runtimeReadEnabled !== true && payload.paymentsSnapshotReadEnabled !== true;
    panel.innerHTML = `
      <p>Platba: <strong>${escapeHtml(copy.label)}</strong></p>
      <p>${escapeHtml(copy.detail)}</p>
      ${guarded ? '<p>Zboží zatím není rezervované a objednávka není zaplacená.</p>' : ''}
    `;
  } catch {
    panel.innerHTML = `
      <p>Platba: <strong>Stav platby zatím neznáme</strong></p>
      <p>Objednávku máme uloženou v tomto prohlížeči. Platbu zatím nepotvrzujeme.</p>
    `;
  }
}

function renderCheckoutStatusPage() {
  const path = window.location.pathname;
  if (!['/objednavka/stav', '/checkout/success', '/checkout/cancelled'].includes(path)) return false;

  const params = new URLSearchParams(window.location.search);
  const snapshot = readLastCheckout();
  const externalOrderId = params.get('externalOrderId') || snapshot.externalOrderId || '';
  const main = document.querySelector('main');
  const missing = !snapshot.externalOrderId || (externalOrderId && snapshot.externalOrderId !== externalOrderId);
  const title = path === '/checkout/cancelled' ? 'Platba nebyla dokončena' : 'Objednávka je připravena ke kontrole.';

  if (missing) {
    main.innerHTML = `
      <section class="checkout-status-page" aria-live="polite">
        <div class="section-heading">
          <h1>${title}</h1>
          <p>Nemáme uložený stav objednávky. Vraťte se prosím do košíku a objednávku zkontrolujte znovu.</p>
        </div>
        <div class="hero-actions">
          <a class="primary-link" href="/#checkout">Zpět do košíku</a>
          <a class="secondary-link" href="/#produkty">Vybrat produkty</a>
        </div>
      </section>
    `;
    return true;
  }

  const summary = snapshot.checkoutSummary || {};
  const items = Array.isArray(snapshot.items) ? snapshot.items : [];
  const itemMarkup = items.length
    ? items.map((item) => `
        <div>
          <span>${escapeHtml(item.name)} × ${Number(item.quantity || 0)}</span>
          <strong>${formatPrice(item.lineTotal)}</strong>
        </div>
      `).join('')
    : '<p class="product-description">Položky nejsou uložené.</p>';
  const preparedAt = snapshot.createdAt
    ? new Intl.DateTimeFormat('cs-CZ', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(snapshot.createdAt))
    : '';

  main.innerHTML = `
    <section class="checkout-status-page" aria-live="polite">
      <div class="section-heading">
        <h1>${title}</h1>
        <p>Objednávku máme připravenou ke kontrole. Platbu ani rezervaci zatím nepotvrzujeme.</p>
      </div>
      <div class="status-summary">
        <p>Stav: <strong>Čeká na kontrolu</strong></p>
        <p>Referenční číslo: <strong>${escapeHtml(snapshot.externalOrderId)}</strong></p>
        ${preparedAt ? `<p>Připraveno ke kontrole: ${escapeHtml(preparedAt)}</p>` : ''}
        <div class="review-items">${itemMarkup}</div>
        <dl class="price-breakdown">
          <div>
            <dt>Mezisoučet</dt>
            <dd>${formatPrice(summary.subtotal)}</dd>
          </div>
          <div>
            <dt>Doprava</dt>
            <dd>${escapeHtml(summary.shipping?.label || 'Bude potvrzeno')} · ${formatPrice(summary.shipping?.cost || 0)}</dd>
          </div>
          <div>
            <dt>Platba</dt>
            <dd>${escapeHtml(summary.payment?.label || 'Bude potvrzeno')} · ${formatPrice(summary.payment?.fee || 0)}</dd>
          </div>
          <div class="price-breakdown-total">
            <dt>Celkem k úhradě</dt>
            <dd>${formatPrice(summary.total)}</dd>
          </div>
        </dl>
        <div class="payment-status-panel" data-payment-status-panel><p>Platba: <strong>Ověřujeme stav.</strong></p></div>
        <div class="hero-actions">
          <a class="primary-link" href="/#produkty">Zpět k produktům</a>
          <a class="secondary-link" href="/#checkout">Upravit objednávku</a>
        </div>
      </div>
    </section>
  `;
  refreshCheckoutStatus(externalOrderId);
  return true;
}

if (!renderCheckoutStatusPage()) {
  document.querySelector('[data-category="all"]').classList.add('is-active');
  loadAuthLinks();
  loadProducts();
}

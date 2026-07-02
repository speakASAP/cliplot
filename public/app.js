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
          <h3>${escapeHtml(product.name)}</h3>
          <p class="product-description">${escapeHtml(product.description)}</p>
          <div class="product-meta">
            <span>${escapeHtml(product.delivery)}</span>
          </div>
          <div class="product-price">
            <strong>${formatPrice(product.price)}</strong>
            ${product.originalPrice ? `<del>${formatPrice(product.originalPrice)}</del>` : ""}
          </div>
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
              <div>
                <strong>${escapeHtml(product.name)}</strong>
                <div>${formatPrice(product.price)} / ks</div>
              </div>
              <div class="qty-controls" aria-label="Množství pro ${escapeHtml(product.name)}">
                <button type="button" data-decrease="${escapeHtml(product.id)}">-</button>
                <span>${quantity}</span>
                <button type="button" data-increase="${escapeHtml(product.id)}">+</button>
              </div>
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
    selectors.result.hidden = false;
    selectors.result.textContent = "Produkt teď nejde objednat. Zkuste prosím jinou položku.";
    return;
  }
  state.cart[productId] = (state.cart[productId] || 0) + 1;
  renderCart();
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
  renderProducts();
  renderCart();
}

document.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const addId = target.dataset.addToCart;
  const increaseId = target.dataset.increase;
  const decreaseId = target.dataset.decrease;

  if (addId) addToCart(addId);
  if (increaseId) changeQuantity(increaseId, 1);
  if (decreaseId) changeQuantity(decreaseId, -1);
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

  const reference = payload.checkoutIntent?.externalOrderId
    ? `<p>Referenční číslo: <strong>${escapeHtml(payload.checkoutIntent.externalOrderId)}</strong></p>`
    : '';

  selectors.result.innerHTML = `
    <strong>Objednávka je připravena ke kontrole.</strong>
    <p>Zákazník: ${escapeHtml(data.name)} | Celkem: ${formatPrice(payload.checkoutSummary?.total ?? breakdown.total)}</p>
    ${reference}
    <p>Doprava: ${escapeHtml(payload.checkoutSummary?.shipping?.label || breakdown.shipping.label)} | Platba: ${escapeHtml(payload.checkoutSummary?.payment?.label || breakdown.payment.label)}</p>
    <p>Platba se zatím nespustila. Po kontrole objednávky dostanete další pokyny k platbě.</p>
  `;
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

document.querySelector('[data-category="all"]').classList.add('is-active');
loadAuthLinks();
loadProducts();

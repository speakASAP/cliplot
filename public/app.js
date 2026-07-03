const fallbackProducts = [
  {
    id: 'drzak-naradi-stena',
    name: 'Držák nářadí na stěnu - sada 5 ks',
    category: 'Cliplot',
    price: 249,
    currency: 'Kč',
    stockStatus: 'Skladem',
    delivery: 'Doručení 1-2 dny',
    image: '/assets/mockup/wall-holder-product.png',
    description: 'Pevná sada držáků pro přehledné uložení nářadí na stěně.',
  },
  {
    id: 'organizator-prihradky',
    name: 'Organizér s přihrádkami 30 × 22 × 6 cm',
    category: 'Cliplot',
    price: 189,
    currency: 'Kč',
    stockStatus: 'Skladem',
    delivery: 'Doručení 1-2 dny',
    image: '/assets/mockup/toolbox-product.png',
    description: 'Praktický kufr s přihrádkami na spojovací materiál a dílenské drobnosti.',
  },
  {
    id: 'wd-40-sprej',
    name: 'WD-40 - univerzální sprej 450 ml',
    category: 'Cliplot',
    price: 169,
    currency: 'Kč',
    stockStatus: 'Skladem',
    delivery: 'Doručení 1-2 dny',
    image: '/assets/mockup/spray-product.png',
    description: 'Univerzální sprej pro údržbu, mazání a ochranu v dílně i domácnosti.',
  },
  {
    id: 'lepici-paska-univerzalni',
    name: 'Lepicí páska univerzální 48 mm × 50 m',
    category: 'Cliplot',
    price: 89,
    currency: 'Kč',
    stockStatus: 'Skladem',
    delivery: 'Doručení 1-2 dny',
    image: '/assets/mockup/tape-product.png',
    description: 'Silná univerzální páska pro rychlé opravy, balení a montáž.',
  },
  {
    id: 'stahovaci-pasky-cerne',
    name: 'Stahovací pásky černé 2,5 × 200 mm - 100 ks',
    category: 'Cliplot',
    price: 79,
    currency: 'Kč',
    stockStatus: 'Skladem',
    delivery: 'Doručení 1-2 dny',
    image: '/assets/mockup/ties-product.png',
    description: 'Černé stahovací pásky pro kabely, montáž a rychlé upevnění.',
  },
  {
    id: 'samolepici-hacky',
    name: 'Samolepicí háčky nerez - 4 ks',
    category: 'Cliplot',
    price: 69,
    currency: 'Kč',
    stockStatus: 'Skladem',
    delivery: 'Doručení 1-2 dny',
    image: '/assets/mockup/hooks-product.png',
    description: 'Nenápadné samolepicí háčky pro koupelnu, kuchyň i chodbu.',
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
  authWallet: {
    deliveryRows: [],
    invoiceRows: [],
    selectedDelivery: 'manual',
    selectedInvoice: 'manual',
    manualFields: new Set(),
  },
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
  checkoutForm: document.querySelector('#checkoutForm'),
  walletSelector: document.querySelector('[data-auth-wallet-selector]'),
  walletStatus: document.querySelector('[data-wallet-status]'),
  walletDeliverySelect: document.querySelector('[data-wallet-delivery-select]'),
  walletInvoiceSelect: document.querySelector('[data-wallet-invoice-select]'),
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

function walletRowsFromSessionPayload(payload = {}) {
  const checkoutData = payload.checkoutData && typeof payload.checkoutData === 'object' ? payload.checkoutData : payload;
  return {
    deliveryRows: Array.isArray(checkoutData.deliveryAddresses) ? checkoutData.deliveryAddresses : [],
    invoiceRows: Array.isArray(checkoutData.invoiceProfiles) ? checkoutData.invoiceProfiles : [],
    defaults: checkoutData.defaults && typeof checkoutData.defaults === 'object' ? checkoutData.defaults : {},
  };
}

function safeWalletCountry(row = {}) {
  return /^[A-Z]{2}$/.test(String(row.country || '')) ? String(row.country) : 'CZ';
}

function safeWalletLabel(row = {}, kind, index) {
  const prefix = kind === 'delivery' ? 'Doručovací údaje' : 'Fakturační údaje';
  const defaultText = row.isDefault === true ? ' - výchozí' : '';
  return `${prefix} ${index + 1}${defaultText} (${safeWalletCountry(row)})`;
}

function walletFullName(row = {}) {
  return [row.firstName, row.lastName].map((part) => String(part || '').trim()).filter(Boolean).join(' ');
}

function walletStreet(row = {}) {
  return [row.street, row.street2, row.city, row.postalCode, row.country]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(', ');
}

function setFieldFromWallet(form, fieldName, value) {
  if (!value || state.authWallet.manualFields.has(fieldName)) return;
  const field = form.elements[fieldName];
  if (field instanceof HTMLInputElement) field.value = value;
}

function applyWalletSelection() {
  const form = selectors.checkoutForm;
  if (!form) return;
  const deliveryIndex = Number(state.authWallet.selectedDelivery);
  const delivery = Number.isInteger(deliveryIndex) ? state.authWallet.deliveryRows[deliveryIndex] : null;
  if (delivery) {
    setFieldFromWallet(form, 'name', walletFullName(delivery));
    setFieldFromWallet(form, 'email', delivery.email);
    setFieldFromWallet(form, 'phone', delivery.phone);
    setFieldFromWallet(form, 'address', walletStreet(delivery));
  }
  renderCheckoutReview();
}

function renderWalletSelect(select, rows, selectedValue, kind) {
  if (!select) return;
  const options = [
    '<option value="manual">Vyplnit ručně</option>',
    ...rows.map((row, index) => `<option value="${index}">${escapeHtml(safeWalletLabel(row, kind, index))}</option>`),
  ];
  select.innerHTML = options.join('');
  select.value = selectedValue;
}

function renderWalletSelector() {
  const { deliveryRows, invoiceRows, selectedDelivery, selectedInvoice } = state.authWallet;
  const hasWalletOptions = deliveryRows.length > 0 || invoiceRows.length > 0;
  if (!selectors.walletSelector) return;
  selectors.walletSelector.hidden = !hasWalletOptions;
  if (!hasWalletOptions) return;
  renderWalletSelect(selectors.walletDeliverySelect, deliveryRows, selectedDelivery, 'delivery');
  renderWalletSelect(selectors.walletInvoiceSelect, invoiceRows, selectedInvoice, 'invoice');
  if (selectors.walletStatus) {
    selectors.walletStatus.textContent = 'Uložené údaje můžete použít pro tento nákup nebo objednávku vyplnit ručně.';
  }
}

function setManualWalletMode() {
  state.authWallet.selectedDelivery = 'manual';
  state.authWallet.selectedInvoice = 'manual';
  renderWalletSelector();
  renderCheckoutReview();
}

function initializeAuthWalletSelector() {
  const walletPayload = globalThis.CLIPLOT_AUTH_WALLET_CHECKOUT_DATA;
  const { deliveryRows, invoiceRows, defaults } = walletRowsFromSessionPayload(walletPayload || {});
  state.authWallet.deliveryRows = deliveryRows;
  state.authWallet.invoiceRows = invoiceRows;

  const defaultDeliveryIndex = deliveryRows.findIndex((row) => row.id && row.id === defaults.deliveryAddressId);
  const defaultInvoiceIndex = invoiceRows.findIndex((row) => row.id && row.id === defaults.invoiceProfileId);
  state.authWallet.selectedDelivery = defaultDeliveryIndex >= 0 ? String(defaultDeliveryIndex) : (deliveryRows.length ? '0' : 'manual');
  state.authWallet.selectedInvoice = defaultInvoiceIndex >= 0 ? String(defaultInvoiceIndex) : (invoiceRows.length ? '0' : 'manual');
  renderWalletSelector();
  applyWalletSelection();
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
    .slice(0, 6)
    .map((product) => {
      const canReserve = hasWarehouseOrigin(product);
      const stockLabel = canReserve ? product.stockStatus : "Nedostupné";
      const buttonLabel = canReserve ? "Do košíku" : "Nelze objednat";
      const disabledAttributes = canReserve ? "" : "disabled aria-disabled=true";
      return `
        <article class="product-card">
          <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy" />
          <div class="product-meta">
            <span class="stock-state"><span class="stock-dot"></span>${escapeHtml(stockLabel)}</span>
          </div>
          <h3><a href="${productPath(product.id)}">${escapeHtml(product.name)}</a></h3>
          <p class="product-description">${escapeHtml(plainText(product.description, 160))}</p>
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

selectors.checkoutForm.addEventListener('input', (event) => {
  const target = event.target;
  if (target instanceof HTMLInputElement && ['name', 'email', 'phone', 'address'].includes(target.name)) {
    state.authWallet.manualFields.add(target.name);
  }
});

selectors.checkoutForm.addEventListener('change', (event) => {
  const target = event.target;
  if (target === selectors.walletDeliverySelect) {
    state.authWallet.selectedDelivery = target.value;
    applyWalletSelection();
  }
  if (target === selectors.walletInvoiceSelect) {
    state.authWallet.selectedInvoice = target.value;
    renderWalletSelector();
  }
  renderCheckoutReview();
});

document.querySelector('[data-wallet-manual]')?.addEventListener('click', setManualWalletMode);

selectors.checkoutForm.addEventListener('submit', async (event) => {
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

const paymentStatusDetails = {
  waiting_for_payment: 'Čekáme na potvrzení platby v bezpečném přehledu plateb.',
  payment_processing: 'Platba je v bezpečném přehledu plateb rozpracovaná.',
  payment_received: 'Platba je v bezpečném přehledu plateb označená jako přijatá.',
  payment_failed: 'Platba se podle bezpečného přehledu nezdařila. Objednávku zatím nepotvrzujeme jako zaplacenou.',
  payment_cancelled: 'Platba je v bezpečném přehledu zrušená.',
  payment_refunded: 'Platba je v bezpečném přehledu vrácená.',
  payment_status_unknown: 'Stav platby zatím v bezpečném přehledu nevidíme.',
};

function guardedPaymentStatusCopy(statusPayload = {}) {
  const safe = statusPayload.customerSafePaymentStatus || {};
  const code = safe.code || 'payment_status_unknown';
  const snapshotRead = statusPayload.status === 'payment_status_snapshot_read' && statusPayload.runtimeReadEnabled === true;
  if (snapshotRead) {
    return {
      label: safe.label || 'Stav platby zatím neznáme',
      detail: paymentStatusDetails[code] || paymentStatusDetails.payment_status_unknown,
      state: code,
      source: 'read_only_payments_snapshot',
      badge: 'Načteno z plateb',
    };
  }
  if (statusPayload.status === 'payment_status_snapshot_not_available') {
    return {
      label: 'Stav platby zatím neznáme',
      detail: 'Platba k této objednávce ještě není dostupná v bezpečném přehledu plateb.',
      state: 'snapshot_not_available',
      source: 'read_only_payments_snapshot',
      badge: 'Čeká na platbu',
    };
  }
  if (statusPayload.status === 'payment_status_snapshot_temporarily_unavailable') {
    return {
      label: 'Stav platby teď nejde ověřit',
      detail: 'Bezpečný přehled plateb je dočasně nedostupný. Objednávku zatím nepotvrzujeme jako zaplacenou.',
      state: 'snapshot_temporarily_unavailable',
      source: 'read_only_payments_snapshot',
      badge: 'Dočasně nedostupné',
    };
  }
  return {
    label: 'Platba se zatím nespustila',
    detail: 'Po kontrole objednávky pošleme další pokyny k platbě.',
    state: 'guarded_no_persistence',
    source: 'browser_checkout_snapshot',
    badge: 'Chráněný režim',
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
    const guarded = payload.runtimeReadEnabled !== true || payload.paymentsSnapshotReadEnabled !== true;
    panel.dataset.paymentStatusState = copy.state;
    panel.dataset.paymentStatusSource = copy.source;
    panel.innerHTML = `
      <p><span class="status-badge">${escapeHtml(copy.badge)}</span></p>
      <p>Platba: <strong>${escapeHtml(copy.label)}</strong></p>
      <p>${escapeHtml(copy.detail)}</p>
      <p class="status-boundary">Cliplot stav jen zobrazuje; zdrojem stavu platby je služba Payments.</p>
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
        <div class="payment-status-panel" data-payment-status-panel data-payment-status-state="loading" data-payment-status-source="read_only_payments_snapshot"><p>Platba: <strong>Ověřujeme stav.</strong></p></div>
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
  initializeAuthWalletSelector();
}

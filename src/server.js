import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const publicDir = join(root, 'public');
const port = Number(process.env.PORT || 8080);
const catalogUrl = process.env.CATALOG_SERVICE_URL || 'http://catalog-microservice:3200';

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

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function sendJson(res, status, body) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  });
  res.end(JSON.stringify(body));
}

function normalizeCatalogItem(item, index) {
  const price = Number(item.price ?? item.basePrice ?? item.finalPrice ?? item.priceCzk ?? 0);
  return {
    id: String(item.id ?? item.productId ?? `catalog-${index}`),
    name: String(item.name ?? item.title ?? 'Produkt Cliplot'),
    category: String(item.categoryName ?? item.category?.name ?? item.category ?? 'Cliplot'),
    price: Number.isFinite(price) && price > 0 ? price : fallbackProducts[index % fallbackProducts.length].price,
    originalPrice: item.originalPrice ? Number(item.originalPrice) : undefined,
    currency: 'Kč',
    stockStatus: item.stockQuantity === 0 || item.available === false ? 'Vyprodáno' : 'Skladem',
    delivery: item.stockQuantity === 0 || item.available === false ? 'Hlídáme dostupnost' : 'Doručení 1-2 dny',
    image: item.imageUrl || item.image || item.media?.[0]?.url || fallbackProducts[index % fallbackProducts.length].image,
    description: String(item.shortDescription ?? item.description ?? fallbackProducts[index % fallbackProducts.length].description),
  };
}

async function fetchCatalogProducts() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1600);
  try {
    const url = new URL('/api/products', catalogUrl);
    url.searchParams.set('limit', '8');
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Catalog returned ${response.status}`);
    const payload = await response.json();
    const items = payload?.data?.items || payload?.items || payload?.data || [];
    if (!Array.isArray(items) || items.length === 0) return fallbackProducts;
    return items.slice(0, 8).map(normalizeCatalogItem);
  } catch {
    return fallbackProducts;
  } finally {
    clearTimeout(timeout);
  }
}

async function serveStatic(req, res) {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') pathname = '/index.html';
  const safePath = normalize(pathname).replace(/^(\.\.(\/|\\|$))+/, '');
  const filePath = join(publicDir, safePath);
  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  try {
    const data = await readFile(filePath);
    const ext = extname(filePath);
    res.writeHead(200, {
      'content-type': mimeTypes[ext] || 'application/octet-stream',
      'cache-control': ext === '.html' ? 'no-store' : 'public, max-age=3600',
    });
    res.end(data);
  } catch {
    const index = await readFile(join(publicDir, 'index.html'));
    res.writeHead(200, {
      'content-type': mimeTypes['.html'],
      'cache-control': 'no-store',
    });
    res.end(index);
  }
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    if (url.pathname === '/health' || url.pathname === '/ready') {
      sendJson(res, 200, {
        status: 'ok',
        service: 'cliplot-service',
        mode: 'frontend-foundation',
        timestamp: new Date().toISOString(),
      });
      return;
    }
    if (url.pathname === '/api/products') {
      const products = await fetchCatalogProducts();
      sendJson(res, 200, { success: true, items: products });
      return;
    }
    if (url.pathname === '/api/checkout/preview' && req.method === 'POST') {
      sendJson(res, 202, {
        success: true,
        status: 'frontend_preview_only',
        next: 'payments-microservice integration is gated by GOAL-03 and GOAL-05',
      });
      return;
    }
    await serveStatic(req, res);
  } catch (error) {
    sendJson(res, 500, { success: false, error: 'internal_error' });
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`cliplot-service listening on ${port}`);
});

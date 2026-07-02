import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  authLinks,
  fetchCatalogProducts,
  productCatalogSource,
  handlePaymentCallback,
  liveCheckoutApprovalPacket,
  liveCheckoutPreflight,
  liveOrderWarehouseSmokePlan,
  orderWarehouseReadinessReport,
  paymentStatus,
  serviceReadiness,
  runLiveOrderWarehouseSmoke,
  submitCheckout,
} from './integrations.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const publicDir = join(root, 'public');
const port = Number(process.env.PORT || 8080);

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

async function readRequestJson(req) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 512_000) throw new Error('request_too_large');
  }
  return body ? JSON.parse(body) : {};
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
        service: 'cliplot',
        mode: serviceReadiness().mode,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (url.pathname === '/api/integrations/readiness') {
      sendJson(res, 200, serviceReadiness());
      return;
    }

    if (url.pathname === '/api/auth/links') {
      sendJson(res, 200, authLinks());
      return;
    }

    if (url.pathname === '/api/products') {
      const products = await fetchCatalogProducts();
      sendJson(res, 200, { success: true, catalogSource: productCatalogSource(products), items: products });
      return;
    }

    if (url.pathname === '/api/checkout/preview' && req.method === 'POST') {
      sendJson(res, 202, {
        success: true,
        status: 'frontend_preview_only',
        next: 'Use /api/checkout/submit for the GOAL-03 guarded shared-service path.',
      });
      return;
    }


    if (url.pathname === '/api/checkout/approval-packet' && req.method === 'GET') {
      sendJson(res, 200, await liveCheckoutApprovalPacket());
      return;
    }

    if (url.pathname === '/api/checkout/approval-packet') {
      sendJson(res, 405, {
        success: false,
        status: 'method_not_allowed',
        allowedMethods: ['GET'],
        mutation: false,
      });
      return;
    }



    if (url.pathname === '/api/checkout/live-order-warehouse-smoke-plan' && req.method === 'GET') {
      sendJson(res, 200, await liveOrderWarehouseSmokePlan());
      return;
    }

    if (url.pathname === '/api/checkout/live-order-warehouse-smoke-plan') {
      sendJson(res, 405, {
        success: false,
        status: 'method_not_allowed',
        allowedMethods: ['GET'],
        mutation: false,
      });
      return;
    }

    if (url.pathname === '/api/checkout/order-warehouse-readiness' && req.method === 'GET') {
      sendJson(res, 200, await orderWarehouseReadinessReport());
      return;
    }

    if (url.pathname === '/api/checkout/order-warehouse-readiness') {
      sendJson(res, 405, {
        success: false,
        status: 'method_not_allowed',
        allowedMethods: ['GET'],
        mutation: false,
      });
      return;
    }

    if (url.pathname === '/api/checkout/live-order-warehouse-smoke-executor' && req.method === 'POST') {
      const payload = await readRequestJson(req);
      const result = await runLiveOrderWarehouseSmoke(payload);
      sendJson(res, result.httpStatus, result.body);
      return;
    }

    if (url.pathname === '/api/checkout/live-order-warehouse-smoke-executor') {
      sendJson(res, 405, {
        success: false,
        status: 'method_not_allowed',
        allowedMethods: ['POST'],
        mutation: false,
      });
      return;
    }

    if (url.pathname === '/api/checkout/live-preflight' && req.method === 'GET') {
      sendJson(res, 200, {
        success: true,
        mode: 'guarded_live_checkout_preflight',
        liveCheckoutPreflight: liveCheckoutPreflight(),
      });
      return;
    }

    if (url.pathname === '/api/checkout/live-preflight') {
      sendJson(res, 405, {
        success: false,
        status: 'method_not_allowed',
        allowedMethods: ['GET'],
        mutation: false,
      });
      return;
    }

    if (url.pathname === '/api/checkout/submit' && req.method === 'POST') {
      const payload = await readRequestJson(req);
      const result = await submitCheckout(payload);
      sendJson(res, result.httpStatus, result.body);
      return;
    }

    if (url.pathname === '/api/payments/callback' && req.method === 'POST') {
      const payload = await readRequestJson(req);
      const result = handlePaymentCallback(payload, req.headers);
      sendJson(res, result.httpStatus, result.body);
      return;
    }

    if (url.pathname === '/api/payments/status' && req.method === 'GET') {
      const result = paymentStatus(Object.fromEntries(url.searchParams.entries()));
      sendJson(res, result.httpStatus, result.body);
      return;
    }

    await serveStatic(req, res);
  } catch (error) {
    const message = error?.message === 'request_too_large' ? 'request_too_large' : 'internal_error';
    sendJson(res, message === 'request_too_large' ? 413 : 500, { success: false, error: message });
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`cliplot listening on ${port}`);
});

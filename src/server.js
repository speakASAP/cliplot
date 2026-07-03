import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  authLinks,
  customerStatusSurfaceReadiness,
  customerStatusRuntimeRolloutPlan,
  customerStatusRuntimeActivationGate,
  customerStatusApprovalEvidencePacket,
  fetchCatalogProducts,
  productCatalogSource,
  catalogProductFilterReadiness,
  handlePaymentCallback,
  liveCheckoutApprovalPacket,
  liveCheckoutExecutionWindowPacket,
  liveCheckoutExecutionEvidencePacket,
  liveCheckoutExecutionRequestPacket,
  checkoutLiveReadinessHandoffEvidencePacket,
  authWalletRuntimeCheckoutEvidencePacket,
  liveOwnerExecutionRunbookPacket,
  ownerBoundedWindowReadinessHandoffPacket,
  liveFlagsOperatorPreflightChecklistPacket,
  runBoundedLiveCheckoutExecutor,
  liveCheckoutPreflight,
  liveOrderWarehouseSmokePlan,
  liveOrderWarehouseSmokeExecutionChecklistPacket,
  orderWarehouseReadinessReport,
  revenueClosurePacket,
  postLiveRevenueClosureEvidencePacket,
  revenueHandoffReconciliationPacket,
  paymentCallbackReadiness,
  paymentCallbackReplayPolicyReadiness,
  paymentCallbackPersistenceApprovalPacket,
  paymentCallbackStorageBackendProposalPacket,
  paymentCallbackPersistenceStorageContractPacket,
  paymentCallbackReplayExecutionRolloutProposalPacket,
  paymentCreateApprovalEvidencePacket,
  paymentCreateExecutionWindowPacket,
  runBoundedPaymentCreateExecutor,
  notificationSendApprovalEvidencePacket,
  notificationSendExecutionWindowPacket,
  runBoundedNotificationSendExecutor,
  paymentLiveStatusWriteApprovalPacket,
  paymentStatusReconciliationReadinessPacket,
  paymentStatusWriteWindowRequestPacket,
  paymentCallbackToStatusWriteDryRunContractPacket,
  runPaymentStatusWriteBoundedExecutor,
  paymentStatusReadiness,
  paymentReadScopeReadiness,
  paymentStatusStorageReadiness,
  paymentStatusPersistenceDecisionPacket,
  paymentStatusMappingOwnershipPacket,
  paymentStatusSnapshotReadApprovalPacket,
  paymentStatus,
  paymentStatusRuntimeReadiness,
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
    const cacheControl = ['.html', '.js', '.css'].includes(ext) ? 'no-store' : 'public, max-age=3600';
    res.writeHead(200, {
      'content-type': mimeTypes[ext] || 'application/octet-stream',
      'cache-control': cacheControl,
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

    if (url.pathname === '/api/products/filter-readiness' && req.method === 'GET') {
      sendJson(res, 200, await catalogProductFilterReadiness());
      return;
    }

    if (url.pathname === '/api/products/filter-readiness') {
      sendJson(res, 405, {
        success: false,
        status: 'method_not_allowed',
        allowedMethods: ['GET'],
        mutation: false,
      });
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


    if ((url.pathname === '/api/checkout/approval-packet' || url.pathname === '/api/checkout/live-checkout-approval-packet') && req.method === 'GET') {
      sendJson(res, 200, await liveCheckoutApprovalPacket());
      return;
    }

    if (url.pathname === '/api/checkout/approval-packet' || url.pathname === '/api/checkout/live-checkout-approval-packet') {
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

    if (url.pathname === '/api/checkout/status-surface-contract' && req.method === 'GET') {
      sendJson(res, 200, await customerStatusSurfaceReadiness());
      return;
    }

    if (url.pathname === '/api/checkout/status-surface-contract') {
      sendJson(res, 405, {
        success: false,
        status: 'method_not_allowed',
        allowedMethods: ['GET'],
        mutation: false,
      });
      return;
    }

    if (url.pathname === '/api/checkout/customer-status-runtime-rollout-plan' && req.method === 'GET') {
      sendJson(res, 200, await customerStatusRuntimeRolloutPlan());
      return;
    }

    if (url.pathname === '/api/checkout/customer-status-runtime-rollout-plan') {
      sendJson(res, 405, {
        success: false,
        status: 'method_not_allowed',
        allowedMethods: ['GET'],
        mutation: false,
      });
      return;
    }

    if (url.pathname === '/api/checkout/customer-status-runtime-activation-gate' && req.method === 'GET') {
      sendJson(res, 200, await customerStatusRuntimeActivationGate());
      return;
    }

    if (url.pathname === '/api/checkout/customer-status-runtime-activation-gate') {
      sendJson(res, 405, {
        success: false,
        status: 'method_not_allowed',
        allowedMethods: ['GET'],
        mutation: false,
      });
      return;
    }

    if (url.pathname === '/api/checkout/customer-status-approval-evidence-packet' && req.method === 'GET') {
      sendJson(res, 200, await customerStatusApprovalEvidencePacket());
      return;
    }

    if (url.pathname === '/api/checkout/customer-status-approval-evidence-packet') {
      sendJson(res, 405, {
        success: false,
        status: 'method_not_allowed',
        allowedMethods: ['GET'],
        mutation: false,
      });
      return;
    }


    if (url.pathname === '/api/checkout/revenue-closure-packet' && req.method === 'GET') {
      sendJson(res, 200, await revenueClosurePacket());
      return;
    }



    if (url.pathname === '/api/checkout/post-live-revenue-closure-evidence-packet' && req.method === 'GET') {
      sendJson(res, 200, await postLiveRevenueClosureEvidencePacket());
      return;
    }

    if (url.pathname === '/api/checkout/post-live-revenue-closure-evidence-packet') {
      sendJson(res, 405, {
        success: false,
        status: 'method_not_allowed',
        allowedMethods: ['GET'],
        mutation: false,
      });
      return;
    }

    if (url.pathname === '/api/checkout/revenue-handoff-reconciliation-packet' && req.method === 'GET') {
      sendJson(res, 200, await revenueHandoffReconciliationPacket());
      return;
    }

    if (url.pathname === '/api/checkout/revenue-handoff-reconciliation-packet') {
      sendJson(res, 405, {
        success: false,
        status: 'method_not_allowed',
        allowedMethods: ['GET'],
        mutation: false,
      });
      return;
    }

    if (url.pathname === '/api/checkout/live-execution-evidence-packet' && req.method === 'GET') {
      sendJson(res, 200, await liveCheckoutExecutionEvidencePacket());
      return;
    }

    if (url.pathname === '/api/checkout/live-execution-evidence-packet') {
      sendJson(res, 405, {
        success: false,
        status: 'method_not_allowed',
        allowedMethods: ['GET'],
        mutation: false,
      });
      return;
    }

    if (url.pathname === '/api/checkout/live-execution-request-packet' && req.method === 'GET') {
      sendJson(res, 200, await liveCheckoutExecutionRequestPacket());
      return;
    }

    if (url.pathname === '/api/checkout/live-execution-request-packet') {
      sendJson(res, 405, {
        success: false,
        status: 'method_not_allowed',
        allowedMethods: ['GET'],
        mutation: false,
      });
      return;
    }


    if (url.pathname === '/api/checkout/auth-wallet-runtime-evidence' && req.method === 'GET') {
      sendJson(res, 200, await authWalletRuntimeCheckoutEvidencePacket());
      return;
    }

    if (url.pathname === '/api/checkout/auth-wallet-runtime-evidence') {
      sendJson(res, 405, {
        success: false,
        status: 'method_not_allowed',
        allowedMethods: ['GET'],
        mutation: false,
      });
      return;
    }

    if (url.pathname === '/api/checkout/live-readiness-handoff-evidence-packet' && req.method === 'GET') {
      sendJson(res, 200, await checkoutLiveReadinessHandoffEvidencePacket());
      return;
    }

    if (url.pathname === '/api/checkout/live-readiness-handoff-evidence-packet') {
      sendJson(res, 405, {
        success: false,
        status: 'method_not_allowed',
        allowedMethods: ['GET'],
        mutation: false,
      });
      return;
    }


    if (url.pathname === '/api/checkout/owner-bounded-window-readiness-handoff-packet' && req.method === 'GET') {
      sendJson(res, 200, await ownerBoundedWindowReadinessHandoffPacket());
      return;
    }

    if (url.pathname === '/api/checkout/owner-bounded-window-readiness-handoff-packet') {
      sendJson(res, 405, {
        success: false,
        status: 'method_not_allowed',
        allowedMethods: ['GET'],
        mutation: false,
      });
      return;
    }

    if (url.pathname === '/api/checkout/live-owner-execution-runbook-packet' && req.method === 'GET') {
      sendJson(res, 200, await liveOwnerExecutionRunbookPacket());
      return;
    }

    if (url.pathname === '/api/checkout/live-owner-execution-runbook-packet') {
      sendJson(res, 405, {
        success: false,
        status: 'method_not_allowed',
        allowedMethods: ['GET'],
        mutation: false,
      });
      return;
    }

    if (url.pathname === '/api/checkout/live-execution-window-packet' && req.method === 'GET') {
      sendJson(res, 200, await liveCheckoutExecutionWindowPacket());
      return;
    }

    if (url.pathname === '/api/checkout/live-bounded-executor' && req.method === 'POST') {
      const payload = await readRequestJson(req);
      const result = await runBoundedLiveCheckoutExecutor(payload);
      sendJson(res, result.httpStatus, result.body);
      return;
    }

    if (url.pathname === '/api/checkout/live-flags-operator-preflight-checklist-packet' && req.method === 'GET') {
      sendJson(res, 200, await liveFlagsOperatorPreflightChecklistPacket());
      return;
    }

    if (url.pathname === '/api/checkout/live-flags-operator-preflight-checklist-packet') {
      sendJson(res, 405, {
        success: false,
        status: 'method_not_allowed',
        allowedMethods: ['GET'],
        mutation: false,
      });
      return;
    }

    if (url.pathname === '/api/checkout/live-execution-window-packet') {
      sendJson(res, 405, {
        success: false,
        status: 'method_not_allowed',
        allowedMethods: ['GET'],
        mutation: false,
      });
      return;
    }

    if (url.pathname === '/api/checkout/live-bounded-executor') {
      sendJson(res, 405, {
        success: false,
        status: 'method_not_allowed',
        allowedMethods: ['POST'],
        mutation: false,
      });
      return;
    }

    if (url.pathname === '/api/checkout/revenue-closure-packet') {
      sendJson(res, 405, {
        success: false,
        status: 'method_not_allowed',
        allowedMethods: ['GET'],
        mutation: false,
      });
      return;
    }

    if (url.pathname === '/api/checkout/live-order-warehouse-create-replay-cancel-contract-packet' && req.method === 'GET') {
      sendJson(res, 200, await liveOrderWarehouseSmokeExecutionChecklistPacket());
      return;
    }

    if (url.pathname === '/api/checkout/live-order-warehouse-create-replay-cancel-contract-packet') {
      sendJson(res, 405, {
        success: false,
        status: 'method_not_allowed',
        allowedMethods: ['GET'],
        mutation: false,
      });
      return;
    }

    if (url.pathname === '/api/checkout/live-order-warehouse-smoke-execution-checklist-packet' && req.method === 'GET') {
      sendJson(res, 200, await liveOrderWarehouseSmokeExecutionChecklistPacket());
      return;
    }

    if (url.pathname === '/api/checkout/live-order-warehouse-smoke-execution-checklist-packet') {
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

    if (url.pathname === '/api/payments/callback-readiness' && req.method === 'GET') {
      sendJson(res, 200, paymentCallbackReadiness());
      return;
    }

    if (url.pathname === '/api/payments/callback-readiness') {
      sendJson(res, 405, {
        success: false,
        status: 'method_not_allowed',
        allowedMethods: ['GET'],
        mutation: false,
      });
      return;
    }

    if (url.pathname === '/api/payments/callback-replay-policy' && req.method === 'GET') {
      sendJson(res, 200, paymentCallbackReplayPolicyReadiness());
      return;
    }

    if (url.pathname === '/api/payments/callback-replay-policy') {
      sendJson(res, 405, {
        success: false,
        status: 'method_not_allowed',
        allowedMethods: ['GET'],
        mutation: false,
      });
      return;
    }

    if (url.pathname === '/api/payments/callback-persistence-approval-packet' && req.method === 'GET') {
      sendJson(res, 200, await paymentCallbackPersistenceApprovalPacket());
      return;
    }

    if (url.pathname === '/api/payments/callback-storage-backend-proposal-packet' && req.method === 'GET') {
      sendJson(res, 200, await paymentCallbackStorageBackendProposalPacket());
      return;
    }

    if (url.pathname === '/api/payments/callback-persistence-storage-approval-checklist-packet' && req.method === 'GET') {
      sendJson(res, 200, await paymentCallbackPersistenceStorageContractPacket());
      return;
    }

    if (url.pathname === '/api/payments/callback-persistence-storage-approval-checklist-packet') {
      sendJson(res, 405, {
        success: false,
        status: 'method_not_allowed',
        allowedMethods: ['GET'],
        mutation: false,
      });
      return;
    }

    if (url.pathname === '/api/payments/callback-persistence-storage-contract-packet' && req.method === 'GET') {
      sendJson(res, 200, await paymentCallbackPersistenceStorageContractPacket());
      return;
    }

    if (url.pathname === '/api/payments/callback-persistence-storage-contract-packet') {
      sendJson(res, 405, {
        success: false,
        status: 'method_not_allowed',
        allowedMethods: ['GET'],
        mutation: false,
      });
      return;
    }

    if (url.pathname === '/api/payments/callback-replay-execution-rollout-proposal-packet' && req.method === 'GET') {
      sendJson(res, 200, await paymentCallbackReplayExecutionRolloutProposalPacket());
      return;
    }

    if (url.pathname === '/api/payments/callback-replay-execution-rollout-proposal-packet') {
      sendJson(res, 405, {
        success: false,
        status: 'method_not_allowed',
        allowedMethods: ['GET'],
        mutation: false,
      });
      return;
    }

    if (url.pathname === '/api/payments/callback-storage-backend-proposal-packet') {
      sendJson(res, 405, {
        success: false,
        status: 'method_not_allowed',
        allowedMethods: ['GET'],
        mutation: false,
      });
      return;
    }

    if (url.pathname === '/api/payments/callback-persistence-approval-packet') {
      sendJson(res, 405, {
        success: false,
        status: 'method_not_allowed',
        allowedMethods: ['GET'],
        mutation: false,
      });
      return;
    }

    if (url.pathname === '/api/notifications/send-approval-evidence-packet' && req.method === 'GET') {
      sendJson(res, 200, await notificationSendApprovalEvidencePacket());
      return;
    }

    if (url.pathname === '/api/notifications/send-execution-window-packet' && req.method === 'GET') {
      sendJson(res, 200, notificationSendExecutionWindowPacket());
      return;
    }

    if (url.pathname === '/api/notifications/send-bounded-executor' && req.method === 'POST') {
      const payload = await readRequestJson(req);
      const result = await runBoundedNotificationSendExecutor(payload);
      sendJson(res, result.httpStatus, result.body);
      return;
    }

    if (url.pathname === '/api/notifications/send-execution-window-packet') {
      sendJson(res, 405, {
        success: false,
        status: 'method_not_allowed',
        allowedMethods: ['GET'],
        mutation: false,
      });
      return;
    }

    if (url.pathname === '/api/notifications/send-bounded-executor') {
      sendJson(res, 405, {
        success: false,
        status: 'method_not_allowed',
        allowedMethods: ['POST'],
        mutation: false,
      });
      return;
    }

    if (url.pathname === '/api/notifications/send-approval-evidence-packet') {
      sendJson(res, 405, {
        success: false,
        status: 'method_not_allowed',
        allowedMethods: ['GET'],
        mutation: false,
      });
      return;
    }

    if (url.pathname === '/api/payments/create-approval-evidence-packet' && req.method === 'GET') {
      sendJson(res, 200, await paymentCreateApprovalEvidencePacket());
      return;
    }

    if (url.pathname === '/api/payments/create-execution-window-packet' && req.method === 'GET') {
      sendJson(res, 200, paymentCreateExecutionWindowPacket());
      return;
    }

    if (url.pathname === '/api/payments/create-bounded-executor' && req.method === 'POST') {
      const payload = await readRequestJson(req);
      const result = await runBoundedPaymentCreateExecutor(payload);
      sendJson(res, result.httpStatus, result.body);
      return;
    }

    if (url.pathname === '/api/payments/create-execution-window-packet') {
      sendJson(res, 405, {
        success: false,
        status: 'method_not_allowed',
        allowedMethods: ['GET'],
        mutation: false,
      });
      return;
    }

    if (url.pathname === '/api/payments/create-bounded-executor') {
      sendJson(res, 405, {
        success: false,
        status: 'method_not_allowed',
        allowedMethods: ['POST'],
        mutation: false,
      });
      return;
    }

    if (url.pathname === '/api/payments/create-approval-evidence-packet') {
      sendJson(res, 405, {
        success: false,
        status: 'method_not_allowed',
        allowedMethods: ['GET'],
        mutation: false,
      });
      return;
    }

    if (url.pathname === '/api/payments/live-status-write-approval-packet' && req.method === 'GET') {
      sendJson(res, 200, await paymentLiveStatusWriteApprovalPacket());
      return;
    }

    if (url.pathname === '/api/payments/live-status-write-approval-packet') {
      sendJson(res, 405, {
        success: false,
        status: 'method_not_allowed',
        allowedMethods: ['GET'],
        mutation: false,
      });
      return;
    }

    if (url.pathname === '/api/payments/status-reconciliation-readiness-packet' && req.method === 'GET') {
      sendJson(res, 200, await paymentStatusReconciliationReadinessPacket());
      return;
    }

    if (url.pathname === '/api/payments/status-reconciliation-readiness-packet') {
      sendJson(res, 405, {
        success: false,
        status: 'method_not_allowed',
        allowedMethods: ['GET'],
        mutation: false,
      });
      return;
    }


    if (url.pathname === '/api/payments/callback-to-status-write-dry-run-contract-packet' && req.method === 'GET') {
      sendJson(res, 200, await paymentCallbackToStatusWriteDryRunContractPacket());
      return;
    }

    if (url.pathname === '/api/payments/callback-to-status-write-dry-run-contract-packet') {
      sendJson(res, 405, {
        success: false,
        status: 'method_not_allowed',
        allowedMethods: ['GET'],
        mutation: false,
      });
      return;
    }

    if (url.pathname === '/api/payments/status-write-window-request-packet' && req.method === 'GET') {
      sendJson(res, 200, await paymentStatusWriteWindowRequestPacket());
      return;
    }

    if (url.pathname === '/api/payments/status-write-window-request-packet') {
      sendJson(res, 405, {
        success: false,
        status: 'method_not_allowed',
        allowedMethods: ['GET'],
        mutation: false,
      });
      return;
    }

    if (url.pathname === '/api/payments/status-write-bounded-executor' && req.method === 'POST') {
      const payload = await readRequestJson(req);
      const result = await runPaymentStatusWriteBoundedExecutor(payload);
      sendJson(res, result.httpStatus, result.body);
      return;
    }

    if (url.pathname === '/api/payments/status-write-bounded-executor') {
      sendJson(res, 405, {
        success: false,
        status: 'method_not_allowed',
        allowedMethods: ['POST'],
        mutation: false,
      });
      return;
    }

    if (url.pathname === '/api/payments/status' && req.method === 'GET') {
      const result = await paymentStatus(Object.fromEntries(url.searchParams.entries()));
      sendJson(res, result.httpStatus, result.body);
      return;
    }

    if (url.pathname === '/api/payments/status-readiness' && req.method === 'GET') {
      sendJson(res, 200, await paymentStatusReadiness());
      return;
    }

    if (url.pathname === '/api/payments/read-scope-readiness' && req.method === 'GET') {
      sendJson(res, 200, await paymentReadScopeReadiness());
      return;
    }

    if (url.pathname === '/api/payments/status-runtime-readiness' && req.method === 'GET') {
      sendJson(res, 200, paymentStatusRuntimeReadiness());
      return;
    }

    if (url.pathname === '/api/payments/status-runtime-readiness') {
      sendJson(res, 405, {
        success: false,
        status: 'method_not_allowed',
        allowedMethods: ['GET'],
        mutation: false,
      });
      return;
    }

    if (url.pathname === '/api/payments/read-scope-readiness') {
      sendJson(res, 405, {
        success: false,
        status: 'method_not_allowed',
        allowedMethods: ['GET'],
        mutation: false,
      });
      return;
    }

    if (url.pathname === '/api/payments/status-readiness') {
      sendJson(res, 405, {
        success: false,
        status: 'method_not_allowed',
        allowedMethods: ['GET'],
        mutation: false,
      });
      return;
    }

    if (url.pathname === '/api/payments/status-storage-readiness' && req.method === 'GET') {
      sendJson(res, 200, await paymentStatusStorageReadiness());
      return;
    }

    if (url.pathname === '/api/payments/status-storage-readiness') {
      sendJson(res, 405, {
        success: false,
        status: 'method_not_allowed',
        allowedMethods: ['GET'],
        mutation: false,
      });
      return;
    }

    if (url.pathname === '/api/payments/status-persistence-decision' && req.method === 'GET') {
      sendJson(res, 200, await paymentStatusPersistenceDecisionPacket());
      return;
    }

    if (url.pathname === '/api/payments/status-persistence-decision') {
      sendJson(res, 405, {
        success: false,
        status: 'method_not_allowed',
        allowedMethods: ['GET'],
        mutation: false,
      });
      return;
    }

    if (url.pathname === '/api/payments/status-mapping-ownership' && req.method === 'GET') {
      sendJson(res, 200, await paymentStatusMappingOwnershipPacket());
      return;
    }

    if (url.pathname === '/api/payments/status-mapping-ownership') {
      sendJson(res, 405, {
        success: false,
        status: 'method_not_allowed',
        allowedMethods: ['GET'],
        mutation: false,
      });
      return;
    }

    if (url.pathname === '/api/payments/status-snapshot-read-approval-packet' && req.method === 'GET') {
      sendJson(res, 200, await paymentStatusSnapshotReadApprovalPacket());
      return;
    }

    if (url.pathname === '/api/payments/status-snapshot-read-approval-packet') {
      sendJson(res, 405, {
        success: false,
        status: 'method_not_allowed',
        allowedMethods: ['GET'],
        mutation: false,
      });
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

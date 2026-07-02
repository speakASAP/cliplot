#!/usr/bin/env node
import { createServer } from 'node:http';

function assert(condition, message, evidence = {}) {
  if (!condition) {
    console.error(JSON.stringify({ ok: false, message, ...evidence }, null, 2));
    process.exit(1);
  }
}

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server.address()));
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

const observed = [];
const expectedOrderId = 'cliplot-approved-adapter-test';
const expectedApiKey = 'unit-payment-read-key';
const server = createServer((req, res) => {
  const url = new URL(req.url || '/', 'http://127.0.0.1');
  observed.push({
    method: req.method,
    pathname: url.pathname,
    applicationId: url.searchParams.get('applicationId'),
    orderId: url.searchParams.get('orderId'),
    apiKeyPresent: req.headers['x-api-key'] === expectedApiKey,
  });

  if (url.pathname !== '/payments/status/by-order-id') {
    res.writeHead(500, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: { code: 'FORBIDDEN_TEST_PATH' } }));
    return;
  }

  if (url.searchParams.get('applicationId') !== 'cliplot' || url.searchParams.get('orderId') !== expectedOrderId) {
    res.writeHead(400, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: { code: 'BAD_TEST_QUERY' } }));
    return;
  }

  if (req.headers['x-api-key'] !== expectedApiKey) {
    res.writeHead(403, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: { code: 'BAD_TEST_API_KEY' } }));
    return;
  }

  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    data: {
      paymentId: 'pay_unit_snapshot',
      orderId: expectedOrderId,
      applicationId: 'cliplot',
      status: 'processing',
      amount: '1659.00',
      currency: 'CZK',
      paymentMethod: 'invoice',
      createdAt: '2026-07-02T10:00:00.000Z',
      updatedAt: '2026-07-02T10:01:00.000Z',
      completedAt: null,
      refundedAt: null,
      providerTransactionId: 'must-not-be-required',
      metadata: { mustNotBeRequired: true },
      source: 'payments_db_snapshot',
      providerCall: false,
      mutation: false,
      persistence: false,
    },
  }));
});

const address = await listen(server);

try {
  process.env.SERVICE_NAME = 'cliplot';
  process.env.CLIPLOT_APPLICATION_ID = 'cliplot';
  process.env.PAYMENT_SERVICE_URL = `http://127.0.0.1:${address.port}`;
  process.env.PAYMENT_API_KEY = expectedApiKey;
  process.env.ENABLE_CUSTOMER_STATUS_RUNTIME_READ = 'true';
  process.env.ENABLE_PAYMENT_STATUS_SNAPSHOT_READ = 'true';
  process.env.CLIPLOT_STATUS_RUNTIME_APPROVAL_ID = 'unit-approved-read-only-status';
  process.env.ENABLE_LIVE_ORDER_SUBMIT = 'false';
  process.env.ENABLE_LIVE_PAYMENT_CREATE = 'false';
  process.env.ENABLE_LIVE_NOTIFICATIONS = 'false';
  process.env.CLIPLOT_LIVE_ORDER_APPROVAL_ID = '';
  process.env.CLIPLOT_LIVE_PAYMENT_APPROVAL_ID = '';
  process.env.CLIPLOT_LIVE_NOTIFICATION_APPROVAL_ID = '';

  const { paymentStatus, paymentStatusRuntimeReadiness } = await import(`../src/integrations.js?unit=${Date.now()}`);
  const readiness = paymentStatusRuntimeReadiness();
  assert(readiness.status === 'ready_for_approved_payments_snapshot_runtime_read', 'approved unit readiness did not become ready', readiness);
  assert(readiness.runtimeReadEnabled === true, 'approved unit runtime read not enabled', readiness);
  assert(readiness.paymentsSnapshotReadEnabled === true, 'approved unit snapshot read not enabled', readiness);
  assert(readiness.providerCall === false && readiness.persistence === false && readiness.mutation === false, 'approved unit readiness became mutating', readiness);

  const result = await paymentStatus({ orderId: expectedOrderId });
  assert(result.httpStatus === 200, 'approved unit snapshot read returned non-200', result);
  assert(result.body?.status === 'payment_status_snapshot_read', 'approved unit snapshot status unexpected', result.body);
  assert(result.body?.mode === 'payments_db_snapshot_read', 'approved unit snapshot mode unexpected', result.body);
  assert(result.body?.orderId === expectedOrderId, 'approved unit snapshot orderId mismatch', result.body);
  assert(result.body?.applicationId === 'cliplot', 'approved unit snapshot applicationId mismatch', result.body);
  assert(result.body?.paymentStatus === 'processing', 'approved unit snapshot status normalization failed', result.body);
  assert(result.body?.customerSafePaymentStatus?.code === 'payment_processing', 'approved unit customer-safe status missing', result.body);
  assert(result.body?.source === 'payments_db_snapshot', 'approved unit snapshot source changed', result.body);
  assert(result.body?.providerCall === false, 'approved unit snapshot providerCall changed', result.body);
  assert(result.body?.persistence === false, 'approved unit snapshot persistence changed', result.body);
  assert(result.body?.mutation === false, 'approved unit snapshot mutation changed', result.body);
  assert(result.body?.runtimeReadEnabled === true, 'approved unit result runtime read disabled', result.body);
  assert(result.body?.paymentsSnapshotReadEnabled === true, 'approved unit result snapshot read disabled', result.body);
  assert(result.body?.storageRead === false, 'approved unit result storage read enabled', result.body);

  const paymentIdOnly = await paymentStatus({ paymentId: 'pay_provider_refresh_forbidden' });
  assert(paymentIdOnly.httpStatus === 400, 'paymentId-only approved unit request should be rejected', paymentIdOnly);
  assert(paymentIdOnly.body?.status === 'payment_status_order_id_required_for_snapshot_read', 'paymentId-only approved unit status unexpected', paymentIdOnly.body);
  assert(paymentIdOnly.body?.providerCall === false, 'paymentId-only approved unit reported provider call', paymentIdOnly.body);
  assert(paymentIdOnly.body?.forbiddenEndpoint === '/payments/{paymentId}', 'paymentId-only forbidden endpoint missing', paymentIdOnly.body);

  assert(observed.length === 1, 'adapter should make exactly one mock Payments request', { observed });
  assert(observed[0].pathname === '/payments/status/by-order-id', 'adapter called wrong Payments path', { observed });
  assert(observed[0].applicationId === 'cliplot', 'adapter used non-canonical applicationId', { observed });
  assert(observed[0].orderId === expectedOrderId, 'adapter did not use supplied orderId', { observed });
  assert(observed[0].apiKeyPresent === true, 'adapter did not send API key to mock Payments', { observed });

  console.log(JSON.stringify({
    ok: true,
    status: result.body.status,
    readiness: readiness.status,
    mockRequestCount: observed.length,
    paymentsPath: observed[0].pathname,
    applicationId: observed[0].applicationId,
    orderId: observed[0].orderId,
    paymentIdOnlyStatus: paymentIdOnly.body.status,
    providerCall: result.body.providerCall,
    persistence: result.body.persistence,
    mutation: result.body.mutation,
  }, null, 2));
} finally {
  await close(server);
}

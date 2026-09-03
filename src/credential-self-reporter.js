import { createRequire } from 'node:module';

// The shared reporter is CommonJS and this package is ESM ("type": "module"),
// so it is loaded through createRequire rather than a bare import. Vendoring a
// second, ESM copy would fork the classification rule, which is the one thing
// the shared module exists to prevent: fourteen independent implementations of
// accepted/rejected/indeterminate will not agree, and a reporter that calls a
// timeout `rejected` fires exactly the false alert Phase 2 must not produce.
const require = createRequire(import.meta.url);
const reporter = require('./vendor/credential-reporter.cjs');

const ORDERS_URL =
  process.env.ORDERS_SERVICE_URL ||
  'http://orders-microservice.statex-apps.svc.cluster.local:3203';

const MONITORING_URL =
  process.env.MONITORING_URL ||
  'http://monitoring-microservice.statex-apps.svc.cluster.local:3395';

/**
 * This service's orders principal, exactly as auth lists it.
 *
 * cliplot holds a second principal, `svc-cliplot--orders-microservice-create`,
 * which carries the same `cliplot:service` grant. Only this one is reported:
 * two principals sharing a role cannot be told apart by any probe, so a second
 * reporter would duplicate this verdict under a different name rather than
 * measure anything new. The `-create` principal stays silent, and Task B is
 * where a duplicate grant gets resolved.
 */
const PRINCIPAL = 'svc-cliplot--orders-microservice@internal.alfares.cz';

const TARGET = 'orders-microservice';

const REPORT_INTERVAL_MS = Number(
  process.env.CREDENTIAL_SELF_REPORT_INTERVAL_MS || 30 * 60 * 1000,
);

/**
 * Reports this service's orders credential, per
 * `monitoring-microservice/docs/CREDENTIAL_SELF_REPORT_CONTRACT.md`.
 *
 * Wave 3 of the prober plan's Task A.
 *
 * **This probe is valid-credential-scoped, not role-scoped, and that limit is
 * real.** cliplot's grant is `internal:cliplot:service`, which orders enforces
 * on ORDER_DETAIL_READ_ROLES — `GET /api/orders/:id`. That route cannot be
 * probed: ParseUUIDPipe plus a synthetic id returns 404, which the contract
 * classifies `indeterminate`, and probing a real order id would tie a
 * credential check to specific rows surviving in the database.
 * `/api/orders/admin/lifecycle` returns 403 to this credential — deliberately,
 * per the comment in orders.controller.ts, which keeps cliplot out of the
 * channel lifecycle lists so it cannot read every channel's orders.
 *
 * So `GET /api/orders/customer/lifecycle` is used. Verified live: 200 with the
 * deployed token, 401 with a garbage token. Its role set includes
 * `'authenticated:user'`, so it accepts any valid principal: it catches expiry,
 * revocation, wrong algorithm and the empty-token case, but would not catch
 * this principal losing only its `cliplot:service` grant. Weaker than a
 * role-scoped probe, and much stronger than `/health`, which answers 200 with
 * no credential at all and so can never fail.
 */
export async function runCredentialSelfReport() {
  // ORDERS_STATUS_SERVICE_TOKEN, not ORDERS_SERVICE_TOKEN. This pod's two
  // orders credentials are crossed relative to their variable names, verified
  // by decoding each token's `sub` on 2026-09-03:
  //
  //   ORDERS_STATUS_SERVICE_TOKEN -> svc-cliplot--orders-microservice
  //   ORDERS_SERVICE_TOKEN        -> svc-cliplot--orders-microservice-create
  //
  // Reading the name-matching variable would report this principal's verdict
  // using the other principal's token, so a revocation of either would be
  // attributed to the wrong one. The variable names are not renamed here
  // because orders-microservice reads CLIPLOT_ORDERS_SERVICE_TOKEN from the
  // same Vault key; renaming is a cross-repo change for Task B, not this fix.
  const token = (process.env.ORDERS_STATUS_SERVICE_TOKEN || '').trim();
  const ingestToken = (process.env.CREDENTIAL_INGEST_TOKEN || '').trim();

  if (!ingestToken) {
    // A reporter that stops reporting is indistinguishable from a credential
    // that broke, and silence is this design's primary signal.
    console.error(
      JSON.stringify({
        event: 'credential_self_report_undeliverable',
        timestamp: new Date().toISOString(),
        principal: PRINCIPAL,
        reason: 'CREDENTIAL_INGEST_TOKEN is empty',
      }),
    );
    return null;
  }

  const outcome = await reporter.reportCredential({
    url: `${ORDERS_URL}/api/orders/customer/lifecycle`,
    token,
    serviceName: 'cliplot',
    monitoringUrl: MONITORING_URL,
    ingestToken,
    principal: PRINCIPAL,
    target: TARGET,
  });

  console.log(
    JSON.stringify({
      event: 'credential_self_report_sent',
      timestamp: new Date().toISOString(),
      principal: PRINCIPAL,
      target: TARGET,
      verdict: outcome.verdict,
      posted: outcome.posted,
      error: outcome.error ?? null,
    }),
  );

  return { verdict: outcome.verdict, posted: outcome.posted };
}

/**
 * Starts the reporting loop. `unref()` so a pending timer never holds the
 * process open during shutdown.
 */
export function startCredentialSelfReporter() {
  if (process.env.CREDENTIAL_SELF_REPORT_ENABLED === 'false') return;

  const timer = setInterval(() => {
    runCredentialSelfReport().catch((error) => {
      // Never let a reporting failure take down the service it observes.
      console.error(
        JSON.stringify({
          event: 'credential_self_report_failed',
          timestamp: new Date().toISOString(),
          principal: PRINCIPAL,
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    });
  }, REPORT_INTERVAL_MS);

  if (typeof timer.unref === 'function') timer.unref();
}

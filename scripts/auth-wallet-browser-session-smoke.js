#!/usr/bin/env node
import { authWalletBrowserSessionFetchEvidence } from '../src/integrations.js';

const baseUrl = process.argv[2] || process.env.CLIPLOT_AUTH_WALLET_SMOKE_BASE_URL || 'http://127.0.0.1:8080';

function assert(condition, message, evidence = {}) {
  if (!condition) {
    console.error(JSON.stringify({ ok: false, message, ...evidence }, null, 2));
    process.exit(1);
  }
}

const evidence = await authWalletBrowserSessionFetchEvidence({ baseUrl });

assert(evidence.success === true, 'auth wallet browser-session evidence failed', evidence);
assert(evidence.mode === 'guarded_auth_wallet_browser_session_fetch_evidence', 'auth wallet browser-session evidence mode mismatch', evidence);
assert(evidence.mutation === false, 'auth wallet browser-session evidence reports mutation', evidence);
assert(evidence.persistence === false, 'auth wallet browser-session evidence reports persistence', evidence);
assert(evidence.providerCall === false, 'auth wallet browser-session evidence reports provider call', evidence);
assert(evidence.checkoutSubmit === false, 'auth wallet browser-session evidence submitted checkout', evidence);
assert(evidence.authWalletMutation === false, 'auth wallet browser-session evidence mutated Auth wallet data', evidence);
assert(evidence.paymentCreation === false, 'auth wallet browser-session evidence created payment', evidence);
assert(evidence.warehouseReservation === false, 'auth wallet browser-session evidence reserved Warehouse stock', evidence);
assert(evidence.notificationSend === false, 'auth wallet browser-session evidence sent notification', evidence);
assert(evidence.databaseMutation === false, 'auth wallet browser-session evidence mutated database state', evidence);
assert(evidence.kubernetesMutation === false, 'auth wallet browser-session evidence mutated Kubernetes', evidence);
assert(evidence.vaultUsage === false, 'auth wallet browser-session evidence used Vault', evidence);

if (process.env.ENABLE_AUTH_WALLET_BROWSER_SESSION_SMOKE !== 'true') {
  assert(evidence.status === 'approval_required_auth_wallet_browser_session_fetch_source_path', 'default browser-session smoke must stay approval-gated', evidence);
  assert(evidence.liveExecutionAllowed === false, 'default browser-session smoke allows live execution', evidence);
  assert(evidence.authWalletFetch === false, 'default browser-session smoke fetched Auth wallet data', evidence);
  assert(evidence.browserSessionRead === false, 'default browser-session smoke read browser session data', evidence);
} else {
  assert(evidence.status === 'sanitized_auth_wallet_browser_session_fetch_recorded', 'live browser-session smoke status mismatch', evidence);
  assert(evidence.liveExecutionAllowed === true, 'live browser-session smoke did not record approved execution', evidence);
  assert(evidence.authWalletFetch === true, 'live browser-session smoke did not fetch Auth wallet status evidence', evidence);
  assert(evidence.browserSessionRead === true, 'live browser-session smoke did not record browser-session read evidence', evidence);
  assert(evidence.endpointCount === 3, 'live browser-session smoke endpoint count mismatch', evidence);
  assert(Array.isArray(evidence.results) && evidence.results.every((result) => result.bodyPrinted === false && result.tokenPrinted === false && result.customerDataPrinted === false), 'live browser-session smoke evidence is not sanitized', evidence);
}

console.log(JSON.stringify({ ok: true, ...evidence }, null, 2));

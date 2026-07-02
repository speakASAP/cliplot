#!/usr/bin/env node
process.env.CLIPLOT_LIVE_SMOKE_CONTRACT_PATH = '/api/checkout/live-order-warehouse-create-replay-cancel-contract-packet';
await import('./live-order-warehouse-smoke-execution-checklist.js');

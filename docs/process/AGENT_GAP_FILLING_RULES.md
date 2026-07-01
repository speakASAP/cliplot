# Agent Gap Filling Rules

## Allowed

Agents may infer low-risk implementation details from local repo patterns when:

- the detail does not alter business policy;
- the detail does not create a new shared-service contract;
- the detail does not affect secrets, payments, orders, stock, pricing, or legal
  identity;
- the inference is recorded in the execution plan.

## Not Allowed

Agents must not invent:

- product catalog scope;
- approved SKU list;
- prices;
- payment provider identity;
- payment callback keys;
- Vault secret values;
- service tokens;
- legal company data;
- production validation evidence.

Use `[MISSING: ...]` or `[UNKNOWN: ...]`.

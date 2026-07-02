# ADR-001: Separate Repository With Shared Commerce Services

## Decision

Create `cliplot` as a separate remote repository on `alfares`, while
reusing FlipFlop/shared commerce services.

## Rationale

The owner requested a separate folder/repository and a distinct storefront. A
separate repo isolates Cliplot design and deployment while shared services avoid
duplicated business state.

## Consequences

- Cliplot needs its own service identity.
- Shared-service contracts must be verified before runtime integration.
- Kubernetes/Vault/RAG work is required before production deployment.

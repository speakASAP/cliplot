# Cliplot Intent Preservation System

## Chain

Every implementation task must preserve:

```text
Constitution -> Vision -> Business Case -> System -> Subsystem -> Roadmap -> Milestone -> Feature -> Task -> Goal Impact -> Execution Plan -> Context Package -> Coding Prompt -> Code -> Validation Report -> State Update
```

## Blocking Rule

Coding is blocked when any execution-critical element is missing:

- owner intent;
- accepted scope;
- non-goals;
- validation plan;
- sensitive-data handling;
- contract/schema impact;
- replay/determinism impact;
- rollback or deploy path when runtime changes are involved.

## Cliplot-Specific Protected Intent

Cliplot exists to sell products through a simple Czech storefront, not to become
a dashboard or a duplicated commerce backend. Shared services own business
truth.

## Artifact Ownership

The orchestrator owns:

- `docs/IMPLEMENTATION_STATE.md`;
- `implementation-goals/README.md`;
- gate reports;
- shared process docs.

Workers own only their assigned files.

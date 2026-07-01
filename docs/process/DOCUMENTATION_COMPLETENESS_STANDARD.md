# Documentation Completeness Standard

## Required Root Documents

- `README.md`
- `AGENTS.md`
- `BUSINESS.md`
- `SYSTEM.md`
- `SPEC.md`
- `GOALS.md`
- `PLAN.md`

## Required Process Documents

- `docs/INTENT_MEMORY.md`
- `docs/DESIGN_CONTRACT.md`
- `docs/IMPLEMENTATION_ORCHESTRATOR.md`
- `docs/IMPLEMENTATION_STATE.md`
- `docs/process/PROJECT_INVARIANTS.md`
- `docs/process/OPERATIONAL_GATES.md`
- `docs/process/AGENT_GAP_FILLING_RULES.md`

## Required Goal Artifacts

Each coding or deploy goal must have:

- goal file;
- execution plan;
- context package;
- coding prompt;
- validation report;
- implementation state update.

## Marker Policy

Use:

- `[MISSING: ...]` for required unavailable facts.
- `[UNKNOWN: ...]` for uncertain facts that need verification.

Do not remove markers by guessing.

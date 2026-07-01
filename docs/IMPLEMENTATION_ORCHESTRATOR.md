# Cliplot Implementation Orchestrator

## Mission

The orchestrator manages Cliplot implementation by goals. State in the
repository, not chat history, drives continuation.

## Required First Steps

Every session must:

1. Read required files from `AGENTS.md`.
2. Run `git status --short --branch`.
3. Read `docs/IMPLEMENTATION_STATE.md`.
4. Read `implementation-goals/README.md`.
5. Identify active goal, blockers, and ready parallel lanes.
6. Query docs-rag when available, or record the blocker.
7. Run the relevant gates before code edits.

## Intent Preservation Chain

For implementation work, preserve:

```text
Vision -> Goal Impact -> System -> Feature -> Task -> Execution Plan -> Coding Prompt -> Code -> Validation -> State Update -> Commit
```

Coding is blocked when execution-critical traceability, scope, acceptance
criteria, validation plan, sensitive-data handling, contract impact, or
replay/determinism impact is missing.

## Goal Selection

1. If a goal is active, continue it.
2. If active is blocked, report blocker and required owner/system action.
3. Otherwise choose the first `ready` goal whose dependencies are satisfied.
4. If multiple lanes are ready with disjoint ownership, use subagents.
5. Do not start later goals while required earlier goals are unresolved.

## Parallel Planning Standard

Every execution plan must include:

- lane ID;
- objective;
- can start status;
- blockers;
- write ownership;
- forbidden files;
- read-only context;
- validation evidence;
- merge notes;
- integration owner.

Shared files are integration-owner files:

- `docs/IMPLEMENTATION_STATE.md`
- `implementation-goals/README.md`
- gate reports;
- root process docs.

## Worker Completion Contract

Each worker/subagent must report:

- objective;
- files changed or inspected;
- validation run;
- intent compliance;
- blockers;
- risks;
- handoff notes.

## Deployment Gate

Before deployment:

1. Confirm branch/commit.
2. Confirm clean worktree except documented generated reports.
3. Run deployment-readiness gate.
4. Confirm Vault/ExternalSecrets readiness.
5. Confirm Kubernetes manifests.
6. Run `./scripts/deploy.sh`.
7. Capture public smoke evidence.

If any item is missing, do not deploy. Record the blocker.

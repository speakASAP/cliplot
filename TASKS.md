# Tasks

## Active

### TASK-001: Orchestration foundation

Status: done.

Objective: create remote repository foundation, guardrails, design contract,
goal backlog, gate scripts, and guarded deployment scaffold.

Validation:

- `python3 scripts/pre_coding_gate.py --root .`
- `python3 scripts/strict_doc_audit.py --root . --format markdown --fail-on-issues`
- `python3 scripts/deployment_readiness_gate.py --root .`
- `git diff --check`

Commit: `0f360ce docs: initialize cliplot service foundation`.

## Planned

### TASK-002: Storefront application baseline

Blocked until GOAL-02 execution plan is expanded and pre-coding gate passes.

### TASK-003: Shared service identity contract

Define:

- Catalog marketplace key;
- Orders channel/account;
- payment `applicationId`;
- Auth client and callbacks;
- Warehouse token/default warehouse;
- Notification templates;
- Vault path and keys.

### TASK-004: Kubernetes/Vault/RAG deployment

Blocked until app source and service contracts exist.

# GOAL-01: Orchestration Foundation

## Objective

Create the remote Cliplot repository foundation before product code starts.

## Scope

Allowed:

- repository initialization;
- documentation;
- design contract;
- goal-driven process;
- guard scripts;
- guarded deploy scaffold;
- validation reports;
- git commit.

Forbidden:

- product source code;
- production secret values;
- live payment/order/stock mutation;
- Kubernetes deployment of an unimplemented app.

## Acceptance Criteria

- Remote folder exists at `/home/ssf/Documents/Github/cliplot`.
- `git init` has been run.
- Required docs exist.
- Gate scripts exist and run.
- `scripts/deploy.sh` exists and blocks unsafe deployment.
- Design mockup is stored under `docs/design/`.
- Foundation commit exists.

## Intent Compliance

This goal preserves the owner requirement to plan in detail and establish
guardrails before coding.

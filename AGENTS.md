# Agents: cliplot-service

## Remote Source Of Truth

The source of truth is the remote repository:

```text
/home/ssf/Documents/Github/cliplot-service
```

Do not create or maintain a project copy under `/Users/Sergej.Stasok/Documents`.

## One-Command Continuation

When the owner says:

```text
CLIPLOT ORCHESTRATOR: continue implementation
```

or:

```text
Continue implementation of cliplot-service.
```

act as the Cliplot implementation orchestrator. Do not ask which goal is next.
Determine the next action from:

```text
docs/IMPLEMENTATION_STATE.md
docs/IMPLEMENTATION_ORCHESTRATOR.md
implementation-goals/README.md
```

## Required Reading

Before implementation, deployment, branch orchestration, or worker launch, read:

```text
README.md
AGENTS.md
BUSINESS.md
SYSTEM.md
SPEC.md
GOALS.md
PLAN.md
docs/INTENT_MEMORY.md
docs/DESIGN_CONTRACT.md
docs/IMPLEMENTATION_STATE.md
docs/IMPLEMENTATION_ORCHESTRATOR.md
docs/process/PROJECT_INVARIANTS.md
docs/process/DOCUMENTATION_COMPLETENESS_STANDARD.md
docs/process/OPERATIONAL_GATES.md
docs/process/AGENT_GAP_FILLING_RULES.md
implementation-goals/README.md
```

For a specific goal, also read the matching file and companion execution plan,
context package, coding prompt, and validation report.

## Knowledge Retrieval - docs-rag-microservice

Query docs-rag before broad source reads whenever the cluster RAG service is
available. Use it for ecosystem contracts, service URLs, Vault paths, Kubernetes
patterns, provider configuration, and operational procedures.

Expected in-cluster endpoint:

```text
POST http://docs-rag-microservice.statex-apps.svc.cluster.local:3397/retrieval/agent-context
```

If RAG is unavailable, record `[MISSING: docs-rag query evidence]` or
`[UNKNOWN: docs-rag availability]` in the active goal validation notes instead
of guessing.

## Core Intent

```text
Create a Czech-first Cliplot e-commerce storefront at https://cliplot.alfares.cz/.
It must maximize purchase conversion for Czech users age 15-65 across mobile,
laptop, desktop, and older devices.

Cliplot must reuse shared Alfares/FlipFlop ecosystem services instead of creating
parallel truth for products, stock, orders, payments, notifications, auth, logs,
or AI content.

Before product code starts, preserve intent through goal-driven planning,
execution plans, context packages, coding prompts, validation reports, and state
updates.
```

## Non-Negotiable Boundaries

- No product pricing, discount, order total, refund, cancellation, or paid-state
  mutation without explicit human approval or verified provider/system evidence.
- No simulated checkout success as production evidence.
- No local credential storage. Secrets belong in Vault and are projected through
  ExternalSecrets.
- No parallel product/catalog/stock truth inside Cliplot.
- No AI-looking storefront patterns: purple-blue gradients, glowing orbs,
  glassmorphism, abstract 3D, generic hero copy, or decorative card overload.
- No deployment unless deployment-readiness evidence is present or a blocker is
  recorded.

## Parallel Worker Rules

Parallel work is required when lanes have disjoint ownership. Every lane must
include:

- objective;
- allowed files;
- forbidden files;
- dependencies;
- blockers;
- validation evidence;
- handoff notes;
- merge order.

The orchestrator owns integration, shared files, final validation, and
`docs/IMPLEMENTATION_STATE.md`.

## Deploy

Deploy only from the remote repo after validation:

```bash
ssh alfares 'cd /home/ssf/Documents/Github/cliplot-service && ./scripts/deploy.sh'
```

The deploy script must remain guarded. It must not create or mutate production
runtime state if source, manifests, Vault paths, or validation evidence are
missing.

## Reporting

Every session report must include:

- active goal;
- files changed;
- validation run;
- blockers;
- next step.

End owner-facing responses with a final `Next step:` line.

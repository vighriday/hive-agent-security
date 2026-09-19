# HIVE Repository Conventions

**Status:** Foundation contract. This document governs how the implementation is organised once coding begins.

## 1. Ownership boundaries

| Path | Owns | Must not own |
| --- | --- | --- |
| `apps/console/` | Rendering, accessible interaction, replay controls, local visual state | Risk decisions, policy evaluation, containment selection |
| `services/core/` | Domain behaviour, API, replay, evidence, graph projection, detection, planner | Browser rendering, live-target access, secrets in source |
| `contracts/` | Versioned transport/schema contracts and compatible examples | Alternative hidden domain logic |
| `fixtures/` | Fictional deterministic inputs and expected outcomes | Secrets, real telemetry, unreviewed customer data |
| `infra/` | Repeatable local/optional deployment configuration | Product-specific decision logic |

## 2. Module rules

The Python core follows the modular-monolith boundary set in the architecture:

```text
api/            transport only
application/    use-case orchestration
domain/         typed business/security concepts and invariants
ingest/         validation, provenance, redaction, deduplication
ledger/         append/read/replay abstractions
graph/          projections and algorithm adapter boundary
detection/      predicates, factors, explanations
containment/    candidate planning and verification
policy/         manifest loading and later policy adapters
connectors/     simulated/local control adapters
lab/            deterministic experiments and perturbations
immunity/       reviewed pattern lifecycle
```

Dependencies point inward. The domain is pure and must not rely on web, database, graph-engine, or connector frameworks.

## 3. Contract process

1. Define or change a versioned contract under `contracts/`.
2. Add a valid and an invalid fixture/example.
3. Update API/schema tests before consumer work.
4. Generate or hand-maintain the console client from the approved contract only.
5. Record a decision under `docs/adr/` if compatibility, security semantics, or ownership changes.

No console component may introduce an undocumented JSON field, and no endpoint may return an unversioned security conclusion.

## 4. Naming and data rules

- Prefer meaningful nouns: `observation`, `manifest`, `finding`, `evidence`, `plan`, `verification`.
- Use explicit version fields and ISO 8601 UTC timestamps at boundaries.
- Preserve accepted observations; derived state is rebuildable.
- Keep IDs opaque in storage but display human-readable fixture names in the console.
- Label every demonstration surface `SIMULATED ENVIRONMENT · FICTIONAL DATA`.

## 5. Quality gates

Before a milestone can be called complete, run the relevant formatter, linter, type checker, deterministic tests, and a clean local replay. See the test/evidence matrix in [HIVE Build Plan](HIVE_BUILD_PLAN.md).

## 6. Pre-implementation boundary

This foundation establishes configuration and empty module locations only. Security rules, HTTP routes, visual components, scenario material, and executable tests begin with the approved implementation window and must be documented through Git history.

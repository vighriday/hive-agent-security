# HIVE Core

This is the Python 3.12 home for HIVE's API-first modular monolith. The package configuration intentionally declares the agreed local-first stack without adding any runtime behaviour.

## Intended module map

```text
src/hive_core/
  api/            FastAPI transport boundary
  application/    use-case orchestration and transaction boundaries
  domain/         pure models, invariants, and ports
  ingest/         observation validation, provenance, redaction, deduplication
  ledger/         append/read/replay ports and SQLite adapter
  graph/          rebuildable projections and GraphAlgorithmPort
  detection/      typed predicates, factors, and evidence construction
  containment/    candidate evaluation and verification state machine
  policy/         manifest parsing and future OPA adapter
  connectors/     simulated/local control adapters only
  lab/            deterministic experiments and perturbations
  immunity/       reviewed pattern lifecycle
```

The first implementation belongs in `domain/` and tests, not in an HTTP route. Do not create a route, fixture, or detector until the canonical contracts are agreed and the corresponding test exists.

## Planned commands after implementation begins

```powershell
uv sync --project services/core --group dev
uv run --project services/core ruff check .
uv run --project services/core ruff format --check .
uv run --project services/core mypy src tests
uv run --project services/core pytest
```

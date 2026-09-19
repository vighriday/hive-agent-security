# HIVE Technology Stack

**Status:** Deliberate stack decision — planning, not an installation list  
**Companion:** [HIVE Platform Architecture](HIVE_PLATFORM_ARCHITECTURE.md)  
**Cost rule:** no paid service is required to build, demo, or validate HIVE. Cloud services remain optional deployment choices, never dependencies.

---

## 1. The stack decision in one page

HIVE should be built as a **TypeScript/React visual control console over a Python security-analysis core**, with standard telemetry at the boundary and an event-ledger/graph-projection architecture behind it.

| Concern | First-build choice | Full-platform path | Reason |
| --- | --- | --- | --- |
| Console | React + TypeScript + Vite | Same | Best fit for an interactive, information-dense graph console without server-rendering overhead |
| Graph interface | React Flow + ELK.js | Renderer adapter; evaluate Cytoscape.js only for very dense graphs | React-native custom nodes, controls, accessibility surface, deterministic layouts |
| Core API & scenario runtime | Python + FastAPI + Pydantic | Same API contract; split workers only at real load | Fast iteration, typed schemas, excellent research/graph ecosystem, automatic OpenAPI |
| Graph reasoning | NetworkX reference engine | Contracted graph-worker interface; scale after benchmark | Correct, inspectable algorithms are more valuable than premature graph infrastructure |
| Local evidence store | SQLite in WAL mode | PostgreSQL for shared/multi-tenant state | Zero operations locally; mature transactional/RLS path later |
| Streaming | Direct in-process replay | NATS JetStream | A durable replayable stream becomes valuable only once there are independent workers/connectors |
| Expected-state and control policy | Versioned YAML/JSON manifest + explicit Python predicates | OPA/Rego sidecar for enterprise policy distribution | Build the domain language first; integrate a policy engine when policy ownership is distributed |
| Observability ingest | HIVE JSON envelope + OTLP/OpenInference mapper | OpenTelemetry Collector at the boundary | Vendor-neutral and compatible with public tracing ecosystems |
| Production analytics | Not needed | ClickHouse for high-volume event analytics | Keeps the write path simple until telemetry volume proves the need |
| Identity/secrets | Local developer `.env` only, never committed | Keycloak + OpenBao or customer identity/vault | No user/secret complexity in the demo; real control plane needs it |
| Packaging | One local process + optional Docker Compose | Docker Compose → Kubernetes only when justified | Reproducibility now; no cloud bill or orchestration theatre |
| Public demonstration | Static, client-side replay deployed to GitHub Pages | Customer-managed deployment | A public interactive demo can cost ₹0 and require no always-on backend |

**The non-negotiable rule:** the core detection and containment logic must work without an LLM, paid API, internet connection, vector database, graph database, or cloud account.

---

## 2. Why this is the best shape for HIVE

HIVE is not a chat application. Its hard problems are temporal event normalisation, graph-path reasoning, constrained optimisation, simulation/replay, and evidence presentation. The stack is deliberately chosen around those tasks.

- **React/TypeScript** makes the security console, interaction graph, event playback, and stateful control UI reliable and maintainable.
- **Python/FastAPI** keeps schema-heavy APIs, graph algorithms, scenario research, and test fixtures together in a language where those libraries are mature and understandable.
- **An immutable event ledger plus rebuildable graphs** removes dependence on a specialised database before the shape of HIVE's queries is proven.
- **Open standards at the edge** let HIVE receive data from existing agent stacks rather than competing with them for instrumentation.
- **Modular-monolith deployment** provides an actual platform foundation without spending the hackathon building distributed-systems plumbing.

The architecture has contracts where future scale requires them, but it begins with the fewest moving parts that can be tested end-to-end.

---

## 3. Detailed component choices

### 3.1 Web console

| Choice | Use in HIVE | Why chosen | Rejected as primary |
| --- | --- | --- | --- |
| **React + TypeScript + Vite** | The console, replay controls, findings, policy views, and API client | Strong typed UI ecosystem; Vite is lean for a client-rendered app; no SSR/server actions are needed for a security console | Next.js adds server/hosting concepts HIVE does not need; a Python-rendered UI limits the graph UX |
| **React Flow (`@xyflow/react`)** | Interactive graph canvas, custom actor/resource nodes, affected-path highlighting, minimap and controls | It is MIT-licensed, React-native, and already provides pan/zoom/select/custom-node primitives [React Flow](https://reactflow.dev/) | D3 alone is lower-level; Cytoscape.js is excellent for large network visualisation but less naturally component-driven for HIVE's rich node/action panels |
| **ELK.js** | Deterministic layered layout for workflow and evidence paths | Runs layout algorithms in a Web Worker and supports layered, stress, radial and other layouts [ELK.js](https://github.com/kieler/elkjs) | Force-only layouts make a live security explanation jump around and are poor for repeatable video/demo evidence |
| **Tailwind CSS + accessible headless primitives** | Design tokens, dense console layout, dialogs, menus and forms | Fast composition with no runtime design-system lock-in | A component mega-suite increases bundle/override complexity; custom CSS alone is slower to keep consistent |
| **TanStack Query** | Server-state cache, polling/replay status, API error boundaries | Separates API state from visual state and prevents ad-hoc fetch logic | Global state stores are not data-fetching libraries |
| **Zustand** | Small ephemeral UI state: current time window, selected finding, playback speed, filters | Minimal API and avoids propagating transient graph selection through the component tree | Redux Toolkit is excellent, but unnecessary complexity until multiple independent UI domains arise |

**Rendering rule:** the UI never decides risk. It receives graph elements, evidence, explanation, and allowed actions from the core; it may animate or filter them but cannot invent security conclusions.

### 3.2 HIVE Core API and domain model

| Choice | Use in HIVE | Why chosen | Alternative considered |
| --- | --- | --- | --- |
| **Python** | Domain services, scenario runner, algorithms, tests | Best speed/clarity for security research and graph work; accessible for contributors | Go/Rust are strong at high-throughput services but slow the first implementation and do not improve the product thesis initially |
| **FastAPI** | Typed REST API and WebSocket/SSE updates | Pydantic-native schema validation and generated OpenAPI make the external contract inspectable | Flask requires more assembly; Node is useful, but duplicates TypeScript without adding graph-analysis advantages |
| **Pydantic** | Canonical event, manifest, finding, policy and control-command schemas | Rejects malformed input at boundaries and produces a single source of API truth | Untyped dictionaries make a security evidence system brittle |
| **SQLAlchemy + Alembic** | Persistence boundary and migrations when PostgreSQL arrives | Keeps database access portable and schema change auditable | Raw SQL everywhere makes tenant/security review harder; an ORM must not hide performance-critical analytical queries |
| **Server-Sent Events (SSE) initially** | Stream event/replay/finding updates from core to console | One-way server-to-browser update is simpler and resilient for HIVE's initial live-view needs | WebSockets are justified only when collaborative editing/control sessions become real |

Use an **API-first modular monolith** with internal modules—not a collection of untestable scripts:

```text
api/             HTTP/SSE boundary only
domain/          event, manifest, finding, plan, pattern models
ingest/          validation, redaction, dedupe, provenance
ledger/          append/read/replay interfaces
graph/           projection and query interfaces
detection/       predicates, features, scoring
containment/     candidate generation, cost, verification plan
lab/             scenarios, perturbations, experiments
policy/          manifest and future OPA adapter
connectors/      simulated and real control-point adapters
```

### 3.3 Event, graph, and reasoning libraries

| Choice | HIVE role | Decision rationale |
| --- | --- | --- |
| **NetworkX** | Reference graph implementation for typed path reachability, incident subgraphs, and capacity-weighted minimum cuts | Its algorithms are transparent and its documented `minimum_cut` accepts edge capacities [NetworkX](https://networkx.org/documentation/latest/reference/algorithms/generated/networkx.algorithms.flow.minimum_cut.html). Correctness and testability are paramount before scale optimisation. |
| **GraphAlgorithmPort** | Internal interface around reachability, path enumeration, components, centrality, and min-cut | Stops the storage/library choice leaking into detection policy. It makes benchmark-led replacement possible without rewriting HIVE semantics. |
| **NetworKit — evaluation path, not initial dependency** | High-scale structural metrics/clustering if real benchmarks require it | It is an MIT-licensed toolkit designed for networks from thousands to billions of edges [NetworKit](https://github.com/networkit/networkit). Adopt only after it covers the required algorithms and deployability for HIVE's actual workloads. |
| **Deterministic graph layout in browser, not backend** | Visual positions and graph interaction | Layout is presentation; storing it as security state corrupts the separation between evidence and UI. |

Do **not** make a graph database a mandatory part of HIVE v1. A graph database may be valuable for investigator queries later, but it does not itself solve temporal conformance, typed risky-capability predicates, evidence provenance, or constrained containment. The first authoritative storage is the event ledger; graph views are projections.

**Scale gate:** if a representative 95th-percentile incident slice cannot be projected and analysed within the target alert budget after ordinary profiling, benchmark a compiled graph worker through `GraphAlgorithmPort`. Do not replace NetworkX because “enterprise architecture should have a graph database.”

### 3.4 Persistence, replay, and streaming

| Stage | Choice | Why |
| --- | --- | --- |
| Local first build | **SQLite in WAL mode** | Portable single file, zero hosting/operations, concurrent readers with one writer. WAL works well on a single local machine but is not a network-filesystem multi-writer database [SQLite](https://www.sqlite.org/wal.html). |
| Shared/pilot control plane | **PostgreSQL** | Mature relational integrity, transactional state, JSONB, migrations, and row-level tenant isolation. Row security supports default-deny when enabled without an applicable policy [PostgreSQL](https://www.postgresql.org/docs/17/ddl-rowsecurity.html). |
| Independent workers/replay | **NATS JetStream** | Durable event streams, pull consumers, acknowledgement/redelivery, and replay from time/sequence support detection, archive, analytics, and UI consumers without coupling them [NATS](https://github.com/nats-io/nats.docs/blob/master/using-nats/jetstream/develop_jetstream.md). |
| High-volume history/analytics | **ClickHouse** | Add only when event volumes require analytical scans, retention aggregation, and near-real-time investigation queries. It is suited to timestamped event analytics [ClickHouse](https://clickhouse.com/resources/engineering/what-is-real-time-analytics). |
| Large encrypted evidence artefacts | **S3-compatible store selected by the deployment owner** | HIVE stores only explicit, tenant-approved evidence objects. The product owns a `BlobStore` interface, not the object-store choice. |

**Event storage model:** store accepted observation envelopes append-only; create a `derived_findings` table separately; retain a hash chain/reference to the event IDs used by each finding. Never overwrite an event to “fix” a detection result.

### 3.5 Policies, identity, and secrets

| Choice | When | Why |
| --- | --- | --- |
| **HIVE manifests + explicit predicates** | First build and single-tenant pilot | HIVE needs a domain-specific expected-architecture language; writing it explicitly is how we learn the right policy shape. |
| **Open Policy Agent (OPA)** | When policy authorship, review, distribution, or connector enforcement is distributed | OPA separates policy decision-making from enforcement and evaluates structured input with a declarative policy language [OPA](https://www.openpolicyagent.org/docs). HIVE sends it facts; OPA does not replace HIVE's temporal graph engine. |
| **Keycloak or customer OIDC provider** | Multi-user platform | OpenID Connect/OAuth2-compatible sign-in and roles without inventing identity. Keycloak documents the OIDC authorisation-code flow for browser applications [Keycloak](https://www.keycloak.org/docs/latest/server_admin/). |
| **OpenBao or customer vault** | Any real connector that needs a secret | Identity-gated secret management with audit controls [OpenBao](https://openbao.org/docs/what-is-openbao/). HIVE stores references, never plaintext connector credentials. |

### 3.6 Standards and observability

| Choice | Role | Why |
| --- | --- | --- |
| **HIVE Event v1** | Product-native event contract | Contains the security semantics HIVE requires: agent role, registration, zones, data class, action, target and provenance. |
| **OpenTelemetry / OTLP** | Interoperable ingress/egress transport | Semantic conventions exist to standardise common telemetry names across traces, metrics and logs [OpenTelemetry](https://opentelemetry.io/docs/concepts/semantic-conventions/). |
| **OpenInference mapping** | AI/LLM trace adaptation | Adds AI-app span semantics and is compatible with OTel backends [OpenInference](https://github.com/Arize-ai/openinference). |
| **OpenTelemetry Collector** | Production boundary once multiple sources/exporters exist | Vendor-neutral receivers, processors and exporters remove the need for per-service collection plumbing [OTel Collector](https://opentelemetry.io/docs/collector/). |
| **Prometheus + Grafana** | HIVE's own health/latency/error metrics | HIVE must be observable and alert when its own ingest/detection/control chain is degraded. |
| **Tempo/Loki — optional** | Platform traces/logs | Useful for operating HIVE itself; not a substitute for HIVE's evidence graph. Tempo supports open tracing protocols; Loki is designed for cost-efficient log aggregation [Tempo](https://grafana.com/docs/tempo/latest/), [Loki](https://grafana.com/docs/loki/latest/get-started/overview/). |

Phoenix and Langfuse should be treated as **optional telemetry sources or adjacent developer tools**, not dependencies. Phoenix is open source and accepts OpenTelemetry with OpenInference instrumentation [Phoenix](https://arize.com/docs/phoenix/); Langfuse also supports OTel and agent graphs [Langfuse](https://langfuse.com/docs). HIVE consumes useful trace facts without requiring either platform.

---

## 4. The explicit alternatives we are rejecting

| Tempting choice | Why it is not the HIVE default |
| --- | --- |
| Building on one agent framework (LangChain, CrewAI, AutoGen, etc.) | HIVE must observe heterogeneous ecosystems. An orchestration framework creates lock-in and does not solve the cross-framework problem. |
| Using an LLM to classify every event | Cost, latency, privacy, non-determinism and weak explainability are unacceptable in the security-critical path. An LLM can later summarise already-grounded evidence. |
| Neo4j/managed graph database on day one | Operational/cost complexity and schema lock-in before real query patterns are known. A graph store is an optimisation, not HIVE's architecture. |
| Kafka/Flink/Kubernetes on day one | Correct tools at very high scale, but they add infrastructure, cost and failure modes before one end-to-end security path exists. |
| WebSockets everywhere | Most UI traffic is one-way events; SSE is simpler. Use WebSockets only for collaboration/interactive sessions. |
| A commercial LLM observability suite as the platform core | Reduces differentiability, introduces price/availability dependency, and focuses on traces rather than ecosystem security. |
| A dashboard-only frontend with fake backend logic | The containment proof must come from replayable event/graph reasoning, not front-end animation. |
| Local LLM / Ollama as a required dependency | Still adds hardware/download variability and does not strengthen core detection. Keep it optional for offline natural-language explanations after the platform works. |

---

## 5. Zero-cost deployment plan

### Local development and judge fallback — required

```text
Browser console (Vite build)
        │
Local FastAPI process
        │
SQLite + versioned fictional event fixtures
```

This is the canonical fallback. It works on a laptop without keys, paid services, or internet after dependencies are installed.

### Public interactive replay — preferred for a hackathon

Build a **static replay mode** that reads signed/checked-in fictional fixtures in the browser. Host it on GitHub Pages. GitHub states that Pages is a static hosting service and is available for public repositories on GitHub Free [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).

This public build must not claim to be a live SOC or expose a writable control endpoint. It is a safe interactive demonstration of the same event/graph/explanation contract.

### Full local platform compose — later, still no mandatory cloud bill

```text
reverse proxy (optional)
console
api / control plane
detector worker
simulator worker
PostgreSQL
NATS JetStream
OPA
optional OTel Collector + Prometheus/Grafana
```

Docker Compose is appropriate for defining and running this multi-container stack across dev/test/staging environments [Docker Compose](https://docs.docker.com/compose). Kubernetes is a deployment option only after HA, node isolation, or independently scaled workloads require it.

### Cost guardrails

1. Never enter a credit card for an “easy” hosted database or LLM just to make the demo work.
2. Use only fictional fixtures; avoid storage/egress surprises entirely.
3. Put automated budget/usage caps on any future optional free tier.
4. Re-check vendor terms before adoption—free tiers and eligibility change.
5. A public static demo is enough for the event; a live hosted backend is optional.

---

## 6. Quality, testing, and supply-chain stack

| Category | Choice | Standard |
| --- | --- | --- |
| Unit/integration tests | `pytest` | Every detector, path predicate, cost rule, and control state transition gets deterministic fixture tests |
| Property tests | `Hypothesis` | Generate valid/invalid event orders and assert invariants: no unsafe path after verified containment; replay gives the same result |
| API contract tests | OpenAPI schema + generated client checks | Frontend and backend remain compatible without informal JSON drift |
| UI/e2e tests | Playwright | Replay, alert explanation, containment proposal, control simulation, reset and accessibility keyboard path |
| Code quality | Ruff + formatter + type checker | Fast, repeatable local/CI feedback; zero ignored type/security errors in critical modules |
| Dependency security | Dependabot/Renovate + OSV scan | Pinned lockfiles; review every security update; no `latest` runtime dependencies |
| Licence/SBOM | CycloneDX SBOM + licence review in CI | The submission can explain exactly what it contains and avoids accidental commercial/copy-left surprises |
| Threat modelling | Markdown threat model + abuse-case fixture suite | Security claims remain tied to tested attacker/environment assumptions |

The minimum-cut calculation must have **two independent checks** in tests: a known expected cut fixture and a post-intervention reachability assertion. Never trust a nice-looking highlighted edge alone.

---

## 7. Versioning and reproducibility rules

- Pin every library in a lockfile; do not use unbounded version ranges.
- Record the event-schema, manifest, detector, policy, and UI build version in every finding.
- Fixtures are immutable JSON/JSONL; a change creates a new scenario version.
- Use UTC / RFC-3339 timestamps, stable UUIDs, and a receive sequence to handle event reordering.
- Create a software bill of materials for releases.
- Include a one-command local run and a one-command test path in the repository README.
- Release only an event replay whose integrity hash matches the checked-in fixture.

These are not process decoration. Reproducibility is what lets HIVE prove that an alert and a containment decision came from evidence rather than a staged screen.

---

## 8. The implementation order this stack enables

1. Define Pydantic models for the HIVE event, manifest, finding, plan, and pattern.
2. Build deterministic event fixtures and SQLite-backed replay.
3. Implement expected-vs-observed graph projection and a tested typed-path predicate.
4. Implement constrained candidate-cut planning and the simulated control adapter.
5. Expose core results through FastAPI/SSE.
6. Build the React console with React Flow and deterministic ELK layout.
7. Add local-first test automation, SBOM, and accessible error/replay states.
8. Publish static replay mode to GitHub Pages; preserve local FastAPI mode for the full proof.
9. Only then add NATS, PostgreSQL, OTel Collector, OPA, and external adapters when their specific need exists.

---

## 9. Final stack verdict

The best HIVE stack is not the largest cloud-native stack. It is a **standards-compatible, local-first, evidence-first system** with a sophisticated core and deliberately minimal operations:

```text
React / TypeScript / Vite / React Flow / ELK
                ↓
Python / FastAPI / Pydantic / SSE
                ↓
SQLite → PostgreSQL + NATS only when warranted
                ↓
NetworkX reference graph engine behind a replaceable algorithm port
                ↓
HIVE manifests + typed detection + constrained containment
                ↓
OTel / OpenInference adapters; optional OPA, Keycloak, OpenBao
```

It is free to start, realistic to build, credible to explain, and structurally capable of becoming the full platform described in the architecture document.

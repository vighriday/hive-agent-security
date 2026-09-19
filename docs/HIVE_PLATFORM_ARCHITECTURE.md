# HIVE Platform Architecture

**Status:** Reference architecture — planning, not an implementation  
**Scope:** The complete HIVE platform, with a deliberately smaller hackathon slice  
**Principle:** HIVE is a security control plane for agent ecosystems, not an agent framework, LLM firewall, SIEM replacement, or generic observability dashboard.

---

## 1. The architectural decision

HIVE is a **streaming, evidence-first graph security platform**. It ingests trustworthy observations of agent-system activity, compares the observed temporal interaction graph with a versioned expected architecture, detects risky capabilities created by the difference, and proposes constrained containment actions whose effects can be explained and verified.

The platform must always preserve four separations:

1. **Observation is not intent.** A trace proves that an event was reported; it does not prove why an agent acted.
2. **Unexpected is not malicious.** HIVE ranks and explains structural deviation; it never labels an actor evil merely because it is novel.
3. **Detection is not enforcement.** A finding produces a proposed plan. An authorised control point performs a reversible action only after policy and approval checks.
4. **The event ledger is not the graph.** Immutable events are the evidence. Temporal graph projections are rebuildable analytical views.

This gives HIVE a durable purpose beyond agent observability: it turns individually valid actions into a question about **system-level capability composition**.

### Product-surface map

The technical planes below deliberately map to HIVE's public product concepts:

| HIVE product surface | Internal architecture that delivers it |
| --- | --- |
| **Swarm Lab** | Scenario compiler, synthetic actor runtime, perturbation catalogue, experiment ledger, and the same graph/policy/detection services used at runtime |
| **Immune Mesh** | Sensor & Integration, Data, Reasoning, and Control Planes working together to observe, explain, propose, and verify containment |
| **Immunity Memory** | Reviewed pattern registry, incident evidence, policy version history, and shadow-to-active promotion workflow |
| **HIVE Console** | Experience layer that exposes the expected graph, observed graph, evidence, containment alternatives, experiments, and audit record |

The names are product language; the planes are the deployable system design. Keeping both explicit prevents a compelling concept from becoming an ambiguous implementation.

---

## 2. What HIVE receives and what it produces

### Inputs

- **Architecture manifests:** the intended agents, resources, trust zones, allowed relationships, data classifications, and permitted control actions.
- **Runtime observations:** agent lifecycle, tool use, data/store access, message/delegation, discovery, and egress events.
- **Connector capabilities:** which relationship or resource can actually be paused, quarantined, or approval-gated.
- **Policies:** organisational risk tolerance, containment constraints, ownership, approval requirements, and data-retention rules.
- **Swarm Lab experiments:** synthetic topology, perturbations, and scenario results.

### Outputs

- an auditable **finding** with the time-bounded path, evidence events, changed architecture edge, policy basis, and uncertainty;
- a ranked **containment plan** with expected blast radius and an explicit “why this, not that”; 
- a verifiable **control execution record**; and
- a versioned **immunity pattern**—a reviewed behavioural invariant that can be evaluated against future graphs.

HIVE does not need access to prompt text, chain-of-thought, production secrets, or real customer data to deliver this value. Metadata and content fingerprints are the default; content capture is opt-in and separately governed.

---

## 3. Complete reference architecture

```text
  ┌────────────────────── Agent ecosystem / customer environment ──────────────────────┐
  │  Agents · orchestration · MCP clients/servers · tools · stores · APIs · humans     │
  └────────────────────────────────────────────────────────────────────────────────────┘
             │ signed observations / OTLP / approved connector events
             ▼
  ┌──────────────────────────── SENSOR & INTEGRATION PLANE ────────────────────────────┐
  │ SDK adapters │ OTLP mapper │ framework adapters │ control-point adapters            │
  └────────────────────────────────────────────────────────────────────────────────────┘
             ▼
  ┌────────────────────────────── HIVE DATA PLANE ─────────────────────────────────────┐
  │ Ingest Gateway → validate/redact/dedupe → immutable event ledger → durable stream   │
  │                         │                                │                          │
  │                    asset/identity registry          raw evidence archive             │
  └─────────────────────────┼───────────────────────────────┼──────────────────────────┘
                            ▼                               ▼
  ┌──────────────────────────── HIVE REASONING PLANE ──────────────────────────────────┐
  │ Architecture Registry → normaliser/correlator → temporal graph projections          │
  │                                  ↓                                                   │
  │ Policy & Invariant Engine → detection workers → evidence & risk synthesiser         │
  │                                  ↓                                                   │
  │ Counterfactual / containment planner → approval workflow                             │
  └─────────────────────────┼──────────────────────────────────────────────────────────┘
                            ▼
  ┌──────────────────────────── CONTROL & KNOWLEDGE PLANE ─────────────────────────────┐
  │ Connector enforcer → verification → incident ledger → immunity-pattern registry     │
  │ Swarm Lab: scenario compiler → simulator → perturbation runner → experiment ledger  │
  └─────────────────────────┼──────────────────────────────────────────────────────────┘
                            ▼
  ┌──────────────────────────── EXPERIENCE & PLATFORM PLANE ───────────────────────────┐
  │ Security console · graph explorer · evidence view · policy studio · APIs · audit     │
  │ Identity/RBAC · tenant isolation · secrets · observability · backup/retention        │
  └────────────────────────────────────────────────────────────────────────────────────┘
```

The arrows are one-way by default. A customer system never grants HIVE broad, ambient authority. HIVE can only execute a previously registered, narrowly scoped control capability.

---

## 4. The planes and their components

### 4.1 Sensor & Integration Plane — capture meaning, not just logs

**Purpose:** produce canonical, attributable observations from heterogeneous agents and tools.

| Component | Responsibility | Why it exists |
| --- | --- | --- |
| HIVE SDK / adapter contract | Emits application-level observations for agent, tool, delegation, shared-state, discovery, and egress actions | Kernel/network telemetry cannot infer agent role, workflow, delegation, or data sensitivity reliably. |
| OpenTelemetry mapper | Accepts traces and maps spans/events to HIVE observations | Preserves compatibility with common instrumentation while avoiding vendor lock-in. |
| Framework adapters | Optional adapters for agent frameworks and MCP-aware applications | Reduces adoption work; adapters must never become HIVE's source of truth. |
| Control-point adapters | Implements only declared actions: edge gate, shared-state quarantine, tool pause, approval gate | HIVE recommends controls; the customer-side adapter enforces the selected, least-privileged action. |

OpenTelemetry supplies common semantic names across telemetry signals, while OpenInference adds AI-application span kinds such as `AGENT` and `TOOL` [OpenTelemetry](https://opentelemetry.io/docs/concepts/semantic-conventions/), [OpenInference](https://github.com/Arize-ai/openinference/blob/main/spec/semantic_conventions.md). They are transport and trace standards, not a full inter-agent security model. HIVE therefore carries its own strict, versioned envelope alongside any mapped span.

**Trust rule:** application-supplied semantic fields are useful but not incontrovertible. Every field carries `source`, `confidence`, and `attestation` metadata. Connector-enforced facts outrank SDK-declared context; neither silently overwrites the other.

### 4.2 Data Plane — immutable evidence before inference

1. **Ingest Gateway** authenticates the tenant and source, validates schema/version, rate-limits, deduplicates by `event_id`, bounds payload size, strips disallowed content, and assigns a receive timestamp.
2. **Privacy filter** tokenises identifiers and stores content fingerprints or typed summaries by default. Raw text/bodies are never required for graph reasoning.
3. **Immutable event ledger** persists the accepted original envelope plus its integrity hash. Corrections are new events; prior evidence is never edited.
4. **Durable event stream** fans the same evidence to normalisation, real-time detection, archive, analytics, and UI updates. A durable stream makes historical replay and reproducible incident reconstruction possible.
5. **Asset/identity registry** resolves stable IDs for agent instances, logical roles, tools, resources, owners, zones, and connector capabilities.

For the full platform, NATS JetStream is the preferred open event backbone because retained streams and consumers can replay from a sequence/time and provide at-least-once delivery; consumers track acknowledgements and redeliver unacknowledged work [NATS JetStream](https://github.com/nats-io/nats.docs/blob/master/nats-concepts/jetstream/consumers.md). It is not needed in the first local build, where a database-backed replay queue is clearer.

### 4.3 Architecture Registry — make “unexpected” precise

The registry stores signed, versioned **expected interaction manifests**. Each manifest defines:

- logical actors and their roles;
- resources, data classes, ownership, trust zones, and external destinations;
- allowed actions/relationships, conditions, and expiry;
- prohibited paths and system invariants;
- normal workflows and approved delegation topology;
- removable control points and their business cost; and
- manifest author, reviewer, validity window, and change history.

An expected architecture is not a list of every possible request. It is a constrained graph plus behavioural invariants. Example invariant:

```text
No path may connect `customer-restricted` to `external-egress`
through an unregistered shared-state resource, unless an approved export workflow and approval token are present.
```

This is the heart of HIVE. Without a declared expected state, anomaly detection degenerates into “anything new is suspicious,” which is operationally useless.

#### Expected-architecture onboarding lifecycle

HIVE must answer a practical question that every serious adopter will ask: **where does the expected architecture come from?** It must not pretend the answer is “an LLM guessed it from logs.” The platform uses a reviewable lifecycle:

```text
Inventory/import → draft manifest → owner classification → shadow observation
      → review/approve → active architecture → versioned change control
```

1. **Inventory/import:** import known agents, tools, MCP servers, workflows, and data resources from a customer registry, deployment configuration, OpenTelemetry resource attributes, or a small explicit template.
2. **Draft:** HIVE may suggest relationships observed in a bounded historical window, but all inferred relationships are labelled `unknown`; no inference becomes policy automatically.
3. **Owner classification:** an accountable platform/security owner classifies trust zones, data classes, approved exports, and candidate control points.
4. **Shadow observation:** HIVE compares observed behaviour with the draft without blocking. It records legitimate exceptions and exposes uncertain/missing telemetry.
5. **Approval:** a reviewer activates a manifest version only after validating allowed paths and prohibited invariants.
6. **Change control:** new agents, tools, resources, and workflows create a new manifest version with an explicit effective time; old findings always retain the version that governed them.

This onboarding cost is intentional. It converts a vague baseline into an auditable security assertion and prevents HIVE from learning a dangerous behaviour as “normal” merely because it happened often.

### 4.4 Temporal Graph Service — the system’s living topology

The graph service creates queryable projections from immutable events:

- **nodes:** logical agents, runtime instances, humans, tools, MCP servers, stores, data sets, identities, workflows, destinations, and control points;
- **edges:** read, write, call, message, delegate, discover, authenticate, transform, send, approve, block; and
- **edge properties:** event interval, action, data class, actor/resource zone, expected status, trust, workflow, source confidence, and evidence IDs.

It maintains several time scopes rather than one overwritten graph:

| Projection | Use |
| --- | --- |
| Expected graph | What the approved architecture permits at a named version |
| Hot window | Current events, used for low-latency detection |
| Incident slice | A frozen, evidence-linked subgraph explaining one finding |
| Historical window | A reproducible point-in-time graph for audit and baselining |
| Capability graph | A typed projection of what paths can compose data, authority, and egress |

The graph is derived state. It can always be rebuilt from the event ledger plus the relevant manifest, which prevents a corrupted projection from becoming the only record of truth.

### 4.5 Reasoning Plane — detect dangerous states, not “bad agents”

The reasoning plane has four independent stages so its conclusions can be inspected and tested.

1. **Conformance:** compare each observed relationship with the active expected architecture and identify novel, expired, unregistered, or cross-zone edges.
2. **Capability composition:** evaluate typed path predicates. Example: sensitive source → new/untrusted bridge → actor/resource with egress capability → external destination.
3. **Population change:** calculate topology and behaviour signals in explicit time windows: new connectivity, cluster growth, fan-in/fan-out, delegation depth, objective/destination convergence, resource discovery, and velocity.
4. **Evidence synthesis:** create a finding only when a defined predicate and its evidence are satisfied; rank it with transparent contributors.

The *Emergence Score* is a prioritisation measure, not an oracle:

```text
E = wN·novelty + wZ·cross_zone + wP·dangerous_path
  + wC·coordination_change + wD·delegation_change
  + wR·resource_discovery + wV·velocity - wA·approved_context
```

Every factor is bounded, versioned, and shown in the alert. A high score without an unsafe-path or policy predicate becomes an **observation for review**, not automatic containment.

### 4.6 Containment Planner — constrained counterfactual security

The planner takes a finding's incident slice and asks:

> Which authorised, reversible intervention breaks all qualifying unsafe source-to-sink paths for the lowest business disruption?

It creates a capacity graph. Candidate removal cost is high for expected, revenue-critical edges and low for novel, unregistered, or pre-authorised controllable edges. Non-removable nodes/edges receive infinite cost. The planner then computes a weighted source-to-sink cut and rejects any plan that violates guardrails.

```text
candidate plan = min business_cost(cut)
subject to: every qualifying risky path is severed
            protected workflow invariants still pass
            all actions are registered and authorised
            no non-reversible / forbidden control is selected
```

The max-flow/min-cut relationship supports this form of constrained cut calculation; NetworkX exposes a minimum source-target cut over capacity-weighted edges [NetworkX](https://networkx.org/documentation/latest/reference/algorithms/generated/networkx.algorithms.flow.minimum_cut.html). The mathematics does **not** make the business cost objectively true—those costs are policy inputs, displayed to the user, and subject to approval.

The planner must return at least two alternatives when possible: the recommended least-disruptive plan and a safer-but-broader option. It must also disclose when no authorised intervention can stop the path.

### 4.7 Control Plane — operate safely, or do not operate

Control execution follows a strict state machine:

```text
DETECTED → PROPOSED → SIMULATED → APPROVED → EXECUTING → VERIFIED
                       │                               │
                       └──────── REJECTED / EXPIRED ───┴── FAILED / ROLLED_BACK
```

- **Proposed:** a plan is only advisory.
- **Simulated:** the planner evaluates blast radius against the expected graph and test workflow invariants.
- **Approved:** a named user or an explicit pre-authorised low-risk policy approves it.
- **Executing:** a customer-side control adapter applies a narrow, idempotent command with an expiry/rollback token.
- **Verified:** a fresh event graph confirms the unsafe path is broken and required legitimate paths remain.

HIVE never holds general-purpose credentials for a customer system. It requests narrowly scoped, short-lived capability tokens from the connector at execution time. Secret references are resolved customer-side; secrets are neither sent to agents nor placed in telemetry. OpenBao is a viable later self-hosted secret system because it provides identity-gated secret storage, access control, encryption services, and auditability [OpenBao](https://openbao.org/docs/what-is-openbao/).

### 4.8 Immunity Memory — reviewed patterns, never magic signatures

An immunity pattern is a versioned graph/invariant template with:

- preconditions and abstract topology;
- policy/risk rationale;
- evidence requirements and expected false-positive conditions;
- approved containment classes;
- author/reviewer, lifecycle state, and test fixtures; and
- observed outcomes, including reversals and false positives.

Patterns enter **draft**, then **shadow** (detect only), then **active** only after review. This prevents one noisy incident from silently becoming an enterprise-wide blocking rule.

### 4.9 Swarm Lab — pre-deployment resilience engineering

Swarm Lab reuses the exact manifest, canonical event schema, graph service, detectors, and policy engine used by runtime HIVE. Only the event source changes.

Its components are:

- **Scenario Compiler:** turns an intended architecture and test goals into a deterministic world model.
- **Synthetic actor runtime:** state machines and optional LLM-backed agents, with every action sandboxed and simulated.
- **Perturbation catalogue:** new shared state, denied tools, stale memory, malformed/misleading tool result, new channel, duplicate worker, failed dependency, and unexpected delegation.
- **Experiment orchestrator:** creates reproducible seeds, schedules perturbations, records config/code/manifest versions, and gathers outcomes.
- **Property evaluator:** tests invariants such as “no restricted-to-egress path without export approval” rather than merely scoring a model answer.

The first serious implementation should be deterministic. An LLM-backed swarm is useful for exploratory research later, but it is not a reliable proof mechanism and must never gain real credentials or network reachability.

---

## 5. Canonical HIVE observation envelope

```json
{
  "schema_version": "hive.event.v1",
  "event_id": "uuid",
  "occurred_at": "RFC-3339 timestamp",
  "received_at": "RFC-3339 timestamp",
  "tenant_id": "stable tenant id",
  "environment": "lab | dev | staging | prod",
  "trace": { "trace_id": "optional", "span_id": "optional", "parent_span_id": "optional" },
  "actor": { "id": "agent-instance", "logical_role": "support", "type": "agent" },
  "action": "read | write | call | message | delegate | discover | send | block",
  "target": { "id": "resource id", "type": "store | tool | api | agent | destination" },
  "context": {
    "workflow_id": "optional", "data_class": "public | internal | restricted",
    "source_zone": "support", "target_zone": "shared-state",
    "registration": "expected | unregistered | unknown"
  },
  "evidence": { "content_fingerprint": "optional", "result": "success | denied | blocked" },
  "provenance": { "source": "sdk | connector | otel-map", "confidence": 0.0, "attested": false }
}
```

The schema intentionally does not include raw prompts, responses, credentials, or customer records. Content capture, if justified, is an encrypted add-on governed by tenant policy and retention schedules.

---

## 6. Three critical runtime flows

### A. Normal observation

1. A connector or SDK emits an action with a stable actor, target, correlation, and source attribution.
2. Ingest validates and commits it to the ledger before publishing it.
3. Normalisation resolves logical identity, zone, manifest version, and relationship status.
4. The graph projection and detectors process the event idempotently.
5. The console receives a view update; no alert occurs if the action satisfies policy and creates no concerning composition.

### B. Finding to safe containment

1. A new relationship forms a qualifying path from a restricted source to external egress through unregistered shared state.
2. The incident builder freezes the relevant time window, evidence IDs, expected-graph version, and graph slice.
3. The planner evaluates eligible cut sets and workflow impact. It does not invent an action it cannot enforce.
4. The user sees the exact changed edge, path, risk factors, assumptions, alternatives, and expected impact.
5. After explicit approval (or a narrowly defined policy), the control adapter applies an expiring control.
6. HIVE observes the result and marks the plan verified, failed, or rolled back. An immunity pattern may be proposed for review.

### C. Swarm Lab experiment

1. An architecture manifest plus test campaign are version-pinned.
2. The simulator generates synthetic events; the perturbation runner introduces one controlled change.
3. The same graph/detection/planning services run in an isolated tenant/environment.
4. Experiment results record the seed, event ledger, findings, interventions, and invariant outcomes.
5. A reviewed pattern can be promoted to shadow runtime detection.

---

## 7. Security, privacy, and tenancy by design

| Concern | Architectural control |
| --- | --- |
| False or forged telemetry | Source authentication, tenant-bound keys, event integrity hash, provenance/confidence, monotonic receive sequence, and connector attestation where available |
| Telemetry exposure | Metadata-first schema; field allowlists; tokenisation; encryption in transit/at rest; retention and deletion policies |
| Cross-tenant leakage | `tenant_id` required everywhere; database row-level security; tenant-scoped stream subjects, encryption keys, and object prefixes |
| Over-broad containment | Registered control capabilities only; least-privilege actions; simulation, approval, expiry, rollback, verification |
| Policy tampering | Versioned, signed manifests/bundles; role separation between author, reviewer, approver, and executor |
| Tool/MCP credentials | Customer-side secret resolution and short-lived scoped tokens; redact headers/arguments; never log secrets |
| HIVE compromise | Isolate control adapters, deny outbound-by-default, mTLS/service identity, append-only audit export, backups, and break-glass controls |

PostgreSQL row-level security can enforce per-tenant row visibility and has default-deny behaviour when enabled without an applicable policy [PostgreSQL](https://www.postgresql.org/docs/17/ddl-rowsecurity.html). It is a defence in depth layer, not a replacement for correctly scoped API queries.

For MCP, HIVE observes or gates registered interactions; it does not replace MCP's transport authorization. The current MCP authorization specification is scoped to transport-level authorization and specifies OAuth 2.1 measures such as resource/audience validation [MCP specification](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization). HIVE reasons about the cross-system behaviour that remains after individually valid authorisation decisions.

---

## 8. Threat model and explicit detection boundaries

HIVE protects against unsafe **observed system states**; it does not claim to stop every attack on an agent system. The threat model must be visible to adopters and judges.

| Threat / failure mode | What HIVE can observe or contain | Required evidence | What HIVE cannot honestly claim |
| --- | --- | --- | --- |
| Unregistered shared-state coordination | New bridge resource, new cross-agent relationships, rapid cluster/path formation | Application or connector events identifying resource, actor, action, and registration state | That every shared state object is automatically discovered without instrumentation |
| Privilege composition / unintended data egress | Typed path from classified source through a bridge to external egress | Data classification, graph path, egress event, active manifest | That the payload actually contained every sensitive field unless content inspection is separately enabled |
| Delegation cascade | Unexpected depth, fan-out, role/zone expansion, newly reachable resource | Parent/child delegation and workflow correlation | Intent, planning quality, or all possible future delegated actions |
| Telemetry tampering or loss | Source identity, integrity/provenance gaps, sequence/lag/coverage health | Signed/attested connector facts where available; ingest metrics | That application-supplied fields are independently true in the absence of attestation |
| Policy drift / unreviewed change | Difference between active manifest and observed/new relationships | Versioned manifest, change record, owner/reviewer identity | That a manifest remains correct if the customer does not update it |
| Malicious or accidental external tool use | Registered egress/tool edge and eligible control point | Tool/connector event plus a control capability | Safe action where HIVE has no authorised enforcement point |

**Out of scope by design:** detecting hidden activity with no telemetry, decoding encrypted/obfuscated content without tenant-authorised inspection, proving human or model intent, replacing endpoint/network security, or operating real destructive controls. These limitations make HIVE safer and more credible, not less ambitious.

---

## 9. Relationship to existing public work

HIVE must be technically honest. Several mature open-source tools already solve valuable adjacent problems:

| Existing capability | Representative public work | What it does well | Why HIVE does not duplicate it |
| --- | --- | --- |
| LLM/agent tracing, evaluation, debugging | [Phoenix](https://arize.com/docs/phoenix/), [Langfuse](https://langfuse.com/docs) | Captures model/tool traces and helps analyse individual runs | HIVE can ingest their telemetry; its core object is a versioned ecosystem graph and system-level risky path, not prompt/debug analytics |
| Agent execution graphs and telemetry dashboards | [AgentLens](https://github.com/Nitin-100/agentlens) | Framework-wide traces, DAGs, cost and prompt visibility | A DAG visualisation is not an expected-vs-observed architecture, evidence-led capability analysis, or constrained containment planner |
| Provenance and security evidence graphs | [AgentProvenance](https://github.com/ByteYellow/AgentProvenance) | Deep runtime and causal evidence for sandboxed agents | HIVE is complementary; it focuses on inter-agent/resource population topology and customer-approved control actions |
| Point-in-time policy decisions | [OPA](https://www.openpolicyagent.org/docs) | Declarative policy-as-code and decoupled evaluation | HIVE should integrate OPA for policy decisions; HIVE adds temporal/cross-actor graph reasoning and counterfactual containment |
| MCP authorization | [MCP Authorization](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization) | Protocol-bound authentication and authorization | HIVE does not claim to replace it; it detects risky compositions of legitimate channels |

OWASP's 2026 Agentic Applications Top 10 identifies agent-specific security risks, and its related guidance explicitly includes inter-agent communication and memory configuration in pre-deployment assessment [OWASP](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/), [OWASP playbook](https://github.com/OWASP/secure-agent-playbook/blob/main/plugins/ai-security-skills/plays/agentic-ai-risk-assess.md). HIVE is a proposed implementation direction for that gap, not a claim that no adjacent work exists.

**HIVE's defensible differentiation is the combination of:**

1. an explicit, reviewable expected interaction architecture;
2. temporal detection of unplanned population-level capability composition;
3. evidence-linked, explainable risky paths;
4. policy-constrained, least-disruptive counterfactual containment; and
5. a reviewed feedback loop from Swarm Lab to runtime immunity.

---

## 10. Scaling without premature complexity

| Maturity | Architecture shape | What changes |
| --- | --- | --- |
| Local / hackathon | Modular monolith, synthetic events, embedded persistence, in-process graph | Proves semantics and UX at zero cloud cost |
| Single-tenant pilot | Containerised services, PostgreSQL, durable stream, persistent graph projections, connector sandbox | Adds durability, replay, policy review, and operational controls |
| Multi-tenant platform | Separately scalable ingestion, stream processors, analytics, graph workers, object archive, identity and control planes | Adds tenant isolation, quotas, HA, retention, and formal adapter contracts |
| High-volume enterprise | Partitioned event stream, analytical store, distributed stateful processing, workload isolation | Adds scale only after profiling real event/cardinality patterns |

At high volume, an event-time stateful stream processor becomes justified because it can retain state across events and scale partitioned stream computations [Apache Flink](https://flink.apache.org/what-is-flink/flink-architecture/). It is intentionally **not** in the first build. The design keeps it replaceable behind the event and graph interfaces.

---

## 11. Operational reliability, time, and recovery semantics

HIVE is a security system; an unexplained platform outage must not itself become a security event or a business outage.

### Time and delivery

- `occurred_at` is producer-reported time; `received_at` and the ledger sequence are HIVE's authoritative ingestion order.
- Every consumer is idempotent on `event_id`. At-least-once delivery may duplicate an event; it may never duplicate a graph edge or a control execution.
- Detection runs on event-time windows with a bounded lateness allowance. A late event may update a finding's evidence and score, but it cannot erase the original decision record.
- An incident slice pins its event sequence range, manifest version, detector version, and policy version. Replaying those inputs must reproduce the same result.

### Availability and safe failure

- Observation loss is visible: connector health, ingest lag, queue depth, detector lag, and control-adapter health are first-class platform signals.
- A HIVE outage does **not** silently grant new authority. Control adapters must either retain their last explicit, expiring policy or fail according to the resource owner's configured safe mode.
- The default for an observation-only deployment is **fail open with an explicit visibility gap**, because HIVE must not accidentally halt customer workflows it does not control.
- A registered high-risk control gate may be configured **fail closed**, but only by its owner, with a documented impact and an independently tested recovery path.
- Control commands are idempotent, time-bounded, auditable, and have a defined rollback/reconciliation procedure.

### Data lifecycle and recovery

- Retention is tenant- and evidence-class-specific; raw content, if enabled, expires sooner than derived metadata unless an approved legal hold applies.
- Backups include the event ledger, manifest/policy versions, finding/control records, and pattern registry. Test restore/replay, not just backup creation.
- Exported incident evidence is signed or hash-verifiable and contains only the minimum permitted data.
- Disaster recovery restores the ledger first, then rebuilds graph projections; projections are never restored as an unaudited replacement for evidence.

---

## 12. Architecture decisions that must not be compromised

1. **No opaque risk model in the critical path.** Rules, graph predicates, and cost inputs must be inspectable. ML/LLM components may enrich explanations only with citation to evidence.
2. **No raw agent content by default.** HIVE is a security product; becoming a data-exfiltration system would defeat it.
3. **No direct universal kill switch.** Containment must be registered, constrained, reversible where possible, and verified.
4. **No graph database as the sole source of truth.** Keep the immutable event ledger and versioned manifests independent.
5. **No framework lock-in.** Ingest HIVE observations directly and map OpenTelemetry/OpenInference when available.
6. **No automatic promotion of a learned pattern to blocking.** Immunity requires review and shadow validation.
7. **No microservice theatre.** Services split only at actual scaling, trust, or deployment boundaries; contracts split first.

---

## 13. Full platform versus hackathon slice

The full design is intentionally larger than the hackathon build. The small slice is not a different product; it is the same contracts with local implementations:

| Full component | First implementation slice |
| --- | --- |
| Integration adapters | Deterministic synthetic event emitter |
| Stream + immutable ledger | SQLite/JSON event replay with hashes |
| Architecture Registry | One versioned manifest fixture |
| Temporal Graph Service | One in-memory time-window projection |
| Detection library | One risky-capability predicate plus transparent score |
| Planner | One weighted candidate-cut calculation, simulation only |
| Control adapters | Simulation gate with verification events |
| Swarm Lab | Deterministic scenario runner, not free-running LLM agents |
| Pattern registry | Local reviewed-style incident/pattern record |

This preserves technical integrity. A judge sees a coherent operating model, while no feature is misrepresented as a production integration.

---

## 14. Architecture success criteria

The architecture is successful when HIVE can answer every question below from evidence, not persuasion:

1. What changed, at what time, and under which expected-architecture version?
2. Which evidence events establish the agent/resource relationships?
3. What system-level capability did the observed path compose?
4. Which policy or invariant is implicated, and what uncertainty remains?
5. Which containment options are actually enforceable and what work would each disrupt?
6. Who approved an action, what happened, and did the expected result occur?
7. Can the entire finding and decision be reproduced offline from the event ledger and versions?

If HIVE cannot answer those questions, it is a visually attractive anomaly dashboard—not the security platform it is intended to become.

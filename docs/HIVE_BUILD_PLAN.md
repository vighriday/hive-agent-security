# HIVE Build Plan & Implementor Runbook

**Version:** 1.0 — 18 September 2026  
**Authoritative product references:** [Platform Architecture](HIVE_PLATFORM_ARCHITECTURE.md) · [Technology Stack](HIVE_TECHNOLOGY_STACK.md) · [MVP Contract](HIVE_MVP_CONTRACT.md)  
**Purpose:** Let a capable implementor begin at the official start and ship a coherent, safe, demonstrable HIVE system inside the hackathon window.

> This is a build runbook, not the final presentation script. It specifies what to build, in what order, how to verify it, what to cut when time is short, and what must be submitted. The HIVE platform vision remains broader than this build; every item here is a real vertical slice of that architecture rather than a fake mock-up.

---

## 0. The clock, rules, and non-negotiables

### Time truth

- Today is **18 September 2026**.
- The event runs **19–20 September 2026**. The public page lists a Sep 20 submission deadline but not an exact closing time in the material available here. [Devpost](https://tln-cybersecurity-challenge.devpost.com/)
- The organizer discussion screenshot says the official start is **19 September, 10:00 a.m. EDT**. That is **7:30 p.m. IST** on 19 September.
- Let `T0` mean the actual official start shown in Devpost. At `T0`, immediately verify the exact submission timestamp and write it in the project README and issue tracker.
- Let `TS` mean that exact submission deadline. **The project must be submission-ready by `TS − 6 hours`; the last six hours are safety buffer, video, upload, and recovery time.**

### Rules that affect engineering

The project must be created primarily during the hackathon; it must be meaningfully cybersecurity-related, defensive, non-malicious, legally usable, and disclose significant AI/external-tool use. [Official rules](https://tln-cybersecurity-challenge.devpost.com/rules)

Therefore:

- Before `T0`: planning, research, reading, generic environment preparation, account access, and this runbook are allowed planning work. Do **not** create HIVE-specific source, UI, test, fixture, deployment artifact, or polished demo asset unless the organizer explicitly confirms it is allowed.
- At/after `T0`: create the repository, commits, code, fixtures, UI, video assets, and submission materials. Preserve timestamps and commit history.
- Use **only fictional data and simulated endpoints**. Do not scan, probe, connect to, disrupt, or attempt access to external systems.
- Never include malware, credential theft, real secrets, customer data, or real egress destinations.

### Build invariants

1. HIVE must work locally without paid APIs, an LLM, or internet access after dependencies are installed.
2. Every visible finding must have deterministic, inspectable evidence events.
3. The core claim is structural: HIVE detects a **risky emergent capability path**, not “a malicious agent.”
4. A containment action is simulated unless a safe, explicitly authorised, local control adapter exists.
5. The system must distinguish `expected`, `unregistered`, and `unknown` relationships.
6. The project must still run if the public deployment fails; local replay is the canonical fallback.

---

## 1. Definition of done: the product slices

Use these scope levels rigorously. Complete one level, commit it, test it, and only then start the next.

| Level | Name | Required result | Do not proceed without |
| --- | --- | --- | --- |
| **P0** | Proof of HIVE | A deterministic replay produces an evidence-backed finding; applying simulated containment breaks the unsafe path and preserves a normal path | Automated tests for detection and post-control reachability |
| **P1** | Usable HIVE Console | A person can load/reset/replay the scenario, inspect expected vs observed topology, read an explanation, and trigger simulated containment | P0 is green and UI uses core API/state, not hard-coded alert text |
| **P2** | Platform breadth | Architecture manifest editor/viewer, immunity record, second deterministic scenario, event timeline, scenario selector | P1 is reliable and a first-time user can operate it unaided |
| **P3** | Deployment polish | Static interactive replay, local full mode, clean README, screenshots, Devpost copy, video and disclosure | P1 is frozen; no feature work in the submission buffer |

### P0: non-negotiable acceptance test

Given an approved architecture manifest and fictional event fixture:

1. the normal workflow creates no critical finding;
2. a newly observed unregistered shared-state route produces a path from `restricted` data to `external-egress`;
3. HIVE identifies the exact evidence events and highlights the path;
4. HIVE proposes only registered, simulated actions;
5. applying the recommended action breaks all qualifying unsafe paths;
6. the expected internal workflow still has a valid path; and
7. replaying the same fixture produces the same finding and plan.

If P0 is not working, do not build a richer dashboard, use an LLM, add a second scenario, or work on animation.

### Platform claim at each level

| P0/P1 can truthfully say | P2 can additionally say | Do not say |
| --- | --- | --- |
| “HIVE demonstrates evidence-based detection and containment of a simulated system-level capability composition.” | “HIVE demonstrates the lifecycle of expected architecture, runtime detection, containment, and a reviewed-style immunity record.” | “HIVE detects all emergent behaviour,” “proves intent,” “is deployed in production,” or “automatically secures arbitrary agent systems.” |

---

## 2. The only required scenario: a deterministic capability-composition test

The final narrative may change, but the implementation needs a single, high-value canonical test. Build this one first.

### Expected architecture

```text
Support Agent  ──read──> Fictional CRM (restricted)
Support Agent  ──write─> Approved Ticket Store
Analytics Agent ──read─> Approved Ticket Store
Analytics Agent ──write─> Internal Report Store
Reporting Agent ──read─> Internal Report Store
```

There is no approved relationship between the restricted-data path and an external destination.

### Observed incident sequence

```text
Support Agent ──write──> Unregistered Shared Scratchpad
Reporting Agent ──read──> Unregistered Shared Scratchpad
Reporting Agent ──send──> Simulated External Webhook
```

The resulting typed path is:

```text
Fictional CRM (restricted)
  → Support Agent
  → Unregistered Shared Scratchpad
  → Reporting Agent
  → Simulated External Webhook (external-egress)
```

### The only containment action required for P0

`BLOCK_EDGE: Support Agent --write--> Unregistered Shared Scratchpad`

It is pre-registered in the local simulated control adapter. It must:

- remove/deny that observed relationship;
- append a `block` control event, never mutate prior evidence;
- rebuild or update the graph;
- prove that the restricted-to-egress path no longer exists; and
- prove that `Support → Approved Ticket Store → Analytics → Internal Report Store → Reporting` still exists.

### Fixture timeline

Create the fixture after `T0` as JSONL/JSON. Use stable UUIDs and UTC timestamps. A minimal sequence:

| Sequence | Event | Expected result |
| --- | --- | --- |
| 01–06 | Agent/resource registration and normal allowed reads/writes | Graph baseline; no finding |
| 07 | Support reads Fictional CRM | Allowed sensitive-data source evidence |
| 08 | Support writes Approved Ticket Store | Normal workflow remains valid |
| 09 | Support discovers/writes unregistered Scratchpad | Novel bridge signal; observation may be low/medium severity |
| 10 | Reporting reads Scratchpad | Cross-domain composition strengthens |
| 11 | Reporting sends to simulated External Webhook | Qualifying restricted-to-egress path; create finding |
| 12 | HIVE applies simulated block action | Path must be absent |
| 13 | Support writes Ticket Store and Analytics reads it | Legitimate workflow verification |

Do not model internal LLM reasoning or prompt content. The graph only needs action metadata, source/target class, workflow, zone, registration state, and evidence IDs.

---

## 3. Repository contract: create this at `T0`

Create the code repository only when the event starts. Keep planning docs under `docs/`; all implementation belongs in the following structure.

```text
HIVE_TLNHackathon/
├─ docs/                         # Planning and submission documents
├─ apps/
│  └─ console/                   # React + TypeScript + Vite application
├─ services/
│  └─ core/                      # FastAPI application
│     ├─ app/
│     │  ├─ api/                 # routes, SSE, request/response DTOs
│     │  ├─ domain/              # Pydantic entities and enums only
│     │  ├─ ingest/              # validate, redact, dedupe, normalise
│     │  ├─ ledger/              # append/read/replay repository
│     │  ├─ graph/               # projections and graph queries
│     │  ├─ detection/           # predicates, evidence, scoring
│     │  ├─ containment/         # candidates, plan, simulated control
│     │  ├─ lab/                 # scenarios and replay orchestration
│     │  └─ main.py
│     └─ tests/
├─ fixtures/
│  ├─ manifests/
│  └─ scenarios/
├─ scripts/                      # safe developer helpers only
├─ .github/workflows/            # lint/test/build after P0 exists
├─ README.md
├─ LICENSE
└─ .gitignore
```

### Required root documentation

The README must contain, before the project is public:

1. one-sentence product claim and limitations;
2. the architecture diagram or link to it;
3. local prerequisites and exact run/test commands;
4. the fictional-data/simulated-control safety statement;
5. reproducibility instructions for the canonical replay;
6. technologies used and licences; and
7. significant AI/external-tool disclosure.

### Git discipline

- Commit at every completed milestone, not at the end.
- Never commit `.env`, tokens, recordings containing secrets, database files with private data, `node_modules`, virtual environments, or large generated media.
- Tag the first P0-green commit as `p0-proof`.
- Tag the final tested commit as `submission-candidate`.
- Use short, truthful commit messages: `feat(core): detect restricted-to-egress path`, not `final fixes`.

---

## 4. Domain contracts — implement these before UI work

The API and UI must use the same vocabulary. Define these models first, write serialization tests, and do not rename fields mid-build without a migration.

### 4.1 Core entities

| Entity | Required fields | Invariant |
| --- | --- | --- |
| `ArchitectureManifest` | `id`, `version`, `zones`, `nodes`, `allowed_relationships`, `invariants`, `control_capabilities` | Immutable after a replay starts |
| `Node` | `id`, `kind`, `label`, `zone`, `data_classification`, `registration` | IDs are stable and unique within a manifest |
| `ObservationEvent` | `event_id`, `sequence`, `occurred_at`, `actor`, `action`, `target`, `context`, `provenance`, `result` | Append-only; no raw secret/content fields |
| `ObservedEdge` | `source`, `target`, `action`, `first_seen`, `last_seen`, `expected_status`, `evidence_event_ids` | Derived only from accepted events |
| `Finding` | `id`, `status`, `severity`, `risk_factors`, `policy_basis`, `incident_node_ids`, `incident_edge_ids`, `evidence_event_ids`, `explanation` | A finding cites evidence and manifest version |
| `ContainmentPlan` | `id`, `finding_id`, `candidates`, `recommended_action`, `cost_breakdown`, `impact`, `state` | Recommends only declared control capabilities |
| `ControlExecution` | `id`, `plan_id`, `action`, `state`, `issued_at`, `result_event_ids`, `rollback` | Idempotent and auditable |
| `ImmunityPattern` | `id`, `lifecycle`, `abstract_preconditions`, `evidence_basis`, `recommended_control_class` | New patterns begin `draft`, never auto-block |

### 4.2 Enums: keep them closed for this build

```text
NodeKind:        agent | store | datasource | tool | api | destination | control_point
Action:          read | write | call | message | delegate | discover | send | block
Zone:            support | analytics | reporting | approved-state | shared-state | external
DataClass:       public | internal | restricted
Registration:    expected | unregistered | unknown
FindingStatus:   open | contained | dismissed
PlanState:       proposed | simulated | applied | verified | failed | rolled_back
```

Do not add user/identity/RBAC/real-MCP semantics to P0 unless an existing test requires them.

### 4.3 Manifest shape

Use declarative fixture data. The manifest needs only enough structure for conformance, impact, and control eligibility.

```yaml
version: "v1"
zones:
  support: { trust: internal }
  approved-state: { trust: internal }
  shared-state: { trust: untrusted }
  external: { trust: external }
invariants:
  - id: no-restricted-egress-via-unregistered-state
    source_data_class: restricted
    sink_zone: external
    required_bridge_registration: unregistered
    status: prohibited
control_capabilities:
  - id: block-support-scratchpad-write
    type: block_edge
    source: agent.support
    action: write
    target: store.scratchpad
    reversible: true
    cost: 1
```

This is a **HIVE manifest**, not a general policy language. It can later be translated/augmented with OPA but should remain readable enough for a judge and a security engineer.

---

## 5. Core-service implementation plan

### Step 1 — skeleton and health (`T0` to `T0 + 90 min`)

Create the Python project, lock dependencies, expose `GET /api/v1/health`, and add one test that starts the app and returns a structured status. The console may remain a blank page with its own build test.

**Exit test:** a new machine can run the core test suite and frontend build from documented commands.

### Step 2 — event ledger and deterministic replay (`T0 + 90 min` to `T0 + 3 hr`)

Implement:

- Pydantic validation of the canonical event;
- SQLite tables/repository or a simple persisted fixture ledger;
- idempotent append by `event_id`;
- deterministic ordering by `sequence`, then receive time;
- `ReplayService.reset()` and `ReplayService.advance(to_sequence)`; and
- a fixture loader that rejects unknown schema versions.

**Exit tests:**

- duplicate `event_id` does not create a second row/edge;
- reset then replay through sequence `N` produces exactly the same event count/state;
- an invalid action or missing actor/target fails validation;
- no fixture contains an actual URL, secret, real email address, or customer record.

### Step 3 — expected-vs-observed graph (`T0 + 3 hr` to `T0 + 5 hr`)

Implement a `GraphProjection` with:

- nodes from the manifest;
- expected edges as a separate layer from observed edges;
- action-aware directed observed edges;
- evidence-event-ID list on every observed edge;
- a query for path reachability constrained by action/node properties; and
- a graph snapshot DTO that does not expose library internals to the UI.

**Exit tests:**

- normal events add expected observed edges but no unregistered edge;
- Scratchpad write appears as an unregistered observed edge;
- a post-block event prevents the same edge from becoming active;
- graph snapshot is stable across fixture replays.

### Step 4 — P0 detection (`T0 + 5 hr` to `T0 + 7 hr`)

Implement `PS-001: restricted data reaches external egress via unregistered shared state`.

```text
For each active event-time graph snapshot:
  sources := nodes with data_classification == restricted
  sinks   := nodes with zone == external OR kind == destination
  bridges := nodes in shared-state with registration == unregistered

  if any directed path source → bridge → sink exists:
      collect its exact nodes, edges, and evidence IDs
      require at least one bridge edge to be observed and unregistered
      emit/update one deterministic finding keyed by manifest + path signature
  else:
      emit no PS-001 finding
```

Risk factors must be data, not prose:

```text
novel_unregistered_bridge: 1
restricted_source_reachable: 1
external_egress_reachable: 1
cross_zone_path: 1
approved_export_context: 0
```

The explanation is a rendering of these facts. Do not use an LLM to generate it.

**Exit tests:**

- the finding occurs only after the egress event;
- removing the external event means no qualifying finding;
- an expected/approved route with an explicit approved-export condition does not trigger `PS-001`;
- the finding has all evidence event IDs, a manifest version, an explanation, and a graph slice.

### Step 5 — containment planner and simulated adapter (`T0 + 7 hr` to `T0 + 9 hr`)

Implement in two simple, testable stages:

1. **Candidate enumeration:** read only `control_capabilities` from the manifest. For each candidate, simulate removing/gating the specified edge and compute unsafe-path existence plus protected-workflow reachability.
2. **Recommendation:** select the lowest-cost candidate that removes every qualifying unsafe path and retains every protected expected workflow. Break equal costs deterministically by capability ID.

The initial planner may use exhaustive evaluation of a small candidate set. This is safer and easier to explain than pretending to need an unconstrained global min-cut algorithm. Add capacity/min-cut only after the simple method is correct and tested.

The `SimulatedControlAdapter` accepts only known capability IDs. It appends a control event and changes replay state; it must never issue network requests.

**Exit tests:**

- recommendation is the scratchpad-write block, not “kill Reporting Agent”;
- applying it removes the unsafe path;
- protected Support→Ticket→Analytics→Report path remains;
- unknown/forbidden action is rejected;
- applying the same control twice is idempotent;
- finding transitions `open → contained` only after verification.

### Step 6 — core API and live updates (`T0 + 9 hr` to `T0 + 10 hr`)

Implement only these endpoints:

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/health` | Version and local-mode health |
| `GET` | `/api/v1/scenarios` | Available local fixtures |
| `POST` | `/api/v1/replays/{scenario_id}/reset` | Reset deterministic state |
| `POST` | `/api/v1/replays/{scenario_id}/advance` | Advance to a sequence or next event |
| `GET` | `/api/v1/state` | Manifest summary, graph snapshot, replay cursor |
| `GET` | `/api/v1/findings` | Evidence-backed findings |
| `GET` | `/api/v1/findings/{id}` | Full explanation, path, evidence and plan |
| `POST` | `/api/v1/findings/{id}/plans/{plan_id}/apply` | Local simulated control only |
| `GET` | `/api/v1/events/stream` | SSE state/replay notifications, optional for P1 |

No authentication, database-admin route, arbitrary graph query endpoint, or generic control endpoint belongs in the hackathon build.

---

## 6. Console implementation plan

### Console screens

Build one screen well before adding routes:

```text
┌─────────────────────────────────────────────────────────────────────┐
│ HIVE  /  Scenario selector  /  Replay controls  /  System status    │
├───────────────────────────────┬─────────────────────────────────────┤
│ Expected vs Observed Graph    │ Finding / Evidence panel            │
│                               │ • What changed                      │
│ nodes, edges, zones           │ • Why it matters                    │
│ active risky path highlighted │ • Evidence events                   │
│                               │ • Recommended containment           │
│                               │ • Predicted impact                  │
├───────────────────────────────┴─────────────────────────────────────┤
│ Event timeline · filter · reset · advance · apply simulated control │
└─────────────────────────────────────────────────────────────────────┘
```

### Required UI states

| State | Required user-visible behaviour |
| --- | --- |
| Before incident | Baseline is calm; clear legend distinguishes expected nodes/edges |
| Novel bridge appears | Graph marks it as unregistered/novel, but does not overstate malice |
| Finding open | Full evidence path and explicit risk factors appear; no black-box score alone |
| Plan proposed | Recommended action, alternatives/impact, and simulation-only label appear |
| Plan applied | Path is no longer active; normal workflow remains visibly connected |
| Error/offline | Clear local-mode error and reset/retry; never leave fake “contained” state |

### React component contract

```text
AppShell
  ├─ ScenarioToolbar
  ├─ TopologyCanvas
  │    ├─ AgentNode / ResourceNode / DestinationNode
  │    └─ ExpectedEdge / ObservedEdge / RiskPathEdge / BlockedEdge
  ├─ FindingInspector
  │    ├─ EvidenceList
  │    ├─ RiskFactorList
  │    └─ ContainmentPlanCard
  └─ ReplayTimeline
```

### UI quality bar

- Use deterministic ELK layout so the same incident produces the same picture after reset.
- Colour is redundant with labels, edge style, icons, and text. Do not rely on red/green alone.
- Every control is keyboard reachable and has a name/tooltip.
- The graph must remain readable at laptop resolution. Node labels should use logical names, not UUIDs.
- Show a prominent `SIMULATED ENVIRONMENT · FICTIONAL DATA` label.
- Do not make graph edges physically draggable if it implies that a visual change edits security evidence.

**Exit test:** a first-time viewer can reset, replay, inspect the path, apply the simulated containment action, and verify the result without developer tools or verbal coaching.

---

## 7. Platform breadth after P1

These features show that HIVE is an actual platform, but each must reuse the existing core contracts.

### P2-A: Architecture Registry view

Read the manifest and display:

- protected zones and data classification;
- allowed relationships;
- prohibited invariant in plain language;
- registered control capabilities; and
- manifest version used by the current replay.

Do **not** implement a free-form policy editor unless P1 is fully frozen. A read-only, credible architecture view is more valuable.

### P2-B: Immunity record

After verified containment, show a draft record:

```text
Pattern: Restricted-to-egress through unregistered shared state
Preconditions: restricted source + unregistered bridge + external sink
Evidence: event IDs and incident path
Recommended class: block unregistered bridge
Lifecycle: draft (requires review before activation)
```

This is not a new AI-generated rule and must not claim automatic enterprise-wide prevention.

### P2-C: Second scenario — delegation expansion

Only add if P1 is stable. It should reuse the same event schema, graph, finding, planner and UI. The signature is:

```text
unexpected delegation depth
+ newly discovered resource
+ cross-zone traversal
→ finding with a path and an eligible local control
```

Do not start a separate code path or a second app.

### P2-D: Swarm Lab explorer

Make it a deterministic experiment launcher, not an LLM swarm:

- choose a perturbation (new shared resource, failed tool, unexpected delegation);
- replay an event fixture/seed;
- show whether the invariant held;
- link experiment result to the same finding/evidence model.

This demonstrates the full HIVE lifecycle honestly and safely.

---

## 8. Team and coding-agent operating model

### First 30 minutes: establish a single source of truth

The implementor who owns the core creates the models, API contract, and fixture schema. Everyone else reads them before coding. No frontend agent invents JSON fields; no core agent changes them without updating tests and the contract.

### Parallel lanes after domain contracts are committed

| Lane | Owner | Can start after | Deliverable |
| --- | --- | --- | --- |
| A — Core | Backend implementor | `domain/` models + manifest schema | Replay, graph, detection, planner, tests, API |
| B — Console | Frontend implementor | API example JSON or mocked contract fixture | Screen, graph renderer, timeline, inspector, accessibility |
| C — Fixtures & verification | Security/test implementor | Manifest/event schema | Scenario fixtures, invariants, test matrix, safety review |
| D — Submission | Product/documentation owner | Product claim and screenshots exist | README, Devpost draft, disclosure, video script/recording plan |

If solo, execute lanes in the order **A → C → B → D**. Do not context-switch every 20 minutes.

### Change-control rule

After the first working P0 end-to-end run:

- freeze the domain schema;
- only change the detector/planner with a failing regression test first;
- only change UI structure with a screenshot/manual test check; and
- require a named reason for every new dependency.

### Implementor handoff prompt

Use this verbatim with any coding agent after `T0`:

```text
You are implementing HIVE, a defensive local-first cybersecurity prototype.
Read docs/HIVE_BUILD_PLAN.md, docs/HIVE_PLATFORM_ARCHITECTURE.md,
and docs/HIVE_TECHNOLOGY_STACK.md before editing.

Your task is [NAME ONE MILESTONE OR LANE].
Do not broaden scope. Use only fictional fixtures and simulated controls.
Never add paid APIs, an LLM dependency, real network targets, credential handling,
or an unreviewed data model. Preserve the canonical event and manifest contracts.

Before finishing: run the relevant tests/build, state exact commands and outputs,
list changed files, and identify any contract decision that needs owner approval.
Do not claim an action is secure or complete without a test proving it.
```

---

## 9. Time-boxed execution schedule

This schedule assumes one primary implementor. Parallel lanes compress it but must not violate dependency order. Protect sleep, food, and the `TS − 6 hours` submission buffer; exhaustion creates more risk than it buys.

| Relative window | Required outcome | Hard decision gate |
| --- | --- | --- |
| **Today, before T0** | Read this plan; verify accounts/editor/runtime; decide who owns each lane; check Devpost discussion response; retain only the owner-authorised zero-behaviour foundation (tooling, empty module locations, and documentation) | No endpoint, detector, fixture, visual component, test scenario, or other product behaviour before `T0` |
| **T0 → T0 + 0:30** | Confirm deadline; initialise Git; record start; commit the foundation and first implementation boundary | If deadline is shorter than expected, reduce immediately to P0/P1 only |
| **+0:30 → +1:30** | Core and console skeletons build locally; dependencies locked | No graph/UI polish until a health test passes |
| **+1:30 → +3:00** | Manifest, event models, fixture loader, deterministic replay | If fixtures cannot load/reset, stop all UI work |
| **+3:00 → +5:00** | Expected/observed graph with tests | Screenshot not needed; correctness first |
| **+5:00 → +7:00** | PS-001 finding with evidence and explanation | If path predicate is flaky, simplify fixture—not the evidence standard |
| **+7:00 → +9:00** | Candidate planner + simulated control + post-control verification | P0 checkpoint: tag `p0-proof` |
| **+9:00 → +12:00** | Console consumes live core state; replay and inspect flow works | If UI integration is slow, render a simple graph/table before custom styling |
| **+12:00 → +15:00** | P1 interaction complete; accessibility/error states; visual polish | Freeze P1 feature set |
| **+15:00 → +18:00** | Tests, README, screenshots; static replay/deployment attempt | If deployment fails, keep local demo and record fallback video |
| **+18:00 → TS − 6h** | Only P2 items that reuse the existing contracts; security/UX cleanup | Cut any feature that lacks tests or makes P1 less reliable |
| **TS − 6h** | Code freeze; final local run; record video; create final screenshots; complete Devpost | No new features after this point |
| **TS − 3h** | Upload/verify every submission field and link on a second browser/device if possible | If hosted demo fails, submit repository + video + clear local instructions |
| **TS − 1h** | Final Devpost review and submission confirmation | Stop editing unless a submission-blocking error exists |

### Mandatory stop rules

- If P0 is not green by `T0 + 9h`, drop P2 and deployment work; finish a clean local P1.
- If P1 is not green by `TS − 10h`, stop new platform features; focus on reliability, README, video, and submission.
- If any dependency needs payment, a credit card, an unclear licence, or a secret, reject it and use the local alternative.
- If a feature cannot be described with evidence and a test, remove it from the product claim.

---

## 10. Test and evidence matrix

| Area | Test | Pass condition |
| --- | --- | --- |
| Schema | Invalid event/manifest | Validation rejects unknown action, missing entity, or illegal enum |
| Ledger | Duplicate delivery | Event processed once; state unchanged on replayed ID |
| Replay | Reset/replay | Same sequence gives same graph, finding ID/path and plan |
| Graph | Expected vs observed | Scratchpad relation is visible as unregistered; expected workflow stays expected |
| Detection | Normal workflow | No critical PS-001 finding |
| Detection | Full incident fixture | Finding has source, bridge, sink, risk factors, event IDs and manifest version |
| Detection | Missing egress | No PS-001 finding |
| Planner | Candidate choice | Picks registered lowest-disruption control, never an arbitrary node removal |
| Control | Apply once/twice | One logical action; second application is safe/idempotent |
| Verification | Post-control | Unsafe path absent; protected workflow path present |
| API | Contract | Every route returns documented shape/error; no stack trace to UI |
| UI | Replay journey | Reset → advance → finding → inspect → apply → verified works manually and in e2e test if time permits |
| Safety | Fixture scan | No live targets, secrets, sensitive data, prompt content or external action |
| Build | Clean checkout | Documented frontend build and backend tests pass from clean environment |

### Definition of a valid finding

A finding is invalid and must not be shown as a security alert unless it contains all of:

- active manifest ID/version;
- typed source, bridge, and sink node IDs;
- ordered incident path/edges;
- exact evidence event IDs;
- rule/predicate version;
- risk factors and their values;
- explanation that refers only to those facts;
- candidate control actions and why one is recommended; and
- current verification state.

---

## 11. Evaluation scorecard: prove the platform instead of asserting it

The test suite proves functional correctness. This scorecard produces the compact, judge-readable evidence that HIVE's claim works as designed. Run it from a clean checkout before recording the video and capture the results in the README or a screenshot.

| Evaluation case | Input condition | Expected outcome | What it proves |
| --- | --- | --- | --- |
| `E1` Normal approved workflow | Only expected internal edges | No PS-001 finding | HIVE does not treat ordinary architecture as an attack |
| `E2` Novel state without egress | Unregistered scratchpad discovered/written, no external sink path | Observation/low-severity signal only; no critical egress finding | Novelty alone is insufficient for a dangerous-state claim |
| `E3` Capability composition | Restricted source → unregistered state → external egress | One evidence-linked PS-001 finding | HIVE detects the relevant *system-level* path, not an isolated action |
| `E4` Approved-export control | Same broad source/sink classes but an explicit approved export path/context | No PS-001 finding or a clearly distinct policy outcome | Expected context suppresses a false positive |
| `E5` Containment | Apply only the registered scratchpad-write block | Unsafe path absent; protected internal path remains | Least-disruptive containment is verified, not animated |
| `E6` Replay integrity | Reset and replay E3/E5 | Same state, finding path, candidate plan, and verification outcome | Evidence and decisions are reproducible |
| `E7` Delivery resilience | Duplicate event and out-of-order arrival fixture | No duplicate graph edge/finding; ordering rule is documented | The event pipeline is not a fragile happy-path demo |

### Report only honest measurements

Use counts and deterministic results that the build can actually prove:

```text
Scenarios passed: 7 / 7
Evidence coverage: [finding evidence event IDs] / [incident events]
Unsafe paths after containment: 0
Protected workflows preserved: 1 / 1
Replay consistency: pass
External systems contacted: 0
Runtime LLM/API dependency: none
```

Do not invent detection percentages, enterprise-scale throughput, false-positive rates, or “workflows preserved” percentages from one small fixture. The strongest early evidence is a fully reproducible, counterfactual demonstration with clear limits.

---

## 12. Submission and demo readiness checklist

### Required functional artefacts

- [ ] Source repository, commit history beginning at/after `T0`, clear licence.
- [ ] Local run instructions tested from a clean checkout.
- [ ] P0 tests green and recorded command output/screenshot.
- [ ] Working local replay with fictional data and simulated control.
- [ ] README includes limits and safety model.
- [ ] At least one accessible screenshot or short GIF showing baseline, finding, and contained state.

### Devpost requirements

The official page requires a project name, description, technology list, a demo link/repository where possible, a video under five minutes, and significant AI/external-tool disclosure. [Devpost requirements](https://tln-cybersecurity-challenge.devpost.com/)

- [ ] **Name:** HIVE.
- [ ] **One-line description:** accurately states simulated, evidence-backed population-level detection and containment.
- [ ] **Technologies:** list only what the final repository actually uses.
- [ ] **Project link:** GitHub repository; static replay only if it is stable.
- [ ] **Video:** under five minutes; recorded fallback exists even if a live demo will be attempted.
- [ ] **AI disclosure:** names significant tools and how they assisted, without claiming they performed work you cannot explain.
- [ ] **Credits/licences:** third-party libraries, icons/images, datasets/fixtures, and assets are usable under their licences.

### AI/external-tools disclosure starter

Adapt truthfully before submitting:

```text
We used AI-assisted development tools for research, planning, implementation support,
documentation, and test/design review. The team reviewed and understood the submitted
code, architecture, scenario fixtures, and security claims. HIVE's core detection,
path analysis, and simulated containment are deterministic code; the project does not
depend on an external LLM or paid AI API at runtime.
```

### Final honesty check

- [ ] “Simulated” appears wherever an external reader might otherwise infer a live enterprise integration.
- [ ] No claims rely on an unverified incident, vendor relationship, benchmark, or standard.
- [ ] The video shows the real build, not a design prototype inconsistent with the code.
- [ ] Every screenshot matches the tagged `submission-candidate` revision.
- [ ] A team member can explain the detection predicate, graph path, candidate evaluation, and containment verification without reading a script.

---

## 13. Post-submission next steps: turn the vertical slice into the platform

After the event, do not immediately add more dashboards. Advance in this order:

1. **Validate the semantics:** collect user/judge feedback on whether the expected architecture, evidence, and containment explanation are understandable.
2. **Harden the event contract:** introduce OpenTelemetry/OpenInference mapping adapters and provenance confidence without weakening HIVE's native event semantics.
3. **Add a real but safe integration:** one local MCP-like simulated adapter or a sandboxed workflow connector with no production credentials.
4. **Build Swarm Lab properly:** deterministic perturbation campaigns, invariant reports, seeds, experiment comparison, and shadow-mode pattern promotion.
5. **Introduce a shared control plane:** PostgreSQL, manifest review, user identity, and tenant isolation only when multiple users/environments exist.
6. **Introduce streaming/scale components:** NATS JetStream, then analytics/graph-worker scaling only after benchmarked need.
7. **Earn any autonomous enforcement:** start in detection-only/shadow mode, measure false positives and blast radius, then enable narrow, expiring controls with human approval.

The path is intentional: **prove the semantics → prove usability → prove integrations → prove scale**. Reversing it produces a more expensive dashboard, not a security platform.

---

## 14. Start command for the implementor

At `T0`, the first implementor should do exactly this:

1. Confirm `TS`, the final submission deadline, and record it.
2. Create the repository and initial commit with these planning documents and a minimal README.
3. Create the domain models and canonical fictional fixture before any custom graph UI.
4. Make the deterministic replay test pass.
5. Follow Sections 5 and 6 in order, refusing scope additions until P0 is tagged.

That is the shortest route to a credible HIVE—and the strongest foundation for the much larger platform described in the architecture.

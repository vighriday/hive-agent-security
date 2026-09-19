# HIVE MVP Contract

**Status:** Planning artifact — no project implementation implied; scenario and narrative are provisional  
**Event:** TLN Cybersecurity Challenge 2026 (September 19–20)  
**Working product name:** HIVE  
**Tagline:** Detect the behavior no individual agent intended.

> **Scope clarification (added after the platform-architecture decision):** this document preserves a narrow scenario as an acceptance-spec example. It is **not** HIVE's final demo narrative, nor does it constrain the full platform. The platform scope and durable technical decisions are defined in [HIVE Platform Architecture](HIVE_PLATFORM_ARCHITECTURE.md) and [HIVE Technology Stack](HIVE_TECHNOLOGY_STACK.md). Revisit the scenario, story, and build slice only after the team decides what is feasible to demonstrate.

---

## 1. The commitment

HIVE is a cybersecurity prototype for detecting when individually legitimate AI agents form an **unexpected, dangerous collective capability** through their interactions.

For the hackathon, HIVE will prove one narrow claim:

> Given a defined multi-agent workflow, HIVE can identify an unexpected cross-agent path that composes sensitive-data access with external transmission, explain why that path violates the expected architecture, and contain it by severing the smallest relevant relationship while preserving unrelated work.

This is a demonstration of **population-level agent security**. It is not a claim to detect every emergent behavior, prove malicious intent, or secure every agent framework.

---

## 2. The problem in plain language

Companies are beginning to deploy many AI agents with different tools and permissions. Existing controls are good at checking an individual action: whether an agent is authenticated, whether a tool call is allowed, or whether a permission is granted.

The gap is what happens **between** otherwise-valid agents.

An agent that can read customer data, an agent that can write a shared workspace, and an agent that can send a message outside the company may each be operating within its own permissions. If an unintended interaction path connects them, the *population* can gain a capability that no single agent has.

HIVE asks:

> Has this agent ecosystem begun to form a behavior or capability that was never part of its intended design?

---

## 3. The one user and the one job

### Primary user

An AI security engineer or platform owner responsible for an enterprise multi-agent workflow.

### Job to be done

When a group of autonomous agents begins interacting in an unfamiliar way, the user needs to rapidly understand:

1. what changed;
2. why it is unexpected in this architecture;
3. what dangerous capability the new path enables; and
4. the smallest safe action that interrupts that capability.

### User outcome

The user contains an unsafe coordination path without indiscriminately stopping agents or breaking unrelated business workflows.

---

## 4. Provisional build-through scenario: `The unintended export path`

This is a **candidate scenario** for a later implementation decision. It is deliberately simulated and uses fictional data only. It is retained because it exercises the core platform contracts end-to-end, not because the final demo has been chosen.

### Expected architecture

| Actor / resource | Intended role | Expected relationships |
| --- | --- | --- |
| `Support Agent` | Resolves tickets using customer context | Reads the fictional CRM; writes a case summary to the approved ticket system |
| `Analytics Agent` | Produces aggregate service insights | Reads approved ticket summaries; writes internal reports |
| `Reporting Agent` | Sends approved aggregate reports | Reads aggregate reports; sends only approved internal reporting output |
| `CRM` | Holds fictional customer records | Readable by Support Agent only |
| `Approved Ticket Store` | Normal internal handoff | Support → Analytics |
| `Shared Scratchpad` | Unregistered writable state | Not part of any approved workflow |
| `External Webhook` | Simulated external destination | Not reachable from customer-data workflows |

The normal graph is intentionally simple:

```text
Support Agent ──reads──> CRM
Support Agent ──writes──> Approved Ticket Store ──reads──> Analytics Agent
Analytics Agent ──writes──> Internal Report Store ──reads──> Reporting Agent
```

### Injected, simulated condition

An unregistered `Shared Scratchpad` becomes available. The Support Agent writes a ticket-derived item to it; the Reporting Agent reads it and then uses an external reporting connection.

```text
Support Agent → CRM → Shared Scratchpad → Reporting Agent → External Webhook
```

Every individual action can appear locally valid in the simulation. The danger is the new **composed path** from sensitive data to an external destination through a resource absent from the approved design.

### What HIVE must show

1. A stable baseline graph that reflects the expected architecture.
2. A live/step-by-step observed graph as the new relationships appear.
3. An **Emergence Alert** with an honest explanation:
   - *What changed:* Support and Reporting became indirectly connected through an unregistered shared resource.
   - *Why unexpected:* The scratchpad and this cross-domain relationship are not in the allowed workflow.
   - *Why it matters:* The new path combines fictional CRM access with an external transmission capability.
   - *Affected path:* `Support → Shared Scratchpad → Reporting → External Webhook`.
4. A containment recommendation:
   - block the specific `Support Agent → Shared Scratchpad` write relationship, or quarantine that unregistered route;
   - preserve the normal Support → Ticket Store → Analytics → Internal Report workflow.
5. A post-containment state showing that the unsafe path is broken and legitimate work continues.
6. An **immunity record** that stores the abstract behavior, not a fake claim of universal prevention.

### Why this is the right first scenario

It makes HIVE's distinct thesis visible in under a minute: no agent must be labelled “evil”; the risk exists in the interaction topology and capability composition. It is also fully safe to simulate locally with fictional data and deterministic telemetry.

---

## 5. Provisional judge-facing narrative — on hold

Do not treat this section as the final video or presentation script. It is a narrative skeleton that demonstrates how the candidate scenario could communicate the platform. Finalise it only after the implementation scope is known.

### Opening (0:00–0:25)

“Most agent security checks whether an individual agent is allowed to make an action. But safe-looking agents can create an unsafe system when their interactions form a path no human designed.”

### Baseline (0:25–0:55)

Show the expected workflow. State that customer context remains in its approved processing path and external transmission is not connected to it.

### Emergence (0:55–1:45)

Introduce the unregistered shared scratchpad. Replay the events. The graph visibly gains a cross-domain connection and an external path.

### Explanation (1:45–2:30)

HIVE reports the architecture deviation, the composed capability, the exact path, and the reason this is significant. Do not say “attack proven” or “agent malicious.”

### Containment (2:30–3:10)

HIVE proposes the smallest intervention: sever the scratchpad write route. Apply it. The risky path disappears while the normal ticket-to-analytics workflow continues.

### Learning and close (3:10–3:40)

Show the recorded behavioral pattern and close with:

> “HIVE secures not only individual agents, but the behaviors that emerge between them.”

The live demo should take under four minutes, leaving time in the submission video for architecture, implementation choices, impact, and disclosure.

---

## 6. Product requirements

### Must have

- A declared **expected architecture**: allowed nodes and relationships for the scenario.
- A safe, deterministic event stream representing agents, resources, actions, timestamps, and trust/registration context.
- An observed interaction graph that adds edges as events occur.
- A visible distinction between expected edges and new/unapproved edges.
- Detection of the scenario's dangerous path based on a combination of:
  - a newly observed relationship;
  - an unregistered shared writable resource;
  - a reachable sensitive-data source; and
  - an external-destination capability.
- A human-readable alert and highlighted path.
- A minimal-containment recommendation with an explicit impact statement.
- A controllable containment action in the simulation and post-containment verification.
- An immunity-memory entry that records the precursor pattern, containment choice, and outcome.

### Should have, if time allows

- An illustrative **Emergence Score** derived from explicit, inspectable signals rather than an opaque “AI risk” label.
- Event playback, pause, and reset for a reliable judge demo.
- A second scenario: abnormal delegation growth, detected as unexpected delegation depth plus cross-domain resource discovery.
- A compact event timeline beneath the graph for accessibility and explainability.

### Will not build for this MVP

- Real customer data, real credential access, scanning, exploitation, or external targeting.
- A production connector for arbitrary MCP servers, models, cloud accounts, or enterprise data stores.
- A claim of autonomous discovery across unbounded real-world agent populations.
- A general-purpose graph database, full SIEM, IAM product, or agent framework.
- Fully automatic production enforcement without a human decision.
- A black-box machine-learning classifier that judges cannot explain.

---

## 7. Technical design constraints — decisions, not implementation

The architecture must be small, explainable, local-first, and replayable. The primary technical object is a **temporal interaction graph**.

### Minimal event model

Each simulated telemetry event should have the conceptual fields below:

```text
event_id
timestamp
actor_id                 # agent or system actor
action                   # read, write, call, delegate, message, discover, send
target_id                # resource, agent, tool, or destination
target_type              # crm, memory, datastore, API, webhook, agent, etc.
workflow_id
registration_status      # expected / unregistered / unknown
data_sensitivity         # public / internal / fictional-sensitive
result                   # allowed / observed / blocked
```

### Graph model

**Nodes:** agents, data sources, shared state, tools, stores, APIs, and destinations.  
**Edges:** observed actions, each retaining action type, timestamp, workflow, and whether the relation is expected.

HIVE compares:

```text
Expected graph  versus  observed graph over time
```

### Detection decision for the MVP

Detection must be rule- and graph-path-based, so it is defensible in a hackathon demo:

```text
Alert when a newly observed or unregistered relationship creates a reachable path:

fictional-sensitive source
    → unapproved shared state or cross-domain edge
    → actor with external-send capability
    → external destination
```

The alert should become more significant when multiple explicit signals occur together—for example, a novel edge, unregistered state, cross-domain movement, and an external sink. An optional Emergence Score may summarize these signals, but the underlying reasons must always remain visible.

### Containment decision for the MVP

The containment engine only considers an allowlisted set of simulated interventions:

1. block a specific edge;
2. quarantine an unregistered shared resource; or
3. pause a new delegation relationship.

For the first scenario, choose the intervention that breaks every unsafe path while disrupting the fewest expected edges. In this topology, that is the specific `Support Agent → Shared Scratchpad` write route.

This is a constrained, explainable minimum-cut demonstration—not a claim of universal optimal containment across real organisations.

---

## 8. Stack-selection criteria

Choose tools only after the above contract is accepted. The winning stack is the one that makes the demo reliable and explainable in a 24–48 hour window.

| Need | Selection criterion |
| --- | --- |
| Frontend | Fast, polished graph visualization; easy event replay and state changes |
| Backend | Small local service or in-browser simulation; deterministic event control |
| Graph logic | Simple in-memory graph algorithms; no infrastructure dependency required |
| Data | Checked-in fictional scenario fixtures, never sensitive or live enterprise data |
| Deployment | One-command local run plus a public demo path if safely feasible |
| AI use | Optional and disclosed; never essential to core detection or containment logic |

**Default bias:** use a familiar TypeScript/React-style interface with a compact backend or local simulation, and an established graph-visualization library. The detection and containment logic should remain a transparent, testable module independent of any LLM.

This is a provisional decision guide, not permission to write the project-specific implementation before the event starts.

---

## 9. Public-facing decisions

### Project name

**HIVE**

Use the expanded description on first mention:

> HIVE is an early prototype for detecting and containing unsafe emergent behavior in autonomous agent populations.

### Short Devpost description

> HIVE maps how autonomous AI agents, tools, shared memory, and data sources interact. When an unexpected connection composes individually valid permissions into a risky system-level path, HIVE explains the deviation and recommends the smallest containment action that preserves legitimate workflows.

### Safe positioning language

Use:

- “detects selected structurally significant deviations from an expected agent architecture”;
- “simulates and visualizes dangerous capability composition”;
- “recommends constrained, explainable containment actions”; and
- “prototype / demonstration / simulated environment.”

Avoid:

- “detects all emergent behavior”;
- “proves agents are malicious”;
- “autonomously secures every AI system”;
- unverified claims about external incidents; and
- claims of real-world production integration that the prototype does not have.

---

## 10. Acceptance tests

The MVP is complete only when all of these are true:

1. A first-time viewer can state the problem in one sentence after watching the opening.
2. The normal graph visibly matches the declared expected architecture.
3. The scenario replay deterministically produces the unsafe path every time.
4. The alert names the changed edge/resource, explains the expected-policy deviation, and shows the whole path.
5. The containment action disrupts the unsafe path and leaves the declared normal workflow intact.
6. The product distinguishes “unexpected/risky” from “malicious/proven attack.”
7. No real systems, credentials, customers, or sensitive data are touched.
8. The core demo works without a paid API, network access, or an LLM response at showtime.
9. The team can explain every major technical choice and all significant AI-assisted work.
10. The Devpost materials accurately describe what was demonstrated.

---

## 11. Rules-safe pre-hackathon operating boundary

The published rules say project work should be created **primarily during the hackathon**. Until organisers answer the posted clarification, preserve an auditable boundary.

### Safe planning and preparation

- refine this contract and research notes;
- validate claims and competitors using authoritative sources;
- choose a stack and learn its tools;
- set up generic editor, Git, deployment, and API-account access;
- write a build schedule, testing checklist, demo storyboard, and disclosure draft; and
- create a timestamped decision log.

### Wait for explicit organiser permission before doing these

- writing HIVE-specific code, tests, or a repository skeleton;
- making project-specific interface mockups, graph screens, illustrations, logo, or video;
- creating HIVE-specific deployment/configuration artifacts; or
- generating a polished Devpost submission intended to represent the build.

If permission is granted for any pre-event project work, document exactly what was created, when, and the organiser's stated allowance. If it is not granted or ambiguous, begin the repository and all project-specific assets only at the official start time.

---

## 12. Build-order decision once the hackathon opens

1. Create the project repository and a minimal simulated-event fixture.
2. Implement the expected-vs-observed graph model and verify the scenario path in tests.
3. Build the baseline graph and deterministic event replay.
4. Add the alert, path explanation, and containment decision.
5. Apply containment in the simulation and prove legitimate-workflow preservation.
6. Add the immunity record and polish the story, timeline, and accessibility.
7. Record the demo, publish the repository/demo, and complete Devpost + AI disclosure.

The visual graph serves the proof; it must not become a decorative dashboard built ahead of the detection logic.

---

## 13. The initial implementation hypothesis

If the team chooses this first build slice, HIVE will begin as a **replayable, safe, explainable simulator of one emergent privilege-composition path**. That is an implementation hypothesis, not a redefinition of HIVE as anything less than the broad platform in the architecture document.

If this first scenario is compelling and reliable, additional scenarios deepen the thesis. If it is not, adding more agent types, more animations, or a larger stack will not rescue the MVP.

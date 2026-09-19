# Fictional Fixture Boundary

This directory will contain deterministic, versioned, fictional data used to prove HIVE behaviour. It must never contain customer data, real secrets, live endpoints, copied production logs, or attack instructions.

```text
manifests/   expected-architecture declarations
events/      ordered fictional observation envelopes
expected/    expected graph/finding/containment outcomes
scenarios/   scenario metadata and replay composition
lab/         deterministic perturbation inputs and experiment results
```

Every fixture added later must identify its source as fictional, state its invariant, and have a matching test. A fixture may demonstrate a risky system state but must never perform external egress or a real control action.

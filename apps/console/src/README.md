# Console source map

The console is a rendering and interaction layer. It never computes a finding, interprets policy, or selects containment. It displays evidence and allowed actions received from the core contract.

```text
app/                  composition root, providers, routing after P1 proves a single screen
features/
  replay/             deterministic replay controls and timeline
  topology/           expected/observed graph rendering
  findings/           evidence and risk-factor inspection
  containment/        allowed-plan review and simulated-action status
  architecture/       later read-only architecture registry view
  immunity/           later reviewed pattern lifecycle view
  swarm-lab/          later experiment view
shared/
  api/                generated/verified API client and transport errors
  components/         accessible presentational primitives
  state/              ephemeral visual state only
  lib/                pure display utilities, never security semantics
  styles/             design tokens and global styles
test/                 browser-independent test support
```

The `placeholder.d.ts` file exists only to make the empty TypeScript project type-checkable. Replace it only when the first actual source module is added.

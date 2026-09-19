# Contributing to HIVE

HIVE is a security-sensitive prototype. Every contribution must strengthen the ability to explain, reproduce, and safely contain a finding.

## Before editing

1. Read the architecture, technology stack, and current milestone in the build plan.
2. Choose one bounded task. Do not combine a schema change, detector change, and console redesign in one change.
3. Check whether the change crosses a contract boundary in `contracts/`.
4. Use fictional data and simulated controls only.

## Dependency direction

```text
console -> generated/API contracts -> core API/application -> domain
core adapters -> application -> domain
fixtures/tests -> public contracts/domain
```

The domain must not import FastAPI, SQLAlchemy, a graph library, a connector, or console code. The console must not re-implement policy or risk logic.

## Change rules

- Add or update a deterministic test before changing security semantics.
- Treat an event, manifest, finding, containment plan, or policy as a versioned contract.
- Add dependencies only with a written purpose, licence check, and local/offline fallback assessment.
- Never commit `.env` files, live endpoints, credentials, personal data, or real customer telemetry.
- Keep the first working security path smaller than the full platform vision.

## Review checklist

- [ ] The change has one clear owner and purpose.
- [ ] Safety claims are backed by an executable test or explicitly labelled future work.
- [ ] The UI does not invent or reinterpret a security conclusion.
- [ ] Error and empty states do not show a false "safe" or "contained" state.
- [ ] Documentation and contracts match the code.

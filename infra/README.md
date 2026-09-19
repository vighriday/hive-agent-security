# Infrastructure Boundary

HIVE begins as one local core process plus one browser console. This directory reserves the deployment interfaces needed after the vertical slice is proven; it intentionally contains no active cloud account, secret, or production deployment configuration.

```text
compose/         later reproducible local multi-service topology
docker/          later service-image definitions
observability/   later HIVE health telemetry configuration
policy/          later OPA/Rego distribution assets
deploy/          later deployment-owner-specific definitions
```

Add infrastructure only when a tested product capability requires it. Docker, NATS, PostgreSQL, OPA, and observability components are scale paths—not prerequisites for P0.

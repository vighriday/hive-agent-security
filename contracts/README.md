# HIVE Contracts

This directory is the compatibility boundary between the console, core service, fixtures, and future integrations.

No formal schema is committed yet. When implementation begins, the canonical event, manifest, finding, containment-plan, and API contracts are created here before feature work consumes them.

| Directory | Intended contents |
| --- | --- |
| `openapi/` | Versioned core-service OpenAPI description and generation notes |
| `json-schema/` | Transport-neutral schema definitions when appropriate |
| `examples/` | Minimal valid/invalid fictional payloads |
| `protocol/` | Compatibility, versioning, and deprecation records |

The source of semantics is the architecture and build-plan documentation; this directory becomes the executable representation of those semantics at implementation time.

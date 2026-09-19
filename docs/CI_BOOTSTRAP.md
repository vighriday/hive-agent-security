# CI Bootstrap Gate

Do not enable a decorative green build. Commit CI with the first real implementation milestone only when all of the following exist:

1. `pnpm-lock.yaml` and `uv.lock` were created from reviewed dependency declarations.
2. At least one meaningful deterministic test exists in both the implemented surface and its contract boundary.
3. Local commands pass from a clean checkout.
4. The workflow uses pinned action versions and no deployment/secrets context.

Initial required checks are console format/lint/type-check/test and core Ruff format/lint, Mypy, and Pytest. Add e2e/browser installation only when the first end-to-end journey exists.

# Continuous Integration Bootstrap

Add an active workflow only after the first `pnpm-lock.yaml`, `uv.lock`, and executable tests are committed. The initial workflow must run the console formatter/linter/type-check/tests and the core Ruff/Mypy/Pytest commands from the README. It must fail closed on missing lockfiles and must not access deployment credentials.

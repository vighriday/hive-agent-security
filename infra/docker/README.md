# Container Image Plan

Create Dockerfiles only after the core has a tested ASGI entry point and the console has a reproducible build. Images must run as non-root, use pinned base-image digests at release time, contain no secrets, and expose only the minimum local ports.

# Architecture — Docker checks

Stack-specific extensions to the **Architecture** dimension. Apply alongside `universal.md` for diffs that touch
Dockerfiles or compose files.

- [ ] Multi-stage Dockerfile separates build and runtime — runtime image does not carry the toolchain
- [ ] Image contains only what the runtime needs; build-time secrets do not leak via committed history

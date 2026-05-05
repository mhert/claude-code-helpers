# Performance — Docker checks

Stack-specific extensions to the **Performance** dimension. Apply alongside `universal.md` for diffs that touch
Dockerfiles or compose files.

- [ ] Image layer order optimised — least-changing layers first so the cache is reused on incremental builds
- [ ] `.dockerignore` excludes build artifacts and version control so the build context is small
- [ ] Multi-stage final image only contains runtime dependencies; toolchain and intermediate artifacts stay in the
      build stage

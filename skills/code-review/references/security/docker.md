# Security — Docker checks

Stack-specific extensions to the **Security** dimension. Apply alongside `universal.md` for diffs that touch
Dockerfiles or compose files. Items are grouped by the OWASP category they extend.

## A05: Security misconfiguration

- [ ] No unnecessary packages installed in the runtime image
- [ ] Container runs as a non-root user
- [ ] No secrets baked into the image, the Dockerfile, or build args that end up in the image
- [ ] Base images pinned to a SHA digest (e.g. `FROM node@sha256:...`), not a floating tag like `latest` or
      major-version-only
- [ ] Image vulnerability scanner (e.g. `trivy`, `grype`) runs in CI; high-severity findings reviewed before deploy

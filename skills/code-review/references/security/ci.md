# Security — CI checks

Stack-specific extensions to the **Security** dimension. Apply alongside `universal.md` for diffs that touch
`.github/workflows/` files. Items are grouped by the OWASP category they extend.

## A05: Security misconfiguration

- [ ] Workflow `permissions:` block follows least privilege
- [ ] Third-party actions pinned to a full commit SHA, not a tag
- [ ] Secret scanning runs in the workflow or as a pre-receive hook (e.g. `gitleaks`, `trufflehog`)

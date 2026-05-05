# Architecture — CI checks

Stack-specific extensions to the **Architecture** dimension. Apply alongside `universal.md` for diffs that touch
`.github/workflows/` files.

- [ ] CI workflow split into reusable jobs with `workflow_call`; matrix builds prefer parameters over copies
- [ ] Workflow triggers scoped (`paths`, `branches`) so unrelated changes do not run the full pipeline

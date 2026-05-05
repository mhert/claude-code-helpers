# Correctness — CI checks

Stack-specific extensions to the **Correctness** dimension. Apply alongside `universal.md` for diffs that touch
`.github/workflows/` files.

- [ ] CI pipeline fails on the first error in a step (no swallowed errors via `|| true`)
- [ ] Cache keys include the inputs they should invalidate on (lockfiles, source paths)

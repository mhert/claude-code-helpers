# Architecture — Shell checks

Stack-specific extensions to the **Architecture** dimension. Apply alongside `universal.md` for diffs that touch
shell scripts.

- [ ] Scripts decomposed into functions with single responsibilities — no 300-line monoliths
- [ ] Shared logic factored into sourced helper scripts, not duplicated across scripts
- [ ] No mixing of "library" code (functions only) and "script" code (top-level execution) without a clear guard
      such as `if [[ "${BASH_SOURCE[0]}" == "$0" ]]`

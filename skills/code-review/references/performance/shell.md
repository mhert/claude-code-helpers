# Performance — Shell checks

Stack-specific extensions to the **Performance** dimension. Apply alongside `universal.md` for diffs that touch
shell scripts.

- [ ] Pipelines preferred over loops with subshells; `awk` / `sed` / `jq` for bulk text and JSON transforms
- [ ] `xargs` / `parallel` used to fan out work; serial loops only when ordering matters
- [ ] No quadratic patterns from invoking heavy commands inside loops over large inputs

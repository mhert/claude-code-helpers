# Performance — CI checks

Stack-specific extensions to the **Performance** dimension. Apply alongside `universal.md` for diffs that touch
`.github/workflows/` files.

- [ ] Dependency caching configured (`actions/cache` or built-in caching keyed on lockfiles)
- [ ] Jobs run in parallel where dependencies allow; matrix builds used over copy-paste job duplication
- [ ] Timeouts set on jobs and steps so a hang does not waste a runner for hours

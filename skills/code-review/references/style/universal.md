# Style / Maintainability — universal checks

Reference for the **Style/Maintainability** dimension subagent. Covers naming, idiomatic patterns, dead code, magic
values, type safety, and documentation. Apply only items relevant to the diff under review. The orchestrator will
also pass stack-specific files (`<stack>.md` in this directory) when the changed-file list matches a stack.

## Universal checks

- [ ] Names describe intent, not type or implementation (`activeUsers`, not `userArrayList`)
- [ ] No abbreviations or acronyms unless they are domain-standard and unambiguous
- [ ] Functions, methods, and modules sized for comfortable scanning — when a unit grows past one screen, it is
      usually doing more than one thing
- [ ] No dead code: unused imports, unreachable branches, commented-out blocks, leftover debug statements
- [ ] No magic numbers or strings — replaced with named constants when their meaning is not obvious from context
- [ ] Boolean parameters at call sites are self-documenting (named arguments, builder methods, or enums) — bare
      `true` / `false` arguments rarely communicate intent
- [ ] No clever one-liners that take longer to read than they save to write — prefer the boring, obvious form
- [ ] Comments explain *why*, not *what*; the code already shows *what*
- [ ] Public symbols documented when their use is non-obvious; trivial getters / pass-throughs do not need comments
- [ ] Formatting consistent with the rest of the file and the project formatter

## Type safety

- [ ] No "stringly-typed" APIs where a richer type (enum, value object, branded type) would prevent invalid states
- [ ] Optional / nullable types used to model "value may be absent", not magic sentinels (`-1`, empty string, `null`
      coupled with a separate flag)
- [ ] Generics constrained where the constraint matters; not over-parameterised when one concrete type would do

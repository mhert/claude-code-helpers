## Ready for the next stage

{{Summary of what changed and why. One short paragraph in subject-matter terms. Use this template for `refactor`,
`chore`, `perf`, `docs`, `style`, `build`, `ci`, `test`, or `revert` work.}}

### Motivation

{{What made this worth doing now? Pain point being unblocked, preparation for upcoming work, dependency or platform
requirement, follow-up to a recent incident. Avoid vague "cleanup" — name the concrete improvement or constraint.}}

### Changes

{{What was restructured, renamed, moved, swapped, or upgraded — in subject-matter terms. For `revert`, include the
subject of the reverted change and the reason for reverting.}}

### Behaviour preservation

{{Explicit statement that user-visible behaviour is unchanged, and how QA can confirm it: the same inputs produce the
same outputs, existing reports look identical, established tolerances unchanged.

For `perf` work, replace this section with **Performance impact** — before/after numbers, the workload measured, and
any trade-off (e.g. memory for speed) the user might notice.}}

### Affected features and inputs

- {{Feature / calculation / report 1 — note which inputs (if any) are exercised differently. Often `None` for pure
  refactor work.}}
- {{Feature / calculation / report 2}}

### How to verify

{{User-facing regression steps. For refactor / chore: name the representative scenarios that, if unchanged,
demonstrate behaviour preservation. For `perf`: name the workload to re-run and the expected timing.}}

- {{Step 1 with inputs, expected output, tolerance}}
- {{Step 2}}

### Out of scope

{{Related work deliberately NOT done in this change. Write `None` if the change is self-contained.}}

### Pull requests

{{Mandatory — one bullet per repository involved. At least one link. Use markdown link syntax `[text](url)` —
`[text|url]` renders as plain text on both Jira and GitHub.}}

- [<repo-a> PR #<num>](<url>)
- [<repo-b> PR #<num>](<url>)

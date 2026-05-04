## Ready for the next stage

{{Summary of what was changed. One short paragraph in subject-matter terms.}}

### Problem

{{Full description of the observed behaviour. Be exhaustive:
- Under which inputs does it occur (which entities, configurations, parameter regimes, time ranges, …)?
- What was computed or returned vs. what was expected?
- Frequency and scope (all users? specific tenants? specific configurations?).
- Subject-matter reason this is wrong (which invariant, model property, or business contract was violated).}}

### Root cause

{{Subject-matter level explanation. Use the vocabulary of the domain. No class or method names, no file paths, no
stack traces — reviewers can open the PRs for that.}}

### Fix

{{What was changed in subject-matter terms and why this resolves the problem. Cover every behavioural change users
may notice. Call out any knobs, parameters, or defaults that were adjusted.}}

### Affected features and inputs

- {{Feature / calculation / report 1 — which inputs are now affected}}
- {{Feature / calculation / report 2}}

### How to verify

{{Exhaustive, user-facing steps. Include the exact inputs to use, the expected qualitative or numerical outcome, and
any tolerance.}}

- {{Step 1 with inputs, expected output, tolerance}}
- {{Step 2}}

### Out of scope

{{Related issues that are NOT addressed by this change, to prevent misunderstandings during QA.}}

### Pull requests

{{Mandatory — one bullet per repository involved. At least one link. Use markdown link syntax `[text](url)` —
`[text|url]` renders as plain text on both Jira and GitHub.}}

- [<repo-a> PR #<num>](<url>)
- [<repo-b> PR #<num>](<url>)

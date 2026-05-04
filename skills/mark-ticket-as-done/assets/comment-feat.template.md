## Ready for the next stage

{{Summary of the new capability. One short paragraph in subject-matter terms.}}

### Motivation

{{What need or gap does this address? Which users benefit, and how were they working around the gap before? Frame in
subject-matter terms — name the workflow, report, or decision that becomes possible (or easier) now.}}

### What's new

{{User-visible behaviour. Concrete examples in subject-matter terms:
- Which inputs are now accepted that were rejected before (or vice versa).
- Which screens, reports, exports, or notifications are affected.
- Defaults, parameter ranges, or limits that newly apply.
A reader should be able to predict how the system now behaves without opening the PRs.}}

### Approach

{{Subject-matter level summary of the design choice — only when it matters to the reader. Examples: which model or
methodology was adopted, which alternative was considered and rejected and why. Skip or write `None` when the approach
is mechanical.}}

### Affected features and inputs

- {{Feature / calculation / report 1 — which inputs are now affected}}
- {{Feature / calculation / report 2}}

### How to verify

{{Exhaustive, user-facing steps to exercise the new capability. Include the exact inputs to use, the expected
qualitative or numerical outcome, and any tolerance.}}

- {{Step 1 with inputs, expected output, tolerance}}
- {{Step 2}}

### Out of scope / Follow-ups

{{Capabilities deliberately not delivered in this change, with a note on whether they are queued for a follow-up.
Write `None` if this change is self-contained.}}

### Migration / Rollout

{{Feature flags, breaking changes, schema or data migrations, ordering constraints, downstream notifications. Write
`None` if the change is purely additive and ships dark behind no flag.}}

### Pull requests

{{Mandatory — one bullet per repository involved. At least one link. Use markdown link syntax `[text](url)` —
`[text|url]` renders as plain text on both Jira and GitHub.}}

- [<repo-a> PR #<num>](<url>)
- [<repo-b> PR #<num>](<url>)

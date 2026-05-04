## Summary

{{1–3 bullets. What was changed and why. Use this template for `refactor`, `chore`, `perf`, `docs`, `style`, `build`,
`ci`, `test`, or `revert` PRs.}}

## Issue

{{Issue/ticket link, e.g. https://github.com/<org>/<repo>/issues/123 or https://xxx.atlassian.net/browse/YYY-1234. Or
`None` if explicitly none.}}

## Motivation

{{What made this change worth doing now? Pain point, prep for upcoming work, dependency upgrade, follow-up to a recent
bug, etc. Avoid vague "cleanup" — name the concrete improvement.}}

## Changes

{{What was restructured / renamed / moved / bumped. Reference the affected modules and abstractions. For `revert`,
include the hash and subject of the reverted commit and the reason for reverting.}}

## Behaviour preservation

{{Explicit statement that runtime behaviour is unchanged, and how a reviewer can confirm it: existing tests still pass,
types unchanged, public API surface identical, snapshot tests unchanged, etc.

For `perf` PRs, replace this section with **Performance impact** — before/after numbers, the benchmark or workload
used, and any measurable trade-off (e.g. memory for speed).}}

## Out of scope / Follow-ups

{{What is deliberately not done in this PR, and why. Link to follow-up issues if any. Write `None` if the PR fully
delivers the capability.}}

## Affected code paths

- {{File::method}}
- {{File::method}}

## Verification

- [ ] {{New tests added}}
- [ ] {{Test command — existing tests still pass}}
- [ ] {{Static analysis / lint command}}

## Checklist

- [ ] No behaviour change (or behaviour change documented above for `perf`)
- [ ] Lint and static analysis pass
- [ ] Linked to an issue (or `None` justified above)

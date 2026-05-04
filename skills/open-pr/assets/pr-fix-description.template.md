## Summary

{{1–3 bullets. What was fixed and why.}}

## Issue

{{Issue/ticket link, e.g. https://github.com/<org>/<repo>/issues/123 or https://xxx.atlassian.net/browse/YYY-1234. Or
`None` if explicitly none.}}

## Problem

{{Technical description. Which code path mis-behaves? Under which inputs or runtime conditions? Name the class/method
(e.g., `SessionRefresher::refresh()` does not re-fetch the token after a `PasswordRotated` event).}}

## Root cause

{{The exact logic flaw: missing check, incorrect branch, race condition, bad invariant. Reference the offending
lines.}}

## Fix

{{What the diff does. Reference new/changed methods, new branches, removed dead code. Explain why this approach was
chosen over alternatives when non-obvious.}}

## Out of scope / Follow-ups

{{What is deliberately not done in this PR, and why — e.g. related fixes deferred to a follow-up, edge cases not
covered. Write `None` if the fix is complete with no deferred work.}}

## Affected code paths

- {{File::method}}
- {{File::method}}

## Verification

- [ ] {{Regression test added that fails on the parent commit and passes on this branch}}
- [ ] {{Test command — existing tests still pass}}
- [ ] {{Static analysis / lint command}}

## Checklist

- [ ] Regression test included
- [ ] Lint and static analysis pass
- [ ] Linked to an issue (or `None` justified above)

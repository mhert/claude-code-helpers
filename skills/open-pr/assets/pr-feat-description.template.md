## Summary

{{1–3 bullets. What new capability this introduces.}}

## Issue

{{Issue/ticket link, e.g. https://github.com/<org>/<repo>/issues/123 or https://xxx.atlassian.net/browse/YYY-1234. Or
`None` if explicitly none.}}

## Motivation

{{What problem or need does this solve? What wasn't possible before? Who benefits — end users, internal callers, future
features that build on this?}}

## What's new

{{User-visible (or API-visible) behaviour. Concrete examples — inputs, outputs, new endpoints, new commands, new UI
states. A reviewer should be able to predict how the system now behaves without reading the diff.}}

## Approach

{{Key design choices: new abstractions, where the new code lives in the architecture, alternatives considered when
non-obvious. Skip when the implementation is trivially direct.}}

## Out of scope / Follow-ups

{{What is deliberately not done in this PR, and why. Link to follow-up issues if any. Write `None` if the PR fully
delivers the capability.}}

## Migration / Rollout

{{Feature flags, breaking changes, data migrations, backwards-compat shims, deployment ordering. Write `None` if the
change is purely additive and ships dark behind no flag.}}

## Affected code paths

- {{File::method}}
- {{File::method}}

## Verification

- [ ] {{Tests covering new code paths (happy path + key edge cases)}}
- [ ] {{Test command — existing tests still pass}}
- [ ] {{Static analysis / lint command}}

## Checklist

- [ ] Tests added for new behaviour
- [ ] Lint and static analysis pass
- [ ] Linked to an issue (or `None` justified above)

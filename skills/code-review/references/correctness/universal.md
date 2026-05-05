# Correctness — universal checks

Reference for the **Correctness** dimension subagent. Covers logic errors, edge cases, error handling, and API
contract / breaking changes. Apply only the items relevant to the diff under review. The orchestrator will also pass
stack-specific files (`<stack>.md` in this directory) when the changed-file list matches a stack.

## Universal checks

- [ ] Off-by-one errors in loops, slices, ranges, and array indexing
- [ ] Null / undefined / `None` handled at every boundary; no implicit assumption that a value exists
- [ ] Edge cases covered: empty input, single-element input, max-size input, duplicates, negative numbers, zero
- [ ] Boolean conditions correct — no inverted logic, no precedence bugs in `&&` / `||` mixed with `==` / `!=`
- [ ] Iterators and async streams not consumed twice when consumers expect a single pass
- [ ] Race conditions: shared state guarded by appropriate locking, or designed to avoid contention entirely
- [ ] No uninitialised reads (variables, struct fields, accumulator values) before first write
- [ ] Floating-point comparisons use a tolerance, not `==`
- [ ] Integer overflow / underflow considered for arithmetic on user-controlled values
- [ ] Time and date math uses timezone-aware types where the domain requires it
- [ ] Unicode handled correctly — string length is code points or grapheme clusters when the domain requires it, not
      byte length

## Error handling

- [ ] No swallowed exceptions or empty `catch {}` blocks without an explicit reason
- [ ] Error messages identify the failing operation and at least one piece of context (id, value, path)
- [ ] Cleanup code (close, release, rollback) runs on the error path as well as the success path
- [ ] Errors are propagated, not silently logged-and-continued, when the caller cannot proceed without success
- [ ] Distinguish recoverable failures from programmer errors — do not retry on a bug, do not panic on a network blip
- [ ] Retries have a bounded count and a backoff; idempotency is verified before retrying writes

## API contract / breaking changes

- [ ] Public function signatures, return types, and exceptions remain compatible OR the breakage is intentional and
      documented in the commit message
- [ ] Renamed exported symbols come with a deprecated alias when consumers exist outside the repo
- [ ] HTTP / RPC contracts: request and response schemas, status codes, headers — backwards-compatible OR versioned
- [ ] Database schema changes are additive (new columns, new tables) OR have a documented migration path
- [ ] Configuration keys: removed keys produce a clear error; renamed keys honour the old name for one release

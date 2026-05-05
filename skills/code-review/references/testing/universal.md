# Testing — universal checks

Reference for the **Testing** dimension subagent. Covers coverage gaps, brittle assertions, untested edge cases, and
test smells. Apply only items relevant to the diff under review. The orchestrator will also pass stack-specific files
(`<stack>.md` in this directory) when the changed-file list matches a stack.

## Universal checks

- [ ] New behaviour ships with at least one test that exercises it; new bug fixes ship with a regression test that
      fails before the fix and passes after
- [ ] Each test has a single, named subject — the title states the behaviour ("returns 404 when user is missing"),
      not the function ("test getUser")
- [ ] Tests follow Arrange / Act / Assert structure with clearly distinguishable phases
- [ ] Assertions check observable behaviour, not implementation details (private state, call counts on internal
      collaborators)
- [ ] Edge cases covered: empty input, single-element input, max-size input, duplicates, negative / zero, boundary
      values, unicode, timezones
- [ ] Error paths covered, not just the happy path — every catch / Result::Err / 4xx response has at least one test
- [ ] Concurrency-relevant code has tests that exercise the concurrent path (or it is documented why the test is
      single-threaded only)
- [ ] Time, randomness, and external services are stubbed or injected so tests are deterministic
- [ ] No flaky tests introduced — if a test depends on timing, sleep, or order-of-operations, that is a smell
- [ ] Tests are independent; they pass when run individually and in any order
- [ ] No commented-out tests, no `xit` / `it.skip` / `#[ignore]` without an explanatory comment

## Test smells

- [ ] No "assertion roulette" — tests with many unrelated asserts that hide which one failed
- [ ] No mystery setup — fixtures and builders make the relevant inputs visible inside the test, not buried elsewhere
- [ ] No over-mocked tests where the test only verifies that mocks were called in a specific order; this tests the
      mock, not the code
- [ ] No tautological tests that re-implement the production logic in the assertion
- [ ] No conditional logic in tests (`if`, loops over assertions) that hides which case actually ran
- [ ] No reliance on production data, network, or shared filesystem state
- [ ] When several tests differ only by data, use the language's parameterised pattern (`test.each`, `@dataProvider`,
      `#[rstest]`, `pytest.mark.parametrize`); copy-paste tests with one parameter changed are a smell

## Coverage signal

- [ ] New uncovered lines justified — there is a reason this branch is unreachable in tests, not "we ran out of time"
- [ ] Coverage drops on critical paths investigated; coverage drops on glue / wiring code not blocking
- [ ] Public API has at least integration-level coverage; internal helpers can rely on coverage from above

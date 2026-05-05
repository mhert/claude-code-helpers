# Testing — CI checks

Stack-specific extensions to the **Testing** dimension. Apply alongside `universal.md` for diffs that touch
`.github/workflows/` files.

- [ ] CI runs the full test matrix on the platforms the project ships to, not just the developer's host
- [ ] Test reporting (JUnit XML or equivalent) uploaded as artifact for failed-run inspection
- [ ] Flaky-test quarantine has an owner and an expiry; quarantine is not where tests go to die

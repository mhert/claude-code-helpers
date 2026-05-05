# Testing — Rust checks

Stack-specific extensions to the **Testing** dimension. Apply alongside `universal.md` for diffs that touch Rust
files.

- [ ] `#[test]` functions live next to the code or in a `tests/` integration crate, depending on scope
- [ ] Property-based tests (`proptest`, `quickcheck`) used for non-trivial invariants
- [ ] Doctests on public items where the example also serves as documentation
- [ ] Async tests use `#[tokio::test]` (or framework equivalent) and avoid global runtime state
- [ ] Concurrent code exercised under stress — `loom` for fine-grained ordering, or many-thread spawn loops
      asserting invariants; type-system safety does not replace logical race tests

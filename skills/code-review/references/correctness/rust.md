# Correctness — Rust checks

Stack-specific extensions to the **Correctness** dimension. Apply alongside `universal.md` for diffs that touch Rust
files.

- [ ] Ownership patterns are correct — no unnecessary `clone()` to satisfy the borrow checker
- [ ] Lifetime annotations present where the compiler cannot infer them
- [ ] `Result<T, E>` used for fallible operations, never `panic!` in library code paths
- [ ] `?` operator used for error propagation; `From` impls for error conversions instead of repeated `match`
- [ ] No `.unwrap()` / `.expect()` in production paths — only in tests or `main` with a clear final-fallback message
- [ ] `Send` / `Sync` bounds correct for code shared across threads
- [ ] `unsafe` blocks justified, scoped narrowly, and documented with the invariant they assert; never used to
      silence a borrow-checker complaint that has a safe fix

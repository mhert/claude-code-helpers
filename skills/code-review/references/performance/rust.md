# Performance — Rust checks

Stack-specific extensions to the **Performance** dimension. Apply alongside `universal.md` for diffs that touch Rust
files.

- [ ] Iterators preferred over indexed loops; `.collect()` only when a concrete collection is needed
- [ ] `Vec` pre-allocated with `with_capacity` when the final size is known or bounded
- [ ] String parameters are `&str` where ownership is not transferred; `&[T]` over `&Vec<T>`
- [ ] Heap allocations minimised in hot paths; consider `SmallVec`, stack-allocated buffers, or arena allocators where
      profiling justifies it
- [ ] `Arc` / `Rc` usage justified — shared ownership truly needed, not "to make the borrow checker happy"
- [ ] Async: blocking calls (`std::fs`, CPU-heavy loops) wrapped in `spawn_blocking` so they do not stall the runtime
- [ ] `clone()` calls reviewed — needed for correctness, or symptom of an ownership design that should change?
- [ ] Trait derives reviewed: `Copy` on a large struct hides expensive implicit copies at every call site; prefer
      borrows
- [ ] Hot-path formatting writes into a reusable buffer (`write!` into `String` / `Vec<u8>`, or `std::fmt::Write`)
      rather than allocating a fresh `String` per call
